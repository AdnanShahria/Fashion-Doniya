import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { 
  FooterConfig, 
  FooterQuickLinkItem, 
  FooterSocialLinkItem, 
  FooterBottomLinkItem 
} from '../../types';
import { INITIAL_FOOTER_CONFIG } from '../../data/seedData';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Link as LinkIcon,
  Globe,
  Mail,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Share2,
  Sliders,
  PanelBottom,
  Send,
  HelpCircle,
  ShieldCheck,
  Truck,
  ChevronRight
} from 'lucide-react';

// Custom Brand SVGs
const FacebookIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.84 1.56v-3.4z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const TwitterIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

// Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#850B1B]/30 ${
        checked ? 'bg-[#850B1B]' : 'bg-neutral-300'
      }`}
      title={label || 'Toggle'}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// Preset Platform Definitions for Connections
const PRESET_PLATFORMS = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: FacebookIcon,
    accent: '#1877F2',
    bg: 'bg-blue-50 text-blue-600 border-blue-200',
    placeholder: 'https://www.facebook.com/your-page'
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: InstagramIcon,
    accent: '#E4405F',
    bg: 'bg-rose-50 text-rose-600 border-rose-200',
    placeholder: 'https://instagram.com/your-handle'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: YouTubeIcon,
    accent: '#FF0000',
    bg: 'bg-red-50 text-red-600 border-red-200',
    placeholder: 'https://youtube.com/@channel'
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: TikTokIcon,
    accent: '#000000',
    bg: 'bg-neutral-100 text-neutral-900 border-neutral-300',
    placeholder: 'https://tiktok.com/@your-handle'
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: WhatsAppIcon,
    accent: '#25D366',
    bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    placeholder: '+8801700000000'
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    icon: TwitterIcon,
    accent: '#000000',
    bg: 'bg-neutral-100 text-neutral-800 border-neutral-300',
    placeholder: 'https://x.com/your-handle'
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: LinkedInIcon,
    accent: '#0A66C2',
    bg: 'bg-sky-50 text-sky-600 border-sky-200',
    placeholder: 'https://linkedin.com/company/your-company'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: Send,
    accent: '#229ED9',
    bg: 'bg-sky-50 text-sky-600 border-sky-200',
    placeholder: 'https://t.me/your-channel'
  }
];

export const AdminFooter: React.FC = () => {
  const { settings, refreshData, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<'social' | 'brand' | 'links' | 'newsletter' | 'bottom' | 'preview'>('social');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load initial footer config state with fallback
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() => {
    const existing = settings.footerConfig || INITIAL_FOOTER_CONFIG;
    return JSON.parse(JSON.stringify(existing));
  });

  useEffect(() => {
    if (settings.footerConfig) {
      setFooterConfig(JSON.parse(JSON.stringify(settings.footerConfig)));
      setHasUnsavedChanges(false);
    }
  }, [settings.footerConfig]);

  // Update Helper
  const updateFooter = (updater: (prev: FooterConfig) => FooterConfig) => {
    setFooterConfig((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // ─── Save Handler ───
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Find key socials to sync backward-compatibly with store settings
      const fbLink = footerConfig.socialLinks.find((s) => s.platform === 'facebook')?.url || '';
      const igLink = footerConfig.socialLinks.find((s) => s.platform === 'instagram')?.url || '';
      const ytLink = footerConfig.socialLinks.find((s) => s.platform === 'youtube')?.url || '';
      const ttLink = footerConfig.socialLinks.find((s) => s.platform === 'tiktok')?.url || '';
      const waLink = footerConfig.socialLinks.find((s) => s.platform === 'whatsapp')?.url || '';

      settingsService.updateSettings({
        footerConfig,
        storeName: footerConfig.title || settings.storeName,
        address: footerConfig.address || settings.address,
        supportPhone: footerConfig.phone || settings.supportPhone,
        supportEmail: footerConfig.email || settings.supportEmail,
        facebookUrl: fbLink || settings.facebookUrl,
        instagramUrl: igLink || settings.instagramUrl,
        youtubeUrl: ytLink || settings.youtubeUrl,
        tiktokUrl: ttLink || settings.tiktokUrl,
        whatsappNumber: waLink || settings.whatsappNumber,
      });

      refreshData();
      setHasUnsavedChanges(false);
      showToast('কার্ভড ফুটার ও সোশ্যাল মিডিয়া সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
    } catch (err) {
      console.error('Failed to save footer settings:', err);
      showToast('সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Reset Handler ───
  const handleResetDefaults = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে ফুটার সেটিংস ডিফল্ট অবস্থায় রিসেট করতে চান?')) {
      const fresh = JSON.parse(JSON.stringify(INITIAL_FOOTER_CONFIG));
      setFooterConfig(fresh);
      settingsService.updateSettings({ footerConfig: fresh });
      refreshData();
      setHasUnsavedChanges(false);
      showToast('ফুটার সেটিংস ডিফল্টে রিসেট হয়েছে।', 'info');
    }
  };

  // ─── Quick Links Helpers ───
  const [newQuickTitle, setNewQuickTitle] = useState('');
  const [newQuickUrl, setNewQuickUrl] = useState('');

  const handleAddQuickLink = () => {
    if (!newQuickTitle.trim() || !newQuickUrl.trim()) {
      showToast('লিংকের নাম এবং URL উভয়ই প্রদান করুন', 'error');
      return;
    }
    const newItem: FooterQuickLinkItem = {
      id: `ql-${Date.now()}`,
      title: newQuickTitle.trim(),
      url: newQuickUrl.trim(),
      isActive: true,
    };
    updateFooter((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, newItem],
    }));
    setNewQuickTitle('');
    setNewQuickUrl('');
    showToast('নতুন কুইক লিংক যোগ করা হয়েছে', 'success');
  };

  const handleRemoveQuickLink = (id: string) => {
    updateFooter((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((l) => l.id !== id),
    }));
  };

  const handleToggleQuickLink = (id: string) => {
    updateFooter((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((l) =>
        l.id === id ? { ...l, isActive: !l.isActive } : l
      ),
    }));
  };

  const handleMoveQuickLink = (idx: number, dir: 'up' | 'down') => {
    updateFooter((prev) => {
      const arr = [...prev.quickLinks];
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      const temp = arr[idx];
      arr[idx] = arr[targetIdx];
      arr[targetIdx] = temp;
      return { ...prev, quickLinks: arr };
    });
  };

  // ─── Social Media Connections Helpers ───
  const updateSocialConnection = (
    platformId: string,
    updates: Partial<FooterSocialLinkItem>
  ) => {
    updateFooter((prev) => {
      const existing = prev.socialLinks.find((s) => s.platform === platformId);
      if (existing) {
        return {
          ...prev,
          socialLinks: prev.socialLinks.map((s) =>
            s.platform === platformId ? { ...s, ...updates } : s
          ),
        };
      } else {
        const preset = PRESET_PLATFORMS.find((p) => p.id === platformId);
        const newItem: FooterSocialLinkItem = {
          id: `soc-${Date.now()}`,
          platform: platformId as any,
          label: preset?.label || platformId,
          url: '',
          isActive: true,
          ...updates,
        };
        return {
          ...prev,
          socialLinks: [...prev.socialLinks, newItem],
        };
      }
    });
  };

  // ─── Bottom Links Helpers ───
  const [newBottomTitle, setNewBottomTitle] = useState('');
  const [newBottomUrl, setNewBottomUrl] = useState('');

  const handleAddBottomLink = () => {
    if (!newBottomTitle.trim() || !newBottomUrl.trim()) {
      showToast('লিংকের নাম এবং URL উভয়ই প্রদান করুন', 'error');
      return;
    }
    const newItem: FooterBottomLinkItem = {
      id: `bot-${Date.now()}`,
      title: newBottomTitle.trim(),
      url: newBottomUrl.trim(),
      isActive: true,
    };
    updateFooter((prev) => ({
      ...prev,
      bottomLinks: [...prev.bottomLinks, newItem],
    }));
    setNewBottomTitle('');
    setNewBottomUrl('');
    showToast('নতুন বটম লিংক যোগ করা হয়েছে', 'success');
  };

  const handleRemoveBottomLink = (id: string) => {
    updateFooter((prev) => ({
      ...prev,
      bottomLinks: prev.bottomLinks.filter((b) => b.id !== id),
    }));
  };

  const handleToggleBottomLink = (id: string) => {
    updateFooter((prev) => ({
      ...prev,
      bottomLinks: prev.bottomLinks.map((b) =>
        b.id === id ? { ...b, isActive: !b.isActive } : b
      ),
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Top atelier Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#850B1B]/10 border border-[#850B1B]/20 flex items-center justify-center text-[#850B1B]">
            <PanelBottom className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#242424]">
                ফুটার কন্ট্রোল ও সোশ্যাল কানেকশন
              </h1>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Curved Footer Active
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              কার্ভড ফ্রস্টেড গ্লাস ডিজাইন, ব্র্যান্ডিং, সোশ্যাল মিডিয়া সংযোগ এবং কুইক লিংক পরিচালনা করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            title="রিসেট ডিফল্ট"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট রিসেট</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#850B1B] to-[#5e0712] hover:from-[#5e0712] hover:to-[#850B1B] rounded-xl transition-all shadow-md shadow-[#850B1B]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সব সংরক্ষণ করুন'}</span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Modern Tabs Bar ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#EDE5D9] scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'social'
              ? 'bg-[#850B1B] text-white shadow-sm'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EDE5D9]'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>সোশ্যাল কানেকশন (Social Media)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {footerConfig.socialLinks.filter((s) => s.isActive).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'brand'
              ? 'bg-[#850B1B] text-white shadow-sm'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EDE5D9]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ব্র্যান্ড ও যোগাযোগ (Brand & Info)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('links')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'links'
              ? 'bg-[#850B1B] text-white shadow-sm'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EDE5D9]'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>কুইক লিংকস (Quick Links)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {footerConfig.quickLinks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('newsletter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'newsletter'
              ? 'bg-[#850B1B] text-white shadow-sm'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EDE5D9]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>নিউজলেটার সেটিংস (Newsletter)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bottom')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'bottom'
              ? 'bg-[#850B1B] text-white shadow-sm'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EDE5D9]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>বটম বার ও পার্টনার (Bottom Bar)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'preview'
              ? 'bg-[#850B1B] text-white shadow-sm'
              : 'bg-white text-[#850B1B] hover:bg-[#850B1B]/5 border border-[#850B1B]/30'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>লাইভ প্রিভিউ (Live Preview)</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 1: SOCIAL MEDIA CONNECTIONS MANAGEMENT                */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          {/* Section banner */}
          <div className="bg-gradient-to-r from-neutral-900 to-[#1C1917] text-white p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                  Social Hub Manager
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/10 text-neutral-200">
                  Live Sync
                </span>
              </div>
              <h2 className="text-base font-bold mt-1 text-white">
                সোশ্যাল মিডিয়া কানেকশন ও মেম্বারশিপ চ্যানেল
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5 max-w-2xl leading-relaxed">
                এখানে আপনার ব্র্যান্ডের সোশ্যাল একাউন্ট লিংক যুক্ত করুন এবং টগল অন/অফ করুন। সক্রিয় চ্যানেলগুলো ওয়েবসাইটের কার্ভড ফুটারে আইকন ও লিঙ্ক সহ ডায়নামিকালি প্রদর্শিত হবে।
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-neutral-300">
                এক্টিভ চ্যানেল:{' '}
                <strong className="text-amber-400 font-bold">
                  {footerConfig.socialLinks.filter((s) => s.isActive && s.url?.trim()).length} / {PRESET_PLATFORMS.length}
                </strong>
              </span>
            </div>
          </div>

          {/* Social Platform Connections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_PLATFORMS.map((preset) => {
              const current = footerConfig.socialLinks.find((s) => s.platform === preset.id);
              const isActive = current ? current.isActive : false;
              const urlVal = current?.url || '';
              const handleVal = current?.handle || '';
              const IconComp = preset.icon;

              return (
                <div
                  key={preset.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive && urlVal
                      ? 'bg-white border-[#850B1B]/30 shadow-xs ring-1 ring-[#850B1B]/10'
                      : 'bg-white/80 border-[#EDE5D9]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${preset.bg}`}
                      >
                        <IconComp size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#242424] flex items-center gap-2">
                          {preset.label}
                          {isActive && urlVal ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-100 text-neutral-500 font-medium">
                              Inactive
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-neutral-400">
                          {preset.id === 'whatsapp' ? 'সরাসরি চ্যাট নম্বর' : 'প্রোফাইল / পেইজ লিংক'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {urlVal && (
                        <a
                          href={preset.id === 'whatsapp' ? `https://wa.me/${urlVal.replace(/\D/g, '')}` : urlVal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="লিংক টেস্ট করুন"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <ToggleSwitch
                        checked={isActive}
                        onChange={(v) => updateSocialConnection(preset.id, { isActive: v })}
                        label={`${preset.label} সক্রিয় করুন`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        {preset.id === 'whatsapp' ? 'WhatsApp নম্বর (Country code সহ):' : 'সোশ্যাল লিংক URL:'}
                      </label>
                      <input
                        type={preset.id === 'whatsapp' ? 'text' : 'url'}
                        value={urlVal}
                        onChange={(e) => updateSocialConnection(preset.id, { url: e.target.value })}
                        placeholder={preset.placeholder}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#242424] placeholder:text-neutral-400 outline-none transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">
                        একউন্ট হ্যান্ডেল / নাম (ঐচ্ছিক):
                      </label>
                      <input
                        type="text"
                        value={handleVal}
                        onChange={(e) => updateSocialConnection(preset.id, { handle: e.target.value })}
                        placeholder={`e.g. @fashiondoniyabd`}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-[#242424] placeholder:text-neutral-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social Highlight Banner / CTA Settings */}
          <div className="bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#242424] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#850B1B]" />
                  সোশ্যাল কানেক্ট হাইলাইট ব্যানার / CTA
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  কার্ভড ফুটারে সোশ্যাল কানেক্ট কার্ডের নিচে একটি নজরকাড়া অ্যাকশন লিংক (যেমন: "সকল নতুন থান কালেকশন দেখুন →") দেখান।
                </p>
              </div>
              <ToggleSwitch
                checked={footerConfig.socialHighlightEnabled !== false}
                onChange={(v) => updateFooter((prev) => ({ ...prev, socialHighlightEnabled: v }))}
                label="সোশ্যাল হাইলাইট সক্রিয় করুন"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  হাইলাইট টেক্সট (CTA Text):
                </label>
                <input
                  type="text"
                  value={footerConfig.socialHighlightText || ''}
                  onChange={(e) => updateFooter((prev) => ({ ...prev, socialHighlightText: e.target.value }))}
                  placeholder="যেমন: সকল নতুন থান কালেকশন দেখুন →"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#242424] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  টার্গেট লিংক URL:
                </label>
                <input
                  type="text"
                  value={footerConfig.socialHighlightUrl || ''}
                  onChange={(e) => updateFooter((prev) => ({ ...prev, socialHighlightUrl: e.target.value }))}
                  placeholder="যেমন: /shop অথবা /category/kamiz"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#242424] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 2: BRAND & CONTACT INFO                               */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'brand' && (
        <div className="bg-white p-6 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-5">
          <div className="border-b border-[#EDE5D9] pb-3">
            <h3 className="text-sm font-bold text-[#242424]">
              ব্র্যান্ড পরিচিতি ও যোগাযোগ তথ্য
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              কার্ভড ফুটারের প্রধান ব্র্যান্ড কার্ডে এই তথ্যগুলো প্রদর্শিত হবে।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">ব্র্যান্ড নাম (Brand Title):</label>
              <input
                type="text"
                value={footerConfig.title || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Fashion Doniya"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">টপ ডিভাইডার ট্যাগলাইন (Tagline Header):</label>
              <input
                type="text"
                value={footerConfig.tagline || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder="Fashion Doniya — Premium Textile & Fabric Atelier"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-800 mb-1">
                ব্র্যান্ড ও অ্যাটেলিয়ার বিবরণ (Brand Description):
              </label>
              <textarea
                rows={3}
                value={footerConfig.aboutDesc || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, aboutDesc: e.target.value }))}
                placeholder="বাংলাদেশের রুচিশীল ক্রেতাদের জন্য প্রিমিয়াম কোয়ালিটির আনস্টিচড থান ও গজ কাপড়ের বিশ্বস্ত শোরুম..."
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl p-3 leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#850B1B]" /> শোরুম ঠিকানা (Address):
              </label>
              <input
                type="text"
                value={footerConfig.address || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="বাড়ি #১২, রোড #০৪, ধানমন্ডি, ঢাকা - ১২০৫"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
                <Phone size={13} className="text-[#850B1B]" /> হেল্পলাইন ফোন (Phone):
              </label>
              <input
                type="text"
                value={footerConfig.phone || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+880 1712-345678"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-[#850B1B]" /> সাপোর্ট ইমেইল (Email):
              </label>
              <input
                type="email"
                value={footerConfig.email || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="support@fashiondoniyabd.com"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-[#850B1B]" /> কাস্টমার সার্ভিস সময় (Working Hours):
              </label>
              <input
                type="text"
                value={footerConfig.workingHours || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, workingHours: e.target.value }))}
                placeholder="প্রতিদিন সকাল ১০:০০ – রাত ১০:০০"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-800 mb-1">
                লোগো ইমেজ URL (Logo URL):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={footerConfig.logoUrl || ''}
                  onChange={(e) => updateFooter((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="/logo.png অথবা https://..."
                  className="flex-1 bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2 text-xs"
                />
                {footerConfig.logoUrl && (
                  <img
                    src={footerConfig.logoUrl}
                    alt="Logo Preview"
                    className="w-10 h-10 object-contain rounded-xl border border-neutral-200 bg-white p-1"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 3: QUICK LINKS MANAGEMENT                             */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'links' && (
        <div className="space-y-5">
          {/* Add Link Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-[#242424] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#850B1B]" />
              নতুন কুইক লিংক যুক্ত করুন
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  লিংকের নাম (Title):
                </label>
                <input
                  type="text"
                  value={newQuickTitle}
                  onChange={(e) => setNewQuickTitle(e.target.value)}
                  placeholder="যেমন: ৩.৫ বহর কাপড়"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  টার্গেট URL বা রুট:
                </label>
                <input
                  type="text"
                  value={newQuickUrl}
                  onChange={(e) => setNewQuickUrl(e.target.value)}
                  placeholder="যেমন: /shop-3-5 অথবা /calculator"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddQuickLink}
                  className="w-full bg-[#850B1B] hover:bg-[#680814] text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>যুক্ত করুন</span>
                </button>
              </div>
            </div>

            {/* Presets suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-neutral-500">
              <span className="font-semibold text-neutral-700">দ্রুত প্রিসেট:</span>
              {[
                { title: 'সকল কাপড়', url: '/shop' },
                { title: '৩.৫ বহর কাপড়', url: '/shop-3-5' },
                { title: '২.৫ বহর কাপড়', url: '/shop-2-5' },
                { title: 'গজ ক্যালকুলেটর', url: '/calculator' },
                { title: 'অর্ডার ট্র্যাকিং', url: '/order-tracking' },
                { title: 'আমাদের সম্পর্কে', url: '/about' },
                { title: 'যোগাযোগ', url: '/contact' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewQuickTitle(p.title);
                    setNewQuickUrl(p.url);
                  }}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer text-[10px]"
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Links List */}
          <div className="bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-[#242424]">
                বর্তমান কুইক লিংক সমূহ ({footerConfig.quickLinks.length})
              </h3>
              <span className="text-[11px] text-neutral-500">
                ড্র্যাগ বা অ্যারো দিয়ে ক্রম পরিবর্তন করুন
              </span>
            </div>

            <div className="space-y-2">
              {footerConfig.quickLinks.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                    item.isActive
                      ? 'bg-neutral-50/70 border-neutral-200'
                      : 'bg-neutral-100/40 border-dashed border-neutral-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-neutral-400">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        updateFooter((prev) => ({
                          ...prev,
                          quickLinks: prev.quickLinks.map((l) =>
                            l.id === item.id ? { ...l, title: e.target.value } : l
                          ),
                        }))
                      }
                      className="font-bold text-xs text-[#242424] bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-[#850B1B] focus:bg-white rounded px-1.5 py-0.5 outline-none w-44 shrink-0"
                    />
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) =>
                        updateFooter((prev) => ({
                          ...prev,
                          quickLinks: prev.quickLinks.map((l) =>
                            l.id === item.id ? { ...l, url: e.target.value } : l
                          ),
                        }))
                      }
                      className="text-xs text-neutral-500 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-[#850B1B] focus:bg-white rounded px-1.5 py-0.5 outline-none flex-1 min-w-0"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveQuickLink(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 cursor-pointer text-neutral-600"
                      title="উপরে নিন"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveQuickLink(idx, 'down')}
                      disabled={idx === footerConfig.quickLinks.length - 1}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 cursor-pointer text-neutral-600"
                      title="নিচে নিন"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleQuickLink(item.id)}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        item.isActive
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200'
                      }`}
                      title={item.isActive ? 'লুকান' : 'প্রদর্শন করুন'}
                    >
                      {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuickLink(item.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 4: NEWSLETTER SETTINGS                                */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'newsletter' && (
        <div className="bg-white p-6 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#242424]">
                নিউজলেটার সাবস্ক্রিপশন কার্ড
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                কার্ভড ফুটারে গ্রাহকদের ইমেইল সংগ্রহের ইন্টারঅ্যাক্টিভ ফর্ম নিয়ন্ত্রণ করুন।
              </p>
            </div>
            <ToggleSwitch
              checked={footerConfig.newsletterEnabled !== false}
              onChange={(v) => updateFooter((prev) => ({ ...prev, newsletterEnabled: v }))}
              label="নিউজলেটার কার্ড দেখান"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                কার্ডের শিরোনাম (Card Title):
              </label>
              <input
                type="text"
                value={footerConfig.newsletterTitle || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, newsletterTitle: e.target.value }))}
                placeholder="NEWSLETTER"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                সাবস্ক্রাইব বাটন টেক্সট (Button Text):
              </label>
              <input
                type="text"
                value={footerConfig.newsletterBtnText || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, newsletterBtnText: e.target.value }))}
                placeholder="SUBSCRIBE →"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-800 mb-1">
                নিউজলেটার বর্ণনা (Description):
              </label>
              <textarea
                rows={2}
                value={footerConfig.newsletterDesc || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, newsletterDesc: e.target.value }))}
                placeholder="নতুন কাপড়ের কালেকশন ও এক্সক্লুসিভ অফারের আপডেট সবার আগে পান।"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl p-3"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-800 mb-1">
                ইমেইল ইনপুট প্লেসহোল্ডার (Input Placeholder):
              </label>
              <input
                type="text"
                value={footerConfig.newsletterPlaceholder || ''}
                onChange={(e) => updateFooter((prev) => ({ ...prev, newsletterPlaceholder: e.target.value }))}
                placeholder="আপনার ইমেইল লিখুন..."
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 5: BOTTOM BAR & POLICIES                              */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'bottom' && (
        <div className="space-y-5">
          {/* Copyright & Partner Badge */}
          <div className="bg-white p-6 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#242424] border-b border-[#EDE5D9] pb-3">
              কপিরাইট ও ডেভেলপমেন্ট পার্টনার ব্যাজ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  কপিরাইট টেক্সট (Copyright Text):
                </label>
                <input
                  type="text"
                  value={footerConfig.copyrightText || ''}
                  onChange={(e) => updateFooter((prev) => ({ ...prev, copyrightText: e.target.value }))}
                  placeholder="© {year} Fashion Doniya. সর্বস্বত্ব সংরক্ষিত।"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  হিন্ট: বর্তমান সাল স্বয়ংক্রিয়ভাবে দেখানোর জন্য <code>{'{year}'}</code> ব্যবহার করুন।
                </span>
              </div>

              <div className="flex flex-col justify-between p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="font-bold text-xs text-indigo-950">
                      OrbitSaaS Development Partner ব্যাজ
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={footerConfig.showPartnerBadge !== false}
                    onChange={(v) => updateFooter((prev) => ({ ...prev, showPartnerBadge: v }))}
                    label="OrbitSaaS ব্যাজ দেখান"
                  />
                </div>
                <p className="text-[11px] text-indigo-800/80 mt-1.5">
                  ফুটারের বটম বারের মাঝে OrbitSaaS-এর প্রিমিয়াম গ্রেডিয়েন্ট গ্লোয়িং পিল ব্যাজ প্রদর্শন করে।
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Links List */}
          <div className="bg-white p-6 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#242424]">
                  বটম বার পলিসি ও লিগ্যাল লিংক
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Privacy, Terms, Cookies ইত্যাদি পলিসি পেজের লিংক পরিচালনা করুন।
                </p>
              </div>
            </div>

            {/* Add bottom link */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={newBottomTitle}
                  onChange={(e) => setNewBottomTitle(e.target.value)}
                  placeholder="যেমন: শর্তাবলী / Privacy"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={newBottomUrl}
                  onChange={(e) => setNewBottomUrl(e.target.value)}
                  placeholder="যেমন: /privacy-policy"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] focus:border-[#850B1B] rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddBottomLink}
                  className="w-full bg-[#850B1B] hover:bg-[#680814] text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 pt-2">
              {footerConfig.bottomLinks.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50/70"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        updateFooter((prev) => ({
                          ...prev,
                          bottomLinks: prev.bottomLinks.map((b) =>
                            b.id === item.id ? { ...b, title: e.target.value } : b
                          ),
                        }))
                      }
                      className="font-bold text-xs text-[#242424] bg-transparent border-b border-transparent focus:border-[#850B1B] focus:bg-white rounded px-1.5 py-0.5 outline-none w-44"
                    />
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) =>
                        updateFooter((prev) => ({
                          ...prev,
                          bottomLinks: prev.bottomLinks.map((b) =>
                            b.id === item.id ? { ...b, url: e.target.value } : b
                          ),
                        }))
                      }
                      className="text-xs text-neutral-500 bg-transparent border-b border-transparent focus:border-[#850B1B] focus:bg-white rounded px-1.5 py-0.5 outline-none flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBottomLink(item.id)}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        item.isActive
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-neutral-400 bg-neutral-100'
                      }`}
                      title={item.isActive ? 'লুকান' : 'প্রদর্শন করুন'}
                    >
                      {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBottomLink(item.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 6: LIVE INTERACTIVE PREVIEW                           */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <div className="bg-[#FAF8F4] p-4 sm:p-8 rounded-3xl border border-[#EDE5D9] shadow-inner space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-300/60">
            <span className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#850B1B]" />
              লাইভ কার্ভড ফুটার প্রিভিউ (Desktop View)
            </span>
            <span className="text-[11px] text-neutral-400">
              সমস্ত পরিবর্তন সরাসরি এখানে প্রদর্শিত হচ্ছে
            </span>
          </div>

          {/* Render preview curved footer container */}
          <div className="rounded-t-[3rem] sm:rounded-t-[4rem] border-t border-white/70 bg-white/40 backdrop-blur-3xl p-6 sm:p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute -top-20 left-1/4 w-[400px] h-[250px] bg-[#850B1B]/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-20 right-1/4 w-[400px] h-[250px] bg-[#C5A46D]/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Tagline Divider */}
            <div className="flex items-center justify-center gap-4 mb-8 relative z-10">
              <div className="h-px bg-[#850B1B]/15 flex-1" />
              <h2 className="text-[#850B1B] font-extrabold tracking-[0.25em] text-xs uppercase font-serif">
                {footerConfig.tagline || footerConfig.title || 'Fashion Doniya'}
              </h2>
              <div className="h-px bg-[#850B1B]/15 flex-1" />
            </div>

            {/* Bento Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10 mb-8">
              {/* Brand Card */}
              <div className="md:col-span-5 border border-white/70 rounded-3xl p-6 shadow-sm bg-white/45 backdrop-blur-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#850B1B] text-white flex items-center justify-center font-serif font-bold text-sm">
                      FD
                    </div>
                    <h3 className="text-xl font-bold text-[#850B1B] font-serif">
                      {footerConfig.title || 'Fashion Doniya'}
                    </h3>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {footerConfig.aboutDesc}
                  </p>
                </div>

                <div className="space-y-2 mt-6 text-xs text-slate-700">
                  {footerConfig.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#850B1B] shrink-0" />
                      <span>{footerConfig.address}</span>
                    </div>
                  )}
                  {footerConfig.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[#850B1B] shrink-0" />
                      <span>{footerConfig.phone}</span>
                    </div>
                  )}
                  {footerConfig.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-[#850B1B] shrink-0" />
                      <span>{footerConfig.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links & Social Connect */}
              <div className="md:col-span-4 grid grid-cols-2 gap-4">
                {/* Quick Links */}
                <div className="border border-white/70 rounded-3xl p-5 shadow-sm bg-white/45 backdrop-blur-2xl flex flex-col">
                  <h4 className="text-[#850B1B] font-bold text-xs tracking-wider uppercase mb-4 relative font-serif">
                    Quick Links
                    <span className="absolute -bottom-1.5 left-0 w-6 h-px bg-[#850B1B]/40" />
                  </h4>
                  <ul className="space-y-2 text-xs flex-1">
                    {footerConfig.quickLinks
                      .filter((l) => l.isActive)
                      .slice(0, 5)
                      .map((l) => (
                        <li key={l.id} className="text-slate-700 hover:text-[#850B1B] font-medium truncate">
                          {l.title}
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Social Connect */}
                <div className="border border-white/70 rounded-3xl p-5 shadow-sm bg-white/45 backdrop-blur-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-[#850B1B] font-bold text-xs tracking-wider uppercase mb-4 relative font-serif">
                      Social Connect
                      <span className="absolute -bottom-1.5 left-0 w-6 h-px bg-[#850B1B]/40" />
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      {footerConfig.socialLinks
                        .filter((s) => s.isActive && s.url)
                        .slice(0, 4)
                        .map((s) => {
                          const preset = PRESET_PLATFORMS.find((p) => p.id === s.platform);
                          const Icon = preset?.icon || Globe;
                          return (
                            <div key={s.id} className="flex items-center gap-2 text-slate-700 font-medium">
                              <Icon size={14} className="text-[#850B1B]" />
                              <span>{s.label}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {footerConfig.socialHighlightEnabled && footerConfig.socialHighlightText && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#850B1B] mt-4 pt-2 border-t border-[#850B1B]/15">
                      {footerConfig.socialHighlightText}
                    </div>
                  )}
                </div>
              </div>

              {/* Newsletter */}
              {footerConfig.newsletterEnabled !== false && (
                <div className="md:col-span-3 border border-white/70 rounded-3xl p-6 shadow-sm bg-white/45 backdrop-blur-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-[#850B1B] font-bold text-xs tracking-wider uppercase mb-3 relative font-serif">
                      {footerConfig.newsletterTitle || 'NEWSLETTER'}
                      <span className="absolute -bottom-1.5 left-0 w-6 h-px bg-[#850B1B]/40" />
                    </h4>
                    <p className="text-slate-700 text-xs leading-relaxed mt-3">
                      {footerConfig.newsletterDesc}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <input
                      type="email"
                      disabled
                      placeholder={footerConfig.newsletterPlaceholder || 'your@email.com'}
                      className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      disabled
                      className="w-full bg-[#850B1B] text-white py-2 rounded-xl text-xs font-bold"
                    >
                      {footerConfig.newsletterBtnText || 'SUBSCRIBE →'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar Preview */}
            <div className="pt-5 border-t border-slate-300/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 relative z-10">
              <p>
                {footerConfig.copyrightText?.replace('{year}', String(new Date().getFullYear())) ||
                  `© ${new Date().getFullYear()} Fashion Doniya.`}
              </p>

              {footerConfig.showPartnerBadge !== false && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 border border-indigo-200/70 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-slate-600 font-medium">Development Partner:</span>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    OrbitSaaS
                  </span>
                  <span className="text-amber-500">✦</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {footerConfig.bottomLinks
                  .filter((b) => b.isActive)
                  .map((b) => (
                    <span key={b.id} className="hover:underline">
                      {b.title}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFooter;
