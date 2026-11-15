import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { orderService } from '../services/orderService';
import { StorageService } from '../services/storageService';
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  LogIn,
  ArrowRight,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const {
    currentUser,
    loginUser,
    registerUser,
    resetPassword,
    logoutUser,
    updateUserProfile,
    navigateTo,
  } = useStore();

  // Auth Tabs & Mode
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Login Fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot Password Fields
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Inline feedback banner inside the card
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  // Profile & Address Edit State (when logged in)
  const [profileName, setProfileName] = useState(currentUser?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [fullAddress, setFullAddress] = useState(
    currentUser?.address?.fullAddress || 'ফ্ল্যাট ৪বি, বাড়ি ২৭, রোড ৮, ধানমন্ডি, ঢাকা'
  );
  const [district, setDistrict] = useState(currentUser?.address?.district || 'ঢাকা');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName);
      setProfileEmail(currentUser.email || '');
      setFullAddress(
        currentUser.address?.fullAddress || 'ফ্ল্যাট ৪বি, বাড়ি ২৭, রোড ৮, ধানমন্ডি, ঢাকা'
      );
      setDistrict(currentUser.address?.district || 'ঢাকা');
    }
  }, [currentUser]);

  // Customer's order history
  const allOrders = orderService.getAllOrders();
  const userOrders = currentUser
    ? allOrders.filter(
        (o) =>
          StorageService.normalizePhone(o.customer.phone) ===
            StorageService.normalizePhone(currentUser.phone) ||
          o.customer.fullName.toLowerCase() === currentUser.fullName.toLowerCase()
      )
    : [];

  // Handle Login / Register / Forgot Password Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // 1. Forgot Password Flow
    if (isForgotPassword) {
      if (newPassword !== confirmNewPassword) {
        setFeedback({
          type: 'error',
          text: 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!',
        });
        return;
      }
      const ok = await resetPassword(resetPhone, newPassword);
      if (!ok) {
        const normalized = StorageService.normalizePhone(resetPhone);
        const isValidPhone = /^01[3-9]\d{8}$/.test(normalized);
        setFeedback({
          type: 'error',
          text: !isValidPhone
            ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
            : newPassword.trim().length < 4
            ? 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'
            : 'এই মোবাইল নম্বর দিয়ে কোনো নিবন্ধিত অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নতুন অ্যাকাউন্ট রেজিস্টার করুন।',
        });
        return;
      }
      const normalized = StorageService.normalizePhone(resetPhone);
      setLoginPhone(normalized);
      setLoginPassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      setIsForgotPassword(false);
      setAuthTab('login');
      setFeedback({
        type: 'success',
        text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।',
      });
      return;
    }

    // 2. Register Flow
    if (authTab === 'register') {
      if (regPassword !== regConfirmPassword) {
        setFeedback({
          type: 'error',
          text: 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড একই হতে হবে!',
        });
        return;
      }
      const ok = await registerUser(regName, regPhone, regPassword);
      if (!ok) {
        const normalized = StorageService.normalizePhone(regPhone);
        const isValidPhone = /^01[3-9]\d{8}$/.test(normalized);
        setFeedback({
          type: 'error',
          text:
            regName.trim().length < 2
              ? 'অনুগ্রহ করে আপনার পুরো নাম লিখুন'
              : !isValidPhone
              ? 'সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
              : regPassword.trim().length < 4
              ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'
              : 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।',
        });
      }
      return;
    }

    // 3. Login Flow
    const ok = await loginUser(loginPhone, loginPassword);
    if (!ok) {
      const normalized = StorageService.normalizePhone(loginPhone);
      const isValidPhone = /^01[3-9]\d{8}$/.test(normalized);
      const exists = StorageService.getSavedUsers().some(
        (u) => StorageService.normalizePhone(u.phone) === normalized
      );
      setFeedback({
        type: 'error',
        text: !isValidPhone
          ? 'সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
          : loginPassword.trim().length < 4
          ? 'অনুগ্রহ করে কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন'
          : !exists
          ? 'এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে প্রথমে রেজিস্টার করুন।'
          : 'পাসওয়ার্ড সঠিক নয়! আবার চেষ্টা করুন অথবা পাসওয়ার্ড রিসেট করুন।',
      });
    }
  };

  const handleFillDemoCredentials = () => {
    setIsForgotPassword(false);
    setAuthTab('login');
    setLoginPhone('01711223344');
    setLoginPassword('123456');
    setFeedback({
      type: 'success',
      text: 'ডেমো অ্যাকাউন্টের নম্বর ও পাসওয়ার্ড বসানো হয়েছে। এখন "লগইন করুন" বাটনে চাপুন।',
    });
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName: profileName.trim() || currentUser?.fullName,
      email: profileEmail.trim() || currentUser?.email,
      address: {
        district,
        upazila: '',
        area: '',
        fullAddress,
      },
    });
  };

  const handleProfilePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const ok = await resetPassword(currentUser.phone, profileNewPassword);
    if (ok) {
      setProfileNewPassword('');
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full px-3 pt-1.5 pb-6 md:py-10 bg-[#FAF6F0]">
        <div className="max-w-[400px] md:max-w-[430px] mx-auto bg-white rounded-2xl border border-[#E5D4C0] shadow-[0_10px_28px_-8px_rgba(107,8,18,0.14)] overflow-hidden">
          {/* Top Maroon-Gold Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#6B0812] via-[#9E0B16] to-[#C5A46D]" />

          <div className="p-4 md:p-6 space-y-3 md:space-y-4">
            {/* Compact Brand Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#6B0812]/10 border border-[#6B0812]/20 text-[#6B0812] flex items-center justify-center shrink-0">
                  {isForgotPassword ? (
                    <KeyRound className="w-5 h-5" />
                  ) : authTab === 'register' ? (
                    <UserPlus className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9E0B16]">
                    Fashion Doniya BD
                  </span>
                  <h1 className="text-base md:text-lg font-extrabold text-[#241614] leading-tight truncate">
                    {isForgotPassword
                      ? 'পাসওয়ার্ড রিসেট করুন'
                      : authTab === 'register'
                      ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
                      : 'অ্যাকাউন্টে লগইন করুন'}
                  </h1>
                </div>
              </div>

              {!isForgotPassword && authTab === 'login' && (
                <button
                  type="button"
                  onClick={handleFillDemoCredentials}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF4EC] hover:bg-[#F3E6D4] border border-[#E2D0B8] text-[10px] font-bold text-[#6B0812] shrink-0 transition-colors cursor-pointer"
                >
                  ডেমো লগইন
                </button>
              )}
            </div>

            {/* Login / Register Segmented Tabs */}
            {!isForgotPassword && (
              <div className="grid grid-cols-2 p-1 bg-[#FAF4EC] rounded-xl border border-[#E6D5C0]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setIsForgotPassword(false);
                    setFeedback(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-[#6B0812] text-white shadow-[0_2px_8px_rgba(107,8,18,0.28)]'
                      : 'text-[#5C3A38] hover:text-[#6B0812]'
                  }`}
                >
                  লগইন (Login)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setIsForgotPassword(false);
                    setFeedback(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-[#6B0812] text-white shadow-[0_2px_8px_rgba(107,8,18,0.28)]'
                      : 'text-[#5C3A38] hover:text-[#6B0812]'
                  }`}
                >
                  রেজিস্টার (Register)
                </button>
              </div>
            )}

            {/* Inline Status / Validation Message */}
            {feedback && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-start gap-2 leading-snug ${
                  feedback.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-2.5 md:space-y-3">
              {/* ==================== FORGOT PASSWORD FORM ==================== */}
              {isForgotPassword ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-[#2B1816]">
                        নিবন্ধিত মোবাইল নম্বর <span className="text-[#9E0B16]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setFeedback(null);
                        }}
                        className="text-[11px] font-bold text-[#6B0812] hover:underline cursor-pointer"
                      >
                        ← লগইনে ফিরে যান
                      </button>
                    </div>
                    <div className="flex items-stretch rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <div className="px-2.5 bg-[#F6EDE0] border-r border-[#E2D0B8] flex items-center gap-1 text-xs font-bold text-[#6B0812] shrink-0 select-none">
                        <span>+880</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        required
                        className="w-full px-3 py-2 text-xs font-semibold text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1816] mb-1">
                      নতুন পাসওয়ার্ড দিন <span className="text-[#9E0B16]">*</span>
                    </label>
                    <div className="relative flex items-center rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <Lock className="w-3.5 h-3.5 text-[#6B0812]/60 ml-3 shrink-0 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড"
                        required
                        minLength={4}
                        className="w-full px-2.5 py-2 text-xs font-medium text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="px-2.5 py-1.5 text-[#6B0812]/75 hover:text-[#6B0812] flex items-center shrink-0 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1816] mb-1">
                      নতুন পাসওয়ার্ড নিশ্চিত করুন <span className="text-[#9E0B16]">*</span>
                    </label>
                    <div className="relative flex items-center rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <Lock className="w-3.5 h-3.5 text-[#6B0812]/60 ml-3 shrink-0 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                        required
                        minLength={4}
                        className="w-full px-2.5 py-2 text-xs font-medium text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="px-2.5 py-1.5 text-[#6B0812]/75 hover:text-[#6B0812] flex items-center shrink-0 cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : authTab === 'register' ? (
                /* ==================== REGISTER FORM ==================== */
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1816] mb-1">
                      আপনার পুরো নাম <span className="text-[#9E0B16]">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-[#6B0812]/60 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="আপনার নাম লিখুন"
                        required
                        className="w-full bg-[#FDFBF7] border border-[#E2D0B8] focus:border-[#6B0812] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#241614] placeholder:text-[#8C7A72] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1816] mb-1">
                      মোবাইল নম্বর <span className="text-[#9E0B16]">*</span>
                    </label>
                    <div className="flex items-stretch rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <div className="px-2.5 bg-[#F6EDE0] border-r border-[#E2D0B8] flex items-center gap-1 text-xs font-bold text-[#6B0812] shrink-0 select-none">
                        <span>+880</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        required
                        className="w-full px-3 py-2 text-xs font-semibold text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1816] mb-1">
                      পাসওয়ার্ড তৈরি করুন <span className="text-[#9E0B16]">*</span>
                    </label>
                    <div className="relative flex items-center rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <Lock className="w-3.5 h-3.5 text-[#6B0812]/60 ml-3 shrink-0 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                        required
                        minLength={4}
                        className="w-full px-2.5 py-2 text-xs font-medium text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="px-2.5 py-1.5 text-[#6B0812]/75 hover:text-[#6B0812] flex items-center shrink-0 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1816] mb-1">
                      পাসওয়ার্ড নিশ্চিত করুন <span className="text-[#9E0B16]">*</span>
                    </label>
                    <div className="relative flex items-center rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <Lock className="w-3.5 h-3.5 text-[#6B0812]/60 ml-3 shrink-0 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                        required
                        minLength={4}
                        className="w-full px-2.5 py-2 text-xs font-medium text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="px-2.5 py-1.5 text-[#6B0812]/75 hover:text-[#6B0812] flex items-center shrink-0 cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ==================== LOGIN FORM ==================== */
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1816] mb-1">
                      মোবাইল নম্বর <span className="text-[#9E0B16]">*</span>
                    </label>
                    <div className="flex items-stretch rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <div className="px-2.5 bg-[#F6EDE0] border-r border-[#E2D0B8] flex items-center gap-1 text-xs font-bold text-[#6B0812] shrink-0 select-none">
                        <span>+880</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="01711223344"
                        required
                        className="w-full px-3 py-2 text-xs font-semibold text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-[#2B1816]">
                        পাসওয়ার্ড <span className="text-[#9E0B16]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPhone(loginPhone);
                          setIsForgotPassword(true);
                          setFeedback(null);
                        }}
                        className="text-[11px] font-bold text-[#8B0B15] hover:underline cursor-pointer"
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>
                    <div className="relative flex items-center rounded-xl border border-[#E2D0B8] focus-within:border-[#6B0812] bg-[#FDFBF7] overflow-hidden transition-colors">
                      <Lock className="w-3.5 h-3.5 text-[#6B0812]/60 ml-3 shrink-0 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="আপনার পাসওয়ার্ড দিন"
                        required
                        minLength={4}
                        className="w-full px-2.5 py-2 text-xs font-medium text-[#241614] placeholder:text-[#8C7A72] bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="px-2.5 py-1.5 text-[#6B0812]/75 hover:text-[#6B0812] flex items-center gap-1 text-[11px] font-semibold shrink-0 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Full-Width Maroon Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#850B16] via-[#6B0812] to-[#54050D] hover:from-[#960D19] hover:to-[#6B0812] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-[0_6px_16px_-3px_rgba(107,8,18,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {isForgotPassword
                    ? 'পাসওয়ার্ড পরিবর্তন করুন'
                    : authTab === 'register'
                    ? 'রেজিস্টার ও লগইন করুন'
                    : 'লগইন করুন'}
                </span>
              </button>
            </form>

            {/* Quick Switch Helper */}
            {!isForgotPassword && (
              <div className="text-center pt-0.5">
                {authTab === 'login' ? (
                  <p className="text-[11px] text-[#5C433E]">
                    কোনো অ্যাকাউন্ট নেই?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('register');
                        setFeedback(null);
                      }}
                      className="font-bold text-[#6B0812] hover:underline cursor-pointer"
                    >
                      নতুন অ্যাকাউন্ট তৈরি করুন
                    </button>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#5C433E]">
                    ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('login');
                        setFeedback(null);
                      }}
                      className="font-bold text-[#6B0812] hover:underline cursor-pointer"
                    >
                      লগইন করুন
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Compact Bottom Helper & Guest Checkout Link */}
            <div className="pt-2 border-t border-[#EFE4D4] flex items-center justify-between gap-2 text-[11px]">
              <span className="text-[#5C433E] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6B0812] shrink-0" />
                <span>নিরাপদ কাস্টমার পোর্টাল</span>
              </span>
              <button
                type="button"
                onClick={() => navigateTo('shop')}
                className="font-bold text-[#6B0812] hover:underline cursor-pointer"
              >
                গেস্ট শপিং →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE5D9] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-[#6B0812] text-white font-bold text-2xl flex items-center justify-center border-2 border-[#C5A46D] shadow-xs">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#242424]">{currentUser.fullName}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#242424]/60 mt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {currentUser.phone}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {currentUser.email}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logoutUser}
          className="px-4 py-2 border border-[#EDE5D9] hover:bg-[#FAF8F4] text-xs font-semibold text-[#242424] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
          <span>লগআউট</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Saved Address, Password Update & Quick Links (Col 1) */}
        <div className="space-y-6">
          {/* Saved Profile & Address */}
          <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C5A46D]" />
              <span>প্রোফাইল ও ডেলিভারি ঠিকানা</span>
            </h2>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#242424]/70 mb-1">আপনার নাম</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#242424]/70 mb-1">জেলা</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#242424]/70 mb-1">সম্পূর্ণ ঠিকানা</label>
                <textarea
                  rows={3}
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#6B0812] hover:bg-[#850B16] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                তথ্য ও ঠিকানা সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* Change Password Box */}
          <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#C5A46D]" />
              <span>পাসওয়ার্ড পরিবর্তন করুন</span>
            </h2>

            <form onSubmit={handleProfilePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#242424]/70 mb-1">নতুন পাসওয়ার্ড</label>
                <div className="relative flex items-center bg-[#FAF8F4] border border-[#EDE5D9] rounded-md overflow-hidden">
                  <input
                    type={showProfilePassword ? 'text' : 'password'}
                    value={profileNewPassword}
                    onChange={(e) => setProfileNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড"
                    required
                    minLength={4}
                    className="w-full px-3 py-2 text-xs bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword((p) => !p)}
                    className="px-2.5 text-[#242424]/60 hover:text-[#242424] cursor-pointer"
                  >
                    {showProfilePassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#242424] hover:bg-[#6B0812] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                পাসওয়ার্ড আপডেট করুন
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className="bg-[#FAF8F4] p-5 rounded-xl border border-[#EDE5D9] space-y-2 text-xs">
            <button
              onClick={() => navigateTo('wishlist')}
              className="w-full p-2.5 bg-white border border-[#EDE5D9] hover:border-[#C5A46D] rounded-lg text-left flex items-center justify-between font-semibold text-[#242424] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#C5A46D]" />
                <span>আমার পছন্দের তালিকা</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#242424]/40" />
            </button>

            <button
              onClick={() => navigateTo('calculator')}
              className="w-full p-2.5 bg-white border border-[#EDE5D9] hover:border-[#C5A46D] rounded-lg text-left flex items-center justify-between font-semibold text-[#242424] cursor-pointer"
            >
              <span>গজ হিসাব ক্যালকুলেটর</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#242424]/40" />
            </button>
          </div>
        </div>

        {/* Right Col: Order History (Col 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C5A46D]" />
              <span>পূর্ববর্তী অর্ডার হিস্টোরি ({userOrders.length}টি অর্ডার)</span>
            </h2>

            {userOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#242424]/60 space-y-2">
                <p>আপনার এই নম্বরে কোনো পূর্ববর্তী অর্ডারের রেকর্ড নেই।</p>
                <button
                  onClick={() => navigateTo('shop')}
                  className="px-4 py-2 bg-[#6B0812] text-white rounded-md text-xs font-semibold cursor-pointer"
                >
                  প্রথম অর্ডার করুন
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EDE5D9]/60 text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#242424]">
                          {order.orderNumber}
                        </span>
                        <span className="text-[#242424]/50 ml-2">
                          {new Date(order.createdAt).toLocaleDateString('bn-BD')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white border border-[#EDE5D9] text-[#C5A46D] font-bold text-[11px] rounded-xs">
                          {order.orderStatus}
                        </span>
                        <button
                          onClick={() =>
                            navigateTo('order-tracking', {
                              orderNumber: order.orderNumber,
                              trackingPhone: order.customer.phone
                            })
                          }
                          className="text-[11px] font-semibold text-[#242424] hover:text-[#C5A46D] underline cursor-pointer"
                        >
                          ট্র্যাক করুন
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[#242424]/80">
                          <span>
                            {it.productName} ({it.fabricWidth} বহর · {it.yards} গজ)
                          </span>
                          <span className="font-semibold tabular-nums text-[#242424]">
                            ৳{it.subtotal}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#EDE5D9]/60 flex justify-between items-baseline text-xs">
                      <span className="text-[#242424]/60">পেমেন্ট: {order.paymentMethod}</span>
                      <span className="font-bold text-sm text-[#242424] tabular-nums">
                        মোট: ৳{order.grandTotal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
