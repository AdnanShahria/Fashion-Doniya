import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { orderService } from '../../services/orderService';
import { categoryService } from '../../services/categoryService';
import { formatPaymentMethodLabel } from '../../services/settingsService';
import { api } from '../../services/api';
import {
  ActivityLog,
  ContactMessageRecord,
  CustomDesignRequest,
  CustomerUser,
  Order,
  OrderStatus,
} from '../../types';
import {
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  Layers,
  Activity,
  BarChart3,
  RefreshCw,
  Plus,
  CreditCard,
  Palette,
  Mail,
  Scissors,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

type TimeRange = 'today' | '7d' | '30d' | 'all';

interface BulkStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
}

const STATUS_DISPLAY: Array<{
  key: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  label: string;
  barClass: string;
  badgeClass: string;
}> = [
  {
    key: 'Pending',
    label: 'পেন্ডিং (Pending)',
    barClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    key: 'Confirmed',
    label: 'কনফার্মড (Confirmed)',
    barClass: 'bg-sky-600',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  {
    key: 'Processing',
    label: 'কাটিং ও প্রসেসিং',
    barClass: 'bg-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    key: 'Shipped',
    label: 'কুরিয়ারে / পথে',
    barClass: 'bg-[#C5A46D]',
    badgeClass: 'bg-[#FAF6F0] text-[#850B1B] border-[#C5A46D]/40',
  },
  {
    key: 'Delivered',
    label: 'সম্পন্ন (Delivered)',
    barClass: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    key: 'Cancelled',
    label: 'বাতিল / রিটার্ন',
    barClass: 'bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

function getOrderStatusBadge(status: OrderStatus): string {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Cancelled':
    case 'Returned':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Shipped':
    case 'Out for Delivery':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Processing':
    case 'Confirmed':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

function normalizeMethodKey(method: string): 'cod' | 'bkash' | 'nagad' {
  const m = (method || '').toLowerCase();
  if (m.includes('bkash')) return 'bkash';
  if (m.includes('nagad')) return 'nagad';
  return 'cod';
}

export const AdminOverview: React.FC = () => {
  const { products, setAdminTab, navigateTo } = useStore();
  const [orders, setOrders] = useState<Order[]>(() => orderService.getAllOrders());
  const [categories, setCategories] = useState(() => categoryService.getAllCategories());
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomDesignRequest[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessageRecord[]>([]);
  const [bulkStats, setBulkStats] = useState<BulkStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    setOrders(orderService.getAllOrders());
    setCategories(categoryService.getAllCategories());

    const [ordersRes, statsRes, custRes, logRes, reqRes, msgRes] = await Promise.allSettled([
      orderService.syncAdminOrders(),
      api.get('/bulk/admin-stats'),
      api.get('/admin/customers'),
      api.get('/admin/activity-logs'),
      api.get('/admin/custom-requests'),
      api.get('/admin/contact-messages'),
    ]);

    if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
      setOrders(ordersRes.value);
    }
    if (statsRes.status === 'fulfilled' && statsRes.value.data?.stats) {
      setBulkStats(statsRes.value.data.stats);
    }
    if (custRes.status === 'fulfilled' && Array.isArray(custRes.value.data?.customers)) {
      setCustomers(custRes.value.data.customers);
    }
    if (logRes.status === 'fulfilled' && Array.isArray(logRes.value.data?.logs)) {
      setActivityLogs(logRes.value.data.logs);
    }
    if (reqRes.status === 'fulfilled' && Array.isArray(reqRes.value.data?.requests)) {
      setCustomRequests(reqRes.value.data.requests);
    }
    if (msgRes.status === 'fulfilled' && Array.isArray(msgRes.value.data?.messages)) {
      setContactMessages(msgRes.value.data.messages);
    }

    setLastSyncedAt(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
    const handleRefresh = () => loadDashboardData();
    window.addEventListener('admin-stats-updated', handleRefresh);
    return () => window.removeEventListener('admin-stats-updated', handleRefresh);
  }, [products]);

  // Filter orders by selected time range
  const filteredOrders = useMemo(() => {
    if (timeRange === 'all') return orders;
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const cutoff =
      timeRange === 'today'
        ? startOfToday.getTime()
        : timeRange === '7d'
          ? now - 7 * 86_400_000
          : now - 30 * 86_400_000;

    return orders.filter((o) => {
      const ts = new Date(o.createdAt).getTime();
      return Number.isFinite(ts) ? ts >= cutoff : true;
    });
  }, [orders, timeRange]);

  // Core KPI Calculations
  const validOrders = useMemo(
    () =>
      filteredOrders.filter(
        (o) => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Returned'
      ),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => validOrders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0),
    [validOrders]
  );

  const totalYardsSold = useMemo(
    () =>
      validOrders.reduce(
        (sum, o) => sum + o.items.reduce((s, it) => s + Number(it.yards || 0), 0),
        0
      ),
    [validOrders]
  );

  const avgOrderValue =
    validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

  const totalOrdersCount = filteredOrders.length;
  const activeOrdersCount = filteredOrders.filter(
    (o) =>
      o.orderStatus === 'Pending' ||
      o.orderStatus === 'Confirmed' ||
      o.orderStatus === 'Processing'
  ).length;
  const completedOrdersCount = filteredOrders.filter(
    (o) => o.orderStatus === 'Delivered'
  ).length;
  const completionRate =
    totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

  // Urgent operational queues (all-time actionable alerts)
  const pendingMfsOrders = orders.filter(
    (o) =>
      (o.paymentStatus === 'pending_verification' ||
        (normalizeMethodKey(o.paymentMethod) !== 'cod' && o.paymentStatus !== 'Paid')) &&
      o.orderStatus !== 'Cancelled' &&
      o.orderStatus !== 'Returned'
  );
  const lowStockProducts = products.filter((p) => Number(p.stockYards) <= 20);
  const pendingCustomRequestsCount = customRequests.filter(
    (r) => r.status === 'Pending' || r.status === 'Reviewing'
  ).length;
  const unreadMessagesCount = contactMessages.filter(
    (m) => !m.status || m.status === 'unread'
  ).length;

  // Unique Customers Count
  const totalCustomersCount = useMemo(() => {
    const phones = new Set<string>();
    customers.forEach((c) => phones.add((c.phone || '').replace(/\D/g, '')));
    orders.forEach((o) => phones.add((o.customer?.phone || '').replace(/\D/g, '')));
    return Math.max(customers.length, phones.size, bulkStats?.totalCustomers || 0);
  }, [customers, orders, bulkStats]);

  // Status Pipeline Breakdown
  const statusCounts: Record<string, number> = {
    Pending: filteredOrders.filter((o) => o.orderStatus === 'Pending').length,
    Confirmed: filteredOrders.filter((o) => o.orderStatus === 'Confirmed').length,
    Processing: filteredOrders.filter((o) => o.orderStatus === 'Processing').length,
    Shipped: filteredOrders.filter(
      (o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery'
    ).length,
    Delivered: filteredOrders.filter((o) => o.orderStatus === 'Delivered').length,
    Cancelled: filteredOrders.filter(
      (o) => o.orderStatus === 'Cancelled' || o.orderStatus === 'Returned'
    ).length,
  };

  // Payment Method Breakdown (COD vs bKash vs Nagad)
  const paymentBreakdown = useMemo(() => {
    const acc = {
      cod: { label: 'ক্যাশ অন ডেলিভারি', count: 0, amount: 0, color: '#1C1917' },
      bkash: { label: 'বিকাশ (bKash)', count: 0, amount: 0, color: '#850B1B' },
      nagad: { label: 'নগদ (Nagad)', count: 0, amount: 0, color: '#C5A46D' },
    };
    validOrders.forEach((o) => {
      const k = normalizeMethodKey(o.paymentMethod);
      acc[k].count += 1;
      acc[k].amount += Number(o.grandTotal || 0);
    });
    const total = acc.cod.amount + acc.bkash.amount + acc.nagad.amount;
    return {
      total,
      segments: [
        { key: 'bkash', ...acc.bkash },
        { key: 'nagad', ...acc.nagad },
        { key: 'cod', ...acc.cod },
      ],
    };
  }, [validOrders]);

  // Daily Revenue Trend (Last 7 days buckets based on validOrders)
  const dailyTrend = useMemo(() => {
    const daysCount = timeRange === '30d' ? 14 : 7;
    const buckets: Array<{
      dateKey: string;
      label: string;
      revenue: number;
      ordersCount: number;
    }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      buckets.push({
        dateKey: key,
        label: d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
        revenue: 0,
        ordersCount: 0,
      });
    }

    validOrders.forEach((o) => {
      const dayKey = (o.createdAt || '').slice(0, 10);
      const found = buckets.find((b) => b.dateKey === dayKey);
      if (found) {
        found.revenue += Number(o.grandTotal || 0);
        found.ordersCount += 1;
      }
    });

    const maxRevenue = Math.max(1000, ...buckets.map((b) => b.revenue));
    return { buckets, maxRevenue };
  }, [validOrders, timeRange]);

  // Category & Product Analytics
  const { categoryAnalytics, topProducts } = useMemo(() => {
    const catMap: Record<string, { yards: number; revenue: number; ordersCount: number }> = {};
    const prodMap: Record<
      string,
      { id: string; name: string; width: string; yards: number; revenue: number }
    > = {};

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const catName = item.outfitCategory || prod?.category || 'অন্যান্য';
        if (!catMap[catName]) {
          catMap[catName] = { yards: 0, revenue: 0, ordersCount: 0 };
        }
        catMap[catName].yards += Number(item.yards || 0);
        catMap[catName].revenue += Number(item.subtotal || 0);
        catMap[catName].ordersCount += 1;

        if (!prodMap[item.productId]) {
          prodMap[item.productId] = {
            id: item.productId,
            name: item.productName || prod?.name || item.productId,
            width: item.fabricWidth || prod?.fabricWidth || '3.5',
            yards: 0,
            revenue: 0,
          };
        }
        prodMap[item.productId].yards += Number(item.yards || 0);
        prodMap[item.productId].revenue += Number(item.subtotal || 0);
      });
    });

    return {
      categoryAnalytics: Object.entries(catMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
      topProducts: Object.values(prodMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }, [validOrders, products]);

  const recentOrders = useMemo(
    () =>
      [...filteredOrders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [filteredOrders]
  );

  // Donut circumference math for Payment Method breakdown
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="space-y-6">
      {/* Editorial Atelier Header + Period Controls */}
      <div className="bg-white rounded-2xl border border-[#EDE5D9] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#850B1B] via-[#C5A46D] to-[#1C1917]" />
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#850B1B] bg-[#FAF6F0] px-2.5 py-0.5 rounded-full border border-[#C5A46D]/40">
            <Sparkles className="w-3 h-3 text-[#C5A46D]" />
            <span>Fashion Doniya Atelier Command Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
            ড্যাশবোর্ড ওভারভিউ ও রিয়েল-টাইম বিশ্লেষণ
          </h1>
          <p className="text-xs text-[#242424]/65">
            বিক্রয়, গজ ইনভেন্টরি, ম্যানুয়াল MFS পেমেন্ট ভেরিফিকেশন ও কাস্টম ডিজাইনের সার্বিক চিত্র · সর্বশেষ সিঙ্ক:{' '}
            <span className="font-mono font-semibold text-[#1C1917]">
              {lastSyncedAt.toLocaleTimeString('bn-BD')}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:shrink-0">
          {/* Period Switcher */}
          <div className="inline-flex bg-[#FAF8F4] p-1 rounded-xl border border-[#EDE5D9] shrink-0">
            {(
              [
                { id: 'today', label: 'আজ' },
                { id: '7d', label: '৭ দিন' },
                { id: '30d', label: '৩০ দিন' },
                { id: 'all', label: 'সব সময়' },
              ] as Array<{ id: TimeRange; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  timeRange === opt.id
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'text-[#242424]/70 hover:text-[#1C1917]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="px-3 py-2 bg-white hover:bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl text-xs font-semibold text-[#1C1917] flex items-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => setAdminTab('products')}
            className="px-3.5 py-2 bg-[#850B1B] hover:bg-[#6B0812] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন কাপড়</span>
          </button>

          <button
            onClick={() => navigateTo('shop')}
            className="px-3 py-2 bg-[#FAF8F4] hover:bg-[#EDE5D9] border border-[#EDE5D9] text-[#1C1917] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>লাইভ শপ</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Actionable Priority Strip (rendered only when attention is needed) */}
      {(pendingMfsOrders.length > 0 ||
        lowStockProducts.length > 0 ||
        pendingCustomRequestsCount > 0 ||
        unreadMessagesCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pendingMfsOrders.length > 0 && (
            <button
              onClick={() => setAdminTab('orders')}
              className="text-left p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 hover:border-[#850B1B] transition-all flex items-center justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-[#850B1B] text-white shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#850B1B] truncate">
                    {pendingMfsOrders.length.toLocaleString('bn-BD')}টি পেমেন্ট যাচাই বাকি
                  </div>
                  <div className="text-[10px] text-rose-800/80">বিকাশ / নগদ TrxID চেক করুন</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#850B1B] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}

          {lowStockProducts.length > 0 && (
            <button
              onClick={() => setAdminTab('products')}
              className="text-left p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 hover:border-amber-500 transition-all flex items-center justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-amber-900 truncate">
                    {lowStockProducts.length.toLocaleString('bn-BD')}টি কাপড়ে স্টক কম
                  </div>
                  <div className="text-[10px] text-amber-800/80">২০ গজের নিচে স্টক</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-800 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}

          {pendingCustomRequestsCount > 0 && (
            <button
              onClick={() => setAdminTab('custom-requests')}
              className="text-left p-3.5 rounded-xl bg-[#FAF6F0] border border-[#C5A46D]/50 hover:border-[#850B1B] transition-all flex items-center justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-[#1C1917] text-[#C5A46D] shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1C1917] truncate">
                    {pendingCustomRequestsCount.toLocaleString('bn-BD')}টি কাস্টম ডিজাইন
                  </div>
                  <div className="text-[10px] text-[#242424]/70">মাপ ও কোটেশন অপেক্ষমাণ</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#850B1B] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}

          {unreadMessagesCount > 0 && (
            <button
              onClick={() => setAdminTab('content')}
              className="text-left p-3.5 rounded-xl bg-sky-50/90 border border-sky-200 hover:border-sky-500 transition-all flex items-center justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-sky-700 text-white shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-sky-900 truncate">
                    {unreadMessagesCount.toLocaleString('bn-BD')}টি নতুন মেসেজ
                  </div>
                  <div className="text-[10px] text-sky-800/80">কন্ট্যাক্ট ইনবক্স দেখুন</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-800 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* Primary KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          onClick={() => setAdminTab('orders')}
          className="bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs hover:border-[#C5A46D] transition-all cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#242424]/55">
              মোট বিক্রয় (Revenue)
            </span>
            <div className="p-2 rounded-xl bg-[#FAF6F0] text-[#850B1B] border border-[#C5A46D]/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tabular-nums">
              ৳{totalRevenue.toLocaleString('bn-BD')}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#242424]/65">
              <span>গড় অর্ডার: ৳{avgOrderValue.toLocaleString('bn-BD')}</span>
              <span className="text-emerald-700 font-semibold">
                {validOrders.length.toLocaleString('bn-BD')} বৈধ অর্ডার
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setAdminTab('orders')}
          className="bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs hover:border-[#C5A46D] transition-all cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#242424]/55">
              অর্ডার ও ডেলিভারি হার
            </span>
            <div className="p-2 rounded-xl bg-[#FAF8F4] text-[#1C1917] border border-[#EDE5D9]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tabular-nums">
              {totalOrdersCount.toLocaleString('bn-BD')}টি
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activeOrdersCount.toLocaleString('bn-BD')} চলমান
              </span>
              <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {completionRate.toLocaleString('bn-BD')}% ডেলিভার্ড
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setAdminTab('products')}
          className="bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs hover:border-[#C5A46D] transition-all cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#242424]/55">
              বিক্রি হওয়া গজ ও ক্যাটালগ
            </span>
            <div className="p-2 rounded-xl bg-[#FAF8F4] text-[#C5A46D] border border-[#EDE5D9]">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tabular-nums">
              {Number(totalYardsSold.toFixed(1)).toLocaleString('bn-BD')} গজ
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#242424]/65">
              <span>{products.length.toLocaleString('bn-BD')}টি সক্রিয় কাপড়</span>
              <span>{categories.length.toLocaleString('bn-BD')} ক্যাটাগরি</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setAdminTab('customers')}
          className="bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs hover:border-[#C5A46D] transition-all cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#242424]/55">
              মোট গ্রাহক ও কাস্টম স্টুডিও
            </span>
            <div className="p-2 rounded-xl bg-[#FAF8F4] text-[#1C1917] border border-[#EDE5D9]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tabular-nums">
              {totalCustomersCount.toLocaleString('bn-BD')} জন
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#242424]/65">
              <span>{customRequests.length.toLocaleString('bn-BD')} কাস্টম ডিজাইন</span>
              <span>{contactMessages.length.toLocaleString('bn-BD')} ইনবক্স বার্তা</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row: Revenue Trend + Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Revenue Bar & Trend Chart */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE5D9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#850B1B]" />
                <span>দৈনিক বিক্রয় ও অর্ডার ট্রেন্ড ({dailyTrend.buckets.length.toLocaleString('bn-BD')} দিন)</span>
              </h2>
              <p className="text-[11px] text-[#242424]/55">
                বাতিল ও রিটার্ন বাদে দৈনিক মোট অর্ডার রাজস্ব (৳)
              </p>
            </div>
            {hoveredBarIdx !== null && dailyTrend.buckets[hoveredBarIdx] && (
              <div className="px-3 py-1 rounded-lg bg-[#1C1917] text-white text-[11px] font-semibold tabular-nums">
                {dailyTrend.buckets[hoveredBarIdx].label}: ৳
                {dailyTrend.buckets[hoveredBarIdx].revenue.toLocaleString('bn-BD')} (
                {dailyTrend.buckets[hoveredBarIdx].ordersCount.toLocaleString('bn-BD')}টি অর্ডার)
              </div>
            )}
          </div>

          <div className="h-52 flex items-end gap-2 sm:gap-3 pt-4 pb-1 px-1">
            {dailyTrend.buckets.map((bucket, idx) => {
              const heightPct =
                bucket.revenue > 0
                  ? Math.max(8, Math.round((bucket.revenue / dailyTrend.maxRevenue) * 100))
                  : 3;
              const isActive = hoveredBarIdx === idx;
              return (
                <div
                  key={bucket.dateKey}
                  onMouseEnter={() => setHoveredBarIdx(idx)}
                  onMouseLeave={() => setHoveredBarIdx(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 group cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-[#1C1917] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {bucket.revenue > 0 ? `৳${bucket.revenue.toLocaleString('bn-BD')}` : '০'}
                  </span>
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-10 rounded-t-lg transition-all duration-300 ${
                        bucket.revenue === 0
                          ? 'bg-[#EDE5D9]/60'
                          : isActive
                            ? 'bg-[#850B1B] shadow-md'
                            : 'bg-linear-to-t from-[#1C1917] to-[#C5A46D]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-[#242424]/60 font-medium truncate max-w-full">
                    {bucket.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Breakdown Donut */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#EDE5D9] shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-[#EDE5D9] pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#C5A46D]" />
              <span>পেমেন্ট মাধ্যম বিশ্লেষণ</span>
            </h2>
            <span className="text-[10px] font-bold text-[#242424]/50">মোট অনুপাত</span>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#EDE5D9"
                  strokeWidth="12"
                />
                {paymentBreakdown.total > 0 &&
                  paymentBreakdown.segments.map((seg) => {
                    const frac = seg.amount / paymentBreakdown.total;
                    const segLen = frac * circumference;
                    const dashOffset = -cumulativeOffset;
                    cumulativeOffset += segLen;
                    if (segLen <= 0) return null;
                    return (
                      <circle
                        key={seg.key}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray={`${segLen} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="butt"
                      />
                    );
                  })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-[#242424]/55 font-semibold">মোট বিল</span>
                <span className="text-xs font-extrabold text-[#1C1917] tabular-nums">
                  ৳{paymentBreakdown.total.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {paymentBreakdown.segments.map((seg) => {
              const pct =
                paymentBreakdown.total > 0
                  ? Math.round((seg.amount / paymentBreakdown.total) * 100)
                  : 0;
              return (
                <div
                  key={seg.key}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-semibold text-[#1C1917]">{seg.label}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="font-bold text-[#1C1917]">
                      ৳{seg.amount.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[10px] text-[#242424]/55 ml-1.5">
                      ({pct.toLocaleString('bn-BD')}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline + Top Fabrics & Category Yardage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Fulfillment Pipeline */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
            <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#850B1B]" />
              <span>অর্ডার ডেলিভারি পাইপলাইন</span>
            </h2>
            <button
              onClick={() => setAdminTab('orders')}
              className="text-[11px] font-bold text-[#850B1B] hover:underline cursor-pointer"
            >
              সব অর্ডার দেখুন →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {STATUS_DISPLAY.map((row) => {
              const count = statusCounts[row.key] || 0;
              const pct =
                totalOrdersCount > 0 ? Math.round((count / totalOrdersCount) * 100) : 0;
              return (
                <div key={row.key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#242424]">{row.label}</span>
                    <span className="font-bold text-[#1C1917] tabular-nums">
                      {count.toLocaleString('bn-BD')}টি ({pct.toLocaleString('bn-BD')}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#FAF8F4] rounded-full overflow-hidden border border-[#EDE5D9]">
                    <div
                      className={`h-full ${row.barClass} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category & Top Fabric Sales */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
            <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C5A46D]" />
              <span>শীর্ষ বিক্রিত কাপড় ও ক্যাটাগরি বিশ্লেষণ</span>
            </h2>
            <button
              onClick={() => setAdminTab('products')}
              className="text-[11px] font-bold text-[#850B1B] hover:underline cursor-pointer"
            >
              ইনভেন্টরি দেখুন →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#242424]/50">
                শীর্ষ ৫টি কাপড়
              </div>
              {topProducts.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF8F4] text-xs text-[#242424]/50 text-center">
                  এই সময়ে কোনো বিক্রয় তথ্য নেই
                </div>
              ) : (
                topProducts.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#C5A46D] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(idx + 1).toLocaleString('bn-BD')}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-[#1C1917] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#242424]/55">
                          {item.width} বহর · {item.yards.toLocaleString('bn-BD')} গজ
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-[#850B1B] tabular-nums shrink-0 ml-2">
                      ৳{item.revenue.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Category Yardage */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#242424]/50">
                ক্যাটাগরি অনুযায়ী গজ বিক্রয়
              </div>
              {categoryAnalytics.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF8F4] text-xs text-[#242424]/50 text-center">
                  কোনো ক্যাটাগরি ডেটা পাওয়া যায়নি
                </div>
              ) : (
                categoryAnalytics.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[#1C1917] truncate">{cat.name}</div>
                      <div className="text-[10px] text-[#242424]/55">
                        {cat.yards.toLocaleString('bn-BD')} গজ · {cat.ordersCount.toLocaleString('bn-BD')} আইটেম
                      </div>
                    </div>
                    <span className="font-bold text-[#1C1917] tabular-nums shrink-0 ml-2">
                      ৳{cat.revenue.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Lists: Recent Orders, Low Stock Watchlist, Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
            <h2 className="text-sm font-bold text-[#1C1917]">সাম্প্রতিক অর্ডারসমূহ</h2>
            <button
              onClick={() => setAdminTab('orders')}
              className="text-xs font-bold text-[#850B1B] hover:underline cursor-pointer"
            >
              ব্যবস্থাপনা করুন →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#242424]/50">
              নির্বাচিত সময়ে কোনো অর্ডার পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setAdminTab('orders')}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4] hover:border-[#C5A46D] border border-[#EDE5D9] transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1C1917]">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-[#242424]/55">
                        {formatPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#242424]/75 truncate mt-0.5">
                      {order.customer.fullName} · {order.customer.phone}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="font-bold text-[#1C1917] tabular-nums">
                      ৳{Number(order.grandTotal || 0).toLocaleString('bn-BD')}
                    </div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getOrderStatusBadge(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Fabric Watchlist */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
            <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>কম স্টক সতর্কতা</span>
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 tabular-nums">
              {lowStockProducts.length.toLocaleString('bn-BD')}
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-10 text-center text-xs text-emerald-700 font-medium">
              সকল কাপড়ের পর্যাপ্ত স্টক রয়েছে ✓
            </div>
          ) : (
            <div className="space-y-2 text-xs max-h-80 overflow-y-auto pr-1">
              {lowStockProducts.slice(0, 8).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setAdminTab('products')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] hover:border-amber-400 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1C1917] truncate">{prod.name}</div>
                    <div className="text-[10px] text-[#242424]/55">
                      SKU: {prod.sku} · {prod.fabricWidth} বহর
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 ml-2 ${
                      prod.stockYards <= 5
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {Number(prod.stockYards).toLocaleString('bn-BD')} গজ
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
            <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#850B1B]" />
              <span>সাম্প্রতিক অ্যাক্টিভিটি লগ</span>
            </h2>
            <span className="text-[10px] font-bold text-[#242424]/45">সর্বশেষ</span>
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#242424]/50">
              এখনও কোনো সিস্টেম লগ রেকর্ড হয়নি।
            </div>
          ) : (
            <div className="space-y-2.5 text-xs max-h-80 overflow-y-auto pr-1">
              {activityLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[#1C1917]">{log.action}</div>
                    <div className="text-[11px] text-[#242424]/70 line-clamp-2">{log.details}</div>
                  </div>
                  <span className="text-[10px] text-[#242424]/50 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('bn-BD', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
