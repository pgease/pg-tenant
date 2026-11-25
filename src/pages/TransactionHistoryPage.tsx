import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  AlertCircle,
  XCircle,
  Calendar,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';
import { ListSkeleton } from '../components/ui/ListSkeleton';
import { InlineError } from '../components/ui/InlineError';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { toast, toastError } from '../components/ui/use-toast';

interface TransactionItem {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  currency?: string;
  status: 'SUCCESS' | 'PAID' | 'APPROVED' | 'PENDING_VERIFICATION' | 'PENDING' | 'REJECTED' | 'FAILED' | string;
  date: string;
  formattedDate?: string;
  period?: string;
  periodMonth?: number;
  periodYear?: number;
  paymentMethod?: string;
  transactionId?: string;
  utr?: string;
  rejectionReason?: string;
  receiptNumber?: string;
  receiptUrl?: string;
}

function formatDDMMYYYY(dateVal: string | Date | null | undefined): string {
  return formatDateToDDMMYYYY(dateVal) || '—';
}

export const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant, propertyDetails } = useAuth();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'verification' | 'rejected'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const loadHistory = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await tenantService.getRentHistory(1, 50);
      const list: TransactionItem[] = res.transactions || res.history || (Array.isArray(res) ? res : []);
      setTransactions(list);
      setTotalPaid(
        res.totalAmountPaid ||
          list
            .filter((t) => {
              const st = (t.status || '').toUpperCase();
              return st === 'SUCCESS' || st === 'PAID' || st === 'APPROVED';
            })
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
      );
    } catch (err: any) {
      console.error('Failed to load transaction history:', err);
      setError('Could not load payment history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [isAuthenticated]);

  // Extract unique months from transactions for filter dropdown
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.period) months.add(tx.period);
      else if (tx.date) {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) {
          months.add(d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }));
        }
      }
    });
    return Array.from(months);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const st = (tx.status || '').toUpperCase();

      // Status filter
      if (statusFilter === 'success') {
        if (st !== 'SUCCESS' && st !== 'PAID' && st !== 'APPROVED') return false;
      } else if (statusFilter === 'verification') {
        if (st !== 'PENDING_VERIFICATION' && st !== 'UNDER_VERIFICATION') return false;
      } else if (statusFilter === 'rejected') {
        if (st !== 'REJECTED') return false;
      }

      // Month filter
      if (monthFilter !== 'all') {
        const matchesPeriod = tx.period === monthFilter;
        let matchesDate = false;
        if (tx.date) {
          const d = new Date(tx.date);
          if (!isNaN(d.getTime())) {
            matchesDate = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }) === monthFilter;
          }
        }
        if (!matchesPeriod && !matchesDate) return false;
      }

      return true;
    });
  }, [transactions, statusFilter, monthFilter]);

  const statusCounts = useMemo(() => {
    let success = 0;
    let verification = 0;
    let rejected = 0;
    transactions.forEach((t) => {
      const st = (t.status || '').toUpperCase();
      if (st === 'SUCCESS' || st === 'PAID' || st === 'APPROVED') success++;
      else if (st === 'PENDING_VERIFICATION' || st === 'UNDER_VERIFICATION') verification++;
      else if (st === 'REJECTED') rejected++;
    });
    return { all: transactions.length, success, verification, rejected };
  }, [transactions]);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Header */}
      <div className="page-toolbar flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="page-back flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-primary' : ''}`} />
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

      {/* Filter Tabs & Month Selection */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('success')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                statusFilter === 'success'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Paid ({statusCounts.success})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('verification')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                statusFilter === 'verification'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Under Review ({statusCounts.verification})
            </button>
            {statusCounts.rejected > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Rejected ({statusCounts.rejected})
              </button>
            )}
          </div>

          {/* Month Filter Dropdown */}
          {monthOptions.length > 0 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Months</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {error ? (
          <InlineError message={error} onRetry={loadHistory} />
        ) : loading ? (
          <ListSkeleton rows={4} />
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-brandText">
              {transactions.length === 0 ? 'No Transactions Yet' : 'No Transactions Match Filter'}
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {transactions.length === 0
                ? isLinkedTenant
                  ? 'When you pay your monthly rent or submit UTR payment proofs, your official records will appear here.'
                  : 'Sign in to your linked PG stay to view your payment receipts and ledger.'
                : 'Try selecting a different status or month filter to see past records.'}
            </p>
            {transactions.length > 0 && (statusFilter !== 'all' || monthFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setMonthFilter('all');
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Filter className="h-3 w-3" /> Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const st = (tx.status || '').toUpperCase();
            const isSuccess = st === 'SUCCESS' || st === 'PAID' || st === 'APPROVED';
            const isUnderReview = st === 'PENDING_VERIFICATION' || st === 'UNDER_VERIFICATION';
            const isRejected = st === 'REJECTED';

            const statusBadgeConfig = isSuccess
              ? { label: 'Paid', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
              : isUnderReview
              ? { label: 'Under Verification', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' }
              : isRejected
              ? { label: 'Rejected', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' }
              : { label: st || 'Pending', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' };

            const displayUtr = tx.utr || tx.transactionId;

            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3 transition-all hover:border-teal-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-600'
                          : isUnderReview
                          ? 'bg-amber-50 text-amber-600'
                          : isRejected
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isUnderReview ? (
                        <Clock className="h-5 w-5" />
                      ) : isRejected ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-brandText truncate">
                        {tx.title || 'Rent Payment'}
                      </h4>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-gray-700">{formatDDMMYYYY(tx.date)}</span>
                        {tx.period ? (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">{tx.period}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-base font-black text-brandText">
                      ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`block text-[10px] font-bold mt-0.5 px-2 py-0.5 rounded-full border text-center ${statusBadgeConfig.badgeClass}`}
                    >
                      {statusBadgeConfig.label}
                    </span>
                  </div>
                </div>

                {/* Rejection Warning Box */}
                {isRejected && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-900 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-bold text-rose-950">Payment Proof Rejected by PG Manager</span>
                      <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                        Reason: {tx.rejectionReason || 'UTR transaction reference was not found in property bank statement. Please verify with your bank or resubmit.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer metadata & receipt action */}
                <div className="flex flex-wrap items-center justify-between border-t border-gray-50 pt-2.5 gap-2 text-[11px] text-gray-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-teal-50 text-teal-800 px-2 py-0.5 text-[10px] font-bold">
                      {tx.paymentMethod?.toLowerCase().includes('easebuzz') || tx.paymentMethod === 'online'
                        ? 'Easebuzz UPI'
                        : tx.paymentMethod?.toLowerCase().includes('cash')
                        ? 'Cash Handover'
                        : tx.paymentMethod || 'Manual UPI'}
                    </span>
                    {displayUtr && (
                      <span className="text-[10px] font-mono text-gray-500 truncate max-w-[170px]" title={displayUtr}>
                        Ref: {displayUtr}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tx.receiptNumber && (
                      <span className="text-[10px] font-mono text-gray-400">
                        #{tx.receiptNumber}
                      </span>
                    )}
                    {(tx.receiptUrl || isSuccess) && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (tx.receiptUrl) {
                            window.open(tx.receiptUrl, '_blank', 'noopener');
                          } else {
                            try {
                              const receipt = await tenantService.getPaymentReceipt(tx.id);
                              if (receipt?.receiptUrl || receipt?.url) {
                                window.open(receipt.receiptUrl || receipt.url, '_blank', 'noopener');
                              } else {
                                toast({
                                  title: 'Receipt Generated',
                                  description: `Receipt #${receipt?.receiptNumber || tx.receiptNumber || tx.id.slice(0, 8)} is generated.`,
                                  variant: 'success',
                                });
                              }
                            } catch (err: any) {
                              toastError(err, 'Could not download receipt at this time.');
                            }
                          }
                        }}
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px] tap-target"
                      >
                        <Download className="h-3 w-3" />
                        <span>Receipt</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
