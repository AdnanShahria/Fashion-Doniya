import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { api, ADMIN_SESSION_STORAGE_KEY } from '../../services/api';
import { apiCache } from '../../services/apiCache';
import { orderService } from '../../services/orderService';
import { AdminTab } from '../../types';
import { AdminOverview } from './AdminOverview';
import { AdminHomepage } from './AdminHomepage';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminCategories } from './AdminCategories';
import { AdminCustomers } from './AdminCustomers';
import { AdminContent } from './AdminContent';
import { AdminNavigation } from './AdminNavigation';
import { AdminSeo } from './AdminSeo';
import { AdminPromotions } from './AdminPromotions';
import { AdminMeasurements } from './AdminMeasurements';
import { AdminCustomRequests } from './AdminCustomRequests';
import { AdminSettings } from './AdminSettings';
import { AdminFooter } from './AdminFooter';
import {
  LayoutDashboard,
  Home,
  Package,
  ShoppingBag,
  Layers,
  Users,
  FileText,
  Compass,
  PanelBottom,
  Globe,
  Tag,
  Ruler,
  Palette,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Lock,
  LogOut,
  KeyRound,
  ShieldCheck,
  Search,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AdminSessionData {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface BadgeCounts {
  pendingOrders: number;
  lowStockProducts: number;
  pendingCustomRequests: number;
  unreadMessages: number;
}

interface MenuItemDef {
  id: AdminTab;
  label: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  badgeKey?: keyof BadgeCounts;
  badgeTone?: 'crimson' | 'amber' | 'gold';
}

interface MenuGroupDef {
  title: string;
  items: MenuItemDef[];
}

export const AdminLayout: React.FC = () => {
  const { adminTab, setAdminTab, navigateTo, showToast, products } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');

  // Admin Authentication State
  const [authSession, setAuthSession] = useState<AdminSessionData | null>(() => {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminSessionData;
        if (parsed && typeof parsed.token === 'string' && parsed.token.trim().length > 0 && parsed.admin) {
          return parsed;
        }
        localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as AdminSessionData;
      return Boolean(parsed?.token && parsed.token.trim().length > 0);
    } catch {
      return false;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Password Change Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Live operational badges in sidebar
  const [badges, setBadges] = useState<BadgeCounts>({
    pendingOrders: 0,
    lowStockProducts: 0,
    pendingCustomRequests: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    if (authSession?.admin?.email) {
      setNewEmail(authSession.admin.email);
    }
  }, [authSession]);

  // Verify token validity on mount + handle 401/403 events globally
  useEffect(() => {
    const handleUnauthorized = (ev: Event) => {
      const detail = (ev as CustomEvent<{ message?: string }>).detail;
      setAuthSession(null);
      if (detail?.message) {
        showToast(detail.message, 'error');
      }
    };
    const handleApiError = (ev: Event) => {
      const detail = (ev as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) {
        showToast(detail.message, 'info');
      }
    };

    window.addEventListener('admin-unauthorized', handleUnauthorized);
    window.addEventListener('admin-api-error', handleApiError);

    if (authSession?.token) {
      setIsVerifyingSession(true);
      api
        .get('/admin/auth/me')
        .then((res) => {
          if (res.data?.success && res.data.admin) {
            setAuthSession((prev) =>
              prev ? { ...prev, admin: res.data.admin } : prev
            );
          }
        })
        .catch(() => {
          // 401 listener clears expired session automatically
        })
        .finally(() => {
          setIsVerifyingSession(false);
        });
    } else {
      setIsVerifyingSession(false);
    }

    return () => {
      window.removeEventListener('admin-unauthorized', handleUnauthorized);
      window.removeEventListener('admin-api-error', handleApiError);
    };
  }, [authSession?.token]);

  // Load live sidebar badge counters
  const refreshBadges = () => {
    if (!authSession?.token) return;
    const lowStockProducts = products.filter((p) => Number(p.stockYards) <= 20).length;
    const localPending = orderService
      .getAllOrders()
      .filter((o) => o.orderStatus === 'Pending' || o.paymentStatus === 'pending_verification').length;

    setBadges((prev) => ({
      ...prev,
      lowStockProducts,
      pendingOrders: Math.max(prev.pendingOrders, localPending),
    }));

    Promise.allSettled([
      api.get('/admin/orders'),
      api.get('/admin/custom-requests'),
      api.get('/admin/contact-messages'),
    ]).then(([ordersRes, reqRes, msgRes]) => {
      const ordersList =
        ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data?.orders)
          ? ordersRes.value.data.orders
          : orderService.getAllOrders();
      const pendingOrders = ordersList.filter(
        (o: { orderStatus?: string; paymentStatus?: string }) =>
          o.orderStatus === 'Pending' || o.paymentStatus === 'pending_verification'
      ).length;

      const pendingCustomRequests =
        reqRes.status === 'fulfilled' && Array.isArray(reqRes.value.data?.requests)
          ? reqRes.value.data.requests.filter(
              (r: { status?: string }) => r.status === 'Pending' || r.status === 'Reviewing'
            ).length
          : 0;

      const unreadMessages =
        msgRes.status === 'fulfilled' && Array.isArray(msgRes.value.data?.messages)
          ? msgRes.value.data.messages.filter(
              (m: { status?: string }) => !m.status || m.status === 'unread'
            ).length
          : 0;

      setBadges({
        pendingOrders,
        lowStockProducts,
        pendingCustomRequests,
        unreadMessages,
      });
    });
  };

  useEffect(() => {
    if (!authSession?.token || isVerifyingSession) return;
    refreshBadges();
    const handler = () => refreshBadges();
    window.addEventListener('admin-stats-updated', handler);
    return () => window.removeEventListener('admin-stats-updated', handler);
  }, [authSession?.token, isVerifyingSession, products]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await api.post('/admin/auth/login', {
        email: loginEmail.trim(),
        password: loginPassword,
      });
      const data = res.data;
      if (!data?.success) {
        setLoginError(data?.message || data?.error || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
        return;
      }
      const session: AdminSessionData = {
        token: data.token,
        admin: data.admin,
      };
      setAuthSession(session);
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
      showToast('অ্যাডমিন প্যানেলে স্বাগতম!', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoginError(msg || 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    api.post('/admin/auth/logout').catch(() => {});
    apiCache.invalidatePrefix();
    setAuthSession(null);
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    localStorage.removeItem('fashion_doniya_orders');
    localStorage.removeItem('fashion_doniya_order_tracking_history');
    localStorage.removeItem('fashion_doniya_courier_information');
    showToast('অ্যাডমিন প্যানেল থেকে লগআউট সম্পন্ন হয়েছে', 'info');
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword.trim() || newPassword.length < 6) {
      showToast('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'error');
      return;
    }
    try {
      const res = await api.post('/admin/auth/change-password', {
        currentPassword,
        newPassword,
        newEmail: newEmail.trim() || undefined,
      });
      const data = res.data;
      if (!data?.success) {
        showToast(data?.message || data?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে', 'error');
        return;
      }
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      if (authSession && (data?.admin || data?.token)) {
        const updated: AdminSessionData = {
          token: data.token || authSession.token,
          admin: data.admin || authSession.admin,
        };
        setAuthSession(updated);
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(updated));
      }
      showToast('অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || 'পাসওয়ার্ড পরিবর্তন করা যায়নি', 'error');
    }
  };

  const menuGroups: MenuGroupDef[] = useMemo(
    () => [
      {
        title: 'অপারেশন ও বিক্রয়',
        items: [
          {
            id: 'overview',
            label: 'ড্যাশবোর্ড ওভারভিউ',
            subtitle: 'বিক্রয়, বিশ্লেষণ ও সতর্কতা',
            icon: LayoutDashboard,
          },
          {
            id: 'orders',
            label: 'অর্ডার ও ট্র্যাকিং',
            subtitle: 'ভেরিফিকেশন ও কুরিয়ার সিঙ্ক',
            icon: ShoppingBag,
            badgeKey: 'pendingOrders',
            badgeTone: 'crimson',
          },
          {
            id: 'custom-requests',
            label: 'কাস্টম ডিজাইন অনুরোধ',
            subtitle: 'কাস্টম স্কেচ ও টেইলারিং',
            icon: Palette,
            badgeKey: 'pendingCustomRequests',
            badgeTone: 'amber',
          },
          {
            id: 'customers',
            label: 'গ্রাহক তালিকা (CRM)',
            subtitle: 'প্রোফাইল ও অর্ডার ইতিহাস',
            icon: Users,
          },
        ],
      },
      {
        title: 'ফেব্রিক ক্যাটালগ ও স্টুডিও',
        items: [
          {
            id: 'products',
            label: 'পণ্য ব্যবস্থাপনা',
            subtitle: 'নতুন থান যোগ, দাম ও স্টক',
            icon: Package,
            badgeKey: 'lowStockProducts',
            badgeTone: 'gold',
          },
          {
            id: 'categories',
            label: 'ক্যাটাগরি ও বহর স্টুডিও',
            subtitle: '৩.৫ ও ২.৫ বহর সেকশন',
            icon: Layers,
          },
          {
            id: 'measurements',
            label: 'গজ পরিমাপ ও সূত্র',
            subtitle: 'সাইজ গাইড ও অ্যাড-অন কাপড়',
            icon: Ruler,
          },
        ],
      },
      {
        title: 'স্টোরফ্রন্ট ও গ্রোথ',
        items: [
          {
            id: 'homepage',
            label: 'হোমপেজ ডিজাইনার',
            subtitle: 'হিরো স্লাইডার ও ব্যানার',
            icon: Home,
          },
          {
            id: 'promotions',
            label: 'প্রোমোশন ও কুপন',
            subtitle: 'ডিসকাউন্ট কোড ও ক্যাম্পেইন',
            icon: Tag,
          },
          {
            id: 'content',
            label: 'কন্টেন্ট ও ইনবক্স',
            subtitle: 'পলিসি, FAQ ও গ্রাহক বার্তা',
            icon: FileText,
            badgeKey: 'unreadMessages',
            badgeTone: 'crimson',
          },
          {
            id: 'navigation',
            label: 'নেভিগেশন ও মেনু',
            subtitle: 'হেডার, ফুটার ও উইজেট',
            icon: Compass,
          },
          {
            id: 'footer',
            label: 'ফুটার ও সোশ্যাল কন্ট্রোল',
            subtitle: 'কার্ভড ডিজাইন ও সোশ্যাল মিডিয়া সিঙ্ক',
            icon: PanelBottom,
          },
          {
            id: 'seo',
            label: 'এসইও (SEO) কেন্দ্র',
            subtitle: 'মেটা ট্যাগ ও ইনডেক্সিং',
            icon: Globe,
          },
        ],
      },
      {
        title: 'সিস্টেম ও সিকিউরিটি',
        items: [
          {
            id: 'settings',
            label: 'ওয়েবসাইট সেটিংস',
            subtitle: 'বিকাশ, নগদ ও ডেলিভারি চার্জ',
            icon: Settings,
          },
        ],
      },
    ],
    []
  );

  const flatItems = useMemo(() => menuGroups.flatMap((g) => g.items), [menuGroups]);
  const activeMenuItem = flatItems.find((m) => m.id === adminTab) || flatItems[0];

  const filteredGroups = useMemo(() => {
    const q = quickFilter.trim().toLowerCase();
    if (!q) return menuGroups;
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [menuGroups, quickFilter]);

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center p-4">
        <div className="w-8 h-8 border-2 border-[#850B1B] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-[#242424]/70">অ্যাডমিন সেশন যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  // Protected Login Gate if not authenticated
  if (!authSession || !authSession.token) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-28 -right-28 w-80 h-80 rounded-full bg-[#C5A46D]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 w-80 h-80 rounded-full bg-[#850B1B]/10 blur-3xl" />

        <div className="max-w-md w-full bg-white rounded-2xl border border-[#EDE5D9] shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
          <div className="h-1 w-20 bg-linear-to-r from-[#850B1B] via-[#C5A46D] to-[#850B1B] rounded-full mx-auto" />
          <div className="text-center space-y-2">
            <div className="w-13 h-13 rounded-2xl bg-[#1C1917] text-[#C5A46D] flex items-center justify-center mx-auto shadow-lg border border-[#C5A46D]/30">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1C1917] font-['Playfair_Display']">
              Fashion Doniya <span className="text-[#850B1B]">Atelier</span>
            </h1>
            <p className="text-xs text-[#242424]/65">
              নিরাপদ অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে আপনার ক্রেডেনশিয়াল দিন
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#242424] mb-1.5">
                অ্যাডমিন ইমেইল (Admin Email)
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@fashiondoniyabd.com"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl px-3.5 py-2.5 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1.5">
                পাসওয়ার্ড (Password)
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl px-3.5 py-2.5 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#1C1917] hover:bg-[#850B1B] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-60"
            >
              {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="p-3.5 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] text-[11px] text-[#242424]/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#242424]">ডেভেলপমেন্ট ডেমো ক্রেডেনশিয়াল:</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('admin@fashiondoniyabd.com');
                    setLoginPassword('Admin@2026');
                  }}
                  className="text-[#850B1B] font-bold hover:underline cursor-pointer"
                >
                  অটো-ফিল করুন
                </button>
              </div>
              <div className="font-mono">Email: admin@fashiondoniyabd.com</div>
            </div>
          )}

          <div className="text-center pt-2 border-t border-[#EDE5D9]">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="text-xs font-semibold text-[#242424]/70 hover:text-[#242424] inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ওয়েবসাইটে ফিরে যান</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (adminTab) {
      case 'homepage':
        return <AdminHomepage />;
      case 'products':
        return <AdminProducts />;
      case 'orders':
        return <AdminOrders />;
      case 'categories':
        return <AdminCategories />;
      case 'customers':
        return <AdminCustomers />;
      case 'content':
        return <AdminContent />;
      case 'navigation':
        return <AdminNavigation />;
      case 'footer':
        return <AdminFooter />;
      case 'seo':
        return <AdminSeo />;
      case 'promotions':
        return <AdminPromotions />;
      case 'measurements':
        return <AdminMeasurements />;
      case 'custom-requests':
        return <AdminCustomRequests />;
      case 'settings':
        return <AdminSettings />;
      case 'overview':
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col">
      {/* Top Atelier Header */}
      <header className="bg-[#1C1917] text-white px-4 sm:px-6 h-15 flex items-center justify-between border-b border-[#332E2A] sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
            className="p-2 hover:bg-white/10 rounded-lg md:hidden cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('overview')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#850B1B] border border-[#C5A46D]/50 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-4 h-4 text-[#FAF6F0]" />
            </div>
            <div className="leading-tight">
              <div className="font-['Playfair_Display'] font-bold text-base sm:text-lg tracking-wide flex items-center gap-1.5">
                <span>Fashion Doniya</span>
                <span className="text-[#C5A46D] text-xs font-sans uppercase tracking-widest">
                  Studio
                </span>
              </div>
              <div className="hidden sm:block text-[10px] text-white/55 truncate">
                {activeMenuItem?.label} — {activeMenuItem?.subtitle}
              </div>
            </div>
          </button>

          <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-3 h-3" />
            <span>LIVE D1 SYNC</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-3 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="পাসওয়ার্ড পরিবর্তন করুন"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span className="hidden sm:inline">পাসওয়ার্ড</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="px-3.5 py-1.5 bg-[#C5A46D] hover:bg-[#b5935c] text-[#1C1917] rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">স্টোরফ্রন্ট দেখুন</span>
            <span className="sm:hidden">স্টোর</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 bg-rose-500/15 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg transition-colors cursor-pointer border border-rose-500/20"
            title="লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-360 w-full mx-auto relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-20 md:hidden"
          />
        )}

        {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
        <aside
          className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-200 ease-out
          w-72 bg-white border-r border-[#EDE5D9] p-4 shrink-0 fixed md:sticky top-15 left-0 h-[calc(100vh-3.75rem)] z-30 overflow-y-auto flex flex-col justify-between
        `}
        >
          <div className="space-y-4">
            {/* Quick Nav Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#242424]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                placeholder="মেনু খুঁজুন..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
            </div>

            {filteredGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#242424]/45">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = adminTab === item.id;
                  const badgeVal = item.badgeKey ? badges[item.badgeKey] : 0;
                  const badgeClass =
                    item.badgeTone === 'crimson'
                      ? 'bg-[#850B1B] text-white'
                      : item.badgeTone === 'amber'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-[#FAF6F0] text-[#850B1B] border border-[#C5A46D]/50';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAdminTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer group ${
                        isActive
                          ? 'bg-[#1C1917] text-white font-semibold shadow-sm'
                          : 'text-[#242424]/80 hover:bg-[#FAF8F4] hover:text-[#1C1917]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? 'text-[#C5A46D]'
                              : 'text-[#242424]/45 group-hover:text-[#850B1B]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {badgeVal > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 ${
                            isActive ? 'bg-[#C5A46D] text-[#1C1917]' : badgeClass
                          }`}
                        >
                          {badgeVal.toLocaleString('bn-BD')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#EDE5D9] bg-[#FAF8F4] rounded-xl p-3 text-[11px] text-[#242424]/70 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#1C1917] truncate">{authSession.admin.name}</p>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#C5A46D]/20 text-[#850B1B]">
                {authSession.admin.role}
              </span>
            </div>
            <p className="font-mono text-[10px] truncate text-[#242424]/55">
              {authSession.admin.email}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold pt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              সার্ভার ডাটাবেস সিঙ্ক সক্রিয়
            </p>
          </div>
        </aside>

        {/* Main Admin Tab Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {renderActiveTab()}
        </main>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#EDE5D9] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                অ্যাডমিন ইমেইল ও পাসওয়ার্ড পরিবর্তন
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF8F4] cursor-pointer"
              >
                <X className="w-4 h-4 text-[#242424]" />
              </button>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">অ্যাডমিন ইমেইল</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">বর্তমান পাসওয়ার্ড *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE5D9]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE5D9] rounded-lg font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1917] hover:bg-[#850B1B] text-white rounded-lg font-semibold cursor-pointer"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
