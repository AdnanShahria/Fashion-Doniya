import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { orderService } from '../../services/orderService';
import { api } from '../../services/api';
import { formatMeasurementsSummary } from '../../services/measurementService';
import { formatPaymentMethodLabel } from '../../services/settingsService';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import {
  Search,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  X,
  Clock,
  AlertCircle,
  Truck,
  RotateCcw,
  PlusCircle,
  Calendar,
  MapPin,
  Phone,
  RefreshCw,
  ExternalLink,
  FileText,
  XCircle,
  Send,
  Scissors
} from 'lucide-react';

const ALL_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned'
];

const BANGLADESH_COURIERS = [
  'Steadfast Courier',
  'Pathao Courier',
  'RedX',
  'Paperfly',
  'Sundarban Courier',
  'SA Paribahan',
  'eCourier',
  'নিজস্ব ডেলিভারি রাইডার (In-House Rider)'
];

export const AdminOrders: React.FC = () => {
  const { refreshData, showToast, setLastCompletedOrder, navigateTo } = useStore();
  const [orders, setOrders] = useState<Order[]>(() => orderService.getAllOrders());
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSyncingBackend, setIsSyncingBackend] = useState(false);

  // Modal Form States for Status & Tracking History Update
  const [modalStatus, setModalStatus] = useState<OrderStatus>('Pending');
  const [trackingNote, setTrackingNote] = useState('');
  const [trackingLocation, setTrackingLocation] = useState('');

  // Modal Form States for Courier Information (courier_information table)
  const [courierName, setCourierName] = useState('Steadfast Courier');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [consignmentId, setConsignmentId] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [courierNote, setCourierNote] = useState('');
  const [autoMarkShipped, setAutoMarkShipped] = useState(true);
  const [selectedWebhookStage, setSelectedWebhookStage] = useState('In Transit to Destination Hub');
  const [isCourierSyncing, setIsCourierSyncing] = useState(false);

  const reloadOrders = () => {
    const list = orderService.getAllOrders();
    setOrders(list);
    refreshData();
    if (selectedOrder) {
      const updated = list.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  };

  // Sync with backend database on mount and subscribe to real-time updates
  useEffect(() => {
    setIsSyncingBackend(true);
    orderService
      .syncAdminOrders()
      .then((synced) => {
        setOrders(synced);
      })
      .finally(() => setIsSyncingBackend(false));

    const unsubscribe = orderService.subscribeToOrderUpdates(
      { isAdmin: true },
      () => {
        const list = orderService.getAllOrders();
        setOrders(list);
        setSelectedOrder((prev) =>
          prev ? list.find((o) => o.id === prev.id) || prev : null
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // Populate modal inputs when an order is opened
  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setModalStatus(order.orderStatus);
    setTrackingNote('');
    setTrackingLocation('');
    setCourierName(order.courierInfo?.courierName || 'Steadfast Courier');
    setTrackingNumber(order.courierInfo?.trackingNumber || '');
    setConsignmentId(order.courierInfo?.consignmentId || '');
    setEstimatedDeliveryDate(
      order.courierInfo?.estimatedDeliveryDate ||
        order.estimatedDeliveryDate ||
        ''
    );
    setCourierNote('');
  };

  // Quick status change from table row
  const handleQuickStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    const updated = orderService.updateOrderStatus(
      orderId,
      newStatus,
      `অ্যাডমিন প্যানেল থেকে অর্ডার স্ট্যাটাস "${newStatus}"-এ আপডেট করা হয়েছে।`
    );
    reloadOrders();
    if (updated) {
      showToast(
        `অর্ডার ${updated.orderNumber}-এর স্ট্যাটাস "${newStatus}"-এ পরিবর্তিত হয়েছে`,
        'success'
      );
    }
  };

  // Detailed status + note update from modal
  const handleModalStatusAndNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const isStatusChanged = modalStatus !== selectedOrder.orderStatus;
    if (!isStatusChanged && !trackingNote.trim()) {
      showToast('স্ট্যাটাস পরিবর্তন করুন অথবা একটি ট্র্যাকিং নোট লিখুন', 'error');
      return;
    }

    let updated: Order | null = null;
    if (isStatusChanged) {
      updated = orderService.updateOrderStatus(
        selectedOrder.id,
        modalStatus,
        trackingNote.trim() || undefined,
        trackingLocation.trim() || undefined,
        estimatedDeliveryDate || undefined
      );
    } else {
      updated = orderService.addTrackingHistoryNote(
        selectedOrder.id,
        trackingNote.trim(),
        trackingLocation.trim() || undefined,
        modalStatus
      );
    }

    if (updated) {
      setSelectedOrder(updated);
      setTrackingNote('');
      setTrackingLocation('');
      reloadOrders();
      showToast(
        isStatusChanged
          ? `স্ট্যাটাস "${modalStatus}" এবং ট্র্যাকিং হিস্ট্রি সংরক্ষিত হয়েছে!`
          : 'নতুন ট্র্যাকিং নোট টাইমলাইনে যুক্ত হয়েছে!',
        'success'
      );
    }
  };

  // Save Courier Information (courier_information table)
  const handleSaveCourierInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!courierName.trim() || !trackingNumber.trim()) {
      showToast('কুরিয়ার কোম্পানির নাম এবং ট্র্যাকিং নম্বর আবশ্যক', 'error');
      return;
    }

    const updated = orderService.updateCourierInformation(selectedOrder.id, {
      courierName: courierName.trim(),
      trackingNumber: trackingNumber.trim(),
      consignmentId: consignmentId.trim() || trackingNumber.trim(),
      estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      autoMarkShipped,
      note: courierNote.trim() || undefined
    });

    if (updated) {
      setSelectedOrder(updated);
      setModalStatus(updated.orderStatus);
      setCourierNote('');
      reloadOrders();
      showToast(
        `কুরিয়ার তথ্য (${courierName} - ${trackingNumber}) সফলভাবে সংরক্ষিত হয়েছে!`,
        'success'
      );
    }
  };

  // Trigger Courier API Sync / Webhook Update
  const handleCourierSync = async () => {
    if (!selectedOrder) return;
    if (!selectedOrder.courierInfo) {
      showToast('প্রথমে কুরিয়ার কোম্পানি ও ট্র্যাকিং নম্বর সংরক্ষণ করুন', 'error');
      return;
    }

    setIsCourierSyncing(true);
    try {
      const updated = await orderService.syncCourierStatusAsync(
        selectedOrder.id,
        selectedWebhookStage
      );
      if (updated) {
        setSelectedOrder(updated);
        setModalStatus(updated.orderStatus);
        reloadOrders();
        showToast(
          `কুরিয়ার স্ট্যাটাস সিঙ্ক সম্পন্ন: ${selectedWebhookStage}`,
          'success'
        );
      }
    } finally {
      setIsCourierSyncing(false);
    }
  };

  const handleUpdatePaymentStatus = (
    orderId: string,
    paymentStatus: PaymentStatus
  ) => {
    orderService.updatePaymentStatus(orderId, paymentStatus);
    reloadOrders();
    showToast(`পেমেন্ট স্ট্যাটাস পরিবর্তিত: ${paymentStatus}`, 'success');
  };

  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'Address',
      'Total Yards',
      'Subtotal',
      'Delivery',
      'Discount',
      'Grand Total',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Courier Name',
      'Tracking Number',
      'Est. Delivery'
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customer.fullName}"`,
      o.customer.phone,
      `"${o.customer.fullAddress}, ${o.customer.district}"`,
      o.items.reduce((sum, it) => sum + it.yards, 0),
      o.subtotal,
      o.deliveryCharge,
      o.discount,
      o.grandTotal,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      `"${o.courierInfo?.courierName || ''}"`,
      `"${o.courierInfo?.trackingNumber || ''}"`,
      o.estimatedDeliveryDate || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fashion_doniya_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('অর্ডার তালিকা CSV ফরম্যাটে ডাউনলোড হয়েছে', 'success');
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;

    if (orderIdSearch.trim()) {
      const qId = orderIdSearch.trim().toLowerCase();
      const matchOrder = o.orderNumber.toLowerCase().includes(qId);
      const matchTracking =
        o.courierInfo?.trackingNumber?.toLowerCase().includes(qId) || false;
      const matchName = o.customer.fullName.toLowerCase().includes(qId);
      if (!matchOrder && !matchTracking && !matchName) return false;
    }

    if (phoneSearch.trim()) {
      const cleanPhoneQuery = phoneSearch.trim().replace(/\D/g, '');
      const orderDigits = o.customer.phone.replace(/\D/g, '');
      const altDigits = (o.customer.altPhone || '').replace(/\D/g, '');
      if (
        !orderDigits.includes(cleanPhoneQuery) &&
        !altDigits.includes(cleanPhoneQuery) &&
        !o.customer.phone.includes(phoneSearch.trim())
      ) {
        return false;
      }
    }

    return true;
  });

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Returned':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Confirmed':
      case 'Processing':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">
            অর্ডার ও ট্র্যাকিং ব্যবস্থাপনা (Order & Tracking Management)
          </h2>
          <p className="text-xs text-[#242424]/60">
            অর্ডার আইডি ও ফোন নম্বর দিয়ে খুঁজুন, লাইভ স্ট্যাটাস, ট্র্যাকিং নোট এবং কুরিয়ার তথ্য আপডেট করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setIsSyncingBackend(true);
              orderService
                .syncWithBackend()
                .then((list) => {
                  setOrders(list);
                  showToast('ডাটাবেস সিঙ্ক সম্পন্ন হয়েছে', 'success');
                })
                .finally(() => setIsSyncingBackend(false));
            }}
            className="px-3 py-2.5 bg-white border border-[#EDE5D9] hover:bg-[#FAF8F4] text-[#242424] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#C5A46D] ${
                isSyncingBackend ? 'animate-spin' : ''
              }`}
            />
            <span>সিঙ্ক</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white border border-[#242424] hover:bg-[#FAF8F4] text-[#242424] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-[#C5A46D]" />
            <span>CSV এক্সপোর্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Search by Order ID and Phone Number) */}
      <div className="bg-white p-4 rounded-xl border border-[#EDE5D9] space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#242424]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderIdSearch}
              onChange={(e) => setOrderIdSearch(e.target.value)}
              placeholder="অর্ডার আইডি (FD-2026-...), কুরিয়ার ট্র্যাকিং বা নাম..."
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg pl-9 pr-3 py-2 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
            />
          </div>

          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-[#242424]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="গ্রাহকের মোবাইল নম্বর দিয়ে খুঁজুন (017...)"
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg pl-9 pr-3 py-2 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-[#242424]/60">
              মোট অর্ডার পাওয়া গেছে: <strong>{filteredOrders.length}টি</strong>
            </span>
            {(orderIdSearch || phoneSearch || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setOrderIdSearch('');
                  setPhoneSearch('');
                  setStatusFilter('all');
                }}
                className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-semibold cursor-pointer"
              >
                ফিল্টার মুছুন
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#EDE5D9]/60">
          <span className="text-[#242424]/60 whitespace-nowrap mr-1">স্ট্যাটাস:</span>
          {['all', ...ALL_STATUSES].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer text-xs ${
                statusFilter === st
                  ? 'bg-[#242424] text-white font-bold'
                  : 'bg-[#FAF8F4] text-[#242424] border border-[#EDE5D9]'
              }`}
            >
              {st === 'all' ? 'সকল অর্ডার' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                <th className="p-3">অর্ডার আইডি ও তারিখ</th>
                <th className="p-3">গ্রাহক ও ফোন</th>
                <th className="p-3">কুরিয়ার ও ট্র্যাকিং</th>
                <th className="p-3 text-right">মূল্য (৳)</th>
                <th className="p-3 text-center">পেমেন্ট</th>
                <th className="p-3 text-center">লাইভ স্ট্যাটাস পরিবর্তন</th>
                <th className="p-3 text-right">ট্র্যাকিং ও বিস্তারিত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#242424]/60">
                    কোনো অর্ডার খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalYards = order.items.reduce((s, it) => s + it.yards, 0);
                  const historyCount =
                    order.trackingHistory?.length ||
                    order.statusHistory?.length ||
                    1;

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF8F4]/50">
                      <td className="p-3">
                        <span className="font-mono font-bold text-[#242424] block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-[#242424]/50 block">
                          {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] rounded-xs text-[#242424]/70">
                          {historyCount}টি ট্র্যাকিং ইভেন্ট
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-[#242424] block">
                          {order.customer.fullName}
                        </span>
                        <span className="text-[11px] font-mono text-[#242424]/80 block">
                          {order.customer.phone}
                        </span>
                        <span className="text-[10px] text-[#242424]/50 block">
                          {order.customer.district} · {order.items.length}টি কাপড় (
                          {totalYards.toFixed(1)} গজ)
                        </span>
                        {order.items.some((it) => it.isCustomized) && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-[#850B1B]/10 text-[#850B1B] font-bold rounded text-[10px]">
                            <Scissors className="w-2.5 h-2.5" />
                            কাস্টম মাপ যুক্ত
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {order.courierInfo ? (
                          <div>
                            <span className="font-semibold text-[#242424] block">
                              {order.courierInfo.courierName}
                            </span>
                            <span className="font-mono text-[11px] text-[#C5A46D] font-bold block">
                              #{order.courierInfo.trackingNumber}
                            </span>
                            {order.estimatedDeliveryDate && (
                              <span className="text-[10px] text-[#242424]/50 block">
                                সম্ভাব্য: {order.estimatedDeliveryDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openOrderModal(order)}
                            className="text-[11px] text-[#C5A46D] hover:underline font-semibold cursor-pointer"
                          >
                            + কুরিয়ার যুক্ত করুন
                          </button>
                        )}
                      </td>

                      <td className="p-3 text-right tabular-nums">
                        <span className="font-bold text-[#242424] text-sm">
                          ৳{order.grandTotal}
                        </span>
                        {order.discount > 0 && (
                          <span className="text-[10px] text-emerald-600 block">
                            ছাড়: ৳{order.discount}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center space-y-1">
                        <div className="text-[10px] font-bold text-[#242424]">
                          {formatPaymentMethodLabel(order.paymentMethod)}
                        </div>
                        {order.paymentDetails && (
                          <div className="text-[10px] font-mono bg-[#FAF8F4] border border-[#EDE5D9] rounded px-1.5 py-0.5 text-[#242424]/80">
                            <div>প্রেরক: {order.paymentDetails.senderNumber}</div>
                            <div className="font-bold text-[#850B1B]">
                              TrxID: {order.paymentDetails.trxId}
                            </div>
                          </div>
                        )}
                        <select
                          value={order.paymentStatus}
                          onChange={(e) =>
                            handleUpdatePaymentStatus(
                              order.id,
                              e.target.value as PaymentStatus
                            )
                          }
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-xs border cursor-pointer ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.paymentStatus === 'Failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : order.paymentStatus === 'pending_verification'
                              ? 'bg-pink-50 text-pink-800 border-pink-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="pending_verification">যাচাইয়ের অপেক্ষায় (Verify)</option>
                          <option value="unpaid">অপরিশোধিত (Unpaid)</option>
                          <option value="Pending">বকেয়া (Pending)</option>
                          <option value="Paid">পরিশোধিত (Paid)</option>
                          <option value="Failed">ব্যর্থ (Failed)</option>
                        </select>
                      </td>

                      <td className="p-3 text-center">
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleQuickStatusUpdate(
                              order.id,
                              e.target.value as OrderStatus
                            )
                          }
                          className={`text-xs font-bold border rounded-md px-2 py-1 focus:outline-hidden cursor-pointer ${getStatusBadgeColor(
                            order.orderStatus
                          )}`}
                        >
                          <option value="Pending">Pending (অপেক্ষমান)</option>
                          <option value="Confirmed">Confirmed (নিশ্চিত)</option>
                          <option value="Processing">Processing (কাটিং)</option>
                          <option value="Shipped">Shipped (কুরিয়ারে)</option>
                          <option value="Out for Delivery">
                            Out for Delivery (ডেলিভারির পথে)
                          </option>
                          <option value="Delivered">Delivered (ডেলিভার্ড)</option>
                          <option value="Cancelled">Cancelled (বাতিল)</option>
                          <option value="Returned">Returned (রিটার্নড)</option>
                        </select>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => openOrderModal(order)}
                          className="px-2.5 py-1.5 bg-[#242424] hover:bg-[#C5A46D] text-white rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer text-[11px] font-semibold"
                          title="ট্র্যাকিং ও কুরিয়ার ম্যানেজ করুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ম্যানেজ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order Tracking, Courier & History Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-[#EDE5D9] p-6 space-y-6">
            {/* Modal Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE5D9] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A46D] block">
                  অর্ডার ট্র্যাকিং ও কুরিয়ার কন্ট্রোল প্যানেল
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <h3 className="text-lg font-bold text-[#242424] font-mono">
                    {selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-xs border ${getStatusBadgeColor(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {selectedOrder.orderStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    navigateTo('order-tracking', {
                      orderNumber: selectedOrder.orderNumber,
                      trackingPhone: selectedOrder.customer.phone
                    });
                  }}
                  className="px-3 py-1.5 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] border border-[#EDE5D9] rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span>গ্রাহক ট্র্যাকিং ভিউ দেখুন</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-[#FAF8F4] rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4 text-[#242424]" />
                </button>
              </div>
            </div>

            {/* Customer & Billing Summary Row (with Inline Edit Customer & Address) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9]">
              <div className="space-y-2">
                <span className="text-[#242424]/60 block text-[11px] font-bold uppercase">
                  গ্রাহকের তথ্য ও ঠিকানা সম্পাদনা:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#242424]/60 mb-0.5">নাম</label>
                    <input
                      type="text"
                      value={selectedOrder.customer.fullName}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          customer: { ...selectedOrder.customer, fullName: e.target.value }
                        })
                      }
                      className="w-full bg-white border border-[#EDE5D9] rounded px-2.5 py-1.5 font-semibold text-[#242424]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#242424]/60 mb-0.5">মোবাইল নম্বর</label>
                    <input
                      type="text"
                      value={selectedOrder.customer.phone}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          customer: { ...selectedOrder.customer, phone: e.target.value }
                        })
                      }
                      className="w-full bg-white border border-[#EDE5D9] rounded px-2.5 py-1.5 font-mono text-[#242424]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#242424]/60 mb-0.5">জেলা (District)</label>
                    <input
                      type="text"
                      value={selectedOrder.customer.district}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          customer: { ...selectedOrder.customer, district: e.target.value }
                        })
                      }
                      className="w-full bg-white border border-[#EDE5D9] rounded px-2.5 py-1.5 text-[#242424]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#242424]/60 mb-0.5">থানা/উপজেলা</label>
                    <input
                      type="text"
                      value={selectedOrder.customer.upazila || ''}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          customer: { ...selectedOrder.customer, upazila: e.target.value }
                        })
                      }
                      className="w-full bg-white border border-[#EDE5D9] rounded px-2.5 py-1.5 text-[#242424]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-[#242424]/60 mb-0.5">সম্পূর্ণ ডেলিভারি ঠিকানা</label>
                    <input
                      type="text"
                      value={selectedOrder.customer.fullAddress}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          customer: { ...selectedOrder.customer, fullAddress: e.target.value }
                        })
                      }
                      className="w-full bg-white border border-[#EDE5D9] rounded px-2.5 py-1.5 text-[#242424]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    api.put(`/admin/orders/${encodeURIComponent(selectedOrder.id)}`, {
                      customer: selectedOrder.customer
                    })
                      .then((r) => {
                        if (r.data?.order) {
                          orderService.syncAdminOrders().then(() => reloadOrders());
                          showToast('গ্রাহকের তথ্য ও ঠিকানা আপডেট হয়েছে', 'success');
                        }
                      })
                      .catch((err) => {
                        showToast(
                          err?.response?.data?.message || 'গ্রাহকের তথ্য আপডেট করা যায়নি',
                          'error'
                        );
                      });
                  }}
                  className="px-3 py-1.5 bg-[#242424] hover:bg-[#C5A46D] text-white rounded-md text-[11px] font-semibold cursor-pointer"
                >
                  গ্রাহক ও ঠিকানা সেভ করুন
                </button>
              </div>

              <div>
                <span className="text-[#242424]/60 block text-[11px]">
                  ডেলিভারি ঠিকানা ও বিল সারসংক্ষেপ:
                </span>
                <p className="text-[#242424] font-medium">
                  {selectedOrder.customer.fullAddress}
                </p>
                <p className="text-[#242424]/70">
                  {selectedOrder.customer.upazila
                    ? `${selectedOrder.customer.upazila}, `
                    : ''}
                  {selectedOrder.customer.district}
                </p>
                <p className="font-bold text-[#242424] mt-1">
                  মোট বিল: ৳{selectedOrder.grandTotal} ({formatPaymentMethodLabel(selectedOrder.paymentMethod)}{' '}
                  - {selectedOrder.paymentStatus})
                </p>
                {selectedOrder.paymentDetails && (
                  <div className="mt-2 p-2.5 bg-white rounded-lg border border-[#EDE5D9] space-y-1 text-[11px]">
                    <div className="font-bold text-[#850B1B]">
                      ম্যানুয়াল পেমেন্ট বিবরণ ({selectedOrder.paymentDetails.accountType}):
                    </div>
                    <div className="font-mono text-[#242424]">
                      প্রেরক নম্বর: <strong>{selectedOrder.paymentDetails.senderNumber}</strong> · রিসিভার: {selectedOrder.paymentDetails.receiverNumber}
                    </div>
                    <div className="font-mono text-[#242424]">
                      TrxID: <strong className="bg-amber-100 px-1.5 py-0.5 rounded">{selectedOrder.paymentDetails.trxId}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2-Column Admin Management Grid: Status/Tracking Notes + Courier Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Update Status & Add Tracking History Note */}
              <form
                onSubmit={handleModalStatusAndNoteSubmit}
                className="p-4 rounded-xl border border-[#EDE5D9] bg-white space-y-3.5 text-xs"
              >
                <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
                  <span className="font-bold text-[#242424] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#C5A46D]" />
                    <span>১. স্ট্যাটাস ও ট্র্যাকিং নোট আপডেট</span>
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    অর্ডার স্ট্যাটাস নির্বাচন করুন
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as OrderStatus)}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-bold text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    লোকেশন / অপারেশন হাব (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={trackingLocation}
                    onChange={(e) => setTrackingLocation(e.target.value)}
                    placeholder="উদাঃ ঢাকা ওয়্যারহাউস / ধানমন্ডি হাব"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    অ্যাডমিন ট্র্যাকিং নোট (গ্রাহক টাইমলাইনে দেখবে)
                  </label>
                  <textarea
                    rows={2}
                    value={trackingNote}
                    onChange={(e) => setTrackingNote(e.target.value)}
                    placeholder="উদাঃ ৬ গজ জামদানি থান কাটিং ও কোয়ালিটি চেক সম্পন্ন হয়েছে..."
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>স্ট্যাটাস ও হিস্ট্রি সেভ করুন</span>
                  </button>
                </div>

                {/* Quick Delivery / Cancel / Return Actions */}
                <div className="pt-2 border-t border-[#EDE5D9] flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[#242424]/60">দ্রুত অ্যাকশন:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = orderService.updateOrderStatus(
                        selectedOrder.id,
                        'Delivered',
                        'গ্রাহকের হাতে সফলভাবে পার্সেলটি ডেলিভারি সম্পন্ন হয়েছে।'
                      );
                      if (updated) {
                        setSelectedOrder(updated);
                        setModalStatus('Delivered');
                        reloadOrders();
                        showToast('অর্ডারটি Delivered হিসেবে চিহ্নিত হয়েছে', 'success');
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xs font-semibold cursor-pointer"
                  >
                    ✓ ডেলিভার্ড সম্পন্ন
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = orderService.updateOrderStatus(
                        selectedOrder.id,
                        'Cancelled',
                        trackingNote.trim() ||
                          'গ্রাহকের অনুরোধে বা স্টক জনিত কারণে অর্ডারটি বাতিল করা হয়েছে।'
                      );
                      if (updated) {
                        setSelectedOrder(updated);
                        setModalStatus('Cancelled');
                        reloadOrders();
                        showToast('অর্ডারটি বাতিল (Cancelled) করা হয়েছে', 'info');
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xs font-semibold cursor-pointer"
                  >
                    ✕ অর্ডার বাতিল
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = orderService.updateOrderStatus(
                        selectedOrder.id,
                        'Returned',
                        trackingNote.trim() ||
                          'পার্সেলটি ডেলিভারি না হওয়ায় রিটার্ন হিসেবে ফেরত এসেছে।'
                      );
                      if (updated) {
                        setSelectedOrder(updated);
                        setModalStatus('Returned');
                        reloadOrders();
                        showToast('অর্ডারটি Returned হিসেবে চিহ্নিত হয়েছে', 'info');
                      }
                    }}
                    className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xs font-semibold cursor-pointer"
                  >
                    ↺ রিটার্ন মার্ক করুন
                  </button>
                </div>
              </form>

              {/* Right Column: Courier Information & Courier API Sync */}
              <div className="p-4 rounded-xl border border-[#EDE5D9] bg-white space-y-4 text-xs">
                <form onSubmit={handleSaveCourierInfo} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
                    <span className="font-bold text-[#242424] uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#C5A46D]" />
                      <span>২. কুরিয়ার ও ট্র্যাকিং তথ্য (Courier Info)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        কুরিয়ার কোম্পানি <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                      >
                        {BANGLADESH_COURIERS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        কুরিয়ার ট্র্যাকিং নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="উদাঃ SF-BD-984512"
                        required
                        className="w-full font-mono bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        সম্ভাব্য ডেলিভারি তারিখ
                      </label>
                      <input
                        type="date"
                        value={estimatedDeliveryDate}
                        onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        কনসাইনমেন্ট আইডি (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={consignmentId}
                        onChange={(e) => setConsignmentId(e.target.value)}
                        placeholder="উদাঃ CN-2026-88412"
                        className="w-full font-mono bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#242424]/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoMarkShipped}
                      onChange={(e) => setAutoMarkShipped(e.target.checked)}
                      className="accent-[#C5A46D]"
                    />
                    <span>কুরিয়ার সেভ করার সাথে সাথে স্ট্যাটাস "Shipped" করুন</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#6B0812] hover:bg-[#55060E] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>কুরিয়ার তথ্য সংরক্ষণ করুন</span>
                  </button>
                </form>

                {/* Courier Webhook / API Synchronization Box */}
                <div className="pt-3 border-t border-[#EDE5D9] space-y-2">
                  <span className="font-bold text-[#242424] block text-[11px] uppercase tracking-wider">
                    কুরিয়ার API ও ওয়েবহুক সিঙ্ক (Courier Status Sync):
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedWebhookStage}
                      onChange={(e) => setSelectedWebhookStage(e.target.value)}
                      className="flex-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-2.5 py-1.5 text-xs text-[#242424]"
                    >
                      <option value="Picked Up by Courier">
                        Picked Up by Courier (কুরিয়ার পিকআপ সম্পন্ন)
                      </option>
                      <option value="In Transit to Destination Hub">
                        In Transit to Destination Hub (হাব ট্রানজিটে)
                      </option>
                      <option value="Out for Delivery">
                        Out for Delivery (রাইডার ডেলিভারির পথে)
                      </option>
                      <option value="Delivered">
                        Delivered (কুরিয়ার ডেলিভারি সম্পন্ন)
                      </option>
                      <option value="Returned">
                        Returned (কুরিয়ার রিটার্ন)
                      </option>
                    </select>
                    <button
                      type="button"
                      disabled={isCourierSyncing}
                      onClick={handleCourierSync}
                      className="px-3 py-1.5 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] border border-[#C5A46D] rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-[#C5A46D] ${
                          isCourierSyncing ? 'animate-spin' : ''
                        }`}
                      />
                      <span>কুরিয়ার সিঙ্ক করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Order Tracking History Timeline in Admin Modal */}
            <div className="space-y-3 pt-2 border-t border-[#EDE5D9]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#242424] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#C5A46D]" />
                <span>
                  সম্পূর্ণ অর্ডার ট্র্যাকিং হিস্ট্রি (
                  {(
                    selectedOrder.trackingHistory ||
                    selectedOrder.statusHistory ||
                    []
                  ).length}
                  টি রেকর্ড)
                </span>
              </span>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {(
                  selectedOrder.trackingHistory ||
                  selectedOrder.statusHistory ||
                  []
                )
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border ${getStatusBadgeColor(
                              h.status
                            )}`}
                          >
                            {h.status}
                          </span>
                          {h.location && (
                            <span className="text-[11px] text-[#242424]/60">
                              📍 {h.location}
                            </span>
                          )}
                          {h.updatedBy && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-white border border-[#EDE5D9] rounded-xs text-[#242424]/60">
                              {h.updatedBy}
                            </span>
                          )}
                        </div>
                        <p className="text-[#242424] font-medium mt-1">{h.note}</p>
                      </div>

                      <span className="text-[11px] text-[#242424]/60 font-mono whitespace-nowrap">
                        {new Date(h.timestamp).toLocaleString('bn-BD', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Ordered Items Summary & Customer Custom Measurements */}
            <div className="space-y-2.5 pt-2 border-t border-[#EDE5D9]">
              <span className="text-xs font-bold text-[#242424] flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#850B1B]" />
                <span>অর্ডারকৃত কাপড়, গজ এবং গ্রাহকের কাস্টম মাপ বিবরণী:</span>
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {selectedOrder.items.map((item, idx) => {
                  const measurementSummary = formatMeasurementsSummary(item.customMeasurements);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-[#EDE5D9] space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#242424] text-sm">
                              {item.productName}
                            </span>
                            {item.outfitCategory && (
                              <span className="px-2 py-0.5 bg-[#850B1B] text-white font-bold rounded text-[11px]">
                                পোশাক: {item.outfitCategory}
                              </span>
                            )}
                            {item.isCustomized ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#850B1B]/10 text-[#850B1B] font-bold rounded text-[11px]">
                                <Scissors className="w-3 h-3" />
                                নিজের মাপে কাস্টমাইজড
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] text-[#242424]/70 font-semibold rounded text-[11px]">
                                স্ট্যান্ডার্ড সাইজ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#242424]/70 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {item.outfitCategory && (
                              <span className="text-[#850B1B] font-bold">
                                ডিজাইনের ধরণ: <strong>{item.outfitCategory}</strong>
                              </span>
                            )}
                            <span>বহর: <strong>{item.fabricWidth} হাত</strong></span>
                            <span>রং: <strong>{item.color}</strong></span>
                            <span>স্ট্যান্ডার্ড গজ: <strong>{item.standardGaj ?? item.yards} গজ</strong></span>
                            <span>নির্বাচিত গজ: <strong className="text-[#850B1B]">{item.yards} গজ</strong></span>
                            {item.additionalGaj !== undefined && item.additionalGaj > 0 && (
                              <span className="text-[#850B1B] font-bold">
                                অতিরিক্ত গজ: +{item.additionalGaj} গজ
                              </span>
                            )}
                            <span>দাম: ৳{item.pricePerYard}/গজ</span>
                          </div>
                        </div>
                        <span className="font-bold tabular-nums text-sm text-[#850B1B]">
                          ৳{item.subtotal}
                        </span>
                      </div>

                      {item.isCustomized && (
                        <div className="p-2.5 bg-[#FAF8F4] rounded-md border border-[#EDE5D9] space-y-1 text-xs">
                          <div className="text-[#242424]">
                            <strong className="text-[#850B1B]">গ্রাহকের প্রদত্ত মাপ:</strong>{' '}
                            {measurementSummary || 'কোনো নির্দিষ্ট ইঞ্চি মাপ দেওয়া হয়নি (শুধু কাস্টম গজ নির্বাচিত)'}
                          </div>
                          {item.customizationNotes && (
                            <div className="text-[#242424]/80">
                              <strong>কাস্টমাইজেশন নোট:</strong> {item.customizationNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EDE5D9]">
              <button
                onClick={() => {
                  setLastCompletedOrder(selectedOrder);
                  setSelectedOrder(null);
                  navigateTo('order-confirmation');
                }}
                className="px-3.5 py-2 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] border border-[#EDE5D9] rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#C5A46D]" />
                <span>রশিদ / ইনভয়েস প্রিন্ট ভিউ</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-[#242424] text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
