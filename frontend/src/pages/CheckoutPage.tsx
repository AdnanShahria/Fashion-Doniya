import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { OrangeBackButton } from '../components/common/OrangeBackButton';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { StorageService } from '../services/storageService';
import { FabricPatternVisual } from '../components/common/FabricPatternVisual';
import { getUniqueProductFabricImage } from '../components/home/allProductsImageGenerator';
import { formatMeasurementsSummary } from '../services/measurementService';
import confetti from 'canvas-confetti';
import type { PaymentMethod } from '../types';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Scissors,
  Copy,
  Check,
  Banknote,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Lock,
  ArrowRight,
  ChevronDown,
  ShoppingBag,
  Ticket,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export interface PaymentGatewayItem {
  id: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'upay';
  name: string;
  nameBn: string;
  enabled: boolean;
  number: string;
  type: 'Personal' | 'Merchant' | 'Agent';
  instructions: string;
  brandColor: string;
  accentBg: string;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    buyNowItem, 
    clearBuyNow, 
    clearCart, 
    settings, 
    appliedCoupon,
    applyCoupon,
    clearCoupon,
    setLastCompletedOrder, 
    navigateTo, 
    showToast,
    refreshData,
    currentUser,
    registerUser
  } = useStore();

  // Dynamic payment settings from Admin config
  const paymentSettings = settings.paymentSettings;

  // Determine items to checkout (Buy Now takes priority if active)
  const isDirectBuy = Boolean(buyNowItem);
  const checkoutItems = isDirectBuy && buyNowItem ? [buyNowItem] : cart;

  // Delivery Location (Manual selection required like VOLT)
  const [shippingZone, setShippingZone] = useState<'dhaka' | 'outside' | null>(null);

  // Customer Form Fields
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [altPhone, setAltPhone] = useState(currentUser?.altPhone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [district, setDistrict] = useState(currentUser?.address?.district || 'ঢাকা');
  const [upazila, setUpazila] = useState(currentUser?.address?.upazila || '');
  const [area, setArea] = useState(currentUser?.address?.area || '');
  const [fullAddress, setFullAddress] = useState(currentUser?.address?.fullAddress || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Update form fields if currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName || '');
      if (!phone) setPhone(currentUser.phone || '');
      if (!email) setEmail(currentUser.email || '');
      if (!fullAddress && currentUser.address?.fullAddress) {
        setFullAddress(currentUser.address.fullAddress);
      }
      if (currentUser.address?.district) {
        setDistrict(currentUser.address.district);
        const isDhk = currentUser.address.district.toLowerCase().includes('ঢাকা') || currentUser.address.district.toLowerCase().includes('dhaka');
        setShippingZone(isDhk ? 'dhaka' : 'outside');
      }
    }
  }, [currentUser]);

  // Guest Account Creation States
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);

  // Gateway Configurations
  const insideFee = Number(settings.insideDhakaDeliveryFee ?? 60);
  const outsideFee = Number(settings.outsideDhakaDeliveryFee ?? 120);
  const freeThreshold = Number(settings.freeDeliveryThreshold ?? 2500);

  const gateways: Record<string, PaymentGatewayItem> = {
    cod: {
      id: 'cod',
      name: 'Cash on Delivery',
      nameBn: 'ক্যাশ অন ডেলিভারি',
      enabled: paymentSettings?.cod?.enabled !== false,
      number: '',
      type: 'Personal',
      instructions: paymentSettings?.cod?.note || 'কাপড় হাতে পেয়ে দেখে মূল্য পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।',
      brandColor: '#18181b',
      accentBg: '#18181b'
    },
    bkash: {
      id: 'bkash',
      name: 'bKash',
      nameBn: 'বিকাশ',
      enabled: paymentSettings?.bkash?.enabled !== false,
      number: paymentSettings?.bkash?.number || '01700000000',
      type: paymentSettings?.bkash?.type || 'Personal',
      instructions: paymentSettings?.bkash?.instructions || 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে Send Money / Payment করুন এবং নিচে আপনার নম্বর ও TrxID দিন।',
      brandColor: '#E2136E',
      accentBg: '#E2136E'
    },
    nagad: {
      id: 'nagad',
      name: 'Nagad',
      nameBn: 'নগদ',
      enabled: paymentSettings?.nagad?.enabled !== false,
      number: paymentSettings?.nagad?.number || '01800000000',
      type: paymentSettings?.nagad?.type || 'Personal',
      instructions: paymentSettings?.nagad?.instructions || 'নগদ অ্যাপ অথবা *167# ডায়াল করে Send Money / Payment করুন এবং নিচে আপনার নম্বর ও TrxID দিন।',
      brandColor: '#F7941D',
      accentBg: '#F7941D'
    },
    rocket: {
      id: 'rocket',
      name: 'Rocket',
      nameBn: 'রকেট',
      enabled: Boolean(paymentSettings?.rocket?.enabled ?? true),
      number: paymentSettings?.rocket?.number || '01900000000',
      type: paymentSettings?.rocket?.type || 'Merchant',
      instructions: paymentSettings?.rocket?.instructions || 'রকেট অ্যাপ বা *322# ডায়াল করে মার্চেন্ট পেমেন্ট সম্পন্ন করুন এবং নিচে TrxID দিন।',
      brandColor: '#8C3494',
      accentBg: '#8C3494'
    },
    upay: {
      id: 'upay',
      name: 'Upay',
      nameBn: 'উপায়',
      enabled: Boolean(paymentSettings?.upay?.enabled ?? true),
      number: paymentSettings?.upay?.number || '01500000000',
      type: paymentSettings?.upay?.type || 'Personal',
      instructions: paymentSettings?.upay?.instructions || 'উপায় অ্যাপ বা ডায়াল কোড ব্যবহার করে সেন্ড মানি করুন এবং নিচে আপনার নম্বর ও TrxID লিখুন।',
      brandColor: '#005C8A',
      accentBg: '#005C8A'
    }
  };

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket' | 'upay'>('cod');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');

  // Submitting & Errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Mobile Order Summary modal toggle
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Financial calculations
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards)),
    0
  );
  const totalYards = checkoutItems.reduce((sum, item) => sum + item.yards, 0);

  const isFreeDelivery = subtotal >= freeThreshold;
  const deliveryFee = isFreeDelivery ? 0 : (shippingZone === 'dhaka' ? insideFee : (shippingZone === 'outside' ? outsideFee : 0));
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discount || 0) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Handle empty checkout
  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">চেকআউট করার মতো কোনো কাপড় নেই</h2>
        <p className="text-xs text-neutral-500">আপনার কার্ট খালি রয়েছে। অনুগ্রহ করে শপ থেকে কাপড় বেছে নিন।</p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
        >
          কাপড় দেখতে যান
        </button>
      </div>
    );
  }

  const handleCopyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = num;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedNumber(num);
    showToast(`নম্বর (${num}) কপি হয়েছে!`, 'success');
    setTimeout(() => {
      setCopiedNumber((prev) => (prev === num ? null : prev));
    }, 2500);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput.trim().toUpperCase(), subtotal);
    if (!success) {
      showToast('কুপন কোডটি সঠিক নয় অথবা শর্ত পূরণ করেনি।', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    setCouponInput('');
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!shippingZone) {
      errs.shippingZone = 'অনুগ্রহ করে ডেলিভারি লোকেশন (Inside Dhaka বা Outside Dhaka) নির্বাচন করুন।';
    }

    if (!fullName.trim()) {
      errs.fullName = 'আপনার পুরো নাম লিখুন';
    }

    const normalizedCustomerPhone = StorageService.normalizePhone(phone.trim());
    if (!normalizedCustomerPhone || !/^01[3-9]\d{8}$/.test(normalizedCustomerPhone)) {
      errs.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01711223344)';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'সঠিক ইমেইল ঠিকানা দিন (যেমন: name@example.com)';
    }

    if (!fullAddress.trim() || fullAddress.trim().length < 8) {
      errs.fullAddress = 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন (বাড়ি/রোড/এলাকা)';
    }

    // Check account creation requirements (Email is primary login credential)
    if (!currentUser && createAccount) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        errs.email = 'অ্যাকাউন্ট খোলার জন্য সঠিক ইমেইল ঠিকানা দিন (যেমন: name@example.com)।';
      }
      if (!accountPassword || accountPassword.length < 6) {
        errs.accountPassword = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
      }
      if (accountPassword !== accountConfirmPassword) {
        errs.accountConfirmPassword = 'পাসওয়ার্ড দুটি মেলেনি!';
      }
    }

    // Stock check
    for (const item of checkoutItems) {
      if (item.product.stockYards <= 0) {
        errs.stock = `দুঃখিত, "${item.product.name}" বর্তমানে স্টক শেষ!`;
        break;
      }
    }

    // MFS validation
    if (paymentMethod !== 'cod') {
      const normalizedSender = StorageService.normalizePhone(senderPhone.trim());
      if (!senderPhone.trim()) {
        errs.senderPhone = 'যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি লিখুন';
      } else if (!/^01[3-9]\d{8}$/.test(normalizedSender)) {
        errs.senderPhone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)';
      }

      const cleanTrx = trxId.trim().toUpperCase();
      if (!cleanTrx) {
        errs.trxId = 'ট্রানজেকশন আইডি (TrxID) লিখুন';
      } else if (!/^[A-Z0-9]{4,24}$/.test(cleanTrx)) {
        errs.trxId = 'সঠিক ট্রানজেকশন আইডি (TrxID) দিন (যেমন: BKH9824X7Q)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      if (!shippingZone) {
        showToast('অনুগ্রহ করে ডেলিভারি লোকেশন বেছে নিন (Inside Dhaka / Outside Dhaka)', 'error');
      } else if (errors.stock) {
        showToast(errors.stock, 'error');
      } else if (errors.senderPhone || errors.trxId) {
        showToast('পেমেন্টের প্রেরক নম্বর এবং ট্রানজেকশন আইডি (TrxID) সঠিকভাবে প্রদান করুন', 'error');
      } else {
        showToast('অনুগ্রহ করে প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন', 'error');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. If guest requested account creation, register the user first (Email-first, Zero-SMS)
      if (!currentUser && createAccount) {
        try {
          const cleanEmail = email.trim().toLowerCase();
          const regRes = await registerUser(
            fullName.trim(),
            cleanEmail,
            accountPassword,
            phone.trim()
          );
          if (regRes.success) {
            showToast('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!', 'success');
          } else {
            showToast(
              regRes.message || 'অ্যাকাউন্ট তৈরি করা সম্ভব হয়নি, তবে অর্ডার সম্পন্ন করা হচ্ছে।',
              'info'
            );
          }
        } catch {
          // Continue with order even if account registration had a minor conflict (e.g. email already exists)
        }
      }

      // 2. Format items for Order entity (preserving custom measurements & Gaj details)
      const orderItems = checkoutItems.map(item => {
        const itemFinalPrice = item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards);
        return {
          productId: item.productId,
          productName: item.product.name,
          fabricWidth: item.selectedWidth,
          color: item.selectedColor,
          yards: item.yards,
          pricePerYard: item.pricePerYard,
          subtotal: itemFinalPrice,
          patternType: item.product.patternType,
          isCustomized: item.isCustomized,
          sizeMode: item.sizeMode || 'standard',
          standardGaj: item.standardGaj,
          customGaj: item.customGaj ?? item.yards,
          additionalGaj: item.additionalGaj,
          customMeasurements: item.customMeasurements,
          finalProductPrice: itemFinalPrice,
          outfitCategory: item.outfitCategory,
          outfitId: item.outfitId,
          outfitImage: item.outfitImage,
          specialInstructions: item.specialInstructions || item.customizationNotes,
          selectedAddons: item.selectedAddons
        };
      });

      const isManualMfs = paymentMethod !== 'cod';
      const activeGateway = gateways[paymentMethod] || gateways.bkash;

      const paymentDetailsPayload = isManualMfs
        ? {
            receiverNumber: activeGateway.number,
            senderNumber: StorageService.normalizePhone(senderPhone.trim()),
            trxId: trxId.trim().toUpperCase(),
            accountType: activeGateway.type
          }
        : undefined;

      const resolvedDistrict = shippingZone === 'dhaka' ? 'ঢাকা' : (district.trim() || 'অন্যান্য জেলা');

      const createdOrder = await orderService.createOrderAsync({
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          altPhone: altPhone.trim() || undefined,
          email: email.trim() || undefined,
          district: resolvedDistrict,
          upazila: upazila.trim() || '',
          area: area.trim() || '',
          fullAddress: fullAddress.trim(),
          deliveryNotes: deliveryNotes.trim() || undefined
        },
        items: orderItems,
        subtotal,
        deliveryCharge: deliveryFee,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        grandTotal,
        paymentMethod: paymentMethod as PaymentMethod,
        ...(paymentDetailsPayload ? { paymentDetails: paymentDetailsPayload } : {}),
        paymentStatus: isManualMfs ? 'pending_verification' : 'unpaid',
        orderStatus: 'Pending'
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      // Clean up cart or buyNow
      if (isDirectBuy) {
        clearBuyNow();
      } else {
        clearCart();
      }
      clearCoupon(true);

      setLastCompletedOrder(createdOrder);
      productService.syncFromBackend().then(() => refreshData()).catch(() => {});
      showToast(`অর্ডার সফল হয়েছে! অর্ডার আইডি: ${createdOrder.orderNumber}`, 'success');
      navigateTo('order-confirmation');

    } catch (err) {
      showToast(err instanceof Error ? err.message : 'অর্ডার সম্পন্ন করা যায়নি।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGateway = gateways[paymentMethod] || gateways.bkash;

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Top Checkout Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Checkout
            </h1>
            <p className="text-xs text-neutral-500 font-normal">
              Review and complete your order safely
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <OrangeBackButton
              onClick={() => {
                if (isDirectBuy) clearBuyNow();
                navigateTo(isDirectBuy ? 'shop' : 'cart');
              }}
              label={isDirectBuy ? 'কেনাকাটায় ফিরে যান' : 'ব্যাগে ফিরে যান'}
            />
            {isDirectBuy && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                সরাসরি কেনাকাটা (Buy Now)
              </span>
            )}
          </div>
        </div>

        {/* Mobile Order Summary Trigger Card */}
        <div className="lg:hidden">
          <button 
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full flex items-center justify-between p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs hover:bg-neutral-50/80 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 font-semibold text-xs">
                {checkoutItems.length}
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                  Order Summary
                </span>
                <span className="text-xs font-medium text-neutral-700">
                  {checkoutItems.length} item{checkoutItems.length > 1 ? 's' : ''} ({totalYards.toFixed(1)} গজ) • Tap to view details
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-900 font-semibold text-sm">
              <span>৳{grandTotal.toLocaleString()}</span>
              <ChevronDown size={16} className={`text-neutral-400 transition-transform ${showMobileSummary ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Main Checkout Form Column (Col 7) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Guest Sign-In Banner */}
            {!currentUser && (
              <div className="bg-gradient-to-r from-blue-50/90 via-white to-amber-50/60 border border-blue-200/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-neutral-900">
                      Sign in to your Fashion Doniya Account
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Access saved addresses, auto-track fulfillment, and earn reward perks.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/login?redirect=/checkout')}
                    className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/register?redirect=/checkout')}
                    className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-xs font-semibold hover:bg-neutral-50 transition-all active:scale-95 cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}

            {/* Form Container */}
            <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-6">

              {/* ========================================================= */}
              {/* STEP 1: Shipping Details Card                             */}
              {/* ========================================================= */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm sm:text-base font-semibold text-neutral-900 tracking-tight">
                    Shipping Details
                  </h2>
                </div>

                {/* Apple Segmented Delivery Location Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Delivery Location <span className="text-rose-500">*</span>
                    </label>
                    {isFreeDelivery ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                        Free Shipping Applied
                      </span>
                    ) : !shippingZone ? (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 animate-pulse">
                        Manual selection required
                      </span>
                    ) : null}
                  </div>

                  <div className={`p-1.5 rounded-2xl grid grid-cols-2 gap-2 transition-all duration-200 ${
                    !shippingZone 
                      ? 'bg-neutral-100 border border-amber-300 shadow-2xs' 
                      : 'bg-neutral-100 border border-neutral-200/60'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setShippingZone('dhaka');
                        setDistrict('ঢাকা');
                        if (errors.shippingZone) setErrors((prev) => ({ ...prev, shippingZone: '' }));
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                        shippingZone === 'dhaka' 
                          ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-black/5' 
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                      }`}
                    >
                      <span>Inside Dhaka</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        shippingZone === 'dhaka' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 bg-neutral-200/70'
                      }`}>
                        {isFreeDelivery ? 'FREE' : `৳${insideFee}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShippingZone('outside');
                        if (district === 'ঢাকা') setDistrict('অন্যান্য জেলা');
                        if (errors.shippingZone) setErrors((prev) => ({ ...prev, shippingZone: '' }));
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                        shippingZone === 'outside' 
                          ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-black/5' 
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                      }`}
                    >
                      <span>Outside Dhaka</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        shippingZone === 'outside' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 bg-neutral-200/70'
                      }`}>
                        {isFreeDelivery ? 'FREE' : `৳${outsideFee}`}
                      </span>
                    </button>
                  </div>

                  {!shippingZone && (
                    <p className="mt-1.5 text-xs text-amber-700 font-medium flex items-center gap-1.5">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>Please select Inside Dhaka or Outside Dhaka for delivery calculation</span>
                    </p>
                  )}
                </div>

                {/* Shipping Details Fields */}
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' }));
                        }}
                        required
                        placeholder="আপনার পুরো নাম (e.g. Adnan Hasan)"
                        className={`w-full h-11 px-3.5 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 transition-all outline-none ${
                          errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
                        }`}
                      />
                      {errors.fullName && <span className="text-[11px] text-rose-500 mt-1 block">{errors.fullName}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors((p) => ({ ...p, phone: '' }));
                        }}
                        required
                        placeholder="+880 1XXXXXXXXX"
                        className={`w-full h-11 px-3.5 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 transition-all outline-none ${
                          errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
                        }`}
                      />
                      {errors.phone && <span className="text-[11px] text-rose-500 mt-1 block">{errors.phone}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#6B0812]" />
                        ইমেইল ঠিকানা {createAccount ? <span className="text-rose-500">*</span> : <span className="text-neutral-400 text-[11px] font-normal">(ঐচ্ছিক - ইনভয়েস ও ট্র্যাকিং)</span>}
                      </span>
                      {createAccount && (
                        <span className="text-[10px] text-[#6B0812] font-bold bg-[#FAF4EC] px-2 py-0.5 rounded-full border border-[#E2D0B8]">
                          লগইন ও পাসওয়ার্ড রিকভারির প্রধান আইডি
                        </span>
                      )}
                    </label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                      }}
                      required={createAccount}
                      placeholder="name@example.com"
                      className={`w-full h-11 px-3.5 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 transition-all outline-none ${
                        errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
                      }`}
                    />
                    {errors.email && <span className="text-[11px] text-rose-500 mt-1 block">{errors.email}</span>}
                    {createAccount && (
                      <p className="text-[11px] text-[#5C3A38] mt-1 flex items-center gap-1 font-medium">
                        <Mail className="w-3.5 h-3.5 text-[#6B0812] shrink-0" />
                        এই ইমেইলে বিনামূল্যে অ্যাকাউন্ট নিশ্চিতকরণ ও পাসওয়ার্ড রিসেট কোড যাবে (কোনো SMS চার্জ নেই)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                      Full Delivery Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea 
                      value={fullAddress}
                      onChange={(e) => {
                        setFullAddress(e.target.value);
                        if (errors.fullAddress) setErrors((p) => ({ ...p, fullAddress: '' }));
                      }}
                      required
                      rows={3}
                      placeholder="বাড়ি নম্বর, ফ্ল্যাট/তলা, রোড নম্বর বা চেনার মতো ল্যান্ডমার্ক..."
                      className={`w-full p-3.5 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 transition-all outline-none resize-none leading-relaxed ${
                        errors.fullAddress ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
                      }`}
                    />
                    {errors.fullAddress && <span className="text-[11px] text-rose-500 mt-1 block">{errors.fullAddress}</span>}
                  </div>

                  {/* Optional District, Upazila & Delivery Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        থানা / উপজেলা (ঐচ্ছিক)
                      </label>
                      <input 
                        type="text"
                        value={upazila}
                        onChange={(e) => setUpazila(e.target.value)}
                        placeholder="যেমন: ধানমন্ডি, মিরপুর, পাঁচলাইশ"
                        className="w-full h-10 px-3.5 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 rounded-xl text-xs text-neutral-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        ডেলিভারি নির্দেশনা বা বিশেষ নোট (ঐচ্ছিক)
                      </label>
                      <input 
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="যেমন: কল দিয়ে আসুন"
                        className="w-full h-10 px-3.5 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white border border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 rounded-xl text-xs text-neutral-900 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Guest Account Creation Card (Email-First, Zero-SMS) */}
                  {!currentUser && (
                    <div className={`mt-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
                      createAccount 
                        ? 'bg-[#FAF8F5] border-[#E2D0B8] p-4 sm:p-5 shadow-xs' 
                        : 'bg-neutral-50/50 hover:bg-[#FAF8F5]/80 border-neutral-200/90 p-4'
                    }`}>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={createAccount}
                          onChange={(e) => setCreateAccount(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-[#6B0812] focus:ring-[#6B0812] cursor-pointer accent-[#6B0812]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[#241614] flex items-center gap-1.5">
                              <UserPlus size={15} className="text-[#6B0812]" />
                              এই তথ্য দিয়ে একটি স্থায়ী কাস্টমার অ্যাকাউন্ট তৈরি করবেন?
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6B0812] text-white tracking-wide">
                              সুপারিশকৃত
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-[#5C433E] mt-1 leading-relaxed">
                            শুধুমাত্র একটি পাসওয়ার্ড সেট করলেই অর্ডার ট্র্যাকিং, অতীতের অর্ডারের তালিকা এবং পরবর্তীতে দ্রুত চেকআউট সুবিধা পাওয়া যাবে। কোনো SMS ঝামেলা ছাড়া সরাসরি ইমেইলে নিরাপদ।
                          </p>
                        </div>
                      </label>

                      {createAccount && (
                        <div className="mt-4 pt-4 border-t border-[#E8DCCB] space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Email Credential Summary Box */}
                          <div className="p-3 bg-white border border-[#E2D0B8] rounded-xl text-xs flex items-start gap-2.5 shadow-2xs">
                            <Mail className="w-4 h-4 text-[#6B0812] shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[#241614] flex flex-wrap items-center gap-1.5">
                                <span>লগইন আইডি (ইমেইল):</span>
                                <span className={`font-semibold ${email.trim() ? 'text-[#6B0812] underline' : 'text-rose-600'}`}>
                                  {email.trim() || 'অনুগ্রহ করে উপরের ফিল্ডে আপনার ইমেইল ঠিকানা লিখুন'}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#7A635B] mt-0.5">
                                পাসওয়ার্ড ভুলে গেলে এই ইমেইল ঠিকানায় ফ্রি ৬ সংখ্যার ভেরিফিকেশন OTP কোড পাঠানো হবে।
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-xs font-semibold text-[#241614] mb-1">
                                পাসওয়ার্ড তৈরি করুন <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showAccountPassword ? "text" : "password"}
                                  value={accountPassword}
                                  onChange={(e) => {
                                    setAccountPassword(e.target.value);
                                    if (errors.accountPassword) setErrors((p) => ({ ...p, accountPassword: '' }));
                                  }}
                                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                                  className="w-full h-10 px-3 pr-9 bg-white border border-[#E2D0B8] focus:border-[#6B0812] focus:ring-2 focus:ring-[#6B0812]/10 rounded-xl text-xs text-neutral-900 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowAccountPassword(!showAccountPassword)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#6B0812] cursor-pointer"
                                  aria-label={showAccountPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                                >
                                  {showAccountPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                              {errors.accountPassword && (
                                <span className="text-[11px] text-rose-500 mt-1 block">{errors.accountPassword}</span>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#241614] mb-1">
                                পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type={showAccountPassword ? "text" : "password"}
                                value={accountConfirmPassword}
                                onChange={(e) => {
                                  setAccountConfirmPassword(e.target.value);
                                  if (errors.accountConfirmPassword) setErrors((p) => ({ ...p, accountConfirmPassword: '' }));
                                }}
                                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                                className="w-full h-10 px-3 bg-white border border-[#E2D0B8] focus:border-[#6B0812] focus:ring-2 focus:ring-[#6B0812]/10 rounded-xl text-xs text-neutral-900 outline-none"
                              />
                              {errors.accountConfirmPassword && (
                                <span className="text-[11px] text-rose-500 mt-1 block">{errors.accountConfirmPassword}</span>
                              )}
                            </div>
                          </div>

                          {/* Password Match Indicator */}
                          <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-neutral-500">
                              {accountPassword.length === 0
                                ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"
                                : accountPassword.length < 6 
                                  ? "খুব ছোট (কমপক্ষে ৬ অক্ষর আবশ্যক)" 
                                  : accountConfirmPassword && accountPassword !== accountConfirmPassword
                                    ? <span className="text-rose-500 font-medium">পাসওয়ার্ড দুটি মেলেনি</span>
                                    : accountConfirmPassword && accountPassword === accountConfirmPassword
                                      ? <span className="text-emerald-600 font-medium flex items-center gap-1"><Check size={11} /> উভয় পাসওয়ার্ড মিলেছে</span>
                                      : "৬+ অক্ষর দেওয়া হয়েছে"}
                            </span>
                            {accountPassword.length >= 6 && (
                              <span className={`font-semibold ${accountPassword.length >= 8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {accountPassword.length >= 10 ? 'শক্তিশালী পাসওয়ার্ড' : accountPassword.length >= 8 ? 'ভালো পাসওয়ার্ড' : 'চলনসই পাসওয়ার্ড'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* ========================================================= */}
              {/* STEP 2: Payment Method Card                               */}
              {/* ========================================================= */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm sm:text-base font-semibold text-neutral-900 tracking-tight">
                    Payment Method
                  </h2>
                </div>

                {/* Gateway Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
                  {Object.values(gateways)
                    .filter((gw) => gw.enabled)
                    .map((gw) => {
                      const isSelected = paymentMethod === gw.id;
                      return (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(gw.id);
                            setErrors((p) => {
                              const next = { ...p };
                              delete next.senderPhone;
                              delete next.trxId;
                              return next;
                            });
                          }}
                          className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group ${
                            isSelected
                              ? 'border-neutral-900 shadow-xs'
                              : 'border-neutral-200/90 bg-white hover:bg-neutral-50/80 hover:border-neutral-300 text-neutral-800'
                          }`}
                          style={
                            isSelected
                              ? gw.id === 'cod'
                                ? { backgroundColor: '#18181b', color: '#ffffff' }
                                : { backgroundColor: gw.brandColor, color: '#ffffff' }
                              : undefined
                          }
                        >
                          {gw.id === 'cod' ? (
                            <Banknote size={20} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                          ) : (
                            <CreditCard 
                              size={20} 
                              className={isSelected ? 'text-white' : undefined} 
                              style={!isSelected ? { color: gw.brandColor } : undefined} 
                            />
                          )}
                          <span className="text-xs font-semibold leading-tight">{gw.name}</span>
                          {gw.type && gw.id !== 'cod' && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                              {gw.type}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                </div>

                {/* Cash on Delivery Details Notice */}
                {paymentMethod === 'cod' && (
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600 flex items-start gap-3">
                    <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-neutral-900 block mb-0.5">
                        ক্যাশ অন ডেলিভারি (Cash on Delivery)
                      </span>
                      <span>
                        {paymentSettings?.cod?.note || 'কাপড় হাতে পেয়ে দেখে মূল্য পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Mobile Banking Instructions and Input Box */}
                {paymentMethod !== 'cod' && (
                  <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                            Send Money / {activeGateway.type} Number
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">
                            {activeGateway.type}
                          </span>
                        </div>
                        <span className="text-sm sm:text-base font-bold text-neutral-900 font-mono mt-0.5 block select-all">
                          {activeGateway.number || '01XXXXXXXXX'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(activeGateway.number)}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        {copiedNumber === activeGateway.number ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-neutral-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-neutral-200/60 space-y-1">
                      <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                        <span className="font-semibold text-neutral-800">মোট প্রদেয় টাকা:</span>
                        <span className="font-bold text-neutral-900 font-mono text-sm">৳{grandTotal.toLocaleString()}</span>
                      </div>
                      <p className="pt-1">
                        {activeGateway.instructions || `দয়া করে মোট ৳${grandTotal.toLocaleString()} টাকা উপরের নম্বরে পরিশোধ করে নিচে প্রেরক নম্বর ও TrxID দিন।`}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          আপনার {activeGateway.name} নম্বর <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="tel"
                          value={senderPhone}
                          onChange={(e) => {
                            setSenderPhone(e.target.value);
                            if (errors.senderPhone) setErrors((p) => ({ ...p, senderPhone: '' }));
                          }}
                          placeholder="01XXXXXXXXX"
                          className={`w-full h-10 px-3 bg-white border rounded-xl text-xs text-neutral-900 outline-none ${
                            errors.senderPhone ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
                          }`}
                        />
                        {errors.senderPhone && (
                          <span className="text-[11px] text-rose-500 mt-1 block">{errors.senderPhone}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Transaction ID (TrxID) <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text"
                          value={trxId}
                          onChange={(e) => {
                            setTrxId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                            if (errors.trxId) setErrors((p) => ({ ...p, trxId: '' }));
                          }}
                          placeholder="e.g. 9J28DA10K"
                          className={`w-full h-10 px-3 bg-white border rounded-xl text-xs text-neutral-900 uppercase font-mono outline-none ${
                            errors.trxId ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200/90 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
                          }`}
                        />
                        {errors.trxId && (
                          <span className="text-[11px] text-rose-500 mt-1 block">{errors.trxId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </form>
          </div>

          {/* Right Column: Order Summary Card (Col 5) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs">
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm sm:text-base font-semibold text-neutral-900 tracking-tight">
                  Order Summary
                </h2>
                <span className="text-xs text-neutral-500">
                  {checkoutItems.length} {checkoutItems.length > 1 ? 'items' : 'item'}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1 no-scrollbar mb-4">
                {checkoutItems.map((item) => {
                  const itemTotal = item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards);
                  const fabricImg = getUniqueProductFabricImage(item.product);
                  const measurementSummary = formatMeasurementsSummary(item.customMeasurements);

                  return (
                    <div key={item.id} className="py-3 flex items-start gap-3 first:pt-0">
                      <div className="w-13 h-13 rounded-xl bg-neutral-100 border border-neutral-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                        {fabricImg ? (
                          <img src={fabricImg} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <FabricPatternVisual
                            productId={item.productId}
                            patternType={item.product.patternType}
                            colorHex={item.product.colorHex}
                            fabricWidth={item.selectedWidth}
                            aspectRatio="square"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 truncate leading-snug">
                          {item.product.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[11px] text-neutral-500">
                            {item.selectedWidth} হাত বহর • {item.yards} গজ
                          </span>
                          {item.outfitCategory && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-800">
                              {item.outfitCategory}
                            </span>
                          )}
                        </div>
                        {item.isCustomized ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1">
                            <Scissors className="w-2.5 h-2.5" />
                            কাস্টম মাপ ({measurementSummary ? measurementSummary.slice(0, 24) + '...' : 'নিজের মাপে'})
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs font-bold text-neutral-900 shrink-0 tabular-nums">
                        ৳{itemTotal.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-3 pb-4 border-t border-neutral-100">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>কুপন {appliedCoupon.code} (-৳{Number(appliedCoupon.discount || 0).toLocaleString()})</span>
                    </div>
                    <button 
                      type="button"
                      onClick={handleRemoveCoupon} 
                      className="p-1 text-emerald-700 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="কুপন কোড (যেমন: DONIYA10)"
                        className="flex-1 h-9 px-3 bg-neutral-50 border border-neutral-200/90 focus:border-neutral-900 rounded-xl text-xs font-medium uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponInput.trim()}
                        className="h-9 px-4 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Ticket size={13} />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="py-3 border-t border-neutral-100 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>মোট গজ</span>
                  <span className="font-medium text-neutral-800">{totalYards.toFixed(1)} গজ</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>কাপড়ের সাবটোটাল</span>
                  <span className="font-medium text-neutral-800">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>
                    ডেলিভারি চার্জ {shippingZone ? (shippingZone === 'dhaka' ? '(Inside Dhaka)' : '(Outside Dhaka)') : ''}
                  </span>
                  <span className={`font-medium ${!shippingZone && !isFreeDelivery ? 'text-amber-600 font-semibold' : 'text-neutral-800'}`}>
                    {isFreeDelivery ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : shippingZone ? (
                      `৳${deliveryFee.toLocaleString()}`
                    ) : (
                      'Select location'
                    )}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>কুপন ছাড়</span>
                    <span>-৳{Number(appliedCoupon.discount || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-200/80 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-neutral-900">Total</span>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
                      ৳{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {Object.keys(errors).length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-start gap-2 mb-3">
                  <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">অনুগ্রহ করে নিচের ত্রুটিগুলো ঠিক করুন:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {Object.values(errors).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Submit CTA Button */}
              <button 
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full h-12 bg-neutral-900 hover:bg-black text-white rounded-full text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order • ৳{grandTotal.toLocaleString()}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 mt-3">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Encrypted & secure checkout</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
