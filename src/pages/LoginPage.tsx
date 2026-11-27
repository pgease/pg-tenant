import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  ArrowLeft,
  ArrowRight,
  Smartphone,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  Search,
  Building2,
  Sparkles,
  Check,
} from 'lucide-react';

const WhatsAppIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      fill="#25D366"
      d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"
    />
    <path
      fill="#FFFFFF"
      d="M17.53 14.39C17.23 14.24 15.77 13.52 15.5 13.42C15.23 13.32 15.03 13.27 14.83 13.57C14.63 13.87 14.06 14.54 13.89 14.74C13.72 14.94 13.54 14.96 13.25 14.81C12.95 14.66 12 14.35 10.86 13.34C9.98 12.55 9.38 11.58 9.21 11.28C9.03 10.98 9.19 10.82 9.34 10.67C9.47 10.54 9.64 10.33 9.79 10.15C9.93 9.98 9.98 9.85 10.08 9.66C10.18 9.46 10.13 9.28 10.06 9.14C9.98 8.99 9.38 7.53 9.14 6.93C8.89 6.35 8.65 6.43 8.47 6.42C8.3 6.41 8.1 6.41 7.9 6.41C7.7 6.41 7.38 6.48 7.11 6.78C6.83 7.08 6.06 7.8 6.06 9.26C6.06 10.72 7.13 12.13 7.27 12.33C7.42 12.53 9.37 15.53 12.35 16.82C13.06 17.13 13.61 17.31 14.04 17.45C14.75 17.67 15.4 17.64 15.91 17.57C16.48 17.48 17.67 16.85 17.92 16.15C18.16 15.46 18.16 14.86 18.09 14.74C18.02 14.61 17.82 14.54 17.53 14.39Z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, tenant, checkTenancy } = useAuth();

  // Step 1: phone entry, Step 2: 4-digit OTP, Step 3: First-time profile & intent
  const [step, setStep] = useState<'phone' | 'otp' | 'onboarding'>('phone');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // First-time onboarding states
  const [fullName, setFullName] = useState('');
  const [intent, setIntent] = useState<'searching' | 'already_in_pg' | null>(null);
  const [pendingDestination, setPendingDestination] = useState<string>('/');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (tenant && (!tenant.name || !tenant.name.trim())) {
        setStep('onboarding');
        return;
      }
      if (step === 'onboarding') {
        return;
      }
      const redirect =
        new URLSearchParams(location.search).get('redirect') ||
        sessionStorage.getItem('pgease_post_login_redirect') ||
        '/';
      sessionStorage.removeItem('pgease_post_login_redirect');
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, tenant, step, location.search, navigate]);

  const handleSkipLogin = () => {
    sessionStorage.setItem('pgease_guest_mode', 'true');
    navigate('/');
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Safe error extraction to prevent React object-as-child crash
  const getErrorMessage = (err: any, fallback: string): string => {
    if (!err) return fallback;
    const data = err.response?.data;
    if (typeof data === 'string') {
      if (data.includes('404')) return 'Service temporarily unavailable. Please try again.';
      return data;
    }
    const rawMsg = data?.message || data?.error || err.message;
    if (Array.isArray(rawMsg)) {
      return typeof rawMsg[0] === 'string' ? rawMsg[0] : JSON.stringify(rawMsg[0]);
    }
    if (typeof rawMsg === 'object' && rawMsg !== null) {
      return rawMsg.message || rawMsg.error || JSON.stringify(rawMsg);
    }
    return typeof rawMsg === 'string' ? rawMsg : fallback;
  };

  // Handle phone submission - First time strictly defaults to WhatsApp
  const handleRequestOtp = async (selectedChannel: 'whatsapp' | 'sms' = channel) => {
    setError(null);
    setSuccessMessage(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await authService.requestOtp({
        mobileNumber: cleanPhone,
        countryCode: '+91',
        channel: selectedChannel,
      });

      setChannel(selectedChannel);
      setStep('otp');
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '']);
      setSuccessMessage(
        selectedChannel === 'whatsapp'
          ? `OTP sent via WhatsApp to +91 ${cleanPhone}`
          : `OTP sent via SMS to +91 ${cleanPhone}`
      );

      // Auto focus first OTP input safely
      setTimeout(() => {
        try {
          otpInputsRef.current[0]?.focus();
        } catch {}
      }, 150);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to send OTP. Please check your number and try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit change & auto-fill
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');

    // Handle full paste or autofill in any box
    if (clean.length > 1) {
      const newOtp = ['', '', '', ''];
      for (let i = 0; i < Math.min(clean.length, 4); i++) {
        newOtp[i] = clean[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(clean.length, 3);
      try {
        otpInputsRef.current[nextIndex]?.focus();
      } catch {}
      if (clean.length >= 4) {
        handleVerifyOtp(clean.slice(0, 4));
      }
      return;
    }

    const digit = clean.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) {
      try {
        otpInputsRef.current[index + 1]?.focus();
      } catch {}
    }

    if (digit && index === 3 && newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      try {
        otpInputsRef.current[index - 1]?.focus();
      } catch {}
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const newOtp = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, 3);
    try {
      otpInputsRef.current[nextIndex]?.focus();
    } catch {}

    if (pasted.length === 4) {
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    setError(null);
    const code = codeToVerify || otp.join('');
    if (code.length !== 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp({
        mobileNumber: phone.replace(/\D/g, ''),
        otp: code,
      });

      await login(res.accessToken, res.refreshToken, res.tenant);
      const destination =
        new URLSearchParams(location.search).get('redirect') ||
        sessionStorage.getItem('pgease_post_login_redirect') ||
        (location.state as any)?.from?.pathname ||
        '/';

      const isFirstTime = Boolean(
        res.isFirstTimeUser ||
        !res.tenant?.name ||
        !res.tenant?.name?.trim()
      );

      if (isFirstTime) {
        setPendingDestination(destination);
        setStep('onboarding');
      } else {
        sessionStorage.removeItem('pgease_post_login_redirect');
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid or expired OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Please enter your full name');
      return;
    }
    if (!intent) {
      setError('Please select whether you are searching for a PG or already living in a PG');
      return;
    }

    setLoading(true);
    try {
      await authService.updateProfile({
        name: trimmedName,
        intent: intent,
      });

      await checkTenancy();
      sessionStorage.removeItem('pgease_post_login_redirect');

      if (pendingDestination && pendingDestination !== '/' && pendingDestination !== '/login') {
        navigate(pendingDestination, { replace: true });
      } else if (intent === 'already_in_pg') {
        navigate('/my-pg', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Could not save profile details. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFFFF] flex flex-col justify-between overflow-x-hidden overflow-y-auto font-poppins select-none" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
      {/* Top 320dp Soft Gradient from #E6F3F3 to #FFFFFF */}
      <div className="absolute top-0 inset-x-0 h-[320px] bg-gradient-to-b from-[#E6F3F3] to-[#FFFFFF] pointer-events-none" />

      {/* Top Navigation Row: Back Button and Skip */}
      <div
        className="relative z-20 flex items-center justify-between px-6 pt-4 pb-2"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={() => {
            if (step === 'onboarding') {
              setStep('otp');
            } else if (step === 'otp') {
              setStep('phone');
            } else {
              handleSkipLogin();
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-xs border border-gray-200/60 hover:bg-white active:scale-95 transition-all"
          title="Go Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={handleSkipLogin}
          className="text-xs font-semibold text-[#008080] hover:text-[#005F5F] transition-colors"
        >
          Skip for now
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-1 pb-4 max-w-md mx-auto w-full">
        {/* Logo: 96dp Teal (#008080) Circle with White Mark Inside (60dp tall, centered, NO white box) */}
        <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-[#008080] shadow-md mb-3 sm:mb-5 shrink-0">
          <img
            src="/brand/pgease-mark-white.svg"
            alt="PG Ease"
            className="h-[60px] w-auto object-contain"
          />
        </div>

        {/* Title and Subtitle: Truly Centered */}
        <div className="w-full text-center mb-3 sm:mb-5 shrink-0">
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#1F2937] leading-[30px] sm:leading-[34px] tracking-tight w-full text-center">
            {step === 'phone'
              ? 'Welcome to PG Ease'
              : step === 'otp'
              ? 'Verify 4-Digit Code'
              : 'Complete Your Profile 🎉'}
          </h1>
          <p className="mt-1 text-[13px] sm:text-[14px] font-normal text-[#6B7280] leading-[20px] sm:leading-[22px] max-w-[300px] mx-auto text-center">
            {step === 'phone'
              ? 'Enter your mobile number to sign in or get started.'
              : step === 'otp'
              ? `Enter the 4-digit verification code sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to +91 ${phone}.`
              : 'Tell us your name and how you plan to use PG Ease to personalize your experience.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full space-y-3.5 sm:space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 rounded-[12px] bg-red-50 p-3 border border-red-200 text-red-700 animate-shake">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && !error && (
            <div className="flex items-center gap-2 rounded-[12px] bg-teal-50 p-3 border border-teal-200 text-teal-800">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#008080]" />
              <p className="text-xs font-medium">{successMessage}</p>
            </div>
          )}

          {/* STEP 1: Phone Input Form */}
          {step === 'phone' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRequestOtp();
              }}
              className="space-y-4"
            >
              {/* Phone Input Box: height 52, radius 12, border #D1D5DB, fill #F9FAFB, divider after +91 */}
              <div className="flex items-center h-[52px] rounded-[12px] border border-[#D1D5DB] bg-[#F9FAFB] px-3 shadow-xs focus-within:border-[#008080] focus-within:bg-white transition-all">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 pr-2.5 border-r border-[#D1D5DB] flex-shrink-0 select-none">
                  <span>+91</span>
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(clean);
                    if (error) setError(null);
                  }}
                  className="w-full bg-transparent pl-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none tracking-wide"
                />
              </div>

              {/* Channel Selector with Official WhatsApp Logo */}
              <div className="flex items-center justify-between text-xs pt-0.5 px-0.5">
                <span className="text-gray-400 font-medium">Receive OTP via:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      channel === 'whatsapp'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-400 font-bold shadow-xs'
                        : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      channel === 'sms'
                        ? 'bg-teal-50 text-teal-800 border border-teal-400 font-bold shadow-xs'
                        : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-[#008080]" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>

              {/* Submit Button: height 52, radius 12, #008080 */}
              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length !== 10}
                className="w-full h-[52px] flex items-center justify-center gap-2 rounded-[12px] bg-[#008080] text-sm font-semibold text-white shadow-sm hover:bg-[#006e6e] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>
                      {channel === 'whatsapp' ? 'Sending code to WhatsApp...' : 'Sending code via SMS...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>{channel === 'whatsapp' ? 'Get Verification Code on WhatsApp' : 'Get Verification Code on SMS'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 4-Digit OTP Form */}
          {step === 'otp' && (
            <div className="space-y-4">
              {/* 4 Digit Boxes (Equal width, responsive, no layout overflow) */}
              <div className="flex justify-center items-center gap-2.5 sm:gap-3 py-1">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputsRef.current[index] = el;
                    }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="h-[52px] w-[52px] rounded-[12px] border border-[#D1D5DB] bg-[#F9FAFB] text-center text-xl font-bold text-gray-900 focus:border-[#008080] focus:bg-white focus:outline-none transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Resend Controls */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                  }}
                  className="font-medium text-gray-500 hover:text-gray-800"
                >
                  Edit Number
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp(channel)}
                    disabled={loading}
                    className="flex items-center gap-1 font-semibold text-[#008080] hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Resend Code</span>
                  </button>
                ) : (
                  <span className="text-gray-400">
                    Resend in <strong className="text-gray-700">{timer}s</strong>
                  </span>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.some((d) => d === '')}
                className="w-full h-[52px] flex items-center justify-center gap-2 rounded-[12px] bg-[#008080] text-sm font-semibold text-white shadow-sm hover:bg-[#006e6e] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* On-Demand Channel Switch: Resend via SMS */}
              <div className="pt-2.5 border-t border-gray-100 text-center">
                {channel === 'whatsapp' ? (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp('sms')}
                    disabled={!canResend || loading}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      canResend && !loading
                        ? 'text-gray-500 hover:text-gray-900'
                        : 'text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>Didn't receive code on WhatsApp?</span>
                    <span className="font-bold text-[#008080] underline flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      Get OTP via SMS
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp('whatsapp')}
                    disabled={!canResend || loading}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      canResend && !loading
                        ? 'text-gray-500 hover:text-gray-900'
                        : 'text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>Prefer WhatsApp instead?</span>
                    <span className="font-bold text-[#0E7A4A] underline flex items-center gap-1">
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      Get OTP on WhatsApp
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: First-Time Profile & Intent Form */}
          {step === 'onboarding' && (
            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              {/* Full Name Input Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#008080]" />
                  <span>Your Full Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-[#008080] focus-within:ring-2 focus-within:ring-[#008080]/10 transition-all">
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Enter your full name (e.g. Rahul Sharma)"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value.slice(0, 100));
                      if (error) setError(null);
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      if (fullName.length + text.length > 100) {
                        e.preventDefault();
                        const allowed = 100 - fullName.length;
                        setFullName((prev) => (prev + text.slice(0, Math.max(0, allowed))).slice(0, 100));
                      }
                    }}
                    autoFocus
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none tracking-wide"
                  />
                </div>
                <div className="flex justify-end pr-1">
                  <span className={`text-[11px] tabular-nums font-mono ${fullName.length >= 100 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                    {fullName.length}/100
                  </span>
                </div>
              </div>

              {/* Purpose / Intent Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#008080]" />
                  <span>What brings you to PG Ease today?</span>
                  <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: Searching for a PG */}
                  <button
                    type="button"
                    onClick={() => {
                      setIntent('searching');
                      if (error) setError(null);
                    }}
                    className={`flex items-start gap-3 rounded-2xl p-3.5 border-2 text-left transition-all ${
                      intent === 'searching'
                        ? 'border-[#008080] bg-teal-50/50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        intent === 'searching'
                          ? 'bg-[#008080] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Search className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-900">
                          Here for searching a PG
                        </h3>
                        {intent === 'searching' && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#008080] text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        I am looking to explore, compare & book a new room or bed.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Already living in a PG */}
                  <button
                    type="button"
                    onClick={() => {
                      setIntent('already_in_pg');
                      if (error) setError(null);
                    }}
                    className={`flex items-start gap-3 rounded-2xl p-3.5 border-2 text-left transition-all ${
                      intent === 'already_in_pg'
                        ? 'border-[#008080] bg-teal-50/50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        intent === 'already_in_pg'
                          ? 'bg-[#008080] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-900">
                          Already living in a PG
                        </h3>
                        {intent === 'already_in_pg' && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#008080] text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        I already stay in a PG and want to pay rent, view dues & track complaints.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !fullName.trim() || !intent}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#008080] py-3.5 text-sm font-bold text-white shadow-md shadow-[#008080]/25 hover:bg-[#006b6b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none tap-target"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Saving your profile...</span>
                  </>
                ) : (
                  <>
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Terms & Conditions */}
        <div className="py-6 text-center space-y-3">
          <p className="text-[11px] text-gray-400 leading-relaxed px-4">
            By signing in, you agree to our{' '}
            <a
              href="https://pgease.com/terms"
              target="_blank"
              rel="noreferrer"
              className="text-[#008080] underline font-medium hover:text-[#006060]"
            >
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a
              href="https://pgease.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-[#008080] underline font-medium hover:text-[#006060]"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
