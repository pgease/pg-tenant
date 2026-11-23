import React, { useState, useEffect } from 'react';
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
  Banknote,
  Building2,
  Calendar,
  UserCheck,
  FileText,
  Sparkles,
  Home,
  Zap,
} from 'lucide-react';
import { type RentCollectionDetails, tenantService } from '../../services/tenantService';

interface RentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dues: RentCollectionDetails | null;
  onPaymentSuccess?: () => void;
  initialItem?: 'all' | 'rent' | 'security' | 'dues';
  securityDepositAmount?: number;
  isSecurityPaid?: boolean;
  preselectedDueId?: string | null;
}

type PaymentMode = 'gateway' | 'upi' | 'cash';

export const RentPaymentModal: React.FC<RentPaymentModalProps> = ({
  isOpen,
  onClose,
  dues,
  onPaymentSuccess,
  initialItem = 'all',
  securityDepositAmount = 0,
  isSecurityPaid = false,
  preselectedDueId = null,
}) => {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('gateway');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Itemized Selection State
  const effectiveRent = Number(dues?.lineItems?.rent?.amount || 0);
  const effectiveSecurity = Number(
    dues?.lineItems?.securityDeposit?.amount || securityDepositAmount || 0,
  );
  const effectiveMisc = Number(
    dues?.lineItems?.miscellaneous?.otherDuesAmount ??
    dues?.lineItems?.miscellaneous?.amount ??
    0,
  );

  // Extract individual other dues
  const otherDuesList = dues?.lineItems?.miscellaneous?.otherDues || [];
  const linesList = dues?.lines || [];

  const individualDues = otherDuesList.length > 0
    ? otherDuesList.map((item) => ({
        id: item.id,
        title: item.title || item.dueType || 'Extra Charge',
        amount: Number(item.amount || item.balance || 0),
        balance: Number(item.balance !== undefined ? item.balance : item.amount || 0),
        dueDate: item.dueDate,
        type: item.dueType || 'Due',
      }))
    : linesList.length > 0
    ? linesList.map((l) => ({
        id: l.id,
        title: l.label || 'Extra Charge',
        amount: Number(l.amount || 0),
        balance: Number(l.balance ?? l.amount ?? 0),
        dueDate: dues?.nextDueDate,
        type: l.category || 'Due',
      }))
    : [];

  const [includeRent, setIncludeRent] = useState(true);
  const [includeSecurity, setIncludeSecurity] = useState(false);
  const [includeMisc, setIncludeMisc] = useState(false);
  const [selectedDueIds, setSelectedDueIds] = useState<string[]>([]);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountVal, setCustomAmountVal] = useState<number | string>('');

  // Gateway state
  const [gatewayConfig, setGatewayConfig] = useState<{
    available: boolean;
    checkoutMode: 'hosted' | 'seamless_upi';
    reason?: string;
  }>({ available: false, checkoutMode: 'hosted' });
  const [isInitiatingGateway, setIsInitiatingGateway] = useState(false);

  // Direct UPI state
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // Cash payment state
  const [cashAmount, setCashAmount] = useState<number | string>('');
  const [cashRecipient, setCashRecipient] = useState('');
  const [cashDate, setCashDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [cashReceiptFile, setCashReceiptFile] = useState<File | null>(null);
  const [cashNotes, setCashNotes] = useState('');

  // General submission state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'upi' | 'cash'>('upi');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial selection based on user click
  useEffect(() => {
    if (!isOpen) return;

    if (preselectedDueId) {
      setSelectedDueIds([preselectedDueId]);
      setIncludeMisc(true);
      setIncludeRent(false);
      setIncludeSecurity(false);
      setIsCustomAmount(false);
      return;
    }

    if (initialItem === 'security') {
      setIncludeSecurity(true);
      setIncludeRent(false);
      setIncludeMisc(false);
      setIsCustomAmount(false);
    } else if (initialItem === 'rent') {
      setIncludeRent(true);
      setIncludeSecurity(false);
      setIncludeMisc(false);
      setIsCustomAmount(false);
    } else if (initialItem === 'dues') {
      setIncludeMisc(true);
      setSelectedDueIds(individualDues.map((d) => d.id));
      setIncludeRent(false);
      setIncludeSecurity(false);
      setIsCustomAmount(false);
    } else {
      const isRentSettled = Boolean(dues?.lineItems?.rent?.isPaid || dues?.summary?.rentDue === 0);
      const isSecSettled = Boolean(isSecurityPaid || dues?.lineItems?.securityDeposit?.isPaid);
      setIncludeRent(!isRentSettled && effectiveRent > 0);
      setIncludeSecurity(!isSecSettled && effectiveSecurity > 0);
      setIncludeMisc(effectiveMisc > 0);
      setSelectedDueIds(individualDues.map((d) => d.id));
      setIsCustomAmount(false);
    }
  }, [
    isOpen,
    initialItem,
    preselectedDueId,
    effectiveRent,
    effectiveSecurity,
    effectiveMisc,
    isSecurityPaid,
    dues?.status,
    dues?.lineItems?.rent?.isPaid,
    dues?.lineItems?.securityDeposit?.isPaid,
    dues?.summary?.rentDue,
  ]);

  // Compute live payable amount
  const selectedMiscAmount = individualDues.length > 0 && selectedDueIds.length > 0
    ? individualDues.filter((d) => selectedDueIds.includes(d.id)).reduce((sum, d) => sum + d.amount, 0)
    : includeMisc
    ? effectiveMisc
    : 0;

  const payableAmount = isCustomAmount
    ? (Number(customAmountVal) || 0)
    : (includeRent ? effectiveRent : 0) +
      (includeSecurity ? effectiveSecurity : 0) +
      (includeMisc ? (individualDues.length > 0 ? selectedMiscAmount : effectiveMisc) : 0);

  // Sync cash amount with live payableAmount
  useEffect(() => {
    if (payableAmount > 0) {
      setCashAmount(payableAmount);
    }
  }, [payableAmount]);

  // Check gateway availability and reset forms on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setSubmissionSuccess(false);
    setErrorMessage(null);
    setUtrNumber('');
    setScreenshotFile(null);
    setCashRecipient('');
    setCashDate(new Date().toISOString().split('T')[0]);
    setCashReceiptFile(null);
    setCashNotes('');

    tenantService
      .getEasebuzzConfig()
      .then((cfg) => {
        if (!isMounted) return;
        setGatewayConfig(cfg);
        if (cfg.available) {
          setPaymentMode('gateway');
        } else {
          setPaymentMode('upi');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setGatewayConfig({ available: false, checkoutMode: 'hosted' });
        setPaymentMode('upi');
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !dues) return null;

  const getSelectedPurposeText = () => {
    if (isCustomAmount) {
      return `Custom Dues Payment of ₹${Number(customAmountVal || 0).toLocaleString('en-IN')}`;
    }
    const items: string[] = [];
    if (includeRent) items.push(`Monthly Rent (₹${effectiveRent.toLocaleString('en-IN')})`);
    if (includeSecurity) items.push(`Security Deposit (₹${effectiveSecurity.toLocaleString('en-IN')})`);
    if (includeMisc) items.push(`Utilities/Dues (₹${effectiveMisc.toLocaleString('en-IN')})`);
    return items.length > 0 ? items.join(' + ') : 'Stay Dues';
  };

  const handleInitiateGateway = async () => {
    if (payableAmount <= 0) {
      setErrorMessage('Please select at least one item or enter a valid amount.');
      return;
    }
    setErrorMessage(null);
    setIsInitiatingGateway(true);
    try {
      const res = await tenantService.createEasebuzzPayment({
        checkoutMode: gatewayConfig.checkoutMode,
        dueIds: dues.rentCollectionId ? [dues.rentCollectionId] : undefined,
        amount: payableAmount,
        includeRent,
        includeSecurityDeposit: includeSecurity,
        includeMiscellaneous: includeMisc,
      } as any);

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error('Checkout URL not received from gateway. Please try direct UPI or cash handover.');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err.message || 'Failed to initiate online UPI payment. Please try Direct UPI or Cash.',
      );
    } finally {
      setIsInitiatingGateway(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Direct UPI / UTR submission
  const handleManualUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (payableAmount <= 0) {
      setErrorMessage('Please select at least one item or enter a valid amount.');
      return;
    }

    const cleanUtr = utrNumber.replace(/\s/g, '');
    if (cleanUtr && cleanUtr.length !== 12) {
      setErrorMessage('UTR / Reference number must be exactly 12 digits (or leave blank if uploading screenshot).');
      return;
    }

    if (!cleanUtr && !screenshotFile) {
      setErrorMessage('Please provide either the 12-digit UTR/reference number or upload a payment screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = '';
      if (screenshotFile) {
        setUploading(true);
        photoUrl = await tenantService.uploadPaymentProof(screenshotFile);
        setUploading(false);
      }

      await tenantService.submitManualPayment({
        amount: payableAmount,
        reference: cleanUtr || 'SCREENSHOT_UPLOADED',
        notes: `Direct UPI transfer of ₹${payableAmount.toLocaleString('en-IN')} for ${getSelectedPurposeText()} (${dues.period.label}). UTR: ${cleanUtr || 'N/A'}.`,
        photoUrl: photoUrl || undefined,
        rentCollectionId: dues.rentCollectionId || undefined,
        paymentMethod: 'UPI_MANUAL',
      });

      setSuccessType('upi');
      setSubmissionSuccess(true);
      setTimeout(() => {
        onPaymentSuccess?.();
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err.message || 'Failed to submit payment details. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // Handle Cash Handover submission
  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amount = Number(cashAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid cash amount paid.');
      return;
    }

    if (!cashRecipient.trim()) {
      setErrorMessage('Please specify who you handed the cash to (e.g. PG Manager, Owner, Reception).');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = '';
      if (cashReceiptFile) {
        setUploading(true);
        photoUrl = await tenantService.uploadPaymentProof(cashReceiptFile);
        setUploading(false);
      }

      const handoverDetail = `Cash of ₹${amount.toLocaleString('en-IN')} handed over to ${cashRecipient.trim()} on ${cashDate || new Date().toISOString().split('T')[0]} for ${getSelectedPurposeText()}.`;
      const finalNote = cashNotes.trim() ? `${handoverDetail} Note: ${cashNotes.trim()}` : handoverDetail;

      await tenantService.submitManualPayment({
        amount,
        paymentMethod: 'CASH',
        reference: 'CASH_HANDOVER',
        notes: finalNote,
        photoUrl: photoUrl || undefined,
        rentCollectionId: dues.rentCollectionId || undefined,
      });

      setSuccessType('cash');
      setSubmissionSuccess(true);
      setTimeout(() => {
        onPaymentSuccess?.();
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err.message || 'Failed to submit cash payment confirmation. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const settlement = dues.settlement || {};
  const upiId = settlement.upiId || settlement.settlementUpiId || null;
  const payeeName = dues.owner?.name || settlement.accountHolderName || dues.property?.name || 'PG Stay';

  // Format amount for standard NPCI UPI intent (must be positive number with 2 decimal places, e.g. 315.00)
  const formattedAmount = payableAmount > 0 ? payableAmount.toFixed(2) : '';
  const note = `PG Stay ${dues.tenant?.name || ''} ${dues.period?.label || ''}`.trim() || `Rent ${payeeName}`;

  // Always generate live UPI Intent URL with the actual selected payableAmount
  const upiIntentUrl = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}${formattedAmount ? `&am=${formattedAmount}` : ''}&cu=INR&tn=${encodeURIComponent(note)}`
    : null;

  // Always render dynamic QR matching the live payable amount, fallback to static backend image if no UPI ID
  const qrImageUrl = settlement.qrImageUrl || (settlement as any)?.settlementQrImageUrl || (settlement as any)?.settlementQrCodeUrl;
  const qrDisplayUrl = upiIntentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiIntentUrl)}`
    : qrImageUrl || (settlement.upiQrString ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(settlement.upiQrString)}` : null);
  const displayAccountNum = settlement.accountNumberMasked || settlement.accountNumber || settlement.settlementAccountNumber;
  const displayIfsc = settlement.ifscCode || settlement.settlementIfsc;
  const displayHolder = settlement.accountHolderName || settlement.settlementAccountHolder || dues.owner?.name || 'PG Owner';
  const displayBank = settlement.bankName || settlement.settlementBankName;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="sheet-full flex flex-col w-full max-w-lg max-h-[100dvh] sm:max-h-[92dvh] rounded-none sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-50 flex items-center justify-center text-primary border border-teal-100/80 shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-brandText">Pay Rent & Dues</h2>
                <span className="rounded-full bg-teal-100/70 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                  {dues.period.label}
                </span>
              </div>
              <p className="text-[11px] text-brandText-muted mt-0.5">Secure payment & rent receipt desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText hover:bg-gray-200 transition-colors tap-target"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Amount Due Card */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-50/40 to-white p-4 border border-teal-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                Total Selected Payable
              </span>
              <p className="text-2xl font-black text-brandText mt-0.5 tracking-tight">
                ₹{payableAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/90 px-3 py-1 text-xs font-bold text-teal-900 border border-teal-200">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                {isCustomAmount ? 'Custom Amount' : `${(includeRent ? 1 : 0) + (includeSecurity ? 1 : 0) + (includeMisc ? 1 : 0)} Item(s)`}
              </span>
            </div>
          </div>

          {/* Interactive Itemized Selection Checklist */}
          <div className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-3.5 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-brandText font-bold text-xs uppercase tracking-wider">
                Select Items to Pay
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomAmount(false);
                    setIncludeRent(effectiveRent > 0);
                    setIncludeSecurity(effectiveSecurity > 0);
                    setIncludeMisc(effectiveMisc > 0);
                  }}
                  className="text-[10px] font-bold text-primary hover:underline px-2 py-0.5 rounded bg-white border border-gray-200 shadow-2xs"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomAmount(!isCustomAmount)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                    isCustomAmount
                      ? 'bg-primary text-white border-primary shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100 shadow-2xs'
                  }`}
                >
                  Custom Amount
                </button>
              </div>
            </div>

            {/* Custom Amount Field (if toggled) */}
            {isCustomAmount ? (
              <div className="p-3 bg-white rounded-xl border border-teal-200 space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-bold text-teal-900 flex items-center justify-between">
                  <span>Enter Custom Due / Partial Amount (₹)</span>
                  <span className="text-[10px] text-gray-400 font-normal">e.g. ₹5,000</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount to pay"
                    value={customAmountVal}
                    onChange={(e) => setCustomAmountVal(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm font-black text-brandText focus:border-primary focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  Use this to clear custom security deposit, partial rent, or agreed utility balance.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* 1. Monthly Rent Option */}
                {effectiveRent > 0 && (
                  <div
                    onClick={() => setIncludeRent(!includeRent)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      includeRent
                        ? 'bg-white border-teal-500 shadow-xs'
                        : 'bg-white/60 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                        includeRent ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {includeRent && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5 text-primary" />
                          <span className="font-bold text-brandText">{dues.lineItems?.rent?.title || 'Monthly Room Rent'}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block">{dues.period.label} cycle</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-brandText block">₹{effectiveRent.toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] font-bold ${dues.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {dues.status === 'paid' ? 'Paid ✓' : 'Due'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Security Deposit Option */}
                {effectiveSecurity > 0 && (
                  <div
                    onClick={() => setIncludeSecurity(!includeSecurity)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      includeSecurity
                        ? 'bg-white border-teal-500 shadow-xs'
                        : 'bg-white/60 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                        includeSecurity ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {includeSecurity && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-bold text-brandText">{dues.lineItems?.securityDeposit?.title || 'Security Deposit'}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block">Refundable caution deposit</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-brandText block">₹{effectiveSecurity.toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] font-bold ${isSecurityPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isSecurityPaid ? 'Secured ✓' : 'Deposit Due'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Miscellaneous & Utilities Option */}
                {effectiveMisc > 0 && (
                  <div className="space-y-1.5">
                    <div
                      onClick={() => {
                        const nextState = !includeMisc;
                        setIncludeMisc(nextState);
                        if (nextState) {
                          setSelectedDueIds(individualDues.map((d) => d.id));
                        } else {
                          setSelectedDueIds([]);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        includeMisc
                          ? 'bg-white border-teal-500 shadow-xs'
                          : 'bg-white/60 border-gray-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                          includeMisc ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {includeMisc && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-bold text-brandText">{dues.lineItems?.miscellaneous?.title || 'Utilities & Maintenance'}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 block">
                            {individualDues.length > 0
                              ? `${selectedDueIds.length} of ${individualDues.length} item(s) selected`
                              : (dues.lineItems?.miscellaneous?.description || 'Electricity & maintenance dues')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-brandText block">
                          ₹{(individualDues.length > 0 && includeMisc ? selectedMiscAmount : effectiveMisc).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600">Pending</span>
                      </div>
                    </div>

                    {/* Indented Individual Dues Breakdown */}
                    {includeMisc && individualDues.length > 0 && (
                      <div className="pl-4 pt-1 space-y-1.5 animate-fade-in">
                        {individualDues.map((d) => {
                          const isSelected = selectedDueIds.includes(d.id);
                          return (
                            <div
                              key={d.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  const updated = selectedDueIds.filter((id) => id !== d.id);
                                  setSelectedDueIds(updated);
                                  if (updated.length === 0) setIncludeMisc(false);
                                } else {
                                  setSelectedDueIds([...selectedDueIds, d.id]);
                                }
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border text-[11px] cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                                  : 'bg-white border-gray-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                                  isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 bg-white'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                                <div>
                                  <span className="font-bold text-brandText">{d.title}</span>
                                  <span className="text-[10px] text-gray-400 block">{d.type}</span>
                                </div>
                              </div>
                              <span className="font-black text-brandText">₹{d.amount.toLocaleString('en-IN')}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submission Success View */}
          {submissionSuccess ? (
            <div className="rounded-2xl bg-teal-50 p-6 text-center border border-teal-200 animate-fade-in space-y-2">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
              <h3 className="text-base font-bold text-brandText">
                {successType === 'cash' ? 'Cash Payment Submitted!' : 'Payment Submitted for Verification!'}
              </h3>
              <p className="text-xs text-brandText-muted max-w-sm mx-auto leading-relaxed">
                {successType === 'cash'
                  ? 'Your cash payment report has been sent to the PG manager. Once confirmed, your rent register and digital receipt will be updated automatically.'
                  : 'Your owner has been notified with your UTR reference. The rent register will update once reconciled.'}
              </p>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 animate-fade-in">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* MODE 1: ONLINE INSTANT GATEWAY */}
              {paymentMode === 'gateway' && (
                <div className="space-y-4 animate-fade-in">
                  {gatewayConfig.available ? (
                    <>
                      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-brandText-muted">Payment Method</span>
                          <span className="font-bold text-brandText flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            Easebuzz Instant UPI
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-brandText-muted">Supported UPI Apps</span>
                          <span className="font-medium text-brandText">GPay • PhonePe • Paytm • BHIM</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-brandText-muted">Settlement</span>
                          <span className="font-medium text-brandText">Direct to PG Owner Bank Account</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-brandText-muted">Convenience Fee</span>
                          <span className="font-bold text-emerald-600">₹0 (Zero Extra Fee)</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleInitiateGateway}
                        disabled={isInitiatingGateway || payableAmount <= 0}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/25 disabled:opacity-50 hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
                      >
                        {isInitiatingGateway ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Opening UPI Gateway...</span>
                          </>
                        ) : payableAmount <= 0 ? (
                          <span>Select an item to pay (₹0)</span>
                        ) : (
                          <>
                            <span>Pay ₹{payableAmount.toLocaleString('en-IN')} via Instant UPI</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>

                      <p className="text-center text-[11px] text-brandText-muted flex items-center justify-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        256-bit encrypted checkout with instant receipt generation
                      </p>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 text-center">
                      <AlertCircle className="h-7 w-7 text-amber-600 mx-auto" />
                      <div>
                        <h3 className="text-xs font-bold text-brandText">Instant UPI Gateway Not Configured</h3>
                        <p className="text-[11px] text-brandText-muted mt-1 leading-relaxed">
                          Your PG manager accepts direct payments. You can scan their Standee QR code, transfer via UPI/Bank, or submit cash handover details below.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => setPaymentMode('upi')}
                          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Direct UPI / QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode('cash')}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                          <span>Paid in Cash</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: DIRECT UPI / UTR */}
              {paymentMode === 'upi' && (
                <form onSubmit={handleManualUpiSubmit} className="space-y-4 animate-fade-in">
                  {/* Step 1: Direct Transfer Details */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 shadow-xs">
                    <span className="text-[10px] font-bold text-brandText-muted uppercase tracking-wider block">
                      Step 1: Direct UPI / Bank Transfer
                    </span>

                    {/* QR Code Display */}
                    {Boolean(qrDisplayUrl) && (
                      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
                        <img
                          src={qrDisplayUrl!}
                          alt="Owner UPI QR Code"
                          className="h-44 w-44 object-contain rounded-xl border border-white shadow-sm"
                        />
                        <p className="text-[10px] text-gray-500 mt-1.5 font-medium">Scan using any UPI app (GPay, PhonePe, Paytm)</p>
                      </div>
                    )}

                    {upiId ? (
                      <div className="space-y-2">
                        {upiIntentUrl && (
                          <a
                            href={upiIntentUrl}
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all tap-target"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open UPI App (GPay, PhonePe, Paytm)
                          </a>
                        )}

                        {/* Copy UPI ID */}
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 border border-gray-200">
                          <div>
                            <span className="text-[10px] text-brandText-muted block">Owner UPI ID</span>
                            <span className="text-xs font-bold text-brandText font-mono break-anywhere">{upiId}</span>
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
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                        Direct UPI not published. If you paid directly to owner's bank account or cash, submit your reference below.
                      </div>
                    )}

                    {/* Bank Details View (if owner added Bank Account) */}
                    {Boolean(displayAccountNum || displayIfsc) && (
                      <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 space-y-2 text-xs">
                        <span className="text-[10px] font-bold text-brandText-muted uppercase tracking-wider block flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-gray-500" /> Bank Account Details
                        </span>
                        {displayBank && (
                          <div className="flex justify-between">
                            <span className="text-brandText-muted">Bank:</span>
                            <span className="font-semibold text-brandText">{displayBank}</span>
                          </div>
                        )}
                        {displayHolder && (
                          <div className="flex justify-between">
                            <span className="text-brandText-muted">Account Holder:</span>
                            <span className="font-semibold text-brandText">{displayHolder}</span>
                          </div>
                        )}
                        {displayAccountNum && (
                          <div className="flex justify-between items-center">
                            <span className="text-brandText-muted">Account No:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-brandText">{displayAccountNum}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(displayAccountNum, 'acc')}
                                className="text-primary hover:text-primary-dark p-0.5"
                                title="Copy Account Number"
                              >
                                {copiedField === 'acc' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                        {displayIfsc && (
                          <div className="flex justify-between items-center">
                            <span className="text-brandText-muted">IFSC Code:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-brandText">{displayIfsc}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(displayIfsc, 'ifsc')}
                                className="text-primary hover:text-primary-dark p-0.5"
                                title="Copy IFSC"
                              >
                                {copiedField === 'ifsc' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Upload Proof & UTR */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 shadow-xs">
                    <span className="text-[10px] font-bold text-brandText-muted uppercase tracking-wider block">
                      Step 2: Submit Payment Confirmation
                    </span>

                    {/* Amount Paid */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-brandText-muted">
                          Amount Paid (₹)
                        </label>
                        <span className="text-[10px] text-teal-700 font-semibold">
                          {getSelectedPurposeText()}
                        </span>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={`₹${payableAmount.toLocaleString('en-IN')}`}
                        className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-xs font-bold text-brandText select-none"
                      />
                    </div>

                    {/* 12-digit UTR Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-brandText-muted mb-1">
                        12-digit UTR / Ref Number <span className="font-normal">(Optional if screenshot attached)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="e.g. 429182749102"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-mono font-semibold text-brandText focus:border-primary focus:bg-white focus:outline-none"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Found in your payment app as UPI Transaction ID or Ref ID.</p>
                    </div>

                    {/* Screenshot File Upload */}
                    <div>
                      <label className="block text-[11px] font-semibold text-brandText-muted mb-1">
                        Payment Screenshot / Receipt <span className="font-normal">(Optional if UTR provided)</span>
                      </label>
                      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 cursor-pointer hover:border-primary hover:bg-teal-50/30 transition-all">
                        <Upload className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xs font-semibold text-brandText text-center truncate max-w-[280px]">
                          {screenshotFile ? screenshotFile.name : 'Tap to upload screenshot'}
                        </span>
                        <span className="text-[10px] text-brandText-muted mt-0.5">PNG, JPG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
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
                        <span>Submitting Proof...</span>
                      </>
                    ) : (
                      'Submit Payment Proof'
                    )}
                  </button>
                </form>
              )}

              {/* MODE 3: PAID VIA CASH */}
              {paymentMode === 'cash' && (
                <form onSubmit={handleCashSubmit} className="space-y-4 animate-fade-in">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-1.5 text-xs text-emerald-950">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                      <span>In-Person Cash Payment</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                      Handed cash directly to the PG owner or manager? Record your cash payment here. Once verified by the management, your rent ledger and official receipt will be updated.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3.5 shadow-xs">
                    {/* Amount Paid */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-brandText-muted">
                          Cash Amount Paid (₹) <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setCashAmount(dues.totalPayable)}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Fill Full Due (₹{dues.totalPayable.toLocaleString('en-IN')})
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-brandText-muted text-xs">₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 5000"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3.5 py-2.5 text-xs font-bold text-brandText focus:border-emerald-600 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Handed Over To */}
                    <div>
                      <label className="text-[11px] font-semibold text-brandText-muted mb-1 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Handed Over To (Person / Desk)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh (PG Manager) / Reception Desk"
                        value={cashRecipient}
                        onChange={(e) => setCashRecipient(e.target.value)}
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-medium text-brandText focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                      {/* Quick recipient chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['PG Manager', 'Property Owner', 'Reception Counter', 'Warden'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setCashRecipient(tag)}
                            className="rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-semibold text-brandText-muted px-2.5 py-1 border border-gray-200/80 transition-all"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date of Payment */}
                    <div>
                      <label className="text-[11px] font-semibold text-brandText-muted mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Date of Cash Handover</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={cashDate}
                          onChange={(e) => setCashDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-medium text-brandText focus:border-emerald-600 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Optional Paper Receipt Slip */}
                    <div>
                      <label className="block text-[11px] font-semibold text-brandText-muted mb-1">
                        Physical Cash Slip / Receipt Memo <span className="font-normal">(Optional)</span>
                      </label>
                      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 cursor-pointer hover:border-emerald-600 hover:bg-emerald-50/30 transition-all">
                        <FileText className="h-5 w-5 text-emerald-600 mb-1" />
                        <span className="text-xs font-semibold text-brandText text-center truncate max-w-[280px]">
                          {cashReceiptFile ? cashReceiptFile.name : 'Upload paper receipt or signed voucher'}
                        </span>
                        <span className="text-[10px] text-brandText-muted mt-0.5">PNG, JPG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setCashReceiptFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-[11px] font-semibold text-brandText-muted mb-1">
                        Additional Note <span className="font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Paid in full at reception desk during room inspection."
                        value={cashNotes}
                        onChange={(e) => setCashNotes(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs font-medium text-brandText focus:border-emerald-600 focus:bg-white focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 disabled:opacity-50 hover:bg-emerald-700 active:scale-[0.98] transition-all tap-target"
                  >
                    {submitting || uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Cash Report...</span>
                      </>
                    ) : (
                      <>
                        <Banknote className="h-4 w-4" />
                        <span>Confirm Cash Handover</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-3 pt-2 pb-safe">
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-100/90 p-1.5 border border-gray-200/70">
            <button
              type="button"
              onClick={() => {
                setPaymentMode('gateway');
                setErrorMessage(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xs font-bold transition-all ${
                paymentMode === 'gateway'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-brandText-muted hover:text-brandText hover:bg-white/50'
              }`}
            >
              <CreditCard className="h-4 w-4 flex-shrink-0" />
              <span className="text-center leading-tight">Instant UPI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('upi');
                setErrorMessage(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xs font-bold transition-all ${
                paymentMode === 'upi'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-brandText-muted hover:text-brandText hover:bg-white/50'
              }`}
            >
              <QrCode className="h-4 w-4 flex-shrink-0" />
              <span className="text-center leading-tight">Direct UPI / QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('cash');
                setErrorMessage(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xs font-bold transition-all ${
                paymentMode === 'cash'
                  ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-black/5'
                  : 'text-brandText-muted hover:text-brandText hover:bg-white/50'
              }`}
            >
              <Banknote className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span className="text-center leading-tight">Paid in Cash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
