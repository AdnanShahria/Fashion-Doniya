import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { orderService } from '../../services/orderService';
import { api } from '../../services/api';
import { CustomerUser, Order } from '../../types';
import {
  Users,
  Search,
  Eye,
  Edit3,
  Ban,
  CheckCircle2,
  Plus,
  X,
  Phone,
  MapPin,
  ShoppingBag,
  Trash2
} from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const { showToast } = useStore();
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => orderService.getAllOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CustomerUser>>({
    fullName: '',
    phone: '',
    altPhone: '',
    email: '',
    district: 'ঢাকা',
    upazila: '',
    fullAddress: '',
    status: 'active',
    notes: ''
  });

  const loadCustomers = () => {
    setOrders(orderService.getAllOrders());
    api.get('/admin/customers')
      .then((r) => {
        if (r.data && Array.isArray(r.data.customers)) {
          setCustomers(r.data.customers);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Merge registered customers with any customers from orders who might not be in the table yet
  const mergedCustomers: CustomerUser[] = [...customers];
  const seenPhones = new Set(customers.map((c) => c.phone.replace(/\D/g, '')));

  orders.forEach((order) => {
    const clean = order.customer.phone.replace(/\D/g, '');
    if (clean && !seenPhones.has(clean)) {
      seenPhones.add(clean);
      mergedCustomers.push({
        id: `cust-order-${order.id}`,
        fullName: order.customer.fullName,
        phone: order.customer.phone,
        altPhone: order.customer.altPhone,
        district: order.customer.district,
        upazila: order.customer.upazila,
        fullAddress: order.customer.fullAddress,
        createdAt: order.createdAt,
        status: 'active'
      });
    }
  });

  const getCustomerOrders = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    return orders.filter((o) => o.customer.phone.replace(/\D/g, '') === clean);
  };

  const handleToggleStatus = (cust: CustomerUser) => {
    const nextStatus = cust.status === 'blocked' ? 'active' : 'blocked';
    api.patch(`/admin/customers/${encodeURIComponent(cust.id)}/status`, { status: nextStatus })
      .then(() => {
        loadCustomers();
        showToast(
          `গ্রাহক "${cust.fullName}"-কে ${nextStatus === 'blocked' ? 'ব্লক (Blocked)' : 'সক্রিয় (Active)'} করা হয়েছে`,
          'info'
        );
      })
      .catch(() => {
        // If derived from order, save customer first with the new status
        api.post('/customers/sync', { user: { ...cust, status: nextStatus } }).then(() => {
          loadCustomers();
          showToast(
            `গ্রাহক "${cust.fullName}"-কে ${nextStatus === 'blocked' ? 'ব্লক' : 'সক্রিয়'} করা হয়েছে`,
            'info'
          );
        }).catch(() => {});
      });
  };

  const handleOpenAddModal = () => {
    setFormData({
      id: `cust-${Date.now()}`,
      fullName: '',
      phone: '',
      altPhone: '',
      email: '',
      district: 'ঢাকা',
      upazila: '',
      fullAddress: '',
      status: 'active',
      notes: ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (cust: CustomerUser) => {
    setFormData({ ...cust });
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName?.trim() || !formData.phone?.trim()) {
      showToast('গ্রাহকের নাম ও মোবাইল নম্বর আবশ্যক', 'error');
      return;
    }

    api.put(`/admin/customers/${encodeURIComponent(formData.id || `cust-${Date.now()}`)}`, formData)
      .then(() => {
        loadCustomers();
        setIsEditModalOpen(false);
        showToast('গ্রাহকের তথ্য সফলভাবে সংরক্ষিত হয়েছে!', 'success');
      })
      .catch(() => {});
  };

  const handleDeleteCustomer = (cust: CustomerUser) => {
    if (!window.confirm(`আপনি কি "${cust.fullName}" গ্রাহকের প্রোফাইল মুছে ফেলতে চান?`)) return;
    api.delete(`/admin/customers/${encodeURIComponent(cust.id)}`)
      .then(() => {
        loadCustomers();
        showToast('গ্রাহকের প্রোফাইল মুছে ফেলা হয়েছে', 'info');
      })
      .catch(() => {});
  };

  const filteredCustomers = mergedCustomers.filter((c) => {
    const st = c.status || 'active';
    if (statusFilter !== 'all' && st !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const dist = c.district || c.address?.district || '';
      const addr = c.fullAddress || c.address?.fullAddress || '';
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        dist.toLowerCase().includes(q) ||
        addr.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">
            গ্রাহক ব্যবস্থাপনা (Customer Management)
          </h2>
          <p className="text-xs text-[#242424]/60">
            নিবন্ধিত গ্রাহকদের প্রোফাইল, অর্ডার ইতিহাস দেখুন এবং অ্যাকাউন্ট সক্রিয় বা ব্লক করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন গ্রাহক যোগ করুন</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-[#EDE5D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#242424]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, মোবাইল নম্বর বা জেলা দিয়ে খুঁজুন..."
            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg pl-9 pr-3 py-2 text-xs text-[#242424] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[#242424]/60">অ্যাকাউন্ট স্ট্যাটাস:</span>
          {(['all', 'active', 'blocked'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#242424] text-white font-bold'
                  : 'bg-[#FAF8F4] text-[#242424] border border-[#EDE5D9]'
              }`}
            >
              {st === 'all' ? 'সকল গ্রাহক' : st === 'active' ? 'সক্রিয় (Active)' : 'ব্লকড (Blocked)'}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                <th className="p-3">গ্রাহকের নাম ও ফোন</th>
                <th className="p-3">ডেলিভারি ঠিকানা</th>
                <th className="p-3 text-center">মোট অর্ডার</th>
                <th className="p-3 text-right">মোট কেনাকাটা (৳)</th>
                <th className="p-3 text-center">স্ট্যাটাস</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#242424]/50">
                    কোনো গ্রাহক পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const custOrders = getCustomerOrders(cust.phone);
                  const totalSpent = custOrders
                    .filter((o) => o.orderStatus !== 'Cancelled')
                    .reduce((s, o) => s + o.grandTotal, 0);
                  const isBlocked = cust.status === 'blocked';
                  const fullAddr = cust.fullAddress || cust.address?.fullAddress || '';
                  const upz = cust.upazila || cust.address?.upazila || '';
                  const dist = cust.district || cust.address?.district || '';

                  return (
                    <tr key={cust.id} className="hover:bg-[#FAF8F4]/50">
                      <td className="p-3">
                        <span className="font-bold text-[#242424] block">{cust.fullName}</span>
                        <span className="font-mono text-[11px] text-[#242424]/70 block">
                          {cust.phone}
                        </span>
                        {cust.email && (
                          <span className="text-[10px] text-[#242424]/50 block">{cust.email}</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="font-medium text-[#242424] block">
                          {fullAddr}
                        </span>
                        <span className="text-[11px] text-[#242424]/60">
                          {upz ? `${upz}, ` : ''}
                          {dist}
                        </span>
                      </td>

                      <td className="p-3 text-center font-bold text-[#242424]">
                        {custOrders.length} টি
                      </td>

                      <td className="p-3 text-right font-bold text-[#850B1B] tabular-nums">
                        ৳{totalSpent.toLocaleString('bn-BD')}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cust)}
                          className={`px-2.5 py-0.5 rounded-xs text-[10px] font-bold border cursor-pointer ${
                            isBlocked
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isBlocked ? 'ব্লকড (Blocked)' : 'সক্রিয় (Active)'}
                        </button>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-2.5 py-1 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] border border-[#EDE5D9] rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="প্রোফাইল ও অর্ডার হিস্ট্রি"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C5A46D]" />
                            <span>হিস্ট্রি</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-1.5 text-[#242424] hover:text-[#C5A46D] rounded-md cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(cust)}
                            className={`p-1.5 rounded-md cursor-pointer ${
                              isBlocked
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isBlocked ? 'অ্যাকাউন্ট সক্রিয় করুন' : 'অ্যাকাউন্ট ব্লক করুন'}
                          >
                            {isBlocked ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust)}
                            className="p-1.5 text-[#242424]/40 hover:text-rose-600 rounded-md cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile & Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#EDE5D9] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#242424]">
                  গ্রাহক প্রোফাইল ও অর্ডার ইতিহাস: {selectedCustomer.fullName}
                </h3>
                <span className="text-xs text-[#242424]/60 font-mono">
                  ফোন: {selectedCustomer.phone}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 hover:bg-[#FAF8F4] rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] text-xs">
              <div className="space-y-1">
                <div className="text-[#242424]/60">নাম ও যোগাযোগ:</div>
                <div className="font-bold text-sm text-[#242424]">{selectedCustomer.fullName}</div>
                <div className="font-mono">{selectedCustomer.phone}</div>
                {selectedCustomer.email && <div>ইমেইল: {selectedCustomer.email}</div>}
              </div>
              <div className="space-y-1">
                <div className="text-[#242424]/60">ঠিকানা:</div>
                <div className="font-medium text-[#242424]">{selectedCustomer.fullAddress}</div>
                <div>
                  {selectedCustomer.upazila ? `${selectedCustomer.upazila}, ` : ''}
                  {selectedCustomer.district}
                </div>
                {selectedCustomer.notes && (
                  <div className="text-[#850B1B] font-semibold">নোট: {selectedCustomer.notes}</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#242424] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#C5A46D]" />
                <span>অর্ডার ইতিহাস ({getCustomerOrders(selectedCustomer.phone).length}টি অর্ডার)</span>
              </h4>

              {getCustomerOrders(selectedCustomer.phone).length === 0 ? (
                <p className="text-xs text-[#242424]/50 py-4 text-center">
                  এই গ্রাহকের কোনো অর্ডার রেকর্ড পাওয়া যায়নি।
                </p>
              ) : (
                <div className="space-y-2.5">
                  {getCustomerOrders(selectedCustomer.phone).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-lg border border-[#EDE5D9] bg-[#FAF8F4]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#242424]">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[#242424]/60 ml-2">
                          ({new Date(ord.createdAt).toLocaleDateString('bn-BD')})
                        </span>
                        <div className="text-[11px] text-[#242424]/80 mt-0.5">
                          {ord.items.map((it) => `${it.productName} (${it.yards} গজ)`).join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#850B1B] text-sm">
                          ৳{ord.grandTotal}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#EDE5D9] font-bold text-[10px]">
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#EDE5D9] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                গ্রাহকের তথ্য সম্পাদনা / সংযোজন
              </h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-4 h-4 text-[#242424]" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">গ্রাহকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ইমেইল (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">জেলা (District)</label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">থানা / উপজেলা</label>
                  <input
                    type="text"
                    value={formData.upazila || ''}
                    onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">অ্যাকাউন্ট স্ট্যাটাস</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-semibold"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="blocked">ব্লকড (Blocked)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">সম্পূর্ণ ডেলিভারি ঠিকানা</label>
                  <input
                    type="text"
                    value={formData.fullAddress || ''}
                    onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">অ্যাডমিন নোট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE5D9]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE5D9] rounded-md font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white rounded-md font-semibold cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
