import React, { useState, useEffect } from 'react';
import {
  Clock,
  CreditCard,
  ShieldCheck,
  Home,
  Zap,
  Tag,
  Receipt,
  Download,
  FileText,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantService, type RentCollectionDetails, type OtherDueItem } from '../services/tenantService';
import { RentPaymentModal } from '../components/my-pg/RentPaymentModal';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { toast, toastError } from '../components/ui/use-toast';

type CategoryTab = 'all' | 'rent' | 'deposit' | 'utilities' | 'other';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant, propertyDetails, checkTenancy, isCheckingTenancy } = useAuth();

  const [dues, setDues] = useState<RentCollectionDetails | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [modalInitialItem, setModalInitialItem] = useState<'all' | 'rent' | 'security' | 'dues'>('all');
  const [modalPreselectedDueId, setModalPreselectedDueId] = useState<string | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<CategoryTab>('all');
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated && isLinkedTenant) {
        const [duesRes, historyRes] = await Promise.allSettled([
          tenantService.getRentDues(),
          tenantService.getRentHistory(1, 20),
        ]);

        if (duesRes.status === 'fulfilled' && duesRes.value) {
          setDues(duesRes.value);
        }
        if (historyRes.status === 'fulfilled' && historyRes.value) {
          const txList =
            historyRes.value.transactions ||
            historyRes.value.history ||
            (Array.isArray(historyRes.value) ? historyRes.value : []);
          setTransactions(txList);
        }
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

  const balanceDue = dues?.summary?.balanceDue !== undefined
    ? Number(dues.summary.balanceDue)
    : dues?.summary?.totalPayable !== undefined
    ? Number(dues.summary.totalPayable)
    : dues?.payable !== undefined
    ? Number(dues.payable)
    : Number(dues?.totalPayable || 0);

  const duesStatus = (dues?.status || (balanceDue > 0 ? 'DUE' : 'PAID')).toUpperCase();
  const nextDueDateVal = (dues as any)?.nextDueDate;
  const nextDueText = nextDueDateVal
    ? formatDateToDDMMYYYY(nextDueDateVal)
    : '1st of month';

  const openPaymentForItem = (item: 'all' | 'rent' | 'security' | 'dues', dueId?: string) => {
    setModalInitialItem(item);
    setModalPreselectedDueId(dueId || null);
    setShowPayModal(true);
  };

  const handleDownloadReceipt = async (tx: any) => {
    const id = tx.id;
    if (!id) return;
    setDownloadingReceiptId(id);
    try {
      if (tx.receiptUrl) {
        window.open(tx.receiptUrl, '_blank', 'noopener');
        return;
      }
      const receipt = await tenantService.getPaymentReceipt(id);
      if (receipt?.receiptUrl || receipt?.url) {
        window.open(receipt.receiptUrl || receipt.url, '_blank', 'noopener');
      } else {
        toast({
          title: 'Receipt Verified',
          description: `Receipt #${receipt?.receiptNumber || tx.receiptNumber || id.slice(0, 8)} is verified.`,
          variant: 'success',
        });
      }
    } catch (err: any) {
      toastError(err, 'Could not download receipt at this time.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-12 pb-16 text-center space-y-4 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-[#008080] shadow-sm">
          <CreditCard className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Sign In to View Payments</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Please log in with your phone to view rent dues, pay online, and download receipts.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="rounded-xl bg-[#008080] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006666]"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (!isLinkedTenant) {
    return (
      <div className="pt-12 pb-16 text-center space-y-4 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-[#008080] shadow-sm">
          <CreditCard className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">No Active PG Stay Linked</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Your monthly rent dues and receipts will appear here once your PG manager adds your phone number.
          </p>
        </div>
        <div className="flex gap-2 justify-center max-w-xs mx-auto pt-2">
          <button
            onClick={() => checkTenancy()}
            disabled={isCheckingTenancy}
            className="flex-1 rounded-xl border border-teal-200 bg-white py-2.5 text-xs font-bold text-[#008080] shadow-sm hover:bg-teal-50"
          >
            {isCheckingTenancy ? 'Syncing...' : 'Sync Status'}
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex-1 rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006666]"
          >
            Find PGs
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 pt-1 pb-8 animate-fade-in">
        <div className="h-44 rounded-3xl bg-slate-200/70 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-200/70 animate-pulse" />
        <div className="h-56 rounded-2xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-1 pb-8 animate-fade-in">
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

      {/* ==================================================================== */}
      {/* 1. OUTSTANDING BALANCE SUMMARY (T5)                                   */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006666] via-[#004d4d] to-[#003333] p-6 text-white shadow-xl shadow-teal-900/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                {dues?.period?.label || 'Current Cycle'}
              </span>
              <span className="text-xs text-teal-100/90 truncate max-w-[200px]">
                {propertyDetails?.property?.name || 'Active Stay'}
              </span>
            </div>

            <span className="text-xs font-medium text-teal-100/80 block pt-1">
              Outstanding Balance
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
              ₹{balanceDue.toLocaleString('en-IN')}
            </h2>

            <p className="text-xs text-teal-100/90 flex items-center gap-1.5 pt-0.5">
              <Clock className="h-3.5 w-3.5 text-teal-300" />
              <span>Due by {nextDueText}</span>
              {balanceDue === 0 && <span className="text-emerald-300 font-bold ml-1">· All Clear ✓</span>}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openPaymentForItem('all')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-[#008080] shadow-lg hover:bg-teal-50 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <CreditCard className="h-4 w-4 text-[#008080]" />
            <span>{balanceDue > 0 ? `Pay All (₹${balanceDue.toLocaleString('en-IN')})` : 'Advance Payment'}</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. ITEMISED DUES LIST (T5: Rent, Electricity, Maint, Deposit)        */}
      {/* ==================================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-[#008080]" />
            <span>Itemised Dues</span>
          </h3>
          <span className="text-[11px] text-gray-500 font-medium">Due by {nextDueText}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100">
          {/* 1. Monthly Room Rent */}
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#008080]">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Room Rent</p>
                <p className="text-[11px] text-gray-500 truncate">Monthly accommodation charges</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="block text-sm sm:text-base font-black text-gray-900 tabular-nums">
                  ₹{monthlyRent.toLocaleString('en-IN')}
                </span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    isRentPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : balanceDue > 0 && duesStatus === 'OVERDUE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isRentPaid ? 'Paid' : balanceDue > 0 && duesStatus === 'OVERDUE' ? 'Overdue' : 'Pending'}
                </span>
              </div>

              {!isRentPaid && (
                <button
                  type="button"
                  onClick={() => openPaymentForItem('rent')}
                  className="rounded-xl bg-[#008080] hover:bg-[#006666] text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                >
                  Pay
                </button>
              )}
            </div>
          </div>

          {/* 2. Security Deposit */}
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Security Deposit</p>
                <p className="text-[11px] text-gray-500 truncate">Refundable caution deposit</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="block text-sm sm:text-base font-black text-gray-900 tabular-nums">
                  ₹{securityDepositAmount.toLocaleString('en-IN')}
                </span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    isSecurityPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isSecurityPaid ? 'Paid' : 'Pending'}
                </span>
              </div>

              {!isSecurityPaid && securityDepositAmount > 0 && (
                <button
                  type="button"
                  onClick={() => openPaymentForItem('security')}
                  className="rounded-xl bg-[#008080] hover:bg-[#006666] text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                >
                  Pay
                </button>
              )}
            </div>
          </div>

          {/* 3. Electricity & Utilities */}
          {otherDuesList.map((due) => (
            <div key={due.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {due.title || due.dueType || 'Utilities & Maintenance'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {due.dueDate ? `Due ${formatDateToDDMMYYYY(due.dueDate)}` : 'Utility charge'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="block text-sm sm:text-base font-black text-gray-900 tabular-nums">
                    ₹{Number(due.amount || 0).toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      due.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {due.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>

                {!due.isPaid && (
                  <button
                    type="button"
                    onClick={() => openPaymentForItem('dues', due.id)}
                    className="rounded-xl bg-[#008080] hover:bg-[#006666] text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                  >
                    Pay
                  </button>
                )}
              </div>
            </div>
          ))}

          {otherDuesList.length === 0 && (
            <div className="flex items-center justify-between p-4 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Electricity & Maintenance</p>
                  <p className="text-[11px] text-gray-400">Included in rent or no pending meter charges</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5">
                Cleared
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. CATEGORISED BILLS TAB / ACCORDION (T5)                             */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-[#008080]" />
            <span>Bills by Category</span>
          </h3>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all' as const, label: 'All Bills' },
            { id: 'rent' as const, label: 'Rent' },
            { id: 'deposit' as const, label: 'Security Deposit' },
            { id: 'utilities' as const, label: 'Utilities & Extra' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategoryTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategoryTab === tab.id
                  ? 'bg-[#008080] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Cards */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
          {(selectedCategoryTab === 'all' || selectedCategoryTab === 'rent') && (
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-xs font-bold text-gray-900">Monthly Room Rent</p>
                <p className="text-[11px] text-gray-400">Due monthly on {nextDueText}</p>
              </div>
              <div className="text-right">
                <span className="font-black text-gray-900 text-sm tabular-nums">
                  ₹{monthlyRent.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] font-bold text-emerald-600">{isRentPaid ? 'Settled' : 'Unpaid'}</p>
              </div>
            </div>
          )}

          {(selectedCategoryTab === 'all' || selectedCategoryTab === 'deposit') && (
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-xs font-bold text-gray-900">Refundable Security Deposit</p>
                <p className="text-[11px] text-gray-400">One-time security deposit held</p>
              </div>
              <div className="text-right">
                <span className="font-black text-gray-900 text-sm tabular-nums">
                  ₹{securityDepositAmount.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] font-bold text-emerald-600">{isSecurityPaid ? 'Held in Vault' : 'Pending'}</p>
              </div>
            </div>
          )}

          {(selectedCategoryTab === 'all' || selectedCategoryTab === 'utilities') && (
            otherDuesList.length > 0 ? (
              otherDuesList.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{d.title || d.dueType}</p>
                    <p className="text-[11px] text-gray-400">Meter / Utility split</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-900 text-sm tabular-nums">
                      ₹{Number(d.amount).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[10px] font-bold text-amber-600">{d.isPaid ? 'Paid' : 'Due'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-1">No additional utility or electricity dues billed.</p>
            )
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. PAYMENT HISTORY LIST WITH RECEIPT DOWNLOAD (T5)                    */}
      {/* ==================================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-[#008080]" />
            <span>Payment History</span>
          </h3>
          <button
            type="button"
            onClick={() => navigate('/payments/history')}
            className="text-[11px] font-bold text-[#008080] hover:underline"
          >
            All receipts →
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100">
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((tx) => {
              const amount = Number(tx.amount || tx.rentAmount || 0);
              const dateStr = tx.paidAt || tx.paymentDate || tx.createdAt;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Recent';
              const mode = tx.paymentMethod || tx.method || 'Online UPI';

              return (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {tx.title || 'Rent Settlement'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {formattedDate} · <span className="uppercase font-semibold">{mode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-emerald-700 tabular-nums">
                      ₹{amount.toLocaleString('en-IN')}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(tx)}
                      disabled={downloadingReceiptId === tx.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-[#008080] hover:bg-teal-50 transition-colors"
                      title="Download receipt PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">
              No previous transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
