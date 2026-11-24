import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  Smartphone,
  ShieldCheck,
  Home,
  Zap,
  Sparkles,
  FileText,
  Tag,
  Wifi,
  UserCheck,
  Receipt,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantService, type RentCollectionDetails, type OtherDueItem } from '../services/tenantService';
import { ListSkeleton } from '../components/ui/ListSkeleton';
import { InlineError } from '../components/ui/InlineError';
import { RentPaymentModal } from '../components/my-pg/RentPaymentModal';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant, propertyDetails, checkTenancy, isCheckingTenancy } = useAuth();

  const [dues, setDues] = useState<RentCollectionDetails | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [modalInitialItem, setModalInitialItem] = useState<'all' | 'rent' | 'security' | 'dues'>('all');
  const [modalPreselectedDueId, setModalPreselectedDueId] = useState<string | null>(null);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated && isLinkedTenant) {
        let historyFailed = false;
        const [duesRes, historyRes] = await Promise.all([
          tenantService.getRentDues().catch(() => null),
          tenantService.getRentHistory(1, 20).catch(() => {
            historyFailed = true;
            return { transactions: [], totalAmountPaid: 0 };
          }),
        ]);
        setHistoryError(historyFailed);
        setDues(duesRes);
        const txList = historyRes.transactions || historyRes.history || (Array.isArray(historyRes) ? historyRes : []);
        setTransactions(txList);
        setTotalPaid(historyRes.totalAmountPaid || txList.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0));
      }
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, [isAuthenticated, isLinkedTenant]);

  // Standard Monthly Rent
  const monthlyRent = Number(
    dues?.lineItems?.rent?.amount ??
    propertyDetails?.roomTenant?.rentAmount ??
    (propertyDetails?.roomTenant as any)?.monthlyRent ??
    propertyDetails?.room?.monthlyRent ??
    0
  );

  const isRentPaid = Boolean(
    dues?.lineItems?.rent?.isPaid ||
    (dues?.summary?.rentDue === 0 && (dues?.summary?.amountPaid ?? 0) > 0)
  );

  // Security Deposit
  const securityDepositAmount = Number(
    dues?.lineItems?.securityDeposit?.amount ??
    propertyDetails?.roomTenant?.securityDeposit ??
    (propertyDetails?.roomTenant as any)?.depositAmount ??
    propertyDetails?.room?.securityDeposit ??
    dues?.breakdown?.securityDeposit ??
    0
  );

  const isSecurityPaid = Boolean(
    dues?.lineItems?.securityDeposit?.isPaid ||
    (propertyDetails?.roomTenant as any)?.securityDepositPaid ||
    (propertyDetails?.roomTenant as any)?.isSecurityDepositPaid ||
    (propertyDetails?.roomTenant as any)?.depositPaid
  );

  // Miscellaneous and Other Dues
  const otherDuesList: OtherDueItem[] = dues?.lineItems?.miscellaneous?.otherDues || [];
  const linesList = dues?.lines || [];

  const miscTotal = Number(
    dues?.lineItems?.miscellaneous?.otherDuesAmount ??
    dues?.lineItems?.miscellaneous?.amount ??
    dues?.breakdown?.miscellaneous ??
    0
  );

  // Accurate Outstanding Balance calculation:
  // Note: dues.summary.balanceDue takes precedence to avoid top-level totalPayable=0 quirks
  const balanceDue = dues?.summary?.balanceDue !== undefined
    ? Number(dues.summary.balanceDue)
    : dues?.summary?.totalPayable !== undefined
    ? Number(dues.summary.totalPayable)
    : dues?.payable !== undefined
    ? Number(dues.payable)
    : Number(dues?.totalPayable || 0);

  const totalBilled = Number(
    dues?.summary?.totalBilled ?? (monthlyRent + securityDepositAmount + miscTotal)
  );

  const amountPaidInPeriod = Number(
    dues?.summary?.amountPaid ?? (totalBilled > balanceDue ? totalBilled - balanceDue : 0)
  );

  const isAllCleared = dues?.status?.toLowerCase() === 'paid' || (balanceDue === 0 && dues !== null);

  // Unified breakdown list of individual other dues
  const detailedDuesList = otherDuesList.length > 0
    ? otherDuesList.map((item) => ({
        id: item.id,
        title: item.title || item.dueType || 'Extra Charge',
        type: item.dueType || 'Extra Due',
        amount: Number(item.amount || item.balance || 0),
        balance: Number(item.balance !== undefined ? item.balance : item.amount || 0),
        dueDate: item.dueDate || dues?.nextDueDate,
        createdAt: item.createdAt,
        description: item.description,
        isPaid: Boolean(item.isPaid || (item.balance !== undefined && item.balance === 0)),
      }))
    : linesList.length > 0
    ? linesList.map((line) => ({
        id: line.id,
        title: line.label || 'Stay Due',
        type: line.category || line.type || 'Stay Charge',
        amount: Number(line.amount || 0),
        balance: Number(line.balance ?? line.amount ?? 0),
        dueDate: dues?.nextDueDate,
        createdAt: undefined,
        description: '',
        isPaid: Boolean(line.balance === 0),
      }))
    : [];

  const pendingDuesCount = detailedDuesList.filter((d) => !d.isPaid).length;

  const openPaymentForItem = (item: 'all' | 'rent' | 'security' | 'dues', dueId?: string) => {
    setModalInitialItem(item);
    setModalPreselectedDueId(dueId || null);
    setShowPayModal(true);
  };

  const formatDueDate = (dateStr?: string) => {
    if (dateStr) {
      const formatted = formatDateToDDMMYYYY(dateStr);
      if (formatted) {
        return `Due by ${formatted}`;
      }
    }
    if (propertyDetails?.nextRentDueDate) {
      return `Due by ${formatDateToDDMMYYYY(propertyDetails.nextRentDueDate)}`;
    }
    if (dues?.lineItems?.rent?.dueDay) {
      return `Due on ${dues.lineItems.rent.dueDay} of month`;
    }
    return 'Due on 1st of month';
  };

  const getDueCategoryIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('wifi') || t.includes('internet')) return <Wifi className="h-4 w-4 text-blue-600" />;
    if (t.includes('join') || t.includes('onboard') || t.includes('admin')) return <UserCheck className="h-4 w-4 text-emerald-600" />;
    if (t.includes('laundry') || t.includes('wash')) return <Sparkles className="h-4 w-4 text-indigo-600" />;
    if (t.includes('electric') || t.includes('power') || t.includes('meter')) return <Zap className="h-4 w-4 text-amber-600" />;
    if (t.includes('deposit') || t.includes('caution')) return <ShieldCheck className="h-4 w-4 text-teal-600" />;
    return <Tag className="h-4 w-4 text-teal-600" />;
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-8 pb-12 text-center space-y-4 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-primary shadow-sm">
          <CreditCard className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-brandText">Sign In to View Payments</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Please log in with your mobile OTP to check monthly rent dues, pay online via UPI, and download tax receipts.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
        >
          Sign In with Mobile OTP
        </button>
      </div>
    );
  }

  if (!isLinkedTenant) {
    return (
      <div className="pt-8 pb-12 text-center space-y-4 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-primary shadow-sm">
          <CreditCard className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-brandText">No Active PG Stay Linked</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Your monthly rent dues, online UPI settlements, and payment receipts will appear here once your PG manager adds your phone number to their property.
          </p>
        </div>
        <div className="flex gap-2 justify-center max-w-xs mx-auto pt-2">
          <button
            onClick={() => checkTenancy()}
            disabled={isCheckingTenancy}
            className="flex-1 rounded-xl border border-teal-200 bg-white py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-teal-50 active:scale-95 transition-all"
          >
            {isCheckingTenancy ? 'Syncing...' : 'Sync Status'}
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark active:scale-95 transition-all"
          >
            Find PGs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-1 pb-6 animate-fade-in">
      {/* Payment Modal */}
      <RentPaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        dues={dues}
        initialItem={modalInitialItem}
        securityDepositAmount={securityDepositAmount}
        isSecurityPaid={isSecurityPaid}
        preselectedDueId={modalPreselectedDueId}
        onPaymentSuccess={() => {
          loadPaymentData();
        }}
      />

      {/* 1. Top Metric Cards (Live Backend Data) */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5">
        {/* Total Billed in Period */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold leading-tight text-gray-500 block">Total Invoiced</span>
          <p className="text-base font-black text-brandText mt-0.5 break-anywhere">
            ₹{totalBilled.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400 font-medium">Period total</span>
        </div>

        {/* Outstanding Due */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
          <span className={`text-[11px] font-semibold leading-tight block ${balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {balanceDue > 0 ? 'Outstanding Due' : 'All Cleared'}
          </span>
          <p className={`text-base font-black mt-0.5 break-anywhere ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            ₹{balanceDue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400 font-medium">
            {balanceDue > 0 ? `${pendingDuesCount > 0 ? `${pendingDuesCount} item(s) due` : 'Pending'}` : 'Zero balance'}
          </span>
        </div>

        {/* Total Cleared */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold leading-tight text-emerald-600 block">Amount Paid</span>
          <p className="text-base font-black text-brandText mt-0.5 break-anywhere">
            ₹{(totalPaid || amountPaidInPeriod).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400 font-medium">Cleared to date</span>
        </div>
      </div>

      {/* 2. Amount Due Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary to-primary-dark p-6 text-white shadow-xl shadow-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                {dues?.period?.label || 'Current Period'}
              </span>
              <span className="text-xs text-white/80">
                {propertyDetails?.property?.name || dues?.property?.name || 'My PG Stay'}
              </span>
            </div>

            <div className="pt-0.5">
              <span className="text-xs font-medium text-white/80">
                {isAllCleared ? 'Current Month Status' : 'Net Outstanding Balance'}
              </span>
              <h2 className="text-3xl font-black tracking-tight mt-0.5">
                ₹{balanceDue.toLocaleString('en-IN')}
              </h2>
            </div>

            <p className="text-xs text-white/85 flex items-center gap-1.5 pt-0.5">
              <span>Monthly Rent: ₹{monthlyRent.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span>{isAllCleared ? 'All dues cleared ✓' : formatDueDate()}</span>
            </p>
          </div>

          <button
            onClick={() => openPaymentForItem('all')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-black text-primary shadow-lg hover:bg-gray-50 active:scale-95 transition-all tap-target shrink-0"
          >
            <CreditCard className="h-4 w-4 text-primary" />
            <span>{isAllCleared ? 'Make Advance Payment' : `Pay ₹${balanceDue.toLocaleString('en-IN')} Now`}</span>
          </button>
        </div>

        {/* Last payment reference banner if present */}
        {dues?.paymentInfo?.paymentMethod && (
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/90">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              <span>
                Last payment of ₹{amountPaidInPeriod.toLocaleString('en-IN')} received via{' '}
                <strong className="uppercase">{dues.paymentInfo.paymentMethod}</strong>
                {dues.paymentInfo.paidAt ? ` on ${new Date(dues.paymentInfo.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
              </span>
            </span>
            {dues.paymentInfo.reference && (
              <span className="font-mono text-[10px] bg-white/15 px-2 py-0.5 rounded-md">
                Ref: {dues.paymentInfo.reference}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Itemized Stay Bills & Charges (Rent, Security, Utilities) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-brandText uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Stay Bills & Categories
          </h3>
          <span className="text-[10px] text-gray-400 font-medium">Click to pay specific bill</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Monthly Room Rent */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-primary">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brandText">Monthly Room Rent</h4>
                  <p className="text-[11px] text-gray-400">{formatDueDate()}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isRentPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {isRentPaid ? 'PAID ✓' : 'UNPAID'}
              </span>
            </div>

            <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block">Amount</span>
                <span className="text-base font-black text-brandText">
                  ₹{monthlyRent.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => openPaymentForItem('rent')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                  isRentPaid
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
                }`}
              >
                {isRentPaid ? 'Receipt / Paid' : 'Pay Rent'}
              </button>
            </div>
          </div>

          {/* Card 2: Security Deposit */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brandText">Security Deposit</h4>
                  <p className="text-[11px] text-gray-400">Refundable caution deposit</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isSecurityPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {isSecurityPaid ? 'SECURED ✓' : 'PENDING'}
              </span>
            </div>

            <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block">Deposit Amount</span>
                <span className="text-base font-black text-brandText">
                  ₹{securityDepositAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => openPaymentForItem('security')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                  isSecurityPaid
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                }`}
              >
                {isSecurityPaid ? 'Deposit Status' : 'Pay Deposit'}
              </button>
            </div>
          </div>

          {/* Card 3: Utilities, Electricity & Extra Dues */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brandText">Utilities & Extra Dues</h4>
                  <p className="text-[11px] text-gray-400">
                    {pendingDuesCount > 0 ? `${pendingDuesCount} pending charge(s)` : 'Wifi, laundry & add-ons'}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                miscTotal === 0 || balanceDue === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {miscTotal === 0 || balanceDue === 0 ? 'CLEARED' : 'DUE'}
              </span>
            </div>

            <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block">Pending Charges</span>
                <span className="text-base font-black text-brandText">
                  ₹{miscTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => openPaymentForItem('dues')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                  miscTotal === 0 || balanceDue === 0
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                }`}
              >
                {miscTotal === 0 || balanceDue === 0 ? 'No Dues' : `Pay ₹${miscTotal}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DEDICATED SECTION: DETAILED BREAKDOWN OF INDIVIDUAL DUES */}
      {detailedDuesList.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold text-brandText uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-teal-600" />
                Itemized Dues Breakdown ({detailedDuesList.length})
              </h3>
              <p className="text-[11px] text-gray-400">
                Detailed list of utility fees, internet, laundry, and property services for your stay.
              </p>
            </div>

            {balanceDue > 0 && (
              <button
                onClick={() => openPaymentForItem('dues')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>Pay All (₹{miscTotal.toLocaleString('en-IN')})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
            {detailedDuesList.map((due) => (
              <div
                key={due.id}
                className="p-3.5 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-700 shrink-0">
                    {getDueCategoryIcon(due.type)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-brandText">{due.title}</h4>
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.2 text-[9px] font-semibold text-gray-600 uppercase">
                        {due.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span>{formatDueDate(due.dueDate)}</span>
                      {due.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">{due.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-brandText block">
                      ₹{due.amount.toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[10px] font-bold ${due.isPaid ? 'text-emerald-600' : 'text-red-500'}`}>
                      {due.isPaid ? 'Paid ✓' : 'Due'}
                    </span>
                  </div>

                  {!due.isPaid && (
                    <button
                      onClick={() => openPaymentForItem('dues', due.id)}
                      className="rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-teal-100 active:scale-95 transition-all shadow-2xs"
                    >
                      Pay
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Bill Summary Footer Row */}
            <div className="bg-gray-50/80 px-4 py-3 flex items-center justify-between text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                <span>Total Utilities & Dues</span>
              </span>
              <span className="font-bold text-brandText text-sm">
                ₹{miscTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Section: Payment Methods */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-brandText uppercase tracking-wider px-1">
          Payment Modes
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* UPI Instant Gateway */}
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className="flex flex-col items-center justify-center rounded-2xl border border-teal-100 bg-white p-4 shadow-sm hover:border-teal-300 active:scale-98 transition-all tap-target text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-primary mb-2">
              <Smartphone className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-brandText">UPI Instant</span>
            <span className="text-[10px] text-gray-400 mt-0.5">GPay, PhonePe, Paytm, BHIM</span>
          </button>

          {/* Direct UPI / UTR */}
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-teal-200 active:scale-98 transition-all tap-target text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 mb-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-brandText">Direct Bank / UTR</span>
            <span className="text-[10px] text-gray-400 mt-0.5">QR Standee & Cash Handover</span>
          </button>
        </div>
      </div>

      {/* 6. Section: Dynamic Transaction History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-brandText uppercase tracking-wider">
            Transaction History ({transactions.length})
          </h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>Full Ledger</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <ListSkeleton rows={2} />
            <p className="text-center text-xs text-gray-400">Loading transactions...</p>
          </div>
        ) : historyError ? (
          <InlineError message="Could not load transactions." onRetry={loadPaymentData} />
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center space-y-1.5">
            <p className="text-xs font-semibold text-brandText">No Payment Transactions Recorded</p>
            <p className="text-[11px] text-gray-400">
              When rent payments are settled, your official receipts and transaction timestamps will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => {
              const isSuccess = tx.status === 'SUCCESS' || tx.status === 'PAID' || tx.status === 'paid';
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate('/transactions')}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer hover:border-gray-200 active:scale-99 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brandText">{tx.title || 'Rent Collection'}</h4>
                      <p className="text-[11px] text-gray-400">
                        {tx.formattedDate || (tx.date ? formatDateToDDMMYYYY(tx.date) : 'Recent')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-bold text-brandText">
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
