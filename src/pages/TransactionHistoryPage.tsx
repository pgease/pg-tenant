import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

interface TransactionItem {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  currency?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string;
  date: string;
  formattedDate?: string;
  period?: string;
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  receiptUrl?: string;
}

export const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant, propertyDetails } = useAuth();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const res = await tenantService.getRentHistory(1, 50);
        const list = res.transactions || res.history || (Array.isArray(res) ? res : []);
        setTransactions(list);
        setTotalPaid(res.totalAmountPaid || list.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0));
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [isAuthenticated]);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={loadHistory}
          className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Total Paid Summary Card */}
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-gray-500">Total Rent Paid to Date</span>
          <p className="text-xl font-black text-brandText mt-0.5">
            ₹{totalPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-teal-800 font-medium mt-0.5">
            {propertyDetails?.property?.name || 'Verified Tenancy'}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100/60 text-primary">
          <CreditCard className="h-6 w-6" />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-brandText uppercase tracking-wider px-1">
          Payment Transactions
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
            <p className="text-xs font-medium text-gray-500">Loading your payment history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-brandText">No Transactions Yet</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {isLinkedTenant
                ? 'When you pay your monthly rent or security deposit, your official receipts and payment records will appear here.'
                : 'Sign in to your linked PG stay to view your payment receipts and ledger.'}
            </p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isSuccess = tx.status === 'SUCCESS' || tx.status === 'PAID' || tx.status === 'paid';
            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                        isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-brandText">{tx.title || 'Rent Payment'}</h4>
                      <p className="text-[11px] text-gray-400">
                        {tx.formattedDate || (tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'Recent')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-brandText">
                      ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`block text-[10px] font-bold ${
                        isSuccess ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600">
                      {tx.paymentMethod || 'UPI'}
                    </span>
                    {tx.transactionId && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                        ID: {tx.transactionId}
                      </span>
                    )}
                  </div>

                  {tx.receiptUrl ? (
                    <a
                      href={tx.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px]"
                    >
                      <Download className="h-3 w-3" />
                      <span>Receipt</span>
                    </a>
                  ) : tx.receiptNumber ? (
                    <span className="text-[10px] text-gray-400">
                      #{tx.receiptNumber}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
