import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, CreditCard, User, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomTabBar: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const tabs = isAuthenticated
    ? [
        { path: '/', label: 'Home', icon: Home, end: true },
        { path: '/search', label: 'Search', icon: Search },
        { path: '/payments', label: 'Payments', icon: CreditCard },
        { path: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { path: '/search', label: 'Search PGs', icon: Search, end: true },
        { path: '/login', label: 'Sign In', icon: LogIn },
        { path: '/profile', label: 'Profile', icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-gray-100 bg-white/95 backdrop-blur-md pb-safe shadow-tab-bar">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center py-1 transition-all tap-target ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-gray-400 hover:text-gray-600 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span className="mt-1 text-[11px] tracking-tight">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
