import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { type RentCollectionDetails, tenantService } from '../../services/tenantService';

interface RentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dues: RentCollectionDetails | null;
  onPaymentSuccess?: () => void;
}

export const RentPaymentModal: React.FC<RentPaymentModalProps> = ({
  isOpen,
  onClose,
  dues,
  onPaymentSuccess,
}) => {
  const [paymentMode, setPaymentMode] = useState<'gateway' | 'manual'>('gateway');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual payment submission state
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !dues) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!utrNumber.trim() && !screenshotFile) {
      setErrorMessage('Please provide either the 12-digit UTR/reference number or upload a payment screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = '';
      if (screenshotFile) {
        setUploading(true);
        photoUrl = await tenantService.uploadPhoto(screenshotFile);
        setUploading(false);
      }

      // Record manual payment notification via ticket/complaint or verified note
      await tenantService.raiseComplaint({
        category: 'Rent Payment',
        subject: `Rent Payment UTR: ${utrNumber || 'Screenshot Uploaded'} - ${dues.period.label}`,
        description: `Payment confirmation submitted by tenant for amount ₹${dues.totalPayable}. Reference/UTR: ${utrNumber}. Photo: ${photoUrl || 'None'}`,
        photoUrl,
        priority: 'high',
      });

      setSubmissionSuccess(true);
      setTimeout(() => {
        onPaymentSuccess?.();
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit payment details. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const settlement = dues.settlement || {};
  const upiId = settlement.settlementUpiId || null;
  const upiIntentUrl = upiId
    ? (settlement.upiQrString || `upi://pay?pa=${encodeURIComponent(upiId)}&pn=PG%20Ease&am=${dues.totalPayable}&cu=INR`)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Pay Rent & Dues</h2>
              <p className="text-[11px] text-brandText-muted">Period: {dues.period.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Amount Due Card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-50 via-teal-50/50 to-white p-4 border border-teal-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Total Payable Amount
              </span>
              <p className="text-2xl font-black text-brandText mt-0.5">
                ₹{dues.totalPayable.toLocaleString('en-IN')}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Payment Due
            </span>
          </div>

          {/* Dues Breakdown */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 space-y-2 text-xs">
            <span className="font-bold text-brandText-muted uppercase tracking-wider text-[10px]">
              Bill Breakdown
            </span>
            <div className="flex justify-between py-1 border-b border-gray-200/60 text-brandText">
              <span>{dues.lineItems.rent.title}</span>
              <span className="font-semibold">₹{dues.lineItems.rent.amount.toLocaleString('en-IN')}</span>
            </div>
            {dues.lineItems.securityDeposit?.amount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200/60 text-brandText">
                <span>{dues.lineItems.securityDeposit.title}</span>
                <span className="font-semibold">₹{dues.lineItems.securityDeposit.amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {dues.lineItems.miscellaneous?.amount > 0 && (
              <div className="flex justify-between py-1 text-brandText">
                <span>{dues.lineItems.miscellaneous.title}</span>
                <span className="font-semibold">₹{dues.lineItems.miscellaneous.amount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Payment Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setPaymentMode('gateway')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                paymentMode === 'gateway'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-brandText-muted hover:text-brandText'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Online Gateway
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('manual')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                paymentMode === 'manual'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-brandText-muted hover:text-brandText'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              UPI QR / Manual UTR
            </button>
          </div>

          {/* MODE 1: ONLINE GATEWAY */}
          {paymentMode === 'gateway' && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brandText-muted">Payment Gateway</span>
                  <span className="font-bold text-brandText">Razorpay Secure</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brandText-muted">Supported Methods</span>
                  <span className="font-medium text-brandText">UPI • Debit/Credit • NetBanking</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brandText-muted">Convenience Fee</span>
                  <span className="font-bold text-emerald-600">₹0 (Zero Fee)</span>
                </div>
              </div>

              <a
                href={dues.paymentLink || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
              >
                <span>Proceed to Pay ₹{dues.totalPayable.toLocaleString('en-IN')}</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <p className="text-center text-[11px] text-brandText-muted flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                256-bit encrypted checkout with instant receipt generation
              </p>
            </div>
          )}

          {/* MODE 2: MANUAL UPI / UTR */}
          {paymentMode === 'manual' && (
            <div className="space-y-4 animate-fade-in">
              {submissionSuccess ? (
                <div className="rounded-2xl bg-teal-50 p-6 text-center border border-teal-200">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h3 className="text-base font-bold text-brandText">Payment Submitted!</h3>
                  <p className="text-xs text-brandText-muted mt-1">
                    Your owner has been notified with your UTR reference. The payment status will update once reconciled.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* 1-Tap UPI Intent on Mobile */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <span className="text-[10px] font-bold text-brandText-muted uppercase tracking-wider">
                      Step 1: Direct UPI Transfer
                    </span>

                    {upiId ? (
                      <>
                        {upiIntentUrl && (
                          <a
                            href={upiIntentUrl}
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 active:scale-95 hover:bg-emerald-700 transition-all tap-target"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open UPI App (GPay, PhonePe, Paytm)
                          </a>
                        )}

                        {/* Copy UPI ID */}
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 border border-gray-200">
                          <div>
                            <span className="text-[10px] text-brandText-muted block">Owner UPI ID</span>
                            <span className="text-xs font-bold text-brandText">{upiId}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(upiId, 'upi')}
                            className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-primary border border-gray-200 hover:bg-primary-50 tap-target"
                          >
                            {copiedField === 'upi' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            {copiedField === 'upi' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        Direct UPI not published by PG manager. If you paid directly to owner's bank account or cash, submit your receipt or reference below.
                      </p>
                    )}

                    {/* Bank Details Dropdown / View */}
                    {settlement.settlementAccountNumber && (
                      <div className="text-[11px] text-brandText-muted bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1">
                        <p><strong>A/C:</strong> {settlement.settlementAccountNumber}</p>
                        <p><strong>IFSC:</strong> {settlement.settlementIfsc}</p>
                        <p><strong>Holder:</strong> {settlement.settlementAccountHolder}</p>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Upload Proof & UTR */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <span className="text-[10px] font-bold text-brandText-muted uppercase tracking-wider">
                      Step 2: Submit Payment Confirmation
                    </span>

                    {/* 12-digit UTR Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-brandText-muted mb-1">
                        12-digit UTR / Ref Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 429182749102"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Screenshot File Upload */}
                    <div>
                      <label className="block text-[11px] font-semibold text-brandText-muted mb-1">
                        Upload Payment Screenshot
                      </label>
                      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 cursor-pointer hover:border-primary hover:bg-teal-50/30 transition-all">
                        <Upload className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xs font-semibold text-brandText">
                          {screenshotFile ? screenshotFile.name : 'Tap to upload screenshot'}
                        </span>
                        <span className="text-[10px] text-brandText-muted mt-0.5">PNG, JPG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setScreenshotFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/25 disabled:opacity-50 hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
                  >
                    {submitting || uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting Proof...
                      </>
                    ) : (
                      'Submit Payment Proof'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
