import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import { INITIAL_FOOTER_CONFIG } from '../../data/seedData';
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Globe,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  AlertCircle
} from 'lucide-react';

// Custom SVG Icons for Brands
const FacebookIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YouTubeIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.84 1.56v-3.4z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const TwitterIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const sanitizeHref = (url: string, platform?: string) => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (platform === 'whatsapp') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const cleanNum = trimmed.replace(/\D/g, '');
    return `https://wa.me/${cleanNum}`;
  }
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('mailto:')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { settings, showToast } = useStore();

  const [logoClicks, setLogoClicks] = useState(0);

  // Newsletter interactive submission state
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  // Config with fallback chain
  const cfg = settings.footerConfig || INITIAL_FOOTER_CONFIG;

  const storeName = cfg.title || settings.storeName || 'Fashion Doniya';
  const tagline = cfg.tagline || settings.taglineBengali || 'Fashion Doniya — Premium Textile & Fabric Atelier';
  const aboutDesc =
    cfg.aboutDesc ||
    settings.contentConfig?.footerContent?.brandDescription ||
    'বাংলাদেশের রুচিশীল ক্রেতাদের জন্য প্রিমিয়াম কোয়ালিটির আনস্টিচড থান ও গজ কাপড়ের বিশ্বস্ত শোরুম। আপনার পছন্দমতো সঠিক গজ মেপে কিনুন সহজেই।';

  const address = cfg.address || settings.address || 'বাড়ি #১২, রোড #০৪, ধানমন্ডি, ঢাকা - ১২০৫';
  const phone = cfg.phone || settings.supportPhone || '+880 1712-345678';
  const emailAddr = cfg.email || settings.supportEmail || 'support@fashiondoniyabd.com';
  const workingHours = cfg.workingHours || 'প্রতিদিন সকাল ১০:০০ – রাত ১০:০০ (Everyday: 10:00 AM – 10:00 PM)';
  const logoUrl = cfg.logoUrl || settings.logoUrl || '';

  // Quick Links
  const quickLinks = (cfg.quickLinks || INITIAL_FOOTER_CONFIG.quickLinks).filter((l) => l.isActive);

  // Social Links
  const socialLinks = (cfg.socialLinks || INITIAL_FOOTER_CONFIG.socialLinks).filter((s) => s.isActive && s.url?.trim());

  // Social Highlight
  const socialHighlightEnabled = cfg.socialHighlightEnabled !== false;
  const socialHighlightText = cfg.socialHighlightText || 'সকল নতুন থান কালেকশন দেখুন →';
  const socialHighlightUrl = cfg.socialHighlightUrl || '/shop';

  // Newsletter
  const newsletterEnabled = cfg.newsletterEnabled !== false;
  const newsletterTitle = cfg.newsletterTitle || 'NEWSLETTER';
  const newsletterDesc = cfg.newsletterDesc || 'নতুন কাপড়ের কালেকশন ও এক্সক্লুসিভ অফারের আপডেট সবার আগে পান।';
  const newsletterBtnText = cfg.newsletterBtnText || 'SUBSCRIBE →';
  const newsletterPlaceholder = cfg.newsletterPlaceholder || 'আপনার ইমেইল লিখুন...';

  // Bottom Links & Copyright
  const copyrightTemplate = cfg.copyrightText || '© {year} Fashion Doniya. সর্বস্বত্ব সংরক্ষিত।';
  const formattedCopyright = copyrightTemplate.replace(/\{year\}/g, String(new Date().getFullYear()));
  const showPartnerBadge = cfg.showPartnerBadge !== false;
  const bottomLinks = (cfg.bottomLinks || INITIAL_FOOTER_CONFIG.bottomLinks).filter((b) => b.isActive);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);

    if (newClicks === 10) {
      navigate('/admin');
      setLogoClicks(0);
    } else if (newClicks === 1) {
      setTimeout(() => setLogoClicks(0), 2500);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setNewsletterError('সঠিক ইমেইল ঠিকানা প্রদান করুন');
      showToast('অনুগ্রহ করে সঠিক ইমেইল ঠিকানা প্রদান করুন।', 'error');
      return;
    }

    setSubscribing(true);
    setNewsletterError('');

    try {
      const res = await api.post('/newsletter/subscribe', { email: cleanEmail });
      showToast(res.data?.message || 'নিউজলেটারে সফলভাবে সাবস্ক্রাইব করা হয়েছে!', 'success');
      setEmail('');
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'সাবস্ক্রাইব করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setNewsletterError(msg);
      showToast(msg, 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <FacebookIcon size={15} />;
      case 'instagram':
        return <InstagramIcon size={15} />;
      case 'youtube':
        return <YouTubeIcon size={15} />;
      case 'tiktok':
        return <TikTokIcon size={15} />;
      case 'whatsapp':
        return <WhatsAppIcon size={15} />;
      case 'twitter':
        return <TwitterIcon size={15} />;
      default:
        return <Globe size={15} />;
    }
  };

  const renderLink = (url: string, label: string, className: string, children?: React.ReactNode) => {
    const isExternal =
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:');

    if (isExternal) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
          {children || label}
        </a>
      );
    }

    return (
      <Link to={url} className={className}>
        {children || label}
      </Link>
    );
  };

  // Service Features List
  const serviceFeatures = [
    {
      icon: Truck,
      title: 'সারা দেশে দ্রুত ডেলিভারি',
      desc: 'ঢাকা ও দেশজুড়ে নিরাপদ হোম ডেলিভারি',
    },
    {
      icon: ShieldCheck,
      title: '১০০% নিরাপদ পেমেন্ট',
      desc: 'ক্যাশ অন ডেলিভারি, বিকাশ ও নগদ',
    },
    {
      icon: RotateCcw,
      title: 'সহজ রিটার্ন সুবিধা',
      desc: '৭ দিনের মধ্যে সহজ এক্সচেঞ্জ পলিসি',
    },
    {
      icon: Headphones,
      title: '২৪/৭ গ্রাহক সহায়তা',
      desc: 'কল ও হোয়াটসঅ্যাপে সার্বক্ষণিক সেবা',
    },
  ];

  return (
    <footer className="w-full relative z-20 pt-10 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-12 bg-transparent text-slate-800 font-sans">
      {/* ========================================================= */}
      {/* SERVICE FEATURES CAPSULES (Gentle Top Strip)              */}
      {/* ========================================================= */}
      {cfg.showServiceFeatures !== false && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {serviceFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white/70 border border-neutral-200/90 shadow-2xs backdrop-blur-md min-w-0 hover:bg-white transition-colors"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#850B1B]/10 text-[#850B1B] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[13px] font-bold text-neutral-900 leading-tight truncate">
                      {feat.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 leading-tight truncate mt-0.5">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CURVED GLASSMORPHIC FOOTER CONTAINER                      */}
      {/* ========================================================= */}
      <div className="w-full max-w-full rounded-t-[3rem] sm:rounded-t-[4rem] border-t border-white/60 bg-white/35 sm:bg-white/40 backdrop-blur-3xl relative overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.85)] pt-12 sm:pt-16 pb-6">
        {/* Ambient diffuse warm glowing orbs */}
        <div className="absolute -top-24 left-1/4 w-[600px] h-[350px] bg-[#850B1B]/10 rounded-full blur-[115px] pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-[600px] h-[350px] bg-[#C5A46D]/15 rounded-full blur-[125px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Centered Tagline Header with Hairline Dividers */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px bg-[#850B1B]/20 flex-1 max-w-xs sm:max-w-md"></div>
            <h2 className="text-[#850B1B] font-extrabold tracking-[0.22em] text-xs sm:text-sm uppercase font-serif text-center select-none">
              {tagline}
            </h2>
            <div className="h-px bg-[#850B1B]/20 flex-1 max-w-xs sm:max-w-md"></div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-10">
            {/* ─── CARD 1: BRAND ATELIER & CONTACT (Span 5) ─── */}
            <div
              className={`${
                newsletterEnabled ? 'md:col-span-5' : 'md:col-span-6'
              } border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_12px_36px_rgba(45,35,20,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] bg-white/45 hover:bg-white/60 backdrop-blur-2xl transition-all duration-300`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={storeName}
                      onClick={handleLogoClick}
                      className="w-10 h-10 object-contain rounded-xl shadow-2xs cursor-pointer active:scale-95 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      onClick={handleLogoClick}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#850B1B] to-[#5e0712] text-white flex items-center justify-center font-serif font-bold text-base shadow-xs cursor-pointer active:scale-95 transition-transform select-none"
                      title={storeName}
                    >
                      FD
                    </div>
                  )}
                  <div>
                    <h3
                      onClick={handleLogoClick}
                      className="text-xl sm:text-2xl font-bold text-[#850B1B] font-serif cursor-pointer tracking-tight"
                    >
                      {storeName}
                    </h3>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 block">
                      PREMIUM TEXTILE & FABRIC ATELIER
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 text-xs sm:text-[13px] leading-relaxed font-medium">
                  {aboutDesc}
                </p>
              </div>

              {/* Contact list with elegant icons */}
              <ul className="space-y-3 mt-7 pt-5 border-t border-slate-300/40 text-xs text-slate-700">
                {address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="text-[#850B1B] shrink-0 mt-0.5" size={15} />
                    <span className="font-medium">{address}</span>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="text-[#850B1B] shrink-0" size={15} />
                    <a
                      href={`tel:${phone}`}
                      className="hover:text-[#850B1B] font-semibold transition-colors"
                    >
                      {phone}
                    </a>
                  </li>
                )}
                {emailAddr && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="text-[#850B1B] shrink-0" size={15} />
                    <a
                      href={`mailto:${emailAddr}`}
                      className="hover:text-[#850B1B] font-medium transition-colors"
                    >
                      {emailAddr}
                    </a>
                  </li>
                )}
                {workingHours && (
                  <li className="flex items-center gap-2.5 text-neutral-500 text-[11px]">
                    <Clock className="text-neutral-400 shrink-0" size={14} />
                    <span>{workingHours}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* ─── CARDS 2 & 3: QUICK LINKS & SOCIAL CONNECT (Span 4) ─── */}
            <div
              className={`${
                newsletterEnabled ? 'md:col-span-4' : 'md:col-span-6'
              } grid grid-cols-2 gap-4 sm:gap-6`}
            >
              {/* Card 2: Quick Links */}
              <div className="border border-white/70 rounded-3xl p-5 sm:p-6 flex flex-col shadow-[0_12px_36px_rgba(45,35,20,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] bg-white/45 hover:bg-white/60 backdrop-blur-2xl transition-all duration-300">
                <h4 className="text-[#850B1B] font-bold text-xs sm:text-[13px] tracking-wider uppercase mb-5 relative font-serif">
                  Quick Links
                  <span className="absolute -bottom-2 left-0 w-8 h-px bg-[#850B1B]/40" />
                </h4>
                <ul className="space-y-3 mt-1 flex-1">
                  {quickLinks.map((item) => (
                    <li key={item.id}>
                      {renderLink(
                        item.url,
                        item.title,
                        'text-slate-700 hover:text-[#850B1B] transition-colors text-xs font-semibold block truncate'
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Social Connect */}
              <div className="border border-white/70 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-[0_12px_36px_rgba(45,35,20,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] bg-white/45 hover:bg-white/60 backdrop-blur-2xl transition-all duration-300">
                <div>
                  <h4 className="text-[#850B1B] font-bold text-xs sm:text-[13px] tracking-wider uppercase mb-5 relative font-serif">
                    Social Connect
                    <span className="absolute -bottom-2 left-0 w-8 h-px bg-[#850B1B]/40" />
                  </h4>
                  <ul className="space-y-3.5 mt-1">
                    {socialLinks.map((item) => {
                      const targetUrl = sanitizeHref(
                        item.url,
                        item.platform === 'whatsapp' ? 'whatsapp' : undefined
                      );
                      return (
                        <li key={item.id}>
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-700 hover:text-[#850B1B] transition-colors text-xs flex items-center gap-2.5 font-semibold group"
                          >
                            <span className="text-[#850B1B] group-hover:scale-110 transition-transform">
                              {getSocialIcon(item.platform)}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Social Highlight Banner / CTA */}
                {socialHighlightEnabled && socialHighlightText && socialHighlightUrl && (
                  <div className="pt-4 mt-4 border-t border-slate-300/40">
                    {renderLink(
                      socialHighlightUrl,
                      socialHighlightText,
                      'text-[#850B1B] font-bold text-[10px] sm:text-[11px] uppercase tracking-wider hover:text-[#5e0712] transition-colors block group'
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ─── CARD 4: NEWSLETTER (Span 3) ─── */}
            {newsletterEnabled && (
              <div className="md:col-span-3 border border-white/70 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_12px_36px_rgba(45,35,20,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] bg-white/45 hover:bg-white/60 backdrop-blur-2xl transition-all duration-300">
                <div>
                  <h4 className="text-[#850B1B] font-bold text-xs sm:text-[13px] tracking-wider uppercase mb-5 relative font-serif">
                    {newsletterTitle}
                    <span className="absolute -bottom-2 left-0 w-8 h-px bg-[#850B1B]/40" />
                  </h4>
                  <p className="text-slate-700 text-xs leading-relaxed font-medium mt-1">
                    {newsletterDesc}
                  </p>
                </div>

                <div className="mt-6 pt-2">
                  {subscribed ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 bg-emerald-50/80 border border-emerald-300/70 rounded-2xl shadow-2xs backdrop-blur-md animate-in zoom-in-95">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h5 className="text-xs font-bold text-emerald-950 font-serif">
                        You're Subscribed!
                      </h5>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-tight">
                        নতুন কাপড়ের কালেকশন ও এক্সক্লুসিভ অফারের আপডেট পেয়ে যাবেন।
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2.5">
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (newsletterError) setNewsletterError('');
                          }}
                          placeholder={newsletterPlaceholder}
                          disabled={subscribing}
                          required
                          className="pl-9.5 pr-3.5 py-2.5 bg-white/70 focus:bg-white border border-white/80 focus:border-[#850B1B] focus:ring-2 focus:ring-[#850B1B]/15 text-slate-800 placeholder-slate-400 rounded-xl text-xs w-full transition-all shadow-2xs outline-none disabled:opacity-70"
                        />
                      </div>

                      {newsletterError && (
                        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{newsletterError}</span>
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={subscribing}
                        className="bg-gradient-to-r from-[#850B1B] to-[#5e0712] hover:from-[#5e0712] hover:to-[#850B1B] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all w-full shadow-md shadow-[#850B1B]/20 flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      >
                        {subscribing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>সাবস্ক্রাইব হচ্ছে...</span>
                          </>
                        ) : (
                          <span>{newsletterBtnText}</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* MOBILE BOTTOM BAR (< md)                                 */}
          {/* ========================================================= */}
          <div className="pt-6 pb-4 border-t border-slate-300/40 flex md:hidden flex-col items-center gap-3.5 text-[11px] text-slate-700 font-medium text-center">
            {/* Row 1: OrbitSaaS Development Partner Glowing Pill Badge */}
            {showPartnerBadge && (
              <div>
                <a
                  href="https://orbitsaas.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 border border-indigo-200/70 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-200/40 backdrop-blur-md transition-all group text-xs font-medium cursor-pointer"
                  title="Built by OrbitSaaS — Visit orbitsaas.cloud"
                >
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse shadow-xs" />
                  <span className="text-slate-600 font-medium">Development Partner:</span>
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    OrbitSaaS
                  </span>
                  <span className="text-amber-500 text-xs group-hover:rotate-12 transition-transform">
                    ✦
                  </span>
                </a>
              </div>
            )}

            {/* Row 2: Copyright & Bottom Policy Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-slate-600 text-xs">
              <span>{formattedCopyright}</span>
              <span className="text-slate-400 select-none">·</span>
              {bottomLinks.map((link, idx) => (
                <span key={link.id} className="flex items-center gap-2.5">
                  {renderLink(link.url, link.title, 'hover:text-[#850B1B] transition-colors')}
                  {idx < bottomLinks.length - 1 && (
                    <span className="text-slate-400 select-none">·</span>
                  )}
                </span>
              ))}
            </div>

            {/* Row 3: Smooth Scroll to Top Pill */}
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-300/80 shadow-2xs font-semibold text-[11px] transition-all active:scale-95 cursor-pointer mt-1"
            >
              <span>উপরে যান</span>
              <ArrowUp size={11} className="stroke-[2.5] text-[#850B1B]" />
            </button>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP & TABLET BOTTOM BAR (>= md)                       */}
          {/* ========================================================= */}
          <div className="pt-6 pb-2 border-t border-slate-300/40 hidden md:flex items-center justify-between gap-4 text-xs text-slate-700 font-medium">
            {/* Left: Copyright */}
            <p className="text-left text-slate-600 shrink-0">
              {formattedCopyright}
            </p>

            {/* Center: OrbitSaaS Development Partner Glowing Pill Badge */}
            {showPartnerBadge && (
              <div className="flex justify-center text-center shrink-0">
                <a
                  href="https://orbitsaas.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 border border-indigo-200/70 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-200/40 backdrop-blur-md transition-all group text-xs font-medium cursor-pointer"
                  title="Built by OrbitSaaS — Visit orbitsaas.cloud"
                >
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse shadow-xs" />
                  <span className="text-slate-600 font-medium">Development Partner:</span>
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    OrbitSaaS
                  </span>
                  <span className="text-amber-500 text-xs group-hover:rotate-12 transition-transform">
                    ✦
                  </span>
                </a>
              </div>
            )}

            {/* Right: Policy Links + Scroll to Top Pill */}
            <div className="flex items-center justify-end gap-3 text-slate-600 shrink-0">
              {bottomLinks.map((link) => (
                <span key={link.id}>
                  {renderLink(link.url, link.title, 'hover:text-[#850B1B] transition-colors')}
                </span>
              ))}

              {/* Top button */}
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-300/80 shadow-2xs hover:shadow-xs font-semibold text-xs transition-all active:scale-95 cursor-pointer ml-1"
                title="Scroll to Top"
              >
                <span>Top</span>
                <ArrowUp size={12} className="stroke-[2.5] text-[#850B1B]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
