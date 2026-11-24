import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X,
  LogOut,
  LayoutGrid,
  Search,
  Bookmark,
  Building2,
  Utensils,
  Wifi,
  Bell,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Moon,
  Users,
  DoorOpen,
  FileText,
  User,
  HelpCircle,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  LogIn,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ open, onClose }) => {
  const { isAuthenticated, isLinkedTenant, tenant, propertyDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const rawPhoto =
    tenant?.profilePhotoUrl ||
    tenant?.photoUrl ||
    tenant?.imageUrl ||
    tenant?.selfieUrl ||
    tenant?.avatarUrl ||
    tenant?.kycInfo?.photoUrl ||
    propertyDetails?.tenant?.profilePhotoUrl ||
    propertyDetails?.tenant?.photoUrl ||
    '';
  const tenantPhoto = !imgError && typeof rawPhoto === 'string' && rawPhoto.trim() ? rawPhoto.trim() : '';

  const initials = (tenant?.name || 'GT')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'GT';

  const tenantName = tenant?.name || (isAuthenticated ? 'PG Resident' : 'Guest Explorer');
  const roomName = isLinkedTenant && propertyDetails?.room?.roomNumber
    ? `Room ${propertyDetails.room.roomNumber}`
    : isLinkedTenant
    ? 'Allocated'
    : 'Not linked to a PG';
  const pgName = isLinkedTenant ? propertyDetails?.property?.name || 'PG Ease Stay' : 'Explore verified PGs';

  // Authenticated Menu Groups
  const residentSections = [
    {
      title: 'HOME',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
        { to: '/search', label: 'Explore PGs', icon: Search },
        { to: '/saved', label: 'Saved Properties', icon: Bookmark },
      ],
    },
    {
      title: 'MY STAY',
      items: [
        { to: '/my-pg', label: 'My PG Stay', icon: Building2 },
        { to: '/food', label: 'Food Menu', icon: Utensils },
        { to: '/wifi', label: 'Wi-Fi Network', icon: Wifi },
        { to: '/announcements', label: 'Notice Board', icon: Bell },
      ],
    },
    {
      title: 'PAYMENTS',
      items: [
        { to: '/payments', label: 'Rent & Payments', icon: CreditCard },
        { to: '/transactions', label: 'Transactions', icon: Receipt },
      ],
    },
    {
      title: 'REQUESTS',
      items: [
        { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
        { to: '/night-out', label: 'Night Out', icon: Moon },
        { to: '/guests', label: 'Guest Pass', icon: Users },
        { to: '/notice', label: 'Notice Period', icon: DoorOpen },
      ],
    },
    {
      title: 'DOCUMENTS',
      items: [
        { to: '/documents', label: 'Documents & KYC', icon: FileText },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile & Settings', icon: User },
      ],
    },
  ];

  // Guest Menu Items
  const guestMenuItems = [
    { to: '/search', label: 'Explore PGs', icon: Search },
    { to: '/saved', label: 'Saved Properties', icon: Bookmark },
  ];

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Dark Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        aria-label="Close menu"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 left-0 flex w-[min(85vw,320px)] flex-col bg-white shadow-2xl pt-safe pb-safe z-50">
        {/* Drawer Header Brand & Close */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
          <img
            src="/assets/pgease-full-brand-logo.png"
            alt="PG Ease"
            className="h-7 w-auto object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Card Header */}
        {isAuthenticated ? (
          <div
            onClick={() => {
              onClose();
              navigate('/profile');
            }}
            className="flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-teal-50/70 to-white px-4 py-4 cursor-pointer text-center hover:bg-teal-50/90 transition-colors shrink-0"
          >
            <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#008080] font-bold text-white text-lg shadow-md overflow-hidden shrink-0">
              {tenantPhoto ? (
                <img
                  src={tenantPhoto}
                  alt={tenantName}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                  onError={() => setImgError(true)}
                />
              ) : (
                initials
              )}
            </div>

            <h3 className="text-sm font-bold text-[#1F2937] tracking-tight line-clamp-1">
              {tenantName}
            </h3>
            <p className="text-xs text-[#008080] font-medium mt-0.5 line-clamp-1">
              {roomName}
            </p>
            <p className="text-[11px] text-gray-500 line-clamp-1">
              {pgName}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-teal-50/70 to-white px-4 py-5 text-center shrink-0">
            {/* Avatar "G" */}
            <div className="mb-2.5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#008080] font-bold text-white text-xl shadow-md shrink-0">
              G
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Guest Explorer</h3>
            <p className="text-xs text-gray-500 mt-0.5 max-w-[220px] leading-relaxed">
              Sign in to see your PG, payments and documents
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-[#008080] hover:bg-[#005F5F] px-4 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In with OTP</span>
            </button>
          </div>
        )}

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="All services">
          {isAuthenticated ? (
            /* ================= AUTHENTICATED RESIDENT SECTIONS ================= */
            <div className="space-y-4">
              {residentSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#1F2937]/60">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold transition-colors ${
                              isActive
                                ? 'bg-[#E6F3F3] text-[#008080] font-bold'
                                : 'text-[#1F2937] hover:bg-gray-50'
                            }`
                          }
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-[#008080] shrink-0" strokeWidth={1.8} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Account extras */}
              <div className="space-y-1 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="w-full flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold text-[#1F2937] hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-[#008080] shrink-0" strokeWidth={1.8} />
                    <span>Help & Support</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
              </div>
            </div>
          ) : (
            /* ================= GUEST ONLY MENU ================= */
            <div className="space-y-3">
              <p className="px-2 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1F2937]/60">
                DISCOVER
              </p>
              <div className="space-y-0.5">
                {guestMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#E6F3F3] text-[#008080] font-bold'
                            : 'text-[#1F2937] hover:bg-gray-50'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-[#008080] shrink-0" strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </NavLink>
                  );
                })}
              </div>

              <p className="px-2 pt-3 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1F2937]/60">
                SUPPORT & LEGAL
              </p>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="w-full flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold text-[#1F2937] hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-[#008080] shrink-0" strokeWidth={1.8} />
                    <span>Help & Support</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>

                <div className="flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold text-[#1F2937] hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-[#008080] shrink-0" strokeWidth={1.8} />
                    <span>About PG Ease</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>

                <div className="flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold text-[#1F2937] hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-[#008080] shrink-0" strokeWidth={1.8} />
                    <span>Terms & Conditions</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>

                <div className="flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold text-[#1F2937] hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#008080] shrink-0" strokeWidth={1.8} />
                    <span>Privacy Policy</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Drawer Bottom Actions */}
        <div className="border-t border-gray-100 p-3 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to log out of PG Ease?')) {
                  onClose();
                  logout();
                  navigate('/login');
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#005F5F] transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In with OTP</span>
            </button>
          )}
        </div>
      </aside>

      {/* Quick Help & Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-[#1F2937]">Help & Support</h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Need assistance with finding a PG, your stay or rent payments?
            </p>
            <div className="space-y-2">
              <a
                href="https://wa.me/917701953356"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                <span>Chat on WhatsApp (+91 77019 53356)</span>
              </a>
              <a
                href="tel:+917701953356"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-[#1F2937] hover:bg-gray-50 text-xs font-bold"
              >
                <span>Call Helpline (+91 77019 53356)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
