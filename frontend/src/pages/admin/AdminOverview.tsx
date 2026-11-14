import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { orderService } from '../../services/orderService';
import { categoryService } from '../../services/categoryService';
import { api } from '../../services/api';
import { ActivityLog, CustomerUser } from '../../types';
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
  BarChart3
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const { products, setAdminTab, navigateTo } = useStore();
  const [orders, setOrders] = useState(() => orderService.getAllOrders());
  const [categories, setCategories] = useState(() => categoryService.getAllCategories());
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    setOrders(orderService.getAllOrders());
    setCategories(categoryService.getAllCategories());

    orderService
      .syncWithBackend()
      .then((synced) => {
        setOrders(synced);
      })
      .catch(() => {});

    api.get('/admin/customers')
      .then((r) => {
        if (r.data && Array.isArray(r.data.customers)) {
          setCustomers(r.data.customers);
        }
      })
      .catch(() => {});

    api.get('/admin/activity-logs')
      .then((r) => {
        if (r.data && Array.isArray(r.data.logs)) {
          setActivityLogs(r.data.logs);
        }
      })
      .catch(() => {});
  }, [products]);

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Returned')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing'
  ).length;
  const completedOrders = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const lowStockProducts = products.filter((p) => p.stockYards <= 20);

  // Unique customers (registered + order phones)
  const uniqueCustomerPhones = new Set<string>();
  customers.forEach((c) => uniqueCustomerPhones.add(c.phone.replace(/\D/g, '')));
  orders.forEach((o) => uniqueCustomerPhones.add(o.customer.phone.replace(/\D/g, '')));
  const totalCustomersCount = Math.max(customers.length, uniqueCustomerPhones.size);

  // Status breakdown
  const statusCounts = {
    Pending: orders.filter((o) => o.orderStatus === 'Pending').length,
    Confirmed: orders.filter((o) => o.orderStatus === 'Confirmed').length,
    Processing: orders.filter((o) => o.orderStatus === 'Processing').length,
    Shipped: orders.filter((o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery').length,
    Delivered: orders.filter((o) => o.orderStatus === 'Delivered').length,
    Cancelled: orders.filter((o) => o.orderStatus === 'Cancelled' || o.orderStatus === 'Returned').length
  };

  // Sales Analytics by Category
  const categorySalesMap: Record<string, { yards: number; revenue: number; ordersCount: number }> = {};
  orders
    .filter((o) => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Returned')
    .forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const catName = item.outfitCategory || prod?.category || 'অন্যান্য';
        if (!categorySalesMap[catName]) {
          categorySalesMap[catName] = { yards: 0, revenue: 0, ordersCount: 0 };
        }
        categorySalesMap[catName].yards += item.yards;
        categorySalesMap[catName].revenue += item.subtotal;
        categorySalesMap[catName].ordersCount += 1;
      });
    });

  const categoryAnalytics = Object.entries(categorySalesMap)
    .map(([category, stats]) => ({ category, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-8">
      
      {/* Top Banner Notice */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>
            <strong>লাইভ ডাটাবেস সংযুক্ত:</strong> পণ্য, হোমপেজ, ক্যাটাগরি, অর্ডার, কন্টেন্ট বা সেটিংসের যেকোনো পরিবর্তন সাথে সাথে সার্ভার ডাটাবেসে সংরক্ষিত হবে এবং লাইভ ওয়েবসাইটে প্রতিফলিত হবে।
          </span>
        </div>
        <button
          onClick={() => navigateTo('home')}
          className="px-3 py-1.5 bg-white text-[#242424] hover:bg-emerald-100 font-semibold rounded-md border border-emerald-300 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer shrink-0"
        >
          <span>লাইভ ওয়েবসাইট দেখুন</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary 7 KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Revenue */}
        <div className="p-5 bg-white rounded-xl border border-[#EDE5D9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>মোট রাজস্ব (Total Revenue)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ৳
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#242424] tabular-nums">
            ৳{totalRevenue.toLocaleString('bn-BD')}
          </div>
          <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>সক্রিয় ও সম্পন্ন অর্ডার</span>
          </span>
        </div>

        {/* 2. Total Orders */}
        <div
          onClick={() => setAdminTab('orders')}
          className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] shadow-xs space-y-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>মোট অর্ডার (Total Orders)</span>
            <div className="w-8 h-8 rounded-full bg-[#FAF8F4] text-[#C5A46D] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#242424] tabular-nums">
            {totalOrders} টি
          </div>
          <span className="text-[11px] text-[#242424]/60 block">
            সকল অর্ডারের তালিকা দেখুন →
          </span>
        </div>

        {/* 3. Pending Orders */}
        <div
          onClick={() => setAdminTab('orders')}
          className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] shadow-xs space-y-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>অপেক্ষমান অর্ডার (Pending)</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 tabular-nums">
            {pendingOrders} টি
          </div>
          <span className="text-[11px] text-amber-700 font-medium block">
            Pending / Confirmed / Processing
          </span>
        </div>

        {/* 4. Completed Orders */}
        <div
          onClick={() => setAdminTab('orders')}
          className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] shadow-xs space-y-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>সম্পন্ন অর্ডার (Completed)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
            {completedOrders} টি
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block">
            সফলভাবে ডেলিভার্ড অর্ডার
          </span>
        </div>

        {/* 5. Total Products */}
        <div
          onClick={() => setAdminTab('products')}
          className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] shadow-xs space-y-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>মোট পণ্য (Total Products)</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#242424] tabular-nums">
            {products.length} টি
          </div>
          <span className="text-[11px] text-[#242424]/60 block">
            ৩.৫ বহর: {products.filter((p) => p.fabricWidth === '3.5').length} · ২.৫ বহর: {products.filter((p) => p.fabricWidth === '2.5').length}
          </span>
        </div>

        {/* 6. Total Categories */}
        <div
          onClick={() => setAdminTab('categories')}
          className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] shadow-xs space-y-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>মোট ক্যাটাগরি (Categories)</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#242424] tabular-nums">
            {categories.length} টি
          </div>
          <span className="text-[11px] text-[#242424]/60 block">
            ৩.৫ ও ২.৫ বহর ইনার ক্যাটাগরি সহ
          </span>
        </div>

        {/* 7. Total Customers */}
        <div
          onClick={() => setAdminTab('customers')}
          className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] shadow-xs space-y-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>মোট গ্রাহক (Total Customers)</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#242424] tabular-nums">
            {totalCustomersCount} জন
          </div>
          <span className="text-[11px] text-indigo-600 font-medium block">
            নিবন্ধিত ও অর্ডারকারী গ্রাহক →
          </span>
        </div>

        {/* 8. Low Stock Warning */}
        <div
          onClick={() => setAdminTab('products')}
          className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] shadow-xs space-y-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#242424]/60">
            <span>কম স্টক সতর্কতা (Low Stock)</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#242424] tabular-nums">
            {lowStockProducts.length} টি
          </div>
          <span className="text-[11px] text-rose-600 font-medium block">
            ২০ গজের নিচে স্টক আছে
          </span>
        </div>

      </div>

      {/* Sales Analytics & Status Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Breakdown (Col 1) */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#C5A46D]" />
            <span>অর্ডার স্ট্যাটাস পাইপলাইন</span>
          </h3>

          <div className="space-y-3 text-xs">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-[#242424]/80">
                    <span className="font-semibold">{status}</span>
                    <span className="tabular-nums font-mono">{count}টি ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#FAF8F4] h-2 rounded-full overflow-hidden border border-[#EDE5D9]">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'Delivered' ? 'bg-emerald-500' :
                        status === 'Cancelled' ? 'bg-rose-500' :
                        status === 'Shipped' ? 'bg-blue-500' :
                        'bg-[#C5A46D]'
                      }`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setAdminTab('orders')}
            className="w-full py-2 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] text-xs font-semibold rounded-md border border-[#EDE5D9] transition-colors cursor-pointer"
          >
            সকল অর্ডার ম্যানেজ করুন →
          </button>
        </div>

        {/* Category Sales Analytics (Col 2 & 3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#C5A46D]" />
              <span>বিক্রয় বিশ্লেষণ (Sales Analytics by Category)</span>
            </h3>
            <span className="text-[11px] text-[#242424]/60">ক্যাটাগরি অনুযায়ী গজ ও রাজস্ব</span>
          </div>

          <div className="space-y-3 text-xs">
            {categoryAnalytics.length === 0 ? (
              <p className="text-[#242424]/50 py-4 text-center">কোনো বিক্রয় তথ্য পাওয়া যায়নি।</p>
            ) : (
              categoryAnalytics.map((item) => {
                const revPct = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
                return (
                  <div key={item.category} className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#242424]">{item.category}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-[#242424]/70">{item.ordersCount}টি আইটেম</span>
                        <span className="text-[#850B1B] font-bold">{item.yards.toFixed(1)} গজ</span>
                        <span className="text-emerald-700 font-bold">৳{item.revenue.toLocaleString('bn-BD')} ({revPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#EDE5D9]">
                      <div
                        className="h-full bg-[#850B1B] rounded-full"
                        style={{ width: `${Math.max(6, revPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Recent Orders & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table (Col 1 & 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              সাম্প্রতিক অর্ডার সমূহ (Recent Orders)
            </h3>
            <button
              onClick={() => setAdminTab('orders')}
              className="text-xs text-[#C5A46D] hover:underline font-semibold cursor-pointer"
            >
              সব দেখুন ({orders.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                  <th className="p-2.5">অর্ডার আইডি</th>
                  <th className="p-2.5">গ্রাহক</th>
                  <th className="p-2.5 text-center">মোট গজ</th>
                  <th className="p-2.5 text-right">মূল্য (৳)</th>
                  <th className="p-2.5 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
                {recentOrders.map((order) => {
                  const yardsSum = order.items.reduce((s, it) => s + it.yards, 0);
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF8F4]/50">
                      <td className="p-2.5 font-mono font-bold text-[#242424]">{order.orderNumber}</td>
                      <td className="p-2.5">
                        <span className="font-semibold text-[#242424] block">{order.customer.fullName}</span>
                        <span className="text-[10px] text-[#242424]/50">{order.customer.phone}</span>
                      </td>
                      <td className="p-2.5 text-center tabular-nums">{yardsSum.toFixed(1)} গজ</td>
                      <td className="p-2.5 text-right font-bold text-[#242424] tabular-nums">৳{order.grandTotal}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border ${
                          order.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          order.orderStatus === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Feed (Col 3) */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#C5A46D]" />
              <span>সাম্প্রতিক কার্যক্রম (Recent Activities)</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
            {activityLogs.length === 0 ? (
              <p className="text-[#242424]/50 py-4 text-center">কোনো কার্যক্রম লগ নেই।</p>
            ) : (
              activityLogs.slice(0, 12).map((log) => (
                <div key={log.id} className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#242424] text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-[#242424]/50 font-mono">
                      {new Date(log.timestamp).toLocaleDateString('bn-BD', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#242424]/75 leading-snug">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
