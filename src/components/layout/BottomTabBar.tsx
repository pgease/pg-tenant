import React from 'react';
import { NavLink } from 'react-router-dom';
import { tabItems } from '../../navigation/appMenu';
import { useAuth } from '../../context/AuthContext';
import { LayoutGrid, Search, Bookmark, User } from 'lucide-react';

const guestTabs = [
  { to: '/', label: 'Explore', icon: LayoutGrid, end: true },
  { to: '/search', label: 'PG Search', icon: Search },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/login', label: 'Sign In', icon: User },
];

export const BottomTabBar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const tabs = isAuthenticated ? tabItems : guestTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full border-t border-gray-100 bg-white/95 backdrop-blur-md pb-safe shadow-tab-bar lg:hidden">
      <div className="flex items-stretch justify-around px-1 pt-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center px-0.5 py-1 ${
                  isActive ? 'text-[#008080] font-bold' : 'text-gray-400 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-[#E6F3F3]' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                  </span>
                  <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight tracking-tight">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
