import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { appMenu, type AppMenuItem } from '../../navigation/appMenu';

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

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col bg-white shadow-2xl pt-safe pb-safe">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <img
            src="/assets/pgease-full-brand-logo.png"
            alt="PG Ease"
            className="h-7 w-auto object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
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
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                            isActive ? 'bg-[#008080] text-white' : 'text-gray-700 hover:bg-gray-50'
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
      </aside>
    </div>
  );
};
