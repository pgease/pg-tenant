import React from 'react';
import { X, Phone, MessageSquare, UserCheck, Shield } from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMembers?: any[];
  propertyOwner?: any;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  staffMembers = [],
  propertyOwner,
}) => {
  if (!isOpen) return null;

  const hasContacts = Boolean(propertyOwner?.contactNumber) || staffMembers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[85dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Property Staff & Caretaker</h2>
              <p className="text-[11px] text-brandText-muted">Assistance, Emergencies & Gate Inquiries</p>
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
        <div className="p-5 space-y-3 overflow-y-auto">
          {propertyOwner?.contactNumber && (
            <div className="rounded-2xl border border-gray-100 bg-teal-50/40 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Owner / Administrator
                </span>
                <h4 className="text-sm font-bold text-brandText mt-0.5">
                  {propertyOwner.name || 'PG Owner'}
                </h4>
                <p className="text-xs text-brandText-muted mt-0.5">+91 {propertyOwner.contactNumber}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/91${propertyOwner.contactNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm active:scale-95"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
                <a
                  href={`tel:+91${propertyOwner.contactNumber}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm active:scale-95"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {staffMembers.map((person, index) => {
            const phone = person.phone || person.contactNumber;
            return (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-brandText">{person.name}</h4>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {person.role || person.staffRole || 'Caretaker'}
                  </p>
                  {phone && <p className="text-[11px] text-brandText-muted mt-0.5">+91 {phone}</p>}
                </div>

                {phone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/91${phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm active:scale-95"
                      title="WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>

                    <a
                      href={`tel:+91${phone}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm active:scale-95"
                      title="Call"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}

          {!hasContacts && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-400">
              No staff or caretaker contact numbers published by this property yet.
            </div>
          )}

          <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2 border border-gray-100 text-brandText-muted">
            <Shield className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-[11px] leading-tight">
              In case of medical or safety emergencies, reach out to the 24x7 caretaker immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
