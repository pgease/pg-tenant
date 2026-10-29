import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantService, type RentCollectionDetails } from '../services/tenantService';
import { RentPaymentModal } from '../components/my-pg/RentPaymentModal';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant, propertyDetails, checkTenancy, isCheckingTenancy } = useAuth();

  const [dues, setDues] = useState<RentCollectionDetails | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated && isLinkedTenant) {
        const [duesRes, historyRes] = await Promise.all([
          tenantService.getRentDues().catch(() => null),
          tenantService.getRentHistory(1, 20).catch(() => ({ transactions: [], totalAmountPaid: 0 })),
        ]);
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

  const amountDue = dues?.totalPayable ?? propertyDetails?.roomTenant?.monthlyRent ?? 0;
  const isPaid = dues?.status === 'paid' || (amountDue === 0 && Boolean(propertyDetails));

  const formatDueDate = () => {
    if (propertyDetails?.nextRentDueDate) {
      return `Due by ${new Date(propertyDetails.nextRentDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (dues?.lineItems?.rent?.dueDay) {
      return `Due on ${dues.lineItems.rent.dueDay} of month`;
    }
    return 'Due on 1st of month';
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
        onPaymentSuccess={() => {
          loadPaymentData();
        }}
      />

      {/* 1. Metric Cards (Dynamic from live backend data) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Due Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500">Due</span>
            <p className="text-base font-black text-brandText">
              ₹{isPaid ? '0' : amountDue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Paid Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500">Paid to Date</span>
            <p className="text-base font-black text-brandText">
              ₹{totalPaid.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Amount Due Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-dark p-6 text-white shadow-xl shadow-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-white/80">
              {isPaid ? 'Current Month Status' : 'Amount Due'}
            </span>
            <h2 className="text-2xl font-black mt-0.5">
              ₹{amountDue.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-white/80 mt-1">
              {isPaid ? 'All rent dues cleared' : formatDueDate()}
            </p>
          </div>

          {!isPaid && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-primary shadow-lg hover:bg-gray-50 active:scale-95 transition-all tap-target"
            >
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Pay Now</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Section: Payment Methods */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-brandText uppercase tracking-wider px-1">
          Payment Methods
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* UPI */}
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-teal-200 active:scale-98 transition-all tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-primary mb-2">
              <Smartphone className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-brandText">UPI</span>
            <span className="text-[10px] text-gray-400 mt-0.5">GPay, PhonePe, Paytm</span>
          </button>

          {/* Card / NetBanking */}
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-teal-200 active:scale-98 transition-all tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-primary mb-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-brandText">Card</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Debit / Credit / NetBanking</span>
          </button>
        </div>
      </div>

      {/* 4. Section: Dynamic Transaction History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-brandText uppercase tracking-wider">
            Transaction History
          </h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-1.5" />
            <p className="text-xs text-gray-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center space-y-1.5">
            <p className="text-xs font-semibold text-brandText">No Payment Transactions Recorded</p>
            <p className="text-[11px] text-gray-400">
              When rent payments are settled, your official receipts and transaction timestamps will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.slice(0, 4).map((tx) => {
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
                        {tx.formattedDate || (tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'Recent')}
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
