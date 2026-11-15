import React from 'react';
import { useStore } from '../context/StoreContext';
import { FabricPatternVisual } from '../components/common/FabricPatternVisual';
import { formatMeasurementsSummary } from '../services/measurementService';
import { formatPaymentMethodLabel, formatPaymentStatusLabel } from '../services/settingsService';
import { 
  CheckCircle2, 
  Printer, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Package,
  Calendar,
  Phone,
  MapPin,
  Clock,
  Scissors
} from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { lastCompletedOrder, navigateTo, settings } = useStore();

  // If accessed directly without an active last order, show fallback or demo order
  if (!lastCompletedOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-[#C5A46D] mx-auto" />
        <h2 className="text-xl font-bold text-[#242424]">কোনো সক্রিয় অর্ডার খুঁজে পাওয়া যায়নি</h2>
        <p className="text-xs text-[#242424]/60">আপনি অর্ডার ট্র্যাকিং পেজে গিয়ে আপনার অর্ডারের অবস্থা দেখতে পারেন।</p>
        <button
          onClick={() => navigateTo('order-tracking')}
          className="px-6 py-2.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-md cursor-pointer"
        >
          অর্ডার ট্র্যাক করুন
        </button>
      </div>
    );
  }

  const order = lastCompletedOrder;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Top Banner (No Print) */}
      <div className="no-print bg-[#FAF8F4] border border-[#EDE5D9] rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
            অর্ডার নিশ্চিতকরণ সম্পন্ন
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242424]">
            ধন্যবাদ, {order.customer.fullName}! আপনার অর্ডারটি গৃহীত হয়েছে
          </h1>
          <p className="text-xs sm:text-sm text-[#242424]/70">
            অর্ডার নম্বর: <span className="font-mono font-bold text-base text-[#242424]">{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Confirmation Note */}
        <div className="p-3 bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 rounded-lg max-w-xl mx-auto text-xs flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>আপনার অর্ডারটি আমাদের সিস্টেমে সংরক্ষিত হয়েছে। অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে যেকোনো সময় ট্র্যাক করতে পারবেন।</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-white border border-[#242424] hover:bg-[#FAF8F4] text-[#242424] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#C5A46D]" />
            <span>ইনভয়েস প্রিন্ট করুন</span>
          </button>

          <button
            onClick={() =>
              navigateTo('order-tracking', {
                orderNumber: order.orderNumber,
                trackingPhone: order.customer.phone
              })
            }
            className="px-5 py-2.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>অর্ডার ট্র্যাকিং দেখুন</span>
          </button>

          <button
            onClick={() => navigateTo('shop')}
            className="px-5 py-2.5 text-xs text-[#242424]/80 hover:text-[#242424] font-medium cursor-pointer"
          >
            আরও কাপড় কিনুন →
          </button>
        </div>
      </div>

      {/* Printable Invoice / Order Summary Document */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] p-6 sm:p-10 space-y-8 shadow-sm">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[#EDE5D9] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A46D]"></span>
              <span className="font-['Playfair_Display'] font-bold text-2xl text-[#242424]">
                Fashion Doniya <span className="text-[#C5A46D]">BD</span>
              </span>
            </div>
            <p className="text-xs text-[#242424]/60 mt-1">
              আপনার পছন্দের কাপড়, এখন গজ হিসেবে
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-[#242424]/75">
            <span className="text-xs font-bold text-[#242424] uppercase block">ইনভয়েস / রশিদ</span>
            <span className="font-mono font-bold text-sm text-[#242424]">{order.orderNumber}</span>
            <div className="text-[11px] text-[#242424]/60 mt-0.5">
              তারিখ: {new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1.5 p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A46D] block">
              ডেলিভারি ঠিকানা
            </span>
            <h3 className="font-bold text-sm text-[#242424]">{order.customer.fullName}</h3>
            <p className="text-[#242424]/80">{order.customer.fullAddress}</p>
            <p className="text-[#242424]/70">{order.customer.upazila ? `${order.customer.upazila}, ` : ''}{order.customer.district}</p>
            <p className="text-[#242424] font-medium pt-1">মোবাইল: {order.customer.phone}</p>
          </div>

          <div className="space-y-1.5 p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A46D] block">
              অর্ডার ও পেমেন্ট বিবরণ
            </span>
            <div className="flex justify-between">
              <span className="text-[#242424]/60">পেমেন্ট মাধ্যম:</span>
              <span className="font-bold text-[#242424]">{formatPaymentMethodLabel(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#242424]/60">পেমেন্ট স্ট্যাটাস:</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                {formatPaymentStatusLabel(order.paymentStatus)}
              </span>
            </div>
            {order.paymentDetails && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#242424]/60">প্রেরক নম্বর:</span>
                  <span className="font-mono font-bold text-[#242424]">{order.paymentDetails.senderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#242424]/60">ট্রানজেকশন আইডি (TrxID):</span>
                  <span className="font-mono font-bold text-[#850B1B]">{order.paymentDetails.trxId}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-[#242424]/60">অর্ডার স্ট্যাটাস:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
            অর্ডারকৃত কাপড়ের তালিকা
          </h3>
          <div className="overflow-x-auto border border-[#EDE5D9] rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                  <th className="p-3">কাপড়ের নাম</th>
                  <th className="p-3 text-center">বহর</th>
                  <th className="p-3 text-center">রং</th>
                  <th className="p-3 text-center">গজ পরিমাণ</th>
                  <th className="p-3 text-right">প্রতি গজ</th>
                  <th className="p-3 text-right">মোট (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
                {order.items.map((item, idx) => {
                  const measurementSummary = formatMeasurementsSummary(item.customMeasurements);
                  return (
                    <tr key={idx}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#242424]">{item.productName}</span>
                          {item.outfitCategory && (
                            <span className="px-2 py-0.5 bg-[#850B1B] text-white font-bold rounded text-[10px]">
                              পোশাক: {item.outfitCategory}
                            </span>
                          )}
                        </div>
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
                        {item.isCustomized && (measurementSummary || item.customizationNotes) && (
                          <div className="mt-1.5 p-2 bg-[#FAF8F4] rounded border border-[#EDE5D9] text-[11px] space-y-0.5">
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
                      </td>
                      <td className="p-3 text-center font-medium text-[#C5A46D]">{item.fabricWidth} বহর</td>
                      <td className="p-3 text-center">{item.color}</td>
                      <td className="p-3 text-center font-bold tabular-nums">{item.yards} গজ</td>
                      <td className="p-3 text-right tabular-nums">৳{item.pricePerYard}</td>
                      <td className="p-3 text-right font-bold text-[#242424] tabular-nums">৳{item.subtotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Calculations summary */}
        <div className="flex flex-col sm:flex-row justify-end text-xs">
          <div className="w-full sm:w-72 space-y-2 p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9]">
            <div className="flex justify-between text-[#242424]/75">
              <span>সাবটোটাল:</span>
              <span className="font-semibold tabular-nums text-[#242424]">৳{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-[#242424]/75">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold tabular-nums text-[#242424]">
                {order.deliveryCharge === 0 ? 'ফ্রি' : `৳${order.deliveryCharge}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>ছাড় ({order.couponCode || 'কুপন'}):</span>
                <span className="tabular-nums">-৳{order.discount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#EDE5D9] flex justify-between font-bold text-sm text-[#242424]">
              <span>সর্বমোট প্রদেয়:</span>
              <span className="text-base text-[#242424] tabular-nums">৳{order.grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="pt-6 border-t border-[#EDE5D9] text-center text-[11px] text-[#242424]/60 space-y-1">
          <p>{settings.storeName || 'ফ্যাশন দনিয়া'} থেকে কেনাকাটা করার জন্য ধন্যবাদ। কোনো প্রয়োজনে হেল্পলাইনে যোগাযোগ করুন: {settings.supportPhone || settings.whatsappNumber}</p>
          <p className="font-medium text-[#242424]/80">{settings.tagline || 'আপনার পছন্দের কাপড়, এখন গজ হিসেবে'}</p>
        </div>

      </div>

    </div>
  );
};
