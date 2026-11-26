export type TenantAccessGating = 'none' | 'auth' | 'activeStay';

export type TenantTabId = 'dashboard' | 'search' | 'mypg' | 'menu';

export interface TenantNavRegistryEntry {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  route: string;
  tab: TenantTabId;
  category: 'home' | 'mystay' | 'payments' | 'requests' | 'documents' | 'account';
  keywords: string[];
  gating: TenantAccessGating;
  lockCta?: string;
}

export const TENANT_NAV_REGISTRY: TenantNavRegistryEntry[] = [
  // Home
  {
    id: 'home.dashboard',
    label: 'Dashboard',
    subtitle: 'Overview, dues, quick actions & your PG',
    icon: 'LayoutGrid',
    route: '/',
    tab: 'dashboard',
    category: 'home',
    keywords: ['home', 'dashboard', 'overview', 'dues', 'rent'],
    gating: 'none',
  },
  {
    id: 'home.search',
    label: 'PG Search',
    subtitle: 'Explore verified PGs & hostels near you',
    icon: 'Search',
    route: '/search',
    tab: 'search',
    category: 'home',
    keywords: ['search', 'explore', 'pg', 'hostel', 'find', 'nearby', 'khoj'],
    gating: 'none',
  },
  {
    id: 'home.saved',
    label: 'Saved PGs',
    subtitle: 'Bookmarked & favorite properties',
    icon: 'Bookmark',
    route: '/saved',
    tab: 'search',
    category: 'home',
    keywords: ['saved', 'bookmark', 'favorite', 'wishlist'],
    gating: 'auth',
    lockCta: 'Sign in to view saved PGs',
  },

  // My Stay
  {
    id: 'stay.mypg',
    label: 'My PG Stay',
    subtitle: 'Room, bed, rent, pass & stay services',
    icon: 'Building2',
    route: '/my-pg',
    tab: 'mypg',
    category: 'mystay',
    keywords: ['my pg', 'stay', 'room', 'bed', 'kamra', 'hostel'],
    gating: 'auth',
    lockCta: 'Sign in to see your PG stay',
  },
  {
    id: 'stay.dining',
    label: 'Meal Menu & Dining Schedule',
    subtitle: 'Daily breakfast, lunch, snacks & dinner timings',
    icon: 'UtensilsCrossed',
    route: '/food',
    tab: 'mypg',
    category: 'mystay',
    keywords: ['food', 'meal', 'menu', 'dining', 'khana', 'tiffin', 'timings'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to view meal menu',
  },
  {
    id: 'stay.wifi',
    label: 'Wi-Fi Details',
    subtitle: 'SSID network name & password',
    icon: 'Wifi',
    route: '/wifi',
    tab: 'mypg',
    category: 'mystay',
    keywords: ['wifi', 'internet', 'password', 'ssid', 'network'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to view Wi-Fi details',
  },
  {
    id: 'stay.announcements',
    label: 'Announcements & Notice Board',
    subtitle: 'Latest updates & circulars from management',
    icon: 'Megaphone',
    route: '/announcements',
    tab: 'mypg',
    category: 'mystay',
    keywords: ['announcements', 'notice board', 'circular', 'updates'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to view announcements',
  },

  // Payments
  {
    id: 'pay.payments',
    label: 'Rent & Payment Details',
    subtitle: 'Outstanding dues, pay all, bills & receipts',
    icon: 'IndianRupee',
    route: '/payments',
    tab: 'mypg',
    category: 'payments',
    keywords: ['rent', 'payment', 'dues', 'kiraya', 'pay', 'bill', 'upi'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to view & pay rent',
  },
  {
    id: 'pay.transactions',
    label: 'Payment History & Receipts',
    subtitle: 'All past transactions, UTRs & rent receipts',
    icon: 'Receipt',
    route: '/transactions',
    tab: 'mypg',
    category: 'payments',
    keywords: ['transactions', 'history', 'receipt', 'invoice', 'utr', 'rasid'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to view payment history',
  },

  // Requests
  {
    id: 'req.complaints',
    label: 'Maintenance & Complaints',
    subtitle: 'Raise and track room & PG repairs',
    icon: 'AlertTriangle',
    route: '/complaints',
    tab: 'mypg',
    category: 'requests',
    keywords: ['complaint', 'issue', 'repair', 'maintenance', 'shikayat'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to raise complaints',
  },
  {
    id: 'req.guests',
    label: 'Guest Pass',
    subtitle: 'Register visitor entry & view pass approvals',
    icon: 'UserPlus',
    route: '/guests',
    tab: 'mypg',
    category: 'requests',
    keywords: ['guest', 'visitor', 'pass', 'mehmaan'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to request a guest pass',
  },
  {
    id: 'req.nightout',
    label: 'Night Out Pass',
    subtitle: 'Apply for late-entry or overnight leave',
    icon: 'Moon',
    route: '/night-out',
    tab: 'mypg',
    category: 'requests',
    keywords: ['night out', 'leave', 'late entry', 'overnight', 'chhutti'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to request night out',
  },
  {
    id: 'req.notice',
    label: 'Notice Period',
    subtitle: 'Submit move-out notice or check status',
    icon: 'CalendarClock',
    route: '/notice',
    tab: 'mypg',
    category: 'requests',
    keywords: ['notice period', 'move out', 'vacate', 'checkout'],
    gating: 'activeStay',
    lockCta: 'Link an active PG to manage notice period',
  },

  // Documents
  {
    id: 'doc.documents',
    label: 'Documents & KYC',
    subtitle: 'DigiLocker, Aadhaar KYC & rental agreements',
    icon: 'ShieldCheck',
    route: '/documents',
    tab: 'menu',
    category: 'documents',
    keywords: ['kyc', 'aadhaar', 'digilocker', 'documents', 'agreement'],
    gating: 'auth',
    lockCta: 'Sign in to complete KYC & view documents',
  },

  // Account
  {
    id: 'acc.notifications',
    label: 'Notifications',
    subtitle: 'Rent reminders, pass updates & notices',
    icon: 'Bell',
    route: '/notifications',
    tab: 'dashboard',
    category: 'account',
    keywords: ['notifications', 'alerts', 'bell'],
    gating: 'auth',
    lockCta: 'Sign in to view notifications',
  },
  {
    id: 'acc.profile',
    label: 'Account & Menu',
    subtitle: 'Profile details, KYC, saved PGs & support',
    icon: 'User',
    route: '/profile',
    tab: 'menu',
    category: 'account',
    keywords: ['profile', 'account', 'menu', 'settings', 'help', 'support', 'logout'],
    gating: 'none',
  },
];

export function searchTenantNavRegistry(query: string): TenantNavRegistryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return TENANT_NAV_REGISTRY;
  return TENANT_NAV_REGISTRY.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q)),
  );
}
