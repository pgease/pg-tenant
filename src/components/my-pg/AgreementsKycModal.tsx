import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { tenantService } from '../../services/tenantService';

interface AgreementsKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantData?: any;
}

export const AgreementsKycModal: React.FC<AgreementsKycModalProps> = ({
  isOpen,
  onClose,
  tenantData,
}) => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      tenantService
        .getAgreements()
        .then((res) => setAgreements(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isKycVerified = Boolean(tenantData?.isKycVerified || tenantData?.kycStatus === 'verified');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[85dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Agreements & KYC Status</h2>
              <p className="text-[11px] text-brandText-muted">Legal Documents & Identity Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* KYC Status Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brandText">Identity KYC Verification</span>
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isKycVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {isKycVerified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {isKycVerified ? 'VERIFIED' : 'PENDING REVIEW'}
              </span>
            </div>
            <p className="text-xs text-brandText-muted leading-relaxed">
              {isKycVerified
                ? 'Your Aadhaar and government identity documents have been verified and registered with PG Ease.'
                : 'Aadhaar / PAN KYC is in review by your property administration.'}
            </p>
          </div>

          {/* Rental Agreements Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-brandText-muted uppercase tracking-wider px-1">
              Rental Agreement Documents
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : agreements.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-center">
                <FileCheck className="h-8 w-8 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-brandText">Digital Agreement Active</p>
                <p className="text-[11px] text-brandText-muted mt-0.5">
                  Standard PG Ease tenancy terms apply to your assigned bed and room.
                </p>
              </div>
            ) : (
              agreements.map((agr, idx) => (
                <div
                  key={agr.id || idx}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-brandText">{agr.title || 'PG Tenancy Agreement'}</h4>
                    <p className="text-[11px] text-brandText-muted mt-0.5">
                      Valid through: {agr.endDate || 'Active Stay'}
                    </p>
                  </div>
                  {agr.pdfUrl && (
                    <a
                      href={agr.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-100 tap-target"
                    >
                      <span>PDF</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
