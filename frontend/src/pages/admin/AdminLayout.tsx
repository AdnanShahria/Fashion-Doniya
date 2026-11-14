import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { api, ADMIN_SESSION_STORAGE_KEY } from '../../services/api';
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
import { 
  LayoutDashboard, 
  Home,
  Package, 
  ShoppingBag, 
  Layers, 
  Users,
  FileText,
  Compass,
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
  ShieldCheck
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

export const AdminLayout: React.FC = () => {
  const { adminTab, setAdminTab, navigateTo, showToast } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin Authentication State
  const [authSession, setAuthSession] = useState<AdminSessionData | null>(() => {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  });

  const [loginEmail, setLoginEmail] = useState('admin@fashiondoniyabd.com');
  const [loginPassword, setLoginPassword] = useState('Admin@2026');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Password Change Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (authSession?.admin?.email) {
      setNewEmail(authSession.admin.email);
    }
  }, [authSession]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await api.post('/admin/auth/login', {
        email: loginEmail.trim(),
        password: loginPassword
      });
      const data = res.data;
      if (!data?.success) {
        setLoginError(data?.message || data?.error || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
        return;
      }
      const session: AdminSessionData = {
        token: data.token,
        admin: data.admin
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
    setAuthSession(null);
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    showToast('অ্যাডমিন প্যানেল থেকে লগআউট সম্পন্ন হয়েছে', 'info');
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      showToast('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'error');
      return;
    }
    try {
      const res = await api.post('/admin/auth/change-password', {
        currentPassword,
        newPassword,
        newEmail: newEmail.trim() || undefined
      });
      const data = res.data;
      if (!data?.success) {
        showToast(data?.message || data?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে', 'error');
        return;
      }
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      if (authSession && data?.admin) {
        const updated = { ...authSession, admin: data.admin };
        setAuthSession(updated);
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(updated));
      }
      showToast('অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', 'success');
    } catch {
      showToast('পাসওয়ার্ড পরিবর্তন করা যায়নি', 'error');
    }
  };

  // Protected Login Gate if not authenticated
  if (!authSession) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#EDE5D9] shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#242424] text-[#C5A46D] flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-[#242424]">
              Fashion Doniya <span className="text-[#850B1B]">Admin Portal</span>
            </h1>
            <p className="text-xs text-[#242424]/65">
              নিরাপদ অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                অ্যাডমিন ইমেইল (Admin Email)
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@fashiondoniyabd.com"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3.5 py-2.5 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                পাসওয়ার্ড (Password)
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3.5 py-2.5 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#242424] hover:bg-[#850B1B] text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন'}
            </button>
          </form>

          <div className="p-3 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] text-[11px] text-[#242424]/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#242424]">ডিফল্ট অ্যাডমিন ক্রেডেনশিয়াল:</span>
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
            <div className="font-mono">Pass: Admin@2026</div>
          </div>

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

  const menuItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'ড্যাশবোর্ড ওভারভিউ', icon: LayoutDashboard },
    { id: 'homepage', label: 'হোমপেজ ম্যানেজমেন্ট', icon: Home },
    { id: 'products', label: 'পণ্য ব্যবস্থাপনা (CRUD)', icon: Package },
    { id: 'categories', label: 'ক্যাটাগরি ও বহর স্টুডিও', icon: Layers },
    { id: 'orders', label: 'অর্ডার ও ট্র্যাকিং সমূহ', icon: ShoppingBag },
    { id: 'customers', label: 'গ্রাহক ব্যবস্থাপনা', icon: Users },
    { id: 'content', label: 'ওয়েবসাইট কন্টেন্ট ও পেজ', icon: FileText },
    { id: 'navigation', label: 'নেভিগেশন ও মেনু', icon: Compass },
    { id: 'seo', label: 'এসইও (SEO) ম্যানেজমেন্ট', icon: Globe },
    { id: 'promotions', label: 'প্রোমোশন ও কুপন', icon: Tag },
    { id: 'measurements', label: 'গজ পরিমাপ ও বহর সূত্র', icon: Ruler },
    { id: 'custom-requests', label: 'কাস্টম ডিজাইন অনুরোধ', icon: Palette },
    { id: 'settings', label: 'ওয়েবসাইট সেটিংস', icon: Settings },
  ];

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
      
      {/* Top Admin Bar */}
      <header className="bg-[#242424] text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#333333] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-md md:hidden cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-['Playfair_Display'] font-bold text-lg tracking-wide">
              Fashion Doniya <span className="text-[#C5A46D]">Admin</span>
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xs">
            <ShieldCheck className="w-3 h-3" />
            <span>LIVE DB</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="পাসওয়ার্ড পরিবর্তন করুন"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span className="hidden sm:inline">পাসওয়ার্ড</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="px-3.5 py-1.5 bg-[#FF7A00] hover:bg-[#E86E00] active:bg-[#D46400] text-white rounded-full text-xs font-bold shadow-[0_3px_10px_rgba(255,122,0,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>স্টোরফ্রন্টে ফিরে যান</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar Nav (Desktop & Mobile Drawer) */}
        <aside className={`
          ${sidebarOpen ? 'block' : 'hidden'}
          md:block w-64 bg-white border-r border-[#EDE5D9] p-4 shrink-0 fixed md:sticky top-14 h-[calc(100vh-3.5rem)] z-30 overflow-y-auto
        `}>
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#242424]/40">
              ম্যানেজমেন্ট মেনু (CMS)
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setAdminTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#242424] text-white font-bold shadow-xs'
                      : 'text-[#242424]/80 hover:bg-[#FAF8F4] hover:text-[#242424]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5A46D]' : 'text-[#242424]/50'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-[#EDE5D9] text-[11px] text-[#242424]/60 px-3 space-y-1.5">
            <p className="font-bold text-[#242424]">{authSession.admin.name}</p>
            <p className="font-mono text-[10px] truncate">{authSession.admin.email}</p>
            <p className="text-[10px] text-emerald-700 font-semibold">
              ● সার্ভার ডাটাবেস রিয়েল-টাইম সিঙ্ক সক্রিয়
            </p>
          </div>
        </aside>

        {/* Main Admin Tab Viewport */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {renderActiveTab()}
        </main>

      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#EDE5D9] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                অ্যাডমিন ইমেইল ও পাসওয়ার্ড পরিবর্তন
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)}>
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
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">বর্তমান পাসওয়ার্ড *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE5D9]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE5D9] rounded-md font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#242424] hover:bg-[#850B1B] text-white rounded-md font-semibold cursor-pointer"
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
