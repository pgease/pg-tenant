import React, { useState, useEffect } from 'react';
import {
  FileText,
  ArrowLeft,
  ShieldCheck,
  Download,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSignature,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, propertyDetails, isLinkedTenant } = useAuth();

  const [agreements, setAgreements] = useState<any[]>([]);
  const [kycData, setKycData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const [agrs, kyc] = await Promise.all([
          tenantService.getAgreements().catch(() => []),
          tenantService.getKycStatus().catch(() => null),
        ]);
        setAgreements(Array.isArray(agrs) ? agrs : []);
        setKycData(kyc);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Determine true KYC Status (TW-03, TW-11)
  const rawStatus = (kycData?.status || '').toUpperCase();
  const isKycVerified = Boolean(
    kycData?.isKycVerified ||
    rawStatus === 'VERIFIED' ||
    rawStatus === 'COMPLETED'
  );
  const isRequested = rawStatus === 'REQUESTED' || rawStatus === 'ACTION_REQUIRED';
  const isInProgress = rawStatus === 'IN_PROGRESS' || rawStatus === 'INITIATED';
  const isFailed = rawStatus === 'FAILED' || rawStatus === 'REJECTED';

  const aadhaarLast4 =
    kycData?.verifiedDetails?.aadhaar?.last4 ||
    kycData?.aadhaarLast4 ||
    (tenant?.govtIdNumber ? tenant.govtIdNumber.slice(-4) : '');

  const verifiedResidentName =
    kycData?.verifiedDetails?.aadhaar?.name ||
    kycData?.nameAsPerAadhaar ||
    tenant?.name ||
    'Resident';

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      <div className="page-toolbar flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="page-back flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-primary">
          KYC & Legal
        </span>
      </div>

      {/* KYC Verification Status (TW-03, TW-11) */}
      {!isLinkedTenant ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center space-y-1.5">
          <ShieldCheck className="h-7 w-7 text-gray-400 mx-auto" />
          <h3 className="text-xs font-bold text-brandText">Aadhaar KYC</h3>
          <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
            You are not linked to a PG yet. Once your PG owner adds you, your Aadhaar KYC status will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  isKycVerified
                    ? 'bg-emerald-50 text-emerald-600'
                    : isFailed
                    ? 'bg-rose-50 text-rose-600'
                    : isRequested
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-teal-50 text-primary'
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-brandText">Aadhaar KYC</h3>
                <p className="text-[11px] text-gray-400">DigiLocker Digital Verification</p>
              </div>
            </div>

            {isKycVerified ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : isRequested ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Action Required
              </span>
            ) : isInProgress ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                In Progress
              </span>
            ) : isFailed ? (
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                Not Requested Yet
              </span>
            )}
          </div>

          {isKycVerified ? (
            <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-2.5 text-xs text-gray-600">
              <div>
                <span className="text-[10px] text-gray-400 block">Name on Aadhaar</span>
                <span className="font-semibold text-brandText">{verifiedResidentName}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Aadhaar Number</span>
                <span className="font-semibold text-brandText">
                  {aadhaarLast4 ? `•••• •••• ${aadhaarLast4}` : 'Verified via DigiLocker'}
                </span>
              </div>
              {kycData?.verifiedAt && (
                <div className="col-span-2 text-[10px] text-gray-400 pt-1">
                  Verified on {new Date(kycData.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          ) : isRequested && kycData?.directLink ? (
            <div className="border-t border-gray-50 pt-3 space-y-2">
              <p className="text-xs text-amber-800">
                Your PG owner has requested digital Aadhaar verification. Complete it securely via DigiLocker.
              </p>
              <a
                href={kycData.directLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
              >
                <span>Complete DigiLocker KYC</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : isInProgress ? (
            <div className="border-t border-gray-50 pt-2.5 text-xs text-blue-700">
              Verification in progress. We are syncing with DigiLocker.
            </div>
          ) : isFailed ? (
            <div className="border-t border-gray-50 pt-3 space-y-2">
              <p className="text-xs text-rose-700">
                Aadhaar verification could not be completed. Please try again.
              </p>
              {kycData?.directLink && (
                <a
                  href={kycData.directLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-rose-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
                >
                  <span>Retry KYC</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 border-t border-gray-50 pt-2">
              Your PG administration has not requested DigiLocker KYC yet. No action is required right now.
            </p>
          )}
        </div>
      )}

      {/* Agreements Section (TW-14) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-brandText uppercase tracking-wider px-1">
          Rental Agreements
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <p className="text-xs text-gray-400">Loading documents...</p>
          </div>
        ) : agreements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center space-y-2">
            <FileText className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-xs font-semibold text-brandText">No Agreement Added Yet</p>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
              Your PG owner is preparing your rental agreement for {propertyDetails?.property?.name || 'your stay'}. Once generated, you can review and e-sign it here.
            </p>
          </div>
        ) : (
          agreements.map((doc, idx) => {
            const rawAgrStatus = (doc.status || '').toUpperCase();
            const isSigned = rawAgrStatus === 'SIGNED' || rawAgrStatus === 'COMPLETED' || doc.isSigned;
            const isReadyToSign =
              (rawAgrStatus === 'SENT' || rawAgrStatus === 'READY_TO_SIGN' || rawAgrStatus === 'PENDING') &&
              Boolean(doc.signUrl || doc.signingUrl);
            const downloadUrl = doc.signedPdfUrl || doc.pdfUrl || doc.url;

            return (
              <div
                key={doc.id || idx}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-primary">
                      <FileSignature className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brandText">{doc.title || 'Room Lease Agreement'}</h4>
                      <p className="text-[11px] text-gray-400">
                        {doc.startDate
                          ? `Valid from ${new Date(doc.startDate).toLocaleDateString('en-IN')}`
                          : 'Active Tenancy'}
                      </p>
                    </div>
                  </div>

                  {isSigned ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      Signed
                    </span>
                  ) : isReadyToSign ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                      Ready to Sign
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                      Draft
                    </span>
                  )}
                </div>

                {/* Key Terms */}
                {(doc.monthlyRent || doc.securityDeposit) && (
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50/70 p-2.5 text-[11px] text-gray-600">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Monthly Rent</span>
                      <span className="font-semibold text-brandText">₹{Number(doc.monthlyRent || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Deposit</span>
                      <span className="font-semibold text-brandText">₹{Number(doc.securityDeposit || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-1 flex items-center justify-end gap-2">
                  {isReadyToSign && (doc.signUrl || doc.signingUrl) && (
                    <a
                      href={doc.signUrl || doc.signingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-colors"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      <span>Review & e-Sign</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {isSigned && downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-primary hover:bg-gray-50 shadow-sm transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Signed PDF</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
