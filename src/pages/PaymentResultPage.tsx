import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { tenantService } from '../services/tenantService';

interface PaymentDetails {
  txnid: string;
  status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | string;
  settlementStatus?: string;
  amount: string;
  currency: string;
  easepayid?: string;
  bankRefNum?: string;
  utr?: string;
  mode?: string;
  paidAt?: string;
  createdAt?: string;
}

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const txnid = searchParams.get('txnid') || '';
  const queryStatus = (searchParams.get('status') || '').toLowerCase();

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'polling' | 'completed' | 'timeout'>('polling');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pollCount = useRef(0);
  const maxPolls = 30; // 30 * 2.5s = 75 seconds

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchStatus = async () => {
    if (!txnid) return;
    try {
      const data = await tenantService.getEasebuzzPaymentStatus(txnid);
      setPayment(data);

      if (['SUCCESS', 'FAILED', 'CANCELLED'].includes(data.status)) {
        setPollingStatus('completed');
        return true;
      }
    } catch (err) {
      console.warn('Failed to fetch transaction status:', err);
    }
    return false;
  };

  useEffect(() => {
    if (!txnid) {
      setPollingStatus('completed');
      return;
    }

    let intervalId: any = null;

    const startPolling = async () => {
      const isFinished = await fetchStatus();
      if (isFinished) return;

      intervalId = setInterval(async () => {
        pollCount.current += 1;
        const finished = await fetchStatus();
        if (finished || pollCount.current >= maxPolls) {
          clearInterval(intervalId);
          if (pollCount.current >= maxPolls && !finished) {
            setPollingStatus('timeout');
          }
        }
      }, 2500);
    };

    startPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [txnid]);

  const currentStatus = payment?.status?.toUpperCase() || (queryStatus === 'success' ? 'SUCCESS' : queryStatus === 'failure' || queryStatus === 'usercancelled' ? 'FAILED' : 'PENDING');
  const isSuccess = currentStatus === 'SUCCESS';
  const isFailed = currentStatus === 'FAILED' || currentStatus === 'CANCELLED';
  const isPending = !isSuccess && !isFailed;

  return (
    <div className="max-w-md mx-auto pt-6 pb-12 px-4 space-y-6 animate-fade-in">
      {/* 1. STATUS HERO CARD */}
      <div className="text-center space-y-3">
        {isSuccess ? (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-sm animate-bounce-short">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              UPI Auto-Verified
            </span>
            <h1 className="text-xl font-black text-brandText mt-2">Rent Payment Received!</h1>
            <p className="text-xs text-brandText-muted max-w-xs mt-0.5">
              Your dues have been cleared and your PG manager has been alerted.
            </p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600 shadow-sm">
              <AlertCircle className="h-9 w-9" />
            </div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
              Transaction Incomplete
            </span>
            <h1 className="text-xl font-black text-brandText mt-2">Payment Did Not Complete</h1>
            <p className="text-xs text-brandText-muted max-w-xs mt-0.5">
              The UPI transaction was cancelled, declined, or timed out. No amount was deducted.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 shadow-sm">
              <Clock className="h-9 w-9 animate-spin" />
            </div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              Confirming with UPI Network
            </span>
            <h1 className="text-xl font-black text-brandText mt-2">Verifying Payment...</h1>
            <p className="text-xs text-brandText-muted max-w-xs mt-0.5">
              We are checking your transaction status with the bank. This takes 5 to 15 seconds.
            </p>
          </div>
        )}
      </div>

      {/* 2. TRANSACTION SUMMARY CARD */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs font-semibold text-brandText-muted">Amount</span>
          <span className="text-2xl font-black text-brandText">
            ₹{payment?.amount ? Number(payment.amount).toLocaleString('en-IN') : '—'}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {txnid && (
            <div className="flex items-center justify-between">
              <span className="text-brandText-muted">Order ID</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-brandText">
                <span>{txnid}</span>
                <button
                  onClick={() => copyToClipboard(txnid, 'txnid')}
                  className="text-gray-400 hover:text-primary"
                >
                  {copiedField === 'txnid' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          )}

          {payment?.utr && (
            <div className="flex items-center justify-between">
              <span className="text-brandText-muted">Bank UTR</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-brandText">
                <span>{payment.utr}</span>
                <button
                  onClick={() => copyToClipboard(payment.utr!, 'utr')}
                  className="text-gray-400 hover:text-primary"
                >
                  {copiedField === 'utr' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          )}

          {payment?.easepayid && (
            <div className="flex items-center justify-between">
              <span className="text-brandText-muted">Easebuzz ID</span>
              <span className="font-mono text-brandText">{payment.easepayid}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-brandText-muted">Payment Method</span>
            <span className="font-medium text-brandText">UPI Instant Gateway</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-brandText-muted">Status</span>
            <span
              className={`font-bold ${
                isSuccess
                  ? 'text-emerald-600'
                  : isFailed
                  ? 'text-red-600'
                  : 'text-amber-600'
              }`}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        {isPending && (
          <div className="pt-2 space-y-2">
            {pollingStatus === 'timeout' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl text-center border border-amber-200">
                Transaction is taking a little longer than usual to confirm. Tap below to refresh or check your UPI app.
              </p>
            )}
            <button
              onClick={() => fetchStatus()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Check Status Again</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. ACTION BUTTONS */}
      <div className="space-y-2 pt-2">
        {isSuccess ? (
          <>
            <button
              onClick={() => navigate('/transactions')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
            >
              <CreditCard className="h-4 w-4" />
              <span>View In Ledger & Receipts</span>
            </button>

            <button
              onClick={() => navigate('/payments')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-xs font-bold text-brandText hover:bg-gray-50 active:scale-[0.98] transition-all tap-target"
            >
              <Home className="h-4 w-4 text-brandText-muted" />
              <span>Back to Rent Dues</span>
            </button>
          </>
        ) : isFailed ? (
          <>
            <button
              onClick={() => navigate('/payments')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
            >
              <span>Try Again</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => navigate('/my-pg')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-xs font-bold text-brandText hover:bg-gray-50 active:scale-[0.98] transition-all tap-target"
            >
              <span>Go to My Stay</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/payments')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
          >
            <span>Return to Payments Page</span>
          </button>
        )}
      </div>
    </div>
  );
};
