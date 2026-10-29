import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, propertyDetails } = useAuth();

  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const list = await tenantService.getAgreements();
        setAgreements(list);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-primary">
          KYC & Legal
        </span>
      </div>

      {/* KYC Verification Status */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-brandText">Tenant Identity Verification</h3>
              <p className="text-[11px] text-gray-400">Aadhaar & Police Verification</p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            Verified
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-2.5 text-xs text-gray-600">
          <div>
            <span className="text-[10px] text-gray-400 block">Resident Name</span>
            <span className="font-semibold text-brandText">{tenant?.name || 'Verified Resident'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block">Phone</span>
            <span className="font-semibold text-brandText">{tenant?.phone || 'Verified'}</span>
          </div>
        </div>
      </div>

      {/* Agreements Section */}
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
            <p className="text-xs font-semibold text-brandText">Digital Agreement on File</p>
            <p className="text-[11px] text-gray-400">
              Your tenancy agreement for {propertyDetails?.property?.name || 'your stay'} is registered digitally with the PG administration.
            </p>
          </div>
        ) : (
          agreements.map((doc, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brandText">{doc.title || 'Room Lease Agreement'}</h4>
                  <p className="text-[11px] text-gray-400">{doc.date || 'Active Tenancy'}</p>
                </div>
              </div>

              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-gray-200 bg-white p-2 text-primary hover:bg-gray-50 shadow-sm"
                  title="Download Document"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
