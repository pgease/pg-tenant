import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Search,
  Building2,
  CreditCard,
  FileText,
  Utensils,
  Wifi,
  DoorOpen,
  User,
  Bell,
  MessageSquareWarning,
  Users,
  Moon,
  Receipt,
  Bookmark,
  Menu,
} from 'lucide-react';

export interface AppMenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  tab?: boolean;
  group: 'home' | 'explore' | 'stay' | 'account';
}

/** Every tenant destination. Labels match existing screen titles. */
export const appMenu: AppMenuItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true, tab: true, group: 'home' },
  { to: '/search', label: 'PG Search', icon: Search, tab: true, group: 'explore' },
  { to: '/saved', label: 'Saved Properties', icon: Bookmark, group: 'explore' },
  { to: '/my-pg', label: 'My PG', icon: Building2, tab: true, group: 'stay' },
  { to: '/payments', label: 'Payments', icon: CreditCard, tab: true, group: 'stay' },
  { to: '/transactions', label: 'Transactions', icon: Receipt, group: 'stay' },
  { to: '/documents', label: 'Documents & KYC', icon: FileText, group: 'stay' },
  { to: '/food', label: 'Food & Dining', icon: Utensils, group: 'stay' },
  { to: '/wifi', label: 'WiFi Credentials', icon: Wifi, group: 'stay' },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, group: 'stay' },
  { to: '/guests', label: 'Guest Pass', icon: Users, group: 'stay' },
  { to: '/night-out', label: 'Night Out', icon: Moon, group: 'stay' },
  { to: '/announcements', label: 'Notice Board', icon: Bell, group: 'stay' },
  { to: '/notice', label: 'Notice Period', icon: DoorOpen, group: 'stay' },
  { to: '/notifications', label: 'Notifications', icon: Bell, group: 'account' },
  { to: '/profile', label: 'Menu', icon: Menu, tab: true, group: 'account' },
];

export const tabItems = appMenu.filter((item) => item.tab);

/** Desktop sidebar keeps the labels already shipped, and adds the routes that were missing. */
export const desktopNavItems: AppMenuItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true, group: 'home' },
  { to: '/search', label: 'Explore PGs', icon: Search, group: 'explore' },
  { to: '/my-pg', label: 'My PG Stay', icon: Building2, group: 'stay' },
  { to: '/payments', label: 'Rent & Payments', icon: CreditCard, group: 'stay' },
  { to: '/transactions', label: 'Transactions', icon: Receipt, group: 'stay' },
  { to: '/documents', label: 'Documents & KYC', icon: FileText, group: 'stay' },
  { to: '/food', label: 'Food Menu', icon: Utensils, group: 'stay' },
  { to: '/wifi', label: 'Wi-Fi Network', icon: Wifi, group: 'stay' },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, group: 'stay' },
  { to: '/guests', label: 'Guest Pass', icon: Users, group: 'stay' },
  { to: '/night-out', label: 'Night Out', icon: Moon, group: 'stay' },
  { to: '/announcements', label: 'Notice Board', icon: Bell, group: 'stay' },
  { to: '/notice', label: 'Notice Period', icon: DoorOpen, group: 'stay' },
  { to: '/notifications', label: 'Notifications', icon: Bell, group: 'account' },
  { to: '/saved', label: 'Saved Properties', icon: Bookmark, group: 'explore' },
  { to: '/profile', label: 'Profile & Settings', icon: User, group: 'account' },
];

const alreadyOnMenuPage = new Set(['/documents', '/notifications', '/wifi', '/profile']);

/** Stay tools that the Menu tab did not list. */
export const menuPageServices = appMenu.filter((item) => !item.tab && !alreadyOnMenuPage.has(item.to));

export const rootTabPaths = new Set(tabItems.map((item) => item.to));
