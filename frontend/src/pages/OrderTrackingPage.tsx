import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { orderService } from '../services/orderService';
import { formatMeasurementsSummary } from '../services/measurementService';
import { formatPaymentMethodLabel, formatPaymentStatusLabel } from '../services/settingsService';
import { Order, OrderStatus, OrderTrackingHistory } from '../types';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  FileText,
  Sparkles,
  Scissors
} from 'lucide-react';

const STATUS_META: Record<
  OrderStatus,
  {
    labelBn: string;
    labelEn: string;
    badgeClass: string;
    shortDesc: string;
  }
> = {
  Pending: {
    labelBn: 'অর্ডার গৃহীত (Pending)',
    labelEn: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    shortDesc: 'অর্ডারটি সিস্টেমে জমা হয়েছে'
  },
  Confirmed: {
    labelBn: 'কনফার্মড (Confirmed)',
    labelEn: 'Confirmed',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    shortDesc: 'গ্রাহকের সাথে ফোনে নিশ্চিত করা হয়েছে'
  },
  Processing: {
    labelBn: 'প্রসেসিং ও কাটিং (Processing)',
    labelEn: 'Processing',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    shortDesc: 'ফেব্রিক নিখুঁত মাপে কাটা ও প্যাকিং'
  },
  Shipped: {
    labelBn: 'কুরিয়ারে প্রেরিত (Shipped)',
    labelEn: 'Shipped',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    shortDesc: 'কুরিয়ার সার্ভিসে হস্তান্তর করা হয়েছে'
  },
  'Out for Delivery': {
    labelBn: 'ডেলিভারির পথে (Out for Delivery)',
    labelEn: 'Out for Delivery',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    shortDesc: 'ডেলিভারি ম্যান পার্সেল নিয়ে রওনা হয়েছেন'
  },
  Delivered: {
    labelBn: 'ডেলিভার্ড সম্পন্ন (Delivered)',
    labelEn: 'Delivered',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    shortDesc: 'গ্রাহকের হাতে সফলভাবে হস্তান্তর'
  },
  Cancelled: {
    labelBn: 'বাতিলকৃত (Cancelled)',
    labelEn: 'Cancelled',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
    shortDesc: 'অর্ডারটি বাতিল করা হয়েছে'
  },
  Returned: {
    labelBn: 'ফেরত পাঠানো হয়েছে (Returned)',
    labelEn: 'Returned',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-300',
    shortDesc: 'পার্সেলটি ওয়্যারহাউসে রিটার্ন এসেছে'
  }
};

const TIMELINE_STAGES: {
  status: OrderStatus;
  label: string;
  desc: string;
}[] = [
  { status: 'Pending', label: 'অর্ডার গৃহীত', desc: 'অর্ডারটি সিস্টেমে জমা হয়েছে' },
  { status: 'Confirmed', label: 'কনফার্মড', desc: 'ফোনে অর্ডার নিশ্চিত করা হয়েছে' },
  { status: 'Processing', label: 'প্রসেসিং ও কাটিং', desc: 'সঠিক গজে কাটিং ও প্যাকিং' },
  { status: 'Shipped', label: 'কুরিয়ারে প্রেরিত', desc: 'কুরিয়ারে হস্তান্তর সম্পন্ন' },
  { status: 'Out for Delivery', label: 'ডেলিভারির পথে', desc: 'ডেলিভারি রাইডারের কাছে' },
  { status: 'Delivered', label: 'ডেলিভার্ড সম্পন্ন', desc: 'সফলভাবে ডেলিভারি সম্পন্ন' }
];

export const OrderTrackingPage: React.FC = () => {
  const { trackingQuery, trackingPhone, lastCompletedOrder, currentUser } = useStore();

  const [orderIdInput, setOrderIdInput] = useState(trackingQuery || '');
  const [phoneInput, setPhoneInput] = useState(
    trackingPhone || currentUser?.phone || ''
  );
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [verifiedCredentials, setVerifiedCredentials] = useState<{
    orderNumber: string;
    phone: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorState, setErrorState] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  // Auto-populate and verify if navigated with both orderNumber and phone
  useEffect(() => {
    if (trackingQuery) {
      setOrderIdInput(trackingQuery);
      const effectivePhone =
        trackingPhone ||
        (lastCompletedOrder &&
        lastCompletedOrder.orderNumber.toUpperCase() ===
          trackingQuery.trim().toUpperCase()
          ? lastCompletedOrder.customer.phone
          : currentUser?.phone || '');

      if (effectivePhone) {
        setPhoneInput(effectivePhone);
        handleTrackOrder(trackingQuery, effectivePhone);
      }
    }
  }, [trackingQuery, trackingPhone]);

  // Real-time SSE + Cross-tab subscription for the currently verified order
  useEffect(() => {
    if (!verifiedCredentials) return;

    const unsubscribe = orderService.subscribeToOrderUpdates(
      {
        orderNumber: verifiedCredentials.orderNumber,
        phone: verifiedCredentials.phone
      },
      (updatedOrder) => {
        if (updatedOrder) {
          setSearchedOrder(updatedOrder);
          setLastUpdatedTime(new Date().toLocaleTimeString('bn-BD'));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [verifiedCredentials]);

  const handleTrackOrder = async (id: string, phone: string) => {
    const cleanId = id.trim();
    const cleanPhone = phone.trim();

    if (!cleanId || !cleanPhone) {
      setSearchedOrder(null);
      setVerifiedCredentials(null);
      setErrorState({
        code: 'MISSING_FIELDS',
        message:
          'অর্ডার ট্র্যাক করতে আপনার অর্ডার আইডি এবং অর্ডারে ব্যবহৃত ১১ ডিজিটের মোবাইল নম্বর উভয়ই প্রদান করুন।'
      });
      return;
    }

    setIsLoading(true);
    setErrorState(null);

    try {
      const result = await orderService.verifyOrderTrackingAsync(
        cleanId,
        cleanPhone
      );

      if (result.success && result.order) {
        setSearchedOrder(result.order);
        setVerifiedCredentials({
          orderNumber: result.order.orderNumber,
          phone: cleanPhone
        });
        setErrorState(null);
        setLastUpdatedTime(new Date().toLocaleTimeString('bn-BD'));
      } else {
        setSearchedOrder(null);
        setVerifiedCredentials(null);
        setErrorState({
          code: result.code,
          message: result.message
        });
      }
    } catch {
      setSearchedOrder(null);
      setVerifiedCredentials(null);
      setErrorState({
        code: 'SERVER_ERROR',
        message:
          'সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!verifiedCredentials) return;
    setIsRefreshing(true);
    try {
      const result = await orderService.verifyOrderTrackingAsync(
        verifiedCredentials.orderNumber,
        verifiedCredentials.phone
      );
      if (result.success && result.order) {
        setSearchedOrder(result.order);
        setLastUpdatedTime(new Date().toLocaleTimeString('bn-BD'));
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrackOrder(orderIdInput, phoneInput);
  };

  const handleCopyTrackingNumber = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    } catch {
      // ignore
    }
  };

  const getStageIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Confirmed':
        return 1;
      case 'Processing':
        return 2;
      case 'Shipped':
        return 3;
      case 'Out for Delivery':
        return 4;
      case 'Delivered':
        return 5;
      default:
        return -1;
    }
  };

  const formatDateTimeBn = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const formatDateOnlyBn = (dateStr?: string) => {
    if (!dateStr) return 'নির্ধারিত হয়নি';
    try {
      return new Date(dateStr).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Chronological tracking history from relational table
  const trackingEvents: OrderTrackingHistory[] = searchedOrder
    ? (searchedOrder.trackingHistory && searchedOrder.trackingHistory.length > 0
        ? searchedOrder.trackingHistory
        : searchedOrder.statusHistory.map((sh, i) => ({
            id: sh.id || `trk-${i}`,
            orderId: searchedOrder.id,
            orderNumber: searchedOrder.orderNumber,
            status: sh.status,
            timestamp: sh.timestamp,
            note: sh.note,
            location: sh.location,
            updatedBy: (sh.updatedBy as any) || 'Admin'
          }))
      )
        .slice()
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
    : [];

  // Map latest event for each status so timeline steps show exact timestamp and note
  const stageEventMap = new Map<OrderStatus, OrderTrackingHistory>();
  for (const ev of trackingEvents) {
    stageEventMap.set(ev.status, ev);
  }

  const demoTestOrders = [
    { id: 'FD-2026-1042', phone: '01711223344', label: 'Shipped' },
    { id: 'FD-2026-1038', phone: '01819556677', label: 'Delivered' },
    { id: 'FD-2026-1025', phone: '01912889900', label: 'Processing' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A46D]/15 text-[#C5A46D] rounded-full text-xs font-bold uppercase tracking-wider">
          <Search className="w-3.5 h-3.5" />
          <span>রিয়েল-টাইম অর্ডার ট্র্যাকিং</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242424]">
          আপনার অর্ডারের অবস্থান ট্র্যাক করুন
        </h1>
        <p className="text-xs sm:text-sm text-[#242424]/75">
          আপনার অর্ডার আইডি (যেমন: FD-2026-1042) এবং অর্ডারে ব্যবহৃত মোবাইল নম্বর প্রবেশ করিয়ে অর্ডারের লাইভ স্ট্যাটাস দেখুন।
        </p>
      </div>

      {/* Tracking Verification Search Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE5D9] shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                অর্ডার নম্বর (Order ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="উদাঃ FD-2026-1042"
                required
                aria-label="Order ID"
                className="w-full uppercase font-mono bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3.5 py-2.5 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                অর্ডারে ব্যবহৃত মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="উদাঃ 01711223344"
                required
                aria-label="Phone Number"
                className="w-full font-mono bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3.5 py-2.5 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#242424] hover:bg-[#C5A46D] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ডাটাবেসে যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>অর্ডার যাচাই ও ট্র্যাক করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Security Note + Quick Test Buttons */}
        <div className="mt-4 pt-3 border-t border-[#EDE5D9] space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#242424]/65">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A46D] shrink-0" />
            <span>
              গ্রাহকের গোপনীয়তা সুরক্ষিত রাখতে অর্ডার আইডি ও সঠিক ফোন নম্বর উভয়ই যাচাই করা হয়।
            </span>
          </div>

          <div className="text-[11px] text-[#242424]/60 flex flex-wrap items-center gap-2">
            <span>দ্রুত টেস্ট করুন:</span>
            {lastCompletedOrder && (
              <button
                type="button"
                onClick={() => {
                  setOrderIdInput(lastCompletedOrder.orderNumber);
                  setPhoneInput(lastCompletedOrder.customer.phone);
                  handleTrackOrder(
                    lastCompletedOrder.orderNumber,
                    lastCompletedOrder.customer.phone
                  );
                }}
                className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xs font-mono text-emerald-800 hover:border-emerald-400 cursor-pointer font-semibold"
              >
                আপনার শেষ অর্ডার ({lastCompletedOrder.orderNumber})
              </button>
            )}
            {import.meta.env.DEV &&
              demoTestOrders.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOrderIdInput(item.id);
                    setPhoneInput(item.phone);
                    handleTrackOrder(item.id, item.phone);
                  }}
                  className="px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] rounded-xs font-mono text-[#242424] hover:border-[#C5A46D] cursor-pointer"
                >
                  {item.id} ({item.phone})
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Verification Error Message */}
      {errorState && (
        <div className="max-w-2xl mx-auto p-6 bg-rose-50/80 border border-rose-200 rounded-xl text-center space-y-2 animate-in fade-in duration-200">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">
            {errorState.code === 'PHONE_MISMATCH'
              ? 'ফোন নম্বর যাচাইকরণ ব্যর্থ হয়েছে'
              : errorState.code === 'ORDER_NOT_FOUND'
              ? 'কোনো অর্ডার খুঁজে পাওয়া যায়নি'
              : 'তথ্য যাচাই করা সম্ভব হয়নি'}
          </h3>
          <p className="text-xs text-rose-800/90 max-w-lg mx-auto leading-relaxed">
            {errorState.message}
          </p>
        </div>
      )}

      {/* Verified Order Tracking View */}
      {searchedOrder && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-[#EDE5D9] p-6 sm:p-8 space-y-8 shadow-sm animate-in fade-in duration-200">
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EDE5D9] gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A46D]">
                  ভেরিফাইড অর্ডার ট্র্যাকিং
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  লাইভ সিঙ্ক সক্রিয়
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#242424] font-mono mt-1">
                {searchedOrder.orderNumber}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#242424]/60 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span>অর্ডারের তারিখ: {formatDateTimeBn(searchedOrder.createdAt)}</span>
                </span>
                {searchedOrder.estimatedDeliveryDate && (
                  <span className="flex items-center gap-1 font-medium text-[#242424]/80">
                    <Truck className="w-3.5 h-3.5 text-[#C5A46D]" />
                    <span>
                      সম্ভাব্য ডেলিভারি:{' '}
                      {formatDateOnlyBn(searchedOrder.estimatedDeliveryDate)}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#242424]/60">বর্তমান স্ট্যাটাস:</span>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-sm border ${
                    STATUS_META[searchedOrder.orderStatus]?.badgeClass ||
                    'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {STATUS_META[searchedOrder.orderStatus]?.labelBn ||
                    searchedOrder.orderStatus}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#242424]/50">
                {lastUpdatedTime && <span>সর্বশেষ চেক: {lastUpdatedTime}</span>}
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF8F4] hover:bg-[#EDE5D9]/60 text-[#242424] border border-[#EDE5D9] rounded-xs font-medium cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  <span>রিফ্রেশ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cancelled or Returned Alert Banner */}
          {searchedOrder.orderStatus === 'Cancelled' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
              <XCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm block text-rose-900">
                  এই অর্ডারটি বাতিল (Cancelled) করা হয়েছে
                </span>
                <p>
                  {stageEventMap.get('Cancelled')?.note ||
                    'অর্ডারটি বাতিল করা হয়েছে। কোনো প্রশ্ন থাকলে আমাদের হেল্পলাইনে যোগাযোগ করুন।'}
                </p>
                {stageEventMap.get('Cancelled')?.timestamp && (
                  <span className="text-[11px] text-rose-700/75 block">
                    বাতিলের সময়: {formatDateTimeBn(stageEventMap.get('Cancelled')!.timestamp)}
                  </span>
                )}
              </div>
            </div>
          )}

          {searchedOrder.orderStatus === 'Returned' && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-xs text-orange-900">
              <RotateCcw className="w-5 h-5 shrink-0 text-orange-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm block text-orange-950">
                  পার্সেলটি রিটার্ন (Returned) করা হয়েছে
                </span>
                <p>
                  {stageEventMap.get('Returned')?.note ||
                    'পার্সেলটি ডেলিভারি না হওয়ায় আমাদের ওয়্যারহাউসে ফেরত এসেছে।'}
                </p>
                {stageEventMap.get('Returned')?.timestamp && (
                  <span className="text-[11px] text-orange-800/75 block">
                    রিটার্নের সময়: {formatDateTimeBn(stageEventMap.get('Returned')!.timestamp)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 6-Stage Visual Tracking Stepper */}
          {searchedOrder.orderStatus !== 'Cancelled' &&
            searchedOrder.orderStatus !== 'Returned' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
                    অর্ডার অগ্রগতি টাইমলাইন (Live Order Progress)
                  </h3>
                  <span className="text-[11px] text-[#242424]/60">
                    ধাপ {Math.max(1, getStageIndex(searchedOrder.orderStatus) + 1)} /{' '}
                    {TIMELINE_STAGES.length}
                  </span>
                </div>

                <div className="relative">
                  {/* Connecting Line on Desktop */}
                  <div className="hidden sm:block absolute top-5 left-6 right-6 h-0.5 bg-[#EDE5D9] z-0" />

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 relative z-10">
                    {TIMELINE_STAGES.map((stage, idx) => {
                      const currentIdx = getStageIndex(searchedOrder.orderStatus);
                      const isCompleted = idx < currentIdx || searchedOrder.orderStatus === 'Delivered';
                      const isCurrent = idx === currentIdx && searchedOrder.orderStatus !== 'Delivered';
                      const isPassed = idx <= currentIdx;
                      const stageEvent = stageEventMap.get(stage.status);

                      return (
                        <div
                          key={stage.status}
                          className="flex sm:flex-col items-start sm:items-center sm:text-center gap-3 sm:gap-2"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                              isCompleted
                                ? 'bg-[#242424] text-white shadow-xs'
                                : isCurrent
                                ? 'bg-[#6B0812] text-white ring-4 ring-[#C5A46D]/30 border-2 border-[#C5A46D]'
                                : 'bg-white border-2 border-[#EDE5D9] text-[#242424]/40'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-[#C5A46D]" />
                            ) : isCurrent ? (
                              <Clock className="w-4 h-4 text-[#C5A46D] animate-pulse" />
                            ) : (
                              idx + 1
                            )}
                          </div>

                          <div className="text-left sm:text-center min-w-0 flex-1">
                            <span
                              className={`text-xs font-bold block ${
                                isPassed ? 'text-[#242424]' : 'text-[#242424]/40'
                              }`}
                            >
                              {stage.label}
                            </span>
                            <span className="text-[10px] text-[#242424]/60 block leading-tight mt-0.5">
                              {stage.desc}
                            </span>
                            {stageEvent ? (
                              <span className="text-[10px] font-medium text-[#C5A46D] block mt-1">
                                {new Date(stageEvent.timestamp).toLocaleDateString(
                                  'bn-BD',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }
                                )}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#242424]/35 block mt-1">
                                অপেক্ষমান
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {/* Courier Information Section (courier_information table) */}
          <div className="p-4 sm:p-5 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE5D9] pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C5A46D]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
                  কুরিয়ার ও শিপমেন্ট তথ্য (Courier Information)
                </h3>
              </div>
              {searchedOrder.courierInfo?.isApiConnected && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-xs bg-white border border-[#EDE5D9] text-[#242424]/70">
                  কুরিয়ার হাব সিঙ্ক যুক্ত
                </span>
              )}
            </div>

            {searchedOrder.courierInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#242424]/60 block text-[11px]">
                    কুরিয়ার সার্ভিস:
                  </span>
                  <span className="font-bold text-[#242424] text-sm">
                    {searchedOrder.courierInfo.courierName}
                  </span>
                  {searchedOrder.courierInfo.courierStatus && (
                    <span className="text-[11px] text-[#242424]/70 block mt-0.5">
                      অবস্থা: {searchedOrder.courierInfo.courierStatus}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[#242424]/60 block text-[11px]">
                    ট্র্যাকিং নম্বর / কনসাইনমেন্ট আইডি:
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-[#242424] text-sm bg-white px-2 py-0.5 rounded-xs border border-[#EDE5D9]">
                      {searchedOrder.courierInfo.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyTrackingNumber(
                          searchedOrder.courierInfo!.trackingNumber
                        )
                      }
                      className="p-1 bg-white hover:bg-[#EDE5D9]/50 border border-[#EDE5D9] rounded-xs text-[#242424] cursor-pointer"
                      title="ট্র্যাকিং নম্বর কপি করুন"
                    >
                      {copiedTracking ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[#242424]/60 block text-[11px]">
                      সম্ভাব্য ডেলিভারির তারিখ:
                    </span>
                    <span className="font-bold text-[#242424]">
                      {formatDateOnlyBn(
                        searchedOrder.courierInfo.estimatedDeliveryDate ||
                          searchedOrder.estimatedDeliveryDate
                      )}
                    </span>
                  </div>
                  {searchedOrder.courierInfo.trackingUrl &&
                    /^(https?:)?\/\//i.test(searchedOrder.courierInfo.trackingUrl) && (
                      <a
                        href={searchedOrder.courierInfo.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B0812] hover:text-[#C5A46D] underline mt-1.5"
                      >
                        <span>কুরিয়ার পোর্টালে ট্র্যাক করুন</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#242424]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  পার্সেলটি কুরিয়ারে হস্তান্তর করার সাথে সাথে এখানে কুরিয়ার কোম্পানির নাম ও ট্র্যাকিং নম্বর যুক্ত হবে।
                </span>
                {searchedOrder.estimatedDeliveryDate && (
                  <span className="font-semibold text-[#242424] shrink-0">
                    সম্ভাব্য ডেলিভারি: {formatDateOnlyBn(searchedOrder.estimatedDeliveryDate)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Complete Order Tracking History Log (order_tracking_history table) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#C5A46D]" />
                <span>বিস্তারিত ট্র্যাকিং হিস্ট্রি ও অ্যাডমিন নোট ({trackingEvents.length}টি আপডেট)</span>
              </h3>
            </div>

            <div className="relative pl-5 border-l-2 border-[#EDE5D9] space-y-4">
              {trackingEvents
                .slice()
                .reverse()
                .map((ev, index) => {
                  const isLatest = index === 0;
                  return (
                    <div
                      key={ev.id || `${ev.status}-${ev.timestamp}-${index}`}
                      className={`relative p-3.5 rounded-lg border text-xs transition-all ${
                        isLatest
                          ? 'bg-[#FAF8F4] border-[#C5A46D] shadow-2xs'
                          : 'bg-white border-[#EDE5D9]'
                      }`}
                    >
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-6.75 top-4 w-3.5 h-3.5 rounded-full border-2 ${
                          isLatest
                            ? 'bg-[#6B0812] border-[#C5A46D] ring-4 ring-[#C5A46D]/20'
                            : 'bg-white border-[#C5A46D]'
                        }`}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-xs border ${
                              STATUS_META[ev.status]?.badgeClass ||
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {STATUS_META[ev.status]?.labelBn || ev.status}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#6B0812] text-white rounded-xs">
                              সর্বশেষ আপডেট
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-[#242424]/60 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C5A46D]" />
                          {formatDateTimeBn(ev.timestamp)}
                        </span>
                      </div>

                      <p className="text-[#242424] font-medium mt-2 leading-relaxed">
                        {ev.note}
                      </p>

                      {(ev.location || ev.updatedBy) && (
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-[#242424]/55">
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#C5A46D]" />
                              {ev.location}
                            </span>
                          )}
                          {ev.updatedBy && (
                            <span>
                              আপডেটকারী:{' '}
                              {ev.updatedBy === 'Admin'
                                ? 'অ্যাডমিন প্যানেল'
                                : ev.updatedBy === 'Courier API'
                                ? 'কুরিয়ার সিস্টেম'
                                : 'গ্রাহক অর্ডার'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Order Details & Items Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#EDE5D9] text-xs">
            <div className="p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
              <span className="font-bold text-[#242424] block mb-1">
                গ্রাহক ও ডেলিভারি তথ্য:
              </span>
              <p className="font-semibold text-[#242424]">
                {searchedOrder.customer.fullName}
              </p>
              <p className="text-[#242424]/75">
                {searchedOrder.customer.fullAddress}
              </p>
              <p className="text-[#242424]/70">
                {searchedOrder.customer.upazila
                  ? `${searchedOrder.customer.upazila}, `
                  : ''}
                {searchedOrder.customer.district}
              </p>
              <p className="text-[#242424]/70 pt-1">
                মোবাইল: {searchedOrder.customer.phone}
              </p>
            </div>

            <div className="p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
              <span className="font-bold text-[#242424] block mb-1">
                পেমেন্ট ও ডেলিভারি বিবরণ:
              </span>
              <div className="flex justify-between">
                <span className="text-[#242424]/60">পদ্ধতি:</span>
                <span className="font-semibold text-[#242424]">
                  {formatPaymentMethodLabel(searchedOrder.paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242424]/60">পেমেন্ট অবস্থা:</span>
                <span
                  className={`font-bold ${
                    searchedOrder.paymentStatus === 'Paid'
                      ? 'text-emerald-700'
                      : 'text-amber-800'
                  }`}
                >
                  {formatPaymentStatusLabel(searchedOrder.paymentStatus)}
                </span>
              </div>
              {searchedOrder.paymentDetails && (
                <div className="flex justify-between text-[11px] pt-0.5">
                  <span className="text-[#242424]/60">TrxID ({searchedOrder.paymentDetails.senderNumber}):</span>
                  <span className="font-mono font-bold text-[#850B1B]">
                    {searchedOrder.paymentDetails.trxId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#242424]/60">ডেলিভারি চার্জ:</span>
                <span className="font-semibold text-[#242424]">
                  {searchedOrder.deliveryCharge === 0
                    ? 'ফ্রি'
                    : `৳${searchedOrder.deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-[#EDE5D9]/60">
                <span>সর্বমোট বিল:</span>
                <span className="tabular-nums text-sm text-[#242424]">
                  ৳{searchedOrder.grandTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Items in this Order */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#242424]">
              অর্ডারকৃত কাপড়ের তালিকা:
            </h4>
            <div className="space-y-2">
              {searchedOrder.items.map((item, idx) => {
                const measurementSummary = formatMeasurementsSummary(item.customMeasurements);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#242424]">
                            {item.productName}
                          </span>
                          {item.outfitCategory && (
                            <span className="px-1.5 py-0.2 bg-[#850B1B] text-white text-[10px] font-bold rounded">
                              পোশাক: {item.outfitCategory}
                            </span>
                          )}
                        </div>
                        <span className="text-[#242424]/60 text-[11px]">
                          {item.fabricWidth} বহর · {item.color} · {item.yards} গজ (৳
                          {item.pricePerYard}/গজ)
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {item.isCustomized ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#850B1B]/10 text-[#850B1B] font-bold rounded">
                              <Scissors className="w-2.5 h-2.5" />
                              নিজের মাপে কাস্টমাইজড
                            </span>
                          ) : (
                            <span className="text-[#242424]/60">স্ট্যান্ডার্ড সাইজ</span>
                          )}
                          {item.standardGaj !== undefined && (
                            <span className="text-[#242424]/65">
                              · স্ট্যান্ডার্ড গজ: {item.standardGaj} গজ
                            </span>
                          )}
                          {item.isCustomized && item.additionalGaj !== undefined && item.additionalGaj > 0 && (
                            <span className="text-[#850B1B] font-semibold">
                              · অতিরিক্ত গজ: +{item.additionalGaj} গজ
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-[#242424] tabular-nums">
                        ৳{item.subtotal}
                      </span>
                    </div>
                    {item.isCustomized && (measurementSummary || item.customizationNotes) && (
                      <div className="p-2 bg-white rounded border border-[#EDE5D9] text-[11px] space-y-0.5">
                        {measurementSummary && (
                          <div>
                            <strong className="text-[#850B1B]">কাস্টম মাপ:</strong> {measurementSummary}
                          </div>
                        )}
                        {item.customizationNotes && (
                          <div>
                            <strong>নোট:</strong> {item.customizationNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
