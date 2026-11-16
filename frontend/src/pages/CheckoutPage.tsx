import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { OrangeBackButton } from '../components/common/OrangeBackButton';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { settingsService, formatAccountTypeBadge, formatAccountActionLabelBn } from '../services/settingsService';
import { StorageService } from '../services/storageService';
import { FabricPatternVisual } from '../components/common/FabricPatternVisual';
import { getUniqueProductFabricImage } from '../components/home/allProductsImageGenerator';
import { formatMeasurementsSummary } from '../services/measurementService';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Scissors,
  Copy,
  Check,
  Smartphone
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
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
    currentUser 
  } = useStore();

  // Dynamic payment settings from Admin config
  const paymentSettings = settings.paymentSettings;

  // Determine items to checkout (Buy Now takes priority if active)
  const isDirectBuy = !!buyNowItem;
  const checkoutItems = isDirectBuy ? [buyNowItem] : cart;

  // Customer Form Fields
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [district, setDistrict] = useState('ঢাকা');
  const [upazila, setUpazila] = useState('');
  const [area, setArea] = useState('');
  const [fullAddress, setFullAddress] = useState(currentUser?.address?.fullAddress || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Dynamic active payment selection ("cod" | "bkash" | "nagad")
  const getInitialPaymentMethod = (): 'cod' | 'bkash' | 'nagad' => {
    if (paymentSettings?.cod?.enabled !== false) return 'cod';
    if (paymentSettings?.bkash?.enabled) return 'bkash';
    if (paymentSettings?.nagad?.enabled) return 'nagad';
    return 'cod';
  };

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>(getInitialPaymentMethod);

  // Manual MFS Payment Fields (bKash / Nagad)
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedMethod, setCopiedMethod] = useState<'bkash' | 'nagad' | null>(null);

  // Ensure selected paymentMethod stays valid if Admin disables a method
  useEffect(() => {
    if (paymentMethod === 'cod' && !paymentSettings?.cod?.enabled) {
      if (paymentSettings?.bkash?.enabled) setPaymentMethod('bkash');
      else if (paymentSettings?.nagad?.enabled) setPaymentMethod('nagad');
    } else if (paymentMethod === 'bkash' && !paymentSettings?.bkash?.enabled) {
      if (paymentSettings?.cod?.enabled) setPaymentMethod('cod');
      else if (paymentSettings?.nagad?.enabled) setPaymentMethod('nagad');
    } else if (paymentMethod === 'nagad' && !paymentSettings?.nagad?.enabled) {
      if (paymentSettings?.cod?.enabled) setPaymentMethod('cod');
      else if (paymentSettings?.bkash?.enabled) setPaymentMethod('bkash');
    }
  }, [paymentSettings, paymentMethod]);

  // Coupon state
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');

  // Form error state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards)),
    0
  );
  const totalYards = checkoutItems.reduce((sum, item) => sum + item.yards, 0);

  const isDhaka = district.trim().toLowerCase().includes('ঢাকা') || district.trim().toLowerCase().includes('dhaka');
  const deliveryFee = Number(
    (isDhaka ? settings?.insideDhakaDeliveryFee : settings?.outsideDhakaDeliveryFee) ??
      (isDhaka ? 80 : 150)
  );
  const isFreeDelivery = subtotal >= Number(settings?.freeDeliveryThreshold ?? 2500);
  const effectiveDeliveryFee = isFreeDelivery ? 0 : deliveryFee;

  const discountAmount = appliedCoupon ? Number(appliedCoupon.discount || 0) : 0;
  const grandTotal = Math.max(0, subtotal + effectiveDeliveryFee - discountAmount);

  // Redirect if cart and buynow are both empty
  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#242424]">চেকআউট করার মতো কোনো কাপড় নেই</h2>
        <p className="text-xs text-[#242424]/60">অনুগ্রহ করে শপ থেকে কাপড় বেছে নিন।</p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 bg-[#242424] text-white text-xs font-semibold rounded-md"
        >
          কাপড় দেখতে যান
        </button>
      </div>
    );
  }

  const handleCopyNumber = async (num: string, method: 'bkash' | 'nagad') => {
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
    setCopiedMethod(method);
    showToast(`${method === 'bkash' ? 'বিকাশ' : 'নগদ'} নম্বর (${num}) কপি হয়েছে!`, 'success');
    setTimeout(() => {
      setCopiedMethod((prev) => (prev === method ? null : prev));
    }, 2200);
  };

  const handleSelectPaymentMethod = (method: 'cod' | 'bkash' | 'nagad') => {
    setPaymentMethod(method);
    // Clear manual payment field errors when switching methods
    setErrors((prev) => {
      const next = { ...prev };
      delete next.senderNumber;
      delete next.trxId;
      return next;
    });
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    applyCoupon(couponCode, subtotal);
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'আপনার পুরো নাম লিখুন';
    const normalizedCustomerPhone = StorageService.normalizePhone(phone.trim());
    if (!normalizedCustomerPhone || !/^01[3-9]\d{8}$/.test(normalizedCustomerPhone)) {
      errs.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01711223344)';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'সঠিক ইমেইল ঠিকানা দিন (যেমন: name@example.com)';
    }
    if (!district.trim()) errs.district = 'জেলার নাম নির্বাচন করুন';
    if (!fullAddress.trim() || fullAddress.trim().length < 8) {
      errs.fullAddress = 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন (বাড়ি/রোড/এলাকা)';
    }

    for (const item of checkoutItems) {
      if (item.product.stockYards <= 0) {
        errs.stock = `দুঃখিত, "${item.product.name}" বর্তমানে স্টক শেষ!`;
        break;
      }
    }

    // Strict validation when bKash or Nagad is selected
    if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
      const normalizedSender = StorageService.normalizePhone(senderNumber.trim());
      if (!senderNumber.trim()) {
        errs.senderNumber = 'যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি লিখুন';
      } else if (!/^01[3-9]\d{8}$/.test(normalizedSender)) {
        errs.senderNumber = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)';
      }

      const cleanTrx = trxId.trim().toUpperCase();
      if (!cleanTrx) {
        errs.trxId = 'ট্রানজেকশন আইডি (TrxID) লিখুন';
      } else if (!/^[A-Z0-9]{4,24}$/.test(cleanTrx)) {
        errs.trxId = 'সঠিক আলফানিউমেরিক ট্রানজেকশন আইডি (TrxID) দিন (যেমন: BKH9824X7Q)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      for (const item of checkoutItems) {
        if (item.product.stockYards <= 0) {
          showToast(`দুঃখিত, "${item.product.name}" বর্তমানে স্টক শেষ!`, 'error');
          return;
        }
      }
      if (
        (paymentMethod === 'bkash' || paymentMethod === 'nagad') &&
        (!senderNumber.trim() || !trxId.trim())
      ) {
        showToast(
          `${paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} পেমেন্টের প্রেরক নম্বর এবং ট্রানজেকশন আইডি (TrxID) প্রদান করুন`,
          'error'
        );
      } else {
        showToast('অনুগ্রহ করে প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন', 'error');
      }
      return;
    }

    setIsSubmitting(true);

    // Format items for Order entity (preserving custom measurements & Gaj details)
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

    const isManualMfs = paymentMethod === 'bkash' || paymentMethod === 'nagad';
    const activeMfsConfig =
      paymentMethod === 'bkash' ? paymentSettings.bkash : paymentSettings.nagad;

    const paymentDetailsPayload = isManualMfs
      ? {
          receiverNumber: activeMfsConfig.number,
          senderNumber: StorageService.normalizePhone(senderNumber.trim()),
          trxId: trxId.trim().toUpperCase(),
          accountType: activeMfsConfig.type
        }
      : undefined;

    try {
      const createdOrder = await orderService.createOrderAsync({
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          altPhone: altPhone.trim() || undefined,
          email: email.trim() || undefined,
          district: district.trim(),
          upazila: upazila.trim(),
          area: area.trim(),
          fullAddress: fullAddress.trim(),
          deliveryNotes: deliveryNotes.trim() || undefined
        },
        items: orderItems,
        subtotal,
        deliveryCharge: effectiveDeliveryFee,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        grandTotal,
        paymentMethod,
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
      showToast(`অর্ডার সফল হয়েছে! অর্ডার আইডি: ${createdOrder.orderNumber}`, 'success');
      navigateTo('order-confirmation');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'অর্ডার সম্পন্ন করা যায়নি।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic footer summary label based on selected payment method
  const orderSummaryPaymentFooterText =
    paymentMethod === 'bkash'
      ? 'বিকাশে প্রদেয়'
      : paymentMethod === 'nagad'
      ? 'নগদে প্রদেয়'
      : 'ক্যাশ অন ডেলিভারিতে';

  const activeMfsMethod =
    paymentMethod === 'bkash'
      ? {
          key: 'bkash' as const,
          brandNameBn: 'বিকাশ',
          brandNameEn: 'bKash',
          config: paymentSettings.bkash,
          borderClass: 'border-[#E2136E]',
          bgClass: 'bg-[#FDF2F7]',
          headerBgClass: 'bg-[#E2136E]',
          badgeBgClass: 'bg-[#E2136E]/12 text-[#C20E5C] border-[#E2136E]/30',
          accentTextClass: 'text-[#E2136E]',
          copyBtnClass: 'bg-[#E2136E] hover:bg-[#C20E5C] text-white',
          focusBorderClass: 'focus:border-[#E2136E]'
        }
      : paymentMethod === 'nagad'
      ? {
          key: 'nagad' as const,
          brandNameBn: 'নগদ',
          brandNameEn: 'Nagad',
          config: paymentSettings.nagad,
          borderClass: 'border-[#F16522]',
          bgClass: 'bg-[#FFF6F0]',
          headerBgClass: 'bg-linear-to-r from-[#EC1C24] to-[#F7941D]',
          badgeBgClass: 'bg-[#F16522]/12 text-[#D44D0E] border-[#F16522]/30',
          accentTextClass: 'text-[#F16522]',
          copyBtnClass: 'bg-[#F16522] hover:bg-[#D44D0E] text-white',
          focusBorderClass: 'focus:border-[#F16522]'
        }
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Breadcrumb back */}
      <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-4">
        <OrangeBackButton
          onClick={() => {
            if (isDirectBuy) clearBuyNow();
            navigateTo(isDirectBuy ? 'shop' : 'cart');
          }}
          label={isDirectBuy ? 'কেনাকাটায় ফিরে যান' : 'ব্যাগে ফিরে যান'}
        />

        {isDirectBuy && (
          <span className="px-2.5 py-1 bg-[#C5A46D]/15 text-[#C5A46D] text-xs font-bold rounded-sm">
            সরাসরি কেনাকাটা মোড (Buy Now Mode)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Customer Information & Payment Form (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-6">
            
            {/* 1. Customer Details */}
            <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C5A46D]" />
                <span>১. ডেলিভারির তথ্য ও ঠিকানা</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    পুরো নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার পুরো নাম লিখুন"
                    className={`w-full bg-[#FAF8F4] border rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-[#EDE5D9] focus:border-[#C5A46D]'
                    }`}
                  />
                  {errors.fullName && <span className="text-[11px] text-rose-500 mt-0.5 block">{errors.fullName}</span>}
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="১১ ডিজিট: 01711223344"
                    className={`w-full bg-[#FAF8F4] border rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden ${
                      errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-[#EDE5D9] focus:border-[#C5A46D]'
                    }`}
                  />
                  {errors.phone && <span className="text-[11px] text-rose-500 mt-0.5 block">{errors.phone}</span>}
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    বিকল্প মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="জরুরি প্রয়োজনে অন্য নম্বর"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    ইমেইল (ঐচ্ছিক — ইনভয়েস পেতে)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className={`w-full bg-[#FAF8F4] border rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden ${
                      errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-[#EDE5D9] focus:border-[#C5A46D]'
                    }`}
                  />
                  {errors.email && <span className="text-[11px] text-rose-500 mt-0.5 block">{errors.email}</span>}
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    জেলা <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                  >
                    <option value="ঢাকা">ঢাকা (ডেলিভারি {settings.insideDhakaDeliveryFee}৳)</option>
                    <option value="চট্টগ্রাম">চট্টগ্রাম (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="সিলেট">সিলেট (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="রাজশাহী">রাজশাহী (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="খুলনা">খুলনা (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="বরিশাল">বরিশাল (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="রংপুর">রংপুর (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="ময়মনসিংহ">ময়মনসিংহ (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="কুমিল্লা">কুমিল্লা (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="গাজীপুর">গাজীপুর (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="নারায়ণগঞ্জ">নারায়ণগঞ্জ (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                    <option value="অন্যান্য জেলা">অন্যান্য জেলা (ডেলিভারি {settings.outsideDhakaDeliveryFee}৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    থানা / উপজেলা
                  </label>
                  <input
                    type="text"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    placeholder="যেমন: ধানমন্ডি, মিরপুর, পাঁচলাইশ"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    এলাকা / পাড়া
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="যেমন: রোড #৪, সেক্টর #৭"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#242424] mb-1">
                    সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="বাড়ি নম্বর, ফ্ল্যাট/তলা, রোড নম্বর বা চেনার মতো ল্যান্ডমার্ক..."
                    className={`w-full bg-[#FAF8F4] border rounded-lg p-3 text-[#242424] focus:outline-hidden ${
                      errors.fullAddress ? 'border-rose-400 bg-rose-50/20' : 'border-[#EDE5D9] focus:border-[#C5A46D]'
                    }`}
                  />
                  {errors.fullAddress && <span className="text-[11px] text-rose-500 mt-0.5 block">{errors.fullAddress}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#242424] mb-1">
                    ডেলিভারি নির্দেশনা বা বিশেষ নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="যেমন: শুক্রবার ডেলিভারি দিলে ভালো হয়, কিংবা কল দিয়ে আসুন"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. Dynamic Payment Method Selection */}
            <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A46D]" />
                <span>২. পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
              </h2>

              <div className="space-y-3 text-xs">
                {/* Cash on Delivery (COD) */}
                {paymentSettings?.cod?.enabled !== false && (
                  <label
                    className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#C5A46D] bg-[#FAF8F4] ring-1 ring-[#C5A46D]'
                        : 'border-[#EDE5D9] bg-white hover:border-[#242424]/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => handleSelectPaymentMethod('cod')}
                      className="mt-0.5 accent-[#C5A46D]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-[#242424] text-sm">
                          ক্যাশ অন ডেলিভারি (Cash on Delivery)
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded">
                          পণ্য হাতে পেয়ে পেমেন্ট
                        </span>
                      </div>
                      <span className="text-[#242424]/65 text-xs block mt-1 leading-relaxed">
                        {paymentSettings?.cod?.note ||
                          'কাপড় হাতে পেয়ে দেখে মূল্য পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।'}
                      </span>
                    </div>
                  </label>
                )}

                {/* bKash Option */}
                {paymentSettings?.bkash?.enabled && (
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      paymentMethod === 'bkash'
                        ? 'border-[#E2136E] ring-1 ring-[#E2136E] bg-[#FDF2F7]/50'
                        : 'border-[#EDE5D9] bg-white hover:border-[#E2136E]/40'
                    }`}
                  >
                    <label className="p-4 flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="bkash"
                        checked={paymentMethod === 'bkash'}
                        onChange={() => handleSelectPaymentMethod('bkash')}
                        className="mt-1 accent-[#E2136E]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#E2136E] text-white font-extrabold text-[11px] tracking-wide">
                              bKash
                            </span>
                            <span className="font-bold text-[#242424] text-sm">
                              বিকাশ পেমেন্ট (bKash)
                            </span>
                          </div>
                          <span className="text-[10px] bg-[#E2136E]/10 text-[#C20E5C] border border-[#E2136E]/25 font-bold px-2 py-0.5 rounded">
                            {formatAccountTypeBadge(paymentSettings.bkash.type)}
                          </span>
                        </div>
                        <span className="text-[#242424]/65 text-xs block mt-1">
                          বিকাশ নম্বরে {formatAccountActionLabelBn(paymentSettings.bkash.type)} করে ট্রানজেকশন আইডি দিন।
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Nagad Option */}
                {paymentSettings?.nagad?.enabled && (
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      paymentMethod === 'nagad'
                        ? 'border-[#F16522] ring-1 ring-[#F16522] bg-[#FFF6F0]/60'
                        : 'border-[#EDE5D9] bg-white hover:border-[#F16522]/40'
                    }`}
                  >
                    <label className="p-4 flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="nagad"
                        checked={paymentMethod === 'nagad'}
                        onChange={() => handleSelectPaymentMethod('nagad')}
                        className="mt-1 accent-[#F16522]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-linear-to-r from-[#EC1C24] to-[#F7941D] text-white font-extrabold text-[11px] tracking-wide">
                              Nagad
                            </span>
                            <span className="font-bold text-[#242424] text-sm">
                              নগদ পেমেন্ট (Nagad)
                            </span>
                          </div>
                          <span className="text-[10px] bg-[#F16522]/10 text-[#D44D0E] border border-[#F16522]/25 font-bold px-2 py-0.5 rounded">
                            {formatAccountTypeBadge(paymentSettings.nagad.type)}
                          </span>
                        </div>
                        <span className="text-[#242424]/65 text-xs block mt-1">
                          নগদ নম্বরে {formatAccountActionLabelBn(paymentSettings.nagad.type)} করে ট্রানজেকশন আইডি দিন।
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Expanded Accordion / Box when bKash or Nagad is selected */}
              {activeMfsMethod && (
                <div
                  className={`rounded-xl border-2 ${activeMfsMethod.borderClass} ${activeMfsMethod.bgClass} overflow-hidden transition-all`}
                >
                  {/* Official Brand Header Bar */}
                  <div
                    className={`${activeMfsMethod.headerBgClass} px-4 py-3 text-white flex items-center justify-between gap-2 flex-wrap`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm">
                        {activeMfsMethod.brandNameBn} ({activeMfsMethod.brandNameEn}) ম্যানুয়াল পেমেন্ট নির্দেশনা
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-xs rounded text-[11px] font-bold tracking-wide">
                      {formatAccountTypeBadge(activeMfsMethod.config.type)}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Receiver Phone Number + 1-Click Copy Button + Account Type Badge */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#EDE5D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#242424]/70">
                            আমাদের {activeMfsMethod.brandNameBn} নম্বর:
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${activeMfsMethod.badgeBgClass}`}
                          >
                            {formatAccountTypeBadge(activeMfsMethod.config.type)}
                          </span>
                        </div>
                        <div className="text-lg sm:text-xl font-mono font-extrabold text-[#242424] tracking-wider select-all">
                          {activeMfsMethod.config.number}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyNumber(activeMfsMethod.config.number, activeMfsMethod.key)
                        }
                        className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${activeMfsMethod.copyBtnClass}`}
                      >
                        {copiedMethod === activeMfsMethod.key ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>নম্বর কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step-by-step Bangla Instructions with Highlighted Payable Amount */}
                    <div className="bg-white/90 p-3.5 rounded-xl border border-[#EDE5D9] space-y-2">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EDE5D9]">
                        <span className="font-bold text-[#242424]">
                          পরিশোধযোগ্য সর্বমোট টাকা:
                        </span>
                        <span
                          className={`text-base sm:text-lg font-extrabold tabular-nums px-2.5 py-0.5 rounded ${activeMfsMethod.badgeBgClass}`}
                        >
                          ৳{grandTotal}
                        </span>
                      </div>

                      <ol className="list-decimal list-inside space-y-1.5 text-[#242424]/85 leading-relaxed">
                        <li>
                          প্রথমে আপনার {activeMfsMethod.brandNameBn} অ্যাপ বা ডায়াল অপশনে গিয়ে উপরের{' '}
                          <strong className="font-mono text-[#242424]">
                            {activeMfsMethod.config.number}
                          </strong>{' '}
                          ({activeMfsMethod.config.type}) নম্বরে মোট{' '}
                          <strong className={activeMfsMethod.accentTextClass}>৳{grandTotal}</strong> টাকা{' '}
                          <strong>{formatAccountActionLabelBn(activeMfsMethod.config.type)}</strong> করুন।
                        </li>
                        <li>
                          টাকা পাঠানো সম্পন্ন হলে নিচের ঘরে{' '}
                          <strong>যে নম্বর থেকে টাকা পাঠিয়েছেন</strong> এবং{' '}
                          <strong>Transaction ID (TrxID)</strong> সঠিকভাবে লিখে অর্ডার নিশ্চিত করুন।
                        </li>
                      </ol>

                      {activeMfsMethod.config.instructions && (
                        <div className="pt-1.5 text-[11px] text-[#242424]/75 border-t border-dashed border-[#EDE5D9] flex items-start gap-1.5">
                          <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${activeMfsMethod.accentTextClass}`} />
                          <span>{activeMfsMethod.config.instructions}</span>
                        </div>
                      )}
                    </div>

                    {/* Required Input Fields: Sender Mobile Number & TrxID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block font-bold text-[#242424] mb-1">
                          যে নম্বর থেকে টাকা পাঠিয়েছেন <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          maxLength={14}
                          value={senderNumber}
                          onChange={(e) => {
                            setSenderNumber(e.target.value);
                            if (errors.senderNumber) {
                              setErrors((prev) => ({ ...prev, senderNumber: '' }));
                            }
                          }}
                          placeholder="১১ ডিজিট নম্বর (যেমন: 01712345678)"
                          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono text-[#242424] focus:outline-hidden ${
                            errors.senderNumber
                              ? 'border-rose-500 bg-rose-50/30'
                              : `border-[#DFC9AA] ${activeMfsMethod.focusBorderClass}`
                          }`}
                        />
                        {errors.senderNumber && (
                          <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                            {errors.senderNumber}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-[#242424] mb-1">
                          ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={24}
                          value={trxId}
                          onChange={(e) => {
                            const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            setTrxId(upper);
                            if (errors.trxId) {
                              setErrors((prev) => ({ ...prev, trxId: '' }));
                            }
                          }}
                          placeholder="যেমন: BKH9824X7Q"
                          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[#242424] focus:outline-hidden ${
                            errors.trxId
                              ? 'border-rose-500 bg-rose-50/30'
                              : `border-[#DFC9AA] ${activeMfsMethod.focusBorderClass}`
                          }`}
                        />
                        {errors.trxId && (
                          <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                            {errors.trxId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[#242424] hover:bg-[#C5A46D] text-white text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>অর্ডার নিশ্চিত করুন (মোট প্রদেয় ৳{grandTotal})</span>
            </button>

          </form>
        </div>

        {/* Order Items & Calculations Sidebar (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] p-6 space-y-6 sticky top-24">
            
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-3">
              অর্ডারের কাপড় সমূহ ({checkoutItems.length}টি আইটেম)
            </h2>

            {/* Itemized List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {checkoutItems.map((item) => {
                const itemTotal = item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards);
                const measurementSummary = formatMeasurementsSummary(item.customMeasurements);
                return (
                  <div key={item.id} className="p-2.5 bg-white rounded-lg border border-[#EDE5D9] space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-md overflow-hidden border border-[#EDE5D9] shrink-0 bg-[#FAF8F4]">
                        {getUniqueProductFabricImage(item.product) ? (
                          <img
                            src={getUniqueProductFabricImage(item.product)}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
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
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-[#242424] truncate">{item.product.name}</h4>
                          {item.outfitCategory && (
                            <span className="px-1.5 py-0.2 bg-[#850B1B] text-white text-[10px] font-bold rounded">
                              {item.outfitCategory}
                            </span>
                          )}
                        </div>
                        <span className="text-[#242424]/60 text-[11px] block">
                          {item.selectedWidth} হাত বহর · {item.yards} গজ · ৳{item.pricePerYard}/গজ
                        </span>
                        {item.isCustomized ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#850B1B] bg-[#850B1B]/10 px-1.5 py-0.5 rounded mt-0.5">
                            <Scissors className="w-2.5 h-2.5" />
                            নিজের মাপে কাস্টমাইজড (স্ট্যান্ডার্ড: {item.standardGaj} গজ
                            {item.additionalGaj ? `, +${item.additionalGaj} গজ` : ''})
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-[#242424]/60 mt-0.5">
                            স্ট্যান্ডার্ড সাইজ ({item.standardGaj ?? item.yards} গজ)
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold tabular-nums text-[#242424] shrink-0">
                        ৳{itemTotal}
                      </span>
                    </div>
                    {item.isCustomized && (measurementSummary || item.customizationNotes) && (
                      <div className="p-2 bg-[#FAF8F4] rounded border border-[#EDE5D9] text-[11px] text-[#242424]/80 space-y-0.5">
                        {measurementSummary && (
                          <div>
                            <strong className="text-[#850B1B]">মাপ:</strong> {measurementSummary}
                          </div>
                        )}
                        {item.customizationNotes && (
                          <div>
                            <strong>নোট:</strong> {item.customizationNotes}
                          </div>
                        )}
                      </div>
                    )}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.selectedAddons.map((addon, idx) => (
                          <span
                            key={`${addon.addonId}-${addon.fabricId}-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] rounded text-[10px] text-[#242424]/80"
                          >
                            <span className="font-semibold text-[#850B1B]">{addon.addonName}</span>
                            <span>· {addon.fabricName}</span>
                            <span>×{addon.count}</span>
                            <span className="font-bold text-[#242424] tabular-nums">(৳{addon.totalAddonPrice})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 text-xs border-t border-[#EDE5D9] pt-4">
              <div className="flex justify-between text-[#242424]/70">
                <span>মোট গজ:</span>
                <span className="font-semibold text-[#242424] tabular-nums">{totalYards.toFixed(1)} গজ</span>
              </div>
              <div className="flex justify-between text-[#242424]/70">
                <span>কাপড়ের সাবটোটাল:</span>
                <span className="font-semibold text-[#242424] tabular-nums">৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#242424]/70">
                <span>ডেলিভারি চার্জ ({district}):</span>
                <span className="font-semibold text-[#242424] tabular-nums">
                  {effectiveDeliveryFee === 0 ? <span className="text-emerald-600 font-bold">ফ্রি</span> : `৳${effectiveDeliveryFee}`}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>কুপন ছাড় ({appliedCoupon.code}):</span>
                  <span className="tabular-nums">-৳{appliedCoupon.discount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#EDE5D9] flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-[#242424]">সর্বমোট প্রদেয়:</span>
                  <span
                    className={`text-[11px] font-semibold block mt-0.5 ${
                      paymentMethod === 'bkash'
                        ? 'text-[#E2136E]'
                        : paymentMethod === 'nagad'
                        ? 'text-[#F16522]'
                        : 'text-[#242424]/60'
                    }`}
                  >
                    {orderSummaryPaymentFooterText}
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-[#242424] tabular-nums">
                  ৳{grandTotal}
                </span>
              </div>
            </div>

            {/* Quick Coupon on Checkout */}
            {!appliedCoupon && (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="কুপন কোড (উদাঃ DONIYA10)"
                  className="flex-1 bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-xs uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg"
                >
                  প্রয়োগ
                </button>
              </form>
            )}

            {/* Trust badge */}
            <div className="p-3 bg-white rounded-lg border border-[#EDE5D9] flex items-center gap-3 text-xs text-[#242424]/70">
              <ShieldCheck className="w-5 h-5 text-[#C5A46D] shrink-0" />
              <span>
                {paymentMethod === 'cod'
                  ? 'নিরাপদ চেকআউট। কোনো অগ্রিম ফি নেই, কাপড় হাতে পেয়ে টাকা দিন।'
                  : `${paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} ট্রানজেকশন আইডি (TrxID) যাচাই করে আপনার অর্ডার দ্রুত কনফার্ম করা হবে।`}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
