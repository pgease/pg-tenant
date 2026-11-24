import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { appMenu, type AppMenuItem } from '../../navigation/appMenu';
import { useAuth } from '../../context/AuthContext';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const groups: Array<{ id: AppMenuItem['group']; title: string }> = [
  { id: 'home', title: '' },
  { id: 'explore', title: 'Explore' },
  { id: 'stay', title: 'PG Stay' },
  { id: 'account', title: 'Account' },
];

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ open, onClose }) => {
  const { isAuthenticated, isLinkedTenant, tenant, propertyDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

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

  return (
    <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col bg-white shadow-2xl pt-safe pb-safe z-50">
        {/* Drawer Header Brand & Close */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
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

        {/* T2: Drawer Profile Header with 64dp Avatar */}
        <div
          onClick={() => {
            onClose();
            navigate(isAuthenticated ? '/menu' : '/login');
          }}
          className="flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-teal-50/70 to-white px-4 py-5 cursor-pointer text-center hover:bg-teal-50/90 transition-colors"
        >
          {/* 64dp Round Avatar */}
          <div className="relative mb-2.5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-[#008080] font-bold text-white text-xl shadow-md overflow-hidden shrink-0">
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

          <h3 className="text-sm font-bold text-gray-900 tracking-tight line-clamp-1">
            {tenantName}
          </h3>
          <p className="text-xs text-[#008080] font-medium mt-0.5 line-clamp-1">
            {roomName}
          </p>
          <p className="text-[11px] text-gray-500 line-clamp-1">
            {pgName}
          </p>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="All services">
          {groups.map((group) => {
            const items = appMenu.filter((item) => item.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id} className="mb-4">
                {group.title ? (
                  <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {group.title}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-colors ${
                            isActive ? 'bg-[#008080] text-white shadow-xs' : 'text-gray-700 hover:bg-gray-50'
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Drawer Bottom Actions */}
        <div className="border-t border-gray-100 p-3">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-600" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="flex w-full items-center justify-center rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b]"
            >
              Sign In with OTP
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
