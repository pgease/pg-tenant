import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  MessageSquare,
  Smartphone,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSkipLogin = () => {
    sessionStorage.setItem('pgease_guest_mode', 'true');
    navigate('/');
  };

  // Step 1: phone entry, Step 2: 4-digit OTP
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

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

  // Handle phone submission
  const handleRequestOtp = async (selectedChannel = channel) => {
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
      setSuccessMessage(`OTP sent via ${selectedChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to +91 ${cleanPhone}`);

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
      const destination = (location.state as any)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid or expired OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#F8FAFC] flex flex-col justify-between overflow-x-hidden">
      {/* Top Background Gradient Header with Circles */}
      <div className="relative bg-gradient-to-b from-[#004D4D] via-[#006060] to-[#008080] pt-7 pb-20 px-6 text-white overflow-hidden">
        {/* Soft Decorative Ambient Circles */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute top-24 -left-14 h-40 w-40 rounded-full bg-white/5 blur-lg pointer-events-none" />

        {/* Top Header Row with Back Button */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => (step === 'otp' ? setStep('phone') : handleSkipLogin())}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all tap-target"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleSkipLogin}
            className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Brand App Icon & Title */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#008080] border-2 border-white/20 shadow-lg p-2.5 mb-2.5">
            <img
              src="/favicon.png?v=3"
              alt="PG Ease"
              className="h-full w-full object-contain filter drop-shadow"
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white">PG Ease</h1>
          <span className="mt-1 inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md">
            Tenant App
          </span>
        </div>
      </div>

      {/* Floating White Login Card */}
      <div className="relative z-20 -mt-10 px-5 flex-1 flex flex-col justify-between">
        <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100/80 space-y-5 animate-fade-in">
          {/* Card Title */}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {step === 'phone' ? 'Welcome to PG Ease' : 'Verify 4-Digit Code'}
            </h2>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              {step === 'phone'
                ? 'Enter your mobile number to sign in or get started.'
                : `Enter the 4-digit verification code sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to +91 ${phone}.`}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 border border-red-200 text-red-700 animate-shake">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && !error && (
            <div className="flex items-center gap-2 rounded-xl bg-teal-50 p-3 border border-teal-200 text-teal-800">
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
              {/* Phone Input Box */}
              <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-[#008080] focus-within:ring-2 focus-within:ring-[#008080]/10 transition-all">
                {/* Flag + Country Code Pill */}
                <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 border border-gray-200/80 px-2.5 py-1.5 text-xs font-bold text-gray-800 mr-2.5 flex-shrink-0">
                  <span className="text-sm">🇮🇳</span>
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
                  autoFocus
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none tracking-wide"
                />
              </div>

              {/* Channel Selector Pills */}
              <div className="flex items-center justify-between text-xs pt-0.5 px-0.5">
                <span className="text-gray-400 font-medium">Receive OTP via:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      channel === 'whatsapp'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <MessageSquare className="h-3 w-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      channel === 'sms'
                        ? 'bg-teal-50 text-teal-700 border border-teal-300 font-bold'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Smartphone className="h-3 w-3 text-[#008080]" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length !== 10}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#008080] py-3.5 text-sm font-bold text-white shadow-md shadow-[#008080]/25 hover:bg-[#006b6b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none tap-target"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Get Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Security Guarantee Note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                <span>Your information is strictly protected</span>
              </div>
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
                    className="h-14 w-12 sm:w-14 rounded-2xl border-2 border-gray-200 bg-gray-50/50 text-center text-xl font-black text-gray-900 focus:border-[#008080] focus:bg-white focus:outline-none transition-all shadow-sm"
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
                    className="flex items-center gap-1 font-bold text-[#008080] hover:underline"
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
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#008080] py-3.5 text-sm font-bold text-white shadow-md shadow-[#008080]/25 hover:bg-[#006b6b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none tap-target"
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
            </div>
          )}
        </div>

        {/* Footer Terms & Conditions */}
        <div className="py-6 text-center space-y-3">
          <p className="text-[11px] text-gray-400 leading-relaxed px-4">
            By signing in, you agree to our{' '}
            <a
              href="https://pgease.in/terms"
              target="_blank"
              rel="noreferrer"
              className="text-[#008080] underline font-medium hover:text-[#006060]"
            >
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a
              href="https://pgease.in/privacy"
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
