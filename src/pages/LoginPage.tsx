import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  ArrowLeft,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

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

      // Auto focus first OTP input
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please check your number and try again.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance to next box
    if (digit && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto submit if all 4 digits entered
    if (digit && index === 3 && newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  // Handle Backspace navigation across OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
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
    otpInputsRef.current[nextIndex]?.focus();

    if (pasted.length === 4) {
      handleVerifyOtp(pasted);
    }
  };

  // Verify OTP API call
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

      // Update auth state (triggers automatic tenancy resolution)
      await login(res.accessToken, res.refreshToken, res.tenant);

      // Redirect to home or return path
      const destination = (location.state as any)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)] justify-between pt-2 animate-fade-in">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => {
            if (step === 'otp') {
              setStep('phone');
              setError(null);
              setSuccessMessage(null);
            } else {
              navigate(-1);
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-brandText hover:bg-gray-200 active:scale-95 transition-all tap-target"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brandText">
            {step === 'phone' ? 'Enter your phone number' : 'Verify 4-digit code'}
          </h1>
          <p className="mt-1.5 text-xs text-brandText-muted leading-relaxed">
            {step === 'phone'
              ? "We'll send you a 4-digit verification code to log in or create your tenant account."
              : `Enter the code sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to +91 ${phone}.`}
          </p>
        </div>

        {/* Error or Success Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 border border-red-200/80 text-red-700 animate-shake">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {successMessage && !error && (
          <div className="flex items-center gap-2 rounded-xl bg-teal-50 p-3 border border-teal-200 text-teal-800">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
            <p className="text-xs font-medium">{successMessage}</p>
          </div>
        )}

        {/* STEP 1: Phone & Channel Selection */}
        {step === 'phone' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRequestOtp();
            }}
            className="space-y-5"
          >
            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-brandText-muted mb-1.5">
                Mobile Number
              </label>
              <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm transition-all">
                <span className="flex items-center bg-gray-50 px-3.5 text-sm font-semibold text-brandText border-r border-gray-200">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  autoFocus
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    setError(null);
                    setPhone(e.target.value.replace(/\D/g, ''));
                  }}
                  className="w-full px-4 py-3 text-base font-semibold text-brandText focus:outline-none"
                />
              </div>
            </div>

            {/* Medium Toggle (WhatsApp vs SMS) */}
            <div>
              <label className="block text-xs font-semibold text-brandText-muted mb-1.5">
                Send OTP via
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-3 text-xs font-semibold transition-all tap-target ${
                    channel === 'whatsapp'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white text-brandText-muted hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-3 text-xs font-semibold transition-all tap-target ${
                    channel === 'sms'
                      ? 'border-primary bg-primary-50/80 text-primary shadow-sm ring-1 ring-primary'
                      : 'border-gray-200 bg-white text-brandText-muted hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="h-4 w-4 text-primary" />
                  SMS
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={phone.length !== 10 || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Get OTP'
              )}
            </button>

            {/* Terms & Privacy Under Get OTP */}
            <p className="text-center text-[11px] text-brandText-muted leading-relaxed pt-1">
              By continuing, you agree to our{' '}
              <a href="https://pgease.com/terms" target="_blank" rel="noreferrer" className="text-primary underline font-medium">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://pgease.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline font-medium">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        )}

        {/* STEP 2: 4-digit OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-6">
            {/* 4 Discrete Boxes */}
            <div className="flex justify-between gap-3 px-2">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputsRef.current[index] = el;
                  }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="h-16 w-14 rounded-2xl border-2 border-gray-200 bg-gray-50/50 text-center text-2xl font-bold text-brandText transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-sm"
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={() => handleVerifyOtp()}
              disabled={otp.some((d) => d === '') || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            {/* Resend & Channel Switch */}
            <div className="flex flex-col items-center gap-3 pt-2 text-xs">
              {canResend ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => handleRequestOtp(channel)}
                    className="flex items-center gap-1.5 font-semibold text-primary hover:underline tap-target"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Resend via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </button>

                  <span className="text-gray-300">•</span>

                  <button
                    onClick={() => handleRequestOtp(channel === 'whatsapp' ? 'sms' : 'whatsapp')}
                    className="font-semibold text-brandText-muted hover:text-brandText tap-target"
                  >
                    Send via {channel === 'whatsapp' ? 'SMS' : 'WhatsApp'} instead
                  </button>
                </div>
              ) : (
                <span className="text-brandText-muted">
                  Resend code in <strong className="text-brandText">{timer}s</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trust Footer */}
      <div className="rounded-xl bg-gray-50/80 p-3 text-center border border-gray-100 flex items-center justify-center gap-2 mt-8">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-brandText-muted">
          PG Ease is 100% free for all tenants
        </span>
      </div>
    </div>
  );
};
