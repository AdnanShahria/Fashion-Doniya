import {
  Order,
  OrderStatus,
  OrderTrackingHistory,
  CourierInformation,
  PaymentStatus
} from '../types';
import { StorageService } from './storageService';

export const ADMIN_API_TOKEN = 'fd-admin-secure-2026';

export interface TrackingVerificationResult {
  success: boolean;
  code:
    | 'SUCCESS'
    | 'MISSING_FIELDS'
    | 'INVALID_PHONE'
    | 'ORDER_NOT_FOUND'
    | 'PHONE_MISMATCH'
    | 'RATE_LIMITED'
    | 'SERVER_ERROR';
  message: string;
  order?: Order;
}

const ORDER_CHANNEL_NAME = 'fashion_doniya_order_updates';
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(ORDER_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel not supported in some environments
}

function notifyLocalOrderSubscribers(order?: Order) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'ORDER_UPDATED',
        order,
        timestamp: new Date().toISOString()
      });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fashion-doniya-order-updated', { detail: { order } })
      );
    }
  } catch {
    // ignore
  }
}

export function buildCourierTrackingUrl(
  courierName: string,
  trackingNumber: string
): string | undefined {
  const cleanName = courierName.toLowerCase();
  const code = encodeURIComponent(trackingNumber.trim());
  if (!code) return undefined;
  if (cleanName.includes('steadfast')) {
    return `https://steadfast.com.bd/t/${code}`;
  }
  if (cleanName.includes('pathao')) {
    return `https://merchant.pathao.com/tracking?consignment_id=${code}`;
  }
  if (cleanName.includes('redx')) {
    return `https://redx.com.bd/track-global-parcel/?trackingId=${code}`;
  }
  if (cleanName.includes('paperfly')) {
    return `https://go.paperfly.com.bd/track/order/${code}`;
  }
  if (cleanName.includes('sundarban')) {
    return `https://tracking.sundarbancourierltd.com/?cn=${code}`;
  }
  return undefined;
}

function saveServerOrderSnapshotToLocal(order: Order) {
  StorageService.initialize();
  const rawOrders = StorageService.getRawOrders();
  const idx = rawOrders.findIndex(
    (o) =>
      o.id === order.id ||
      o.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
  );
  if (idx >= 0) {
    rawOrders[idx] = order;
  } else {
    rawOrders.unshift(order);
  }
  StorageService.setOrders(rawOrders);

  if (order.trackingHistory && order.trackingHistory.length > 0) {
    const allHistory = StorageService.getOrderTrackingHistory().filter(
      (h) =>
        h.orderId !== order.id &&
        h.orderNumber.toUpperCase() !== order.orderNumber.toUpperCase()
    );
    StorageService.setOrderTrackingHistory([...allHistory, ...order.trackingHistory]);
  }

  if (order.courierInfo) {
    const allCouriers = StorageService.getCourierInformation().filter(
      (c) =>
        c.orderId !== order.id &&
        c.orderNumber.toUpperCase() !== order.orderNumber.toUpperCase()
    );
    StorageService.setCourierInformation([...allCouriers, order.courierInfo]);
  }
}

export const orderService = {
  getAllOrders(): Order[] {
    StorageService.initialize();
    return StorageService.getOrders();
  },

  getOrderById(id: string): Order | undefined {
    const clean = id.trim().toUpperCase();
    return this.getAllOrders().find(
      (o) => o.id.toUpperCase() === clean || o.orderNumber.toUpperCase() === clean
    );
  },

  // Sync local storage with backend database
  async syncWithBackend(): Promise<Order[]> {
    StorageService.initialize();
    const localOrders = StorageService.getOrders();
    try {
      const response = await fetch('/api/orders/sync-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: localOrders })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.orders)) {
          StorageService.setOrders(data.orders);
          if (Array.isArray(data.order_tracking_history)) {
            StorageService.setOrderTrackingHistory(data.order_tracking_history);
          }
          if (Array.isArray(data.courier_information)) {
            StorageService.setCourierInformation(data.courier_information);
          }
          return StorageService.getOrders();
        }
      }
    } catch {
      // Fallback to local relational store if offline
    }
    return localOrders;
  },

  // Strict local verification (validates both Order ID and Phone Number)
  verifyOrderTrackingLocal(
    rawOrderId: string,
    rawPhone: string
  ): TrackingVerificationResult {
    const cleanOrderId = rawOrderId.trim().toUpperCase();
    const cleanPhoneRaw = rawPhone.trim();

    if (!cleanOrderId || !cleanPhoneRaw) {
      return {
        success: false,
        code: 'MISSING_FIELDS',
        message:
          'অর্ডার ট্র্যাক করতে আপনার অর্ডার আইডি এবং অর্ডারে ব্যবহৃত মোবাইল নম্বর উভয়ই প্রদান করুন।'
      };
    }

    const normalizedPhone = StorageService.normalizePhone(cleanPhoneRaw);
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      return {
        success: false,
        code: 'INVALID_PHONE',
        message:
          'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01711223344)।'
      };
    }

    const orders = this.getAllOrders();
    const matchedOrder = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === cleanOrderId ||
        o.id.toUpperCase() === cleanOrderId
    );

    if (!matchedOrder) {
      return {
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `"${rawOrderId.trim()}" অর্ডার আইডি দিয়ে আমাদের ডাটাবেসে কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে ইনভয়েস বা এসএমএস দেখে সঠিক অর্ডার আইডি দিন।`
      };
    }

    const orderPrimaryPhone = StorageService.normalizePhone(
      matchedOrder.customer.phone
    );
    const orderAltPhone = matchedOrder.customer.altPhone
      ? StorageService.normalizePhone(matchedOrder.customer.altPhone)
      : '';

    const isVerified =
      normalizedPhone === orderPrimaryPhone ||
      (Boolean(orderAltPhone) && normalizedPhone === orderAltPhone);

    if (!isVerified) {
      return {
        success: false,
        code: 'PHONE_MISMATCH',
        message:
          'প্রদত্ত মোবাইল নম্বরটি এই অর্ডার আইডির সাথে মিলছে না। গ্রাহকের তথ্যের নিরাপত্তার স্বার্থে অর্ডারে ব্যবহৃত সঠিক মোবাইল নম্বরটি দিন।'
      };
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: 'অর্ডার সফলভাবে যাচাই করা হয়েছে।',
      order: matchedOrder
    };
  },

  // Server-verified Order Tracking lookup with automatic sync
  async verifyOrderTrackingAsync(
    rawOrderId: string,
    rawPhone: string
  ): Promise<TrackingVerificationResult> {
    const cleanOrderId = rawOrderId.trim();
    const cleanPhone = rawPhone.trim();

    if (!cleanOrderId || !cleanPhone) {
      return {
        success: false,
        code: 'MISSING_FIELDS',
        message:
          'অর্ডার ট্র্যাক করতে আপনার অর্ডার আইডি এবং অর্ডারে ব্যবহৃত মোবাইল নম্বর উভয়ই প্রদান করুন।'
      };
    }

    const normalizedPhone = StorageService.normalizePhone(cleanPhone);
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      return {
        success: false,
        code: 'INVALID_PHONE',
        message:
          'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01711223344)।'
      };
    }

    try {
      // Ensure local orders are synced to backend first
      await this.syncWithBackend();

      const response = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: cleanOrderId,
          phone: normalizedPhone
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.order) {
        saveServerOrderSnapshotToLocal(data.order);
        return {
          success: true,
          code: 'SUCCESS',
          message: 'অর্ডার সফলভাবে যাচাই করা হয়েছে।',
          order: data.order
        };
      }

      if (data && data.code) {
        return {
          success: false,
          code: data.code,
          message: data.message || 'অর্ডার যাচাই করা সম্ভব হয়নি।'
        };
      }
    } catch {
      // Fallback to local relational verification if API is unreachable
    }

    return this.verifyOrderTrackingLocal(cleanOrderId, cleanPhone);
  },

  findOrderByTracking(query: string, phone?: string): Order | undefined {
    if (!phone || !phone.trim()) return undefined;
    const res = this.verifyOrderTrackingLocal(query, phone);
    return res.success ? res.order : undefined;
  },

  // Create Order (writes to relational tables + backend API)
  createOrder(
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'statusHistory'>
  ): Order {
    StorageService.initialize();
    const orders = StorageService.getRawOrders();
    const existingNumbers = new Set(
      orders.map((o) => o.orderNumber.toUpperCase())
    );

    let orderNumber = `FD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    for (let i = 0; i < 50; i++) {
      if (!existingNumbers.has(orderNumber)) break;
      orderNumber = `FD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const now = new Date().toISOString();
    const orderId = `ord-${Date.now()}`;
    const normalizedPhone = StorageService.normalizePhone(
      orderData.customer.phone
    );

    const isDhaka =
      orderData.customer.district.toLowerCase().includes('ঢাকা') ||
      orderData.customer.district.toLowerCase().includes('dhaka');
    const estimatedDeliveryDate = new Date(
      Date.now() + (isDhaka ? 3 : 5) * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];

    const initialTracking: OrderTrackingHistory = {
      id: `trk-${Date.now()}-1`,
      orderId,
      orderNumber,
      status: orderData.orderStatus || 'Pending',
      timestamp: now,
      note: 'অর্ডারটি সফলভাবে গৃহীত হয়েছে এবং ভেরিফিকেশনের জন্য অপেক্ষমান রয়েছে।',
      location: 'অনলাইন স্টোর (Fashion Doniya BD)',
      updatedBy: 'Customer'
    };

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber,
      customer: {
        ...orderData.customer,
        phone: normalizedPhone || orderData.customer.phone.trim()
      },
      createdAt: now,
      updatedAt: now,
      estimatedDeliveryDate,
      trackingHistory: [initialTracking],
      statusHistory: [initialTracking]
    };

    orders.unshift(newOrder);
    StorageService.setOrders(orders);

    const allHistory = StorageService.getOrderTrackingHistory();
    allHistory.push(initialTracking);
    StorageService.setOrderTrackingHistory(allHistory);

    notifyLocalOrderSubscribers(newOrder);

    // Persist asynchronously to the Express backend database
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.order) {
          saveServerOrderSnapshotToLocal(data.order);
          notifyLocalOrderSubscribers(data.order);
        }
      })
      .catch(() => {
        // Synced on next connection
      });

    return newOrder;
  },

  // Update Order Status + Create timestamped order_tracking_history record
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    location?: string,
    estimatedDeliveryDate?: string
  ): Order | null {
    StorageService.initialize();
    const rawOrders = StorageService.getRawOrders();
    const order = rawOrders.find(
      (o) =>
        o.id === orderId ||
        o.orderNumber.toUpperCase() === orderId.toUpperCase()
    );
    if (!order) return null;

    const defaultStatusNotes: Record<OrderStatus, string> = {
      Pending: 'অর্ডারটি সিস্টেমে অপেক্ষমান (Pending) অবস্থায় রয়েছে।',
      Confirmed:
        'গ্রাহকের সাথে ফোনে কথা বলে অর্ডারটি নিশ্চিত (Confirmed) করা হয়েছে।',
      Processing:
        'ফেব্রিক রোল থেকে সঠিক মাপে কাটিং, ফিনিশিং ও কোয়ালিটি চেক চলছে।',
      Shipped:
        'পার্সেলটি ডেলিভারির জন্য কুরিয়ার সার্ভিসে হস্তান্তর করা হয়েছে।',
      'Out for Delivery':
        'ডেলিভারি রাইডার পার্সেলটি নিয়ে গ্রাহকের ঠিকানায় রওনা হয়েছেন।',
      Delivered:
        'অর্ডারটি সফলভাবে গ্রাহকের কাছে ডেলিভারি সম্পন্ন হয়েছে।',
      Cancelled: 'অর্ডারটি বাতিল (Cancelled) করা হয়েছে।',
      Returned: 'পার্সেলটি রিটার্ন (Returned) হিসেবে ওয়্যারহাউসে ফেরত এসেছে।'
    };

    const now = new Date().toISOString();
    order.orderStatus = status;
    order.updatedAt = now;
    if (estimatedDeliveryDate) {
      order.estimatedDeliveryDate = estimatedDeliveryDate;
    }
    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    const historyEntry: OrderTrackingHistory = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status,
      timestamp: now,
      note: note?.trim() || defaultStatusNotes[status],
      location: location?.trim() || 'Fashion Doniya BD অপারেশন সেন্টার',
      updatedBy: 'Admin'
    };

    const allHistory = StorageService.getOrderTrackingHistory();
    allHistory.push(historyEntry);
    StorageService.setOrderTrackingHistory(allHistory);
    StorageService.setOrders(rawOrders);

    const hydrated = this.getOrderById(order.id) || order;
    notifyLocalOrderSubscribers(hydrated);

    // Sync to backend API
    fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_API_TOKEN
      },
      body: JSON.stringify({
        status,
        note: historyEntry.note,
        location: historyEntry.location,
        estimatedDeliveryDate
      })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.order) {
          saveServerOrderSnapshotToLocal(data.order);
          notifyLocalOrderSubscribers(data.order);
        }
      })
      .catch(() => {
        // Handled locally
      });

    return hydrated;
  },

  // Add a tracking note / event to order_tracking_history
  addTrackingHistoryNote(
    orderId: string,
    note: string,
    location?: string,
    status?: OrderStatus
  ): Order | null {
    StorageService.initialize();
    const rawOrders = StorageService.getRawOrders();
    const order = rawOrders.find(
      (o) =>
        o.id === orderId ||
        o.orderNumber.toUpperCase() === orderId.toUpperCase()
    );
    if (!order || !note.trim()) return null;

    const now = new Date().toISOString();
    const effectiveStatus = status || order.orderStatus;
    if (status && status !== order.orderStatus) {
      order.orderStatus = status;
      if (status === 'Delivered') {
        order.paymentStatus = 'Paid';
      }
    }
    order.updatedAt = now;

    const historyEntry: OrderTrackingHistory = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: effectiveStatus,
      timestamp: now,
      note: note.trim(),
      location: location?.trim() || 'Fashion Doniya BD ডেস্ক',
      updatedBy: 'Admin'
    };

    const allHistory = StorageService.getOrderTrackingHistory();
    allHistory.push(historyEntry);
    StorageService.setOrderTrackingHistory(allHistory);
    StorageService.setOrders(rawOrders);

    const hydrated = this.getOrderById(order.id) || order;
    notifyLocalOrderSubscribers(hydrated);

    fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_API_TOKEN
      },
      body: JSON.stringify({
        note: historyEntry.note,
        location: historyEntry.location,
        status: effectiveStatus
      })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.order) {
          saveServerOrderSnapshotToLocal(data.order);
          notifyLocalOrderSubscribers(data.order);
        }
      })
      .catch(() => {});

    return hydrated;
  },

  // Save or update Courier Information in courier_information table
  updateCourierInformation(
    orderId: string,
    courierData: {
      courierName: string;
      trackingNumber: string;
      consignmentId?: string;
      estimatedDeliveryDate?: string;
      trackingUrl?: string;
      courierStatus?: string;
      autoMarkShipped?: boolean;
      note?: string;
    }
  ): Order | null {
    StorageService.initialize();
    const rawOrders = StorageService.getRawOrders();
    const order = rawOrders.find(
      (o) =>
        o.id === orderId ||
        o.orderNumber.toUpperCase() === orderId.toUpperCase()
    );
    if (!order) return null;

    const now = new Date().toISOString();
    const courierName = courierData.courierName.trim();
    const trackingNumber = courierData.trackingNumber.trim();
    const trackingUrl =
      courierData.trackingUrl?.trim() ||
      buildCourierTrackingUrl(courierName, trackingNumber);
    const isApiConnected = /steadfast|pathao|redx|paperfly|sundarban/i.test(
      courierName
    );

    const allCouriers = StorageService.getCourierInformation();
    const existingIdx = allCouriers.findIndex(
      (c) =>
        c.orderId === order.id ||
        c.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
    );

    const courierRecord: CourierInformation = {
      id: existingIdx >= 0 ? allCouriers[existingIdx].id : `cr-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      courierName,
      trackingNumber,
      consignmentId: courierData.consignmentId?.trim() || trackingNumber,
      estimatedDeliveryDate:
        courierData.estimatedDeliveryDate || order.estimatedDeliveryDate,
      trackingUrl,
      courierStatus:
        courierData.courierStatus || 'Booked / Handed over to Courier',
      lastSyncedAt: now,
      isApiConnected,
      updatedAt: now
    };

    if (existingIdx >= 0) {
      allCouriers[existingIdx] = courierRecord;
    } else {
      allCouriers.push(courierRecord);
    }
    StorageService.setCourierInformation(allCouriers);

    if (courierData.estimatedDeliveryDate) {
      order.estimatedDeliveryDate = courierData.estimatedDeliveryDate;
    }
    if (
      courierData.autoMarkShipped &&
      ['Pending', 'Confirmed', 'Processing'].includes(order.orderStatus)
    ) {
      order.orderStatus = 'Shipped';
    }
    order.updatedAt = now;
    StorageService.setOrders(rawOrders);

    const historyEntry: OrderTrackingHistory = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      timestamp: now,
      note:
        courierData.note?.trim() ||
        `কুরিয়ার তথ্য সংরক্ষিত হয়েছে: ${courierName} (ট্র্যাকিং নম্বর: ${trackingNumber})${
          courierData.estimatedDeliveryDate
            ? ` · সম্ভাব্য ডেলিভারি: ${courierData.estimatedDeliveryDate}`
            : ''
        }`,
      location: `${courierName} হাব`,
      updatedBy: 'Admin'
    };

    const allHistory = StorageService.getOrderTrackingHistory();
    allHistory.push(historyEntry);
    StorageService.setOrderTrackingHistory(allHistory);

    const hydrated = this.getOrderById(order.id) || order;
    notifyLocalOrderSubscribers(hydrated);

    fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/courier`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_API_TOKEN
      },
      body: JSON.stringify(courierData)
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.order) {
          saveServerOrderSnapshotToLocal(data.order);
          notifyLocalOrderSubscribers(data.order);
        }
      })
      .catch(() => {});

    return hydrated;
  },

  // Synchronize Courier API status
  async syncCourierStatusAsync(
    orderId: string,
    courierStatus?: string,
    location?: string
  ): Promise<Order | null> {
    try {
      const response = await fetch(
        `/api/courier/sync/${encodeURIComponent(orderId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': ADMIN_API_TOKEN
          },
          body: JSON.stringify({ courierStatus, location })
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data.order) {
          saveServerOrderSnapshotToLocal(data.order);
          notifyLocalOrderSubscribers(data.order);
          return data.order;
        }
      }
    } catch {
      // Fallback local sync
    }

    const order = this.getOrderById(orderId);
    if (!order || !order.courierInfo) return null;

    if (courierStatus) {
      const s = courierStatus.toLowerCase();
      let mapped: OrderStatus = order.orderStatus;
      if (s.includes('deliver') && !s.includes('out')) mapped = 'Delivered';
      else if (s.includes('out')) mapped = 'Out for Delivery';
      else if (s.includes('return')) mapped = 'Returned';
      else if (s.includes('cancel')) mapped = 'Cancelled';
      else if (s.includes('transit') || s.includes('picked')) mapped = 'Shipped';

      return this.updateOrderStatus(
        order.id,
        mapped,
        `${order.courierInfo.courierName} কুরিয়ার সিঙ্ক আপডেট: ${courierStatus}`,
        location || `${order.courierInfo.courierName} (${order.customer.district} হাব)`
      );
    }

    return order;
  },

  updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus
  ): Order | null {
    StorageService.initialize();
    const rawOrders = StorageService.getRawOrders();
    const order = rawOrders.find(
      (o) =>
        o.id === orderId ||
        o.orderNumber.toUpperCase() === orderId.toUpperCase()
    );
    if (!order) return null;

    order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();
    StorageService.setOrders(rawOrders);

    const hydrated = this.getOrderById(order.id) || order;
    notifyLocalOrderSubscribers(hydrated);

    fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/payment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_API_TOKEN
      },
      body: JSON.stringify({ paymentStatus })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.order) {
          saveServerOrderSnapshotToLocal(data.order);
          notifyLocalOrderSubscribers(data.order);
        }
      })
      .catch(() => {});

    return hydrated;
  },

  cancelOrder(orderId: string, reason?: string): Order | null {
    return this.updateOrderStatus(
      orderId,
      'Cancelled',
      reason || 'অর্ডারটি বাতিল করা হয়েছে'
    );
  },

  // Subscribe to real-time updates (SSE + BroadcastChannel + CustomEvent + Storage Event)
  subscribeToOrderUpdates(
    params: { orderNumber?: string; phone?: string; isAdmin?: boolean },
    onUpdate: (updatedOrder?: Order) => void
  ): () => void {
    let eventSource: EventSource | null = null;

    try {
      const qs = new URLSearchParams();
      if (params.isAdmin) {
        qs.set('adminToken', ADMIN_API_TOKEN);
      } else if (params.orderNumber && params.phone) {
        qs.set('orderNumber', params.orderNumber.trim().toUpperCase());
        qs.set('phone', StorageService.normalizePhone(params.phone));
      }

      if (params.isAdmin || (params.orderNumber && params.phone)) {
        eventSource = new EventSource(`/api/orders/stream?${qs.toString()}`);
        eventSource.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data);
            if (parsed.type === 'ORDER_UPDATED' && parsed.order) {
              saveServerOrderSnapshotToLocal(parsed.order);
              onUpdate(parsed.order);
            }
          } catch {
            // ignore
          }
        };
      }
    } catch {
      // SSE optional fallback
    }

    const handleCustomEvent = (e: Event) => {
      const customEv = e as CustomEvent<{ order?: Order }>;
      const updated = customEv.detail?.order;
      if (params.isAdmin) {
        onUpdate(updated);
      } else if (
        updated &&
        params.orderNumber &&
        updated.orderNumber.toUpperCase() ===
          params.orderNumber.trim().toUpperCase()
      ) {
        onUpdate(updated);
      }
    };

    const handleBroadcast = (ev: MessageEvent) => {
      if (ev.data?.type === 'ORDER_UPDATED') {
        const updated: Order | undefined = ev.data.order;
        if (params.isAdmin) {
          onUpdate(updated);
        } else if (
          updated &&
          params.orderNumber &&
          updated.orderNumber.toUpperCase() ===
            params.orderNumber.trim().toUpperCase()
        ) {
          onUpdate(updated);
        }
      }
    };

    const handleStorage = (ev: StorageEvent) => {
      if (
        ev.key &&
        (ev.key.includes('fashion_doniya_orders') ||
          ev.key.includes('fashion_doniya_order_tracking_history') ||
          ev.key.includes('fashion_doniya_courier_information'))
      ) {
        if (params.isAdmin) {
          onUpdate(undefined);
        } else if (params.orderNumber && params.phone) {
          const verified = this.verifyOrderTrackingLocal(
            params.orderNumber,
            params.phone
          );
          if (verified.success && verified.order) {
            onUpdate(verified.order);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('fashion-doniya-order-updated', handleCustomEvent);
      window.addEventListener('storage', handleStorage);
    }
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'fashion-doniya-order-updated',
          handleCustomEvent
        );
        window.removeEventListener('storage', handleStorage);
      }
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
    };
  }
};
