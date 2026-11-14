import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { customDesignService } from '../../services/customDesignService';
import { CustomDesignRequest } from '../../types';
import { 
  Trash2, 
  Eye, 
  CheckCircle2, 
  X, 
  Image as ImageIcon, 
  Clock, 
  Phone,
  MessageCircle,
  RefreshCw,
  Save
} from 'lucide-react';

export const AdminCustomRequests: React.FC = () => {
  const { showToast } = useStore();
  const [requests, setRequests] = useState<CustomDesignRequest[]>(() => customDesignService.getAllRequests());
  const [selectedReq, setSelectedReq] = useState<CustomDesignRequest | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const reload = () => {
    setRequests(customDesignService.getAllRequests());
  };

  const syncFromServer = () => {
    setIsSyncing(true);
    customDesignService
      .syncFromBackend()
      .then((synced) => setRequests(synced))
      .finally(() => setIsSyncing(false));
  };

  useEffect(() => {
    syncFromServer();
  }, []);

  const handleUpdateStatus = (id: string, status: CustomDesignRequest['status']) => {
    customDesignService.updateRequestStatus(id, status, adminNoteInput.trim() || undefined);
    reload();
    showToast(`অনুরোধ স্ট্যাটাস ${status}-এ পরিবর্তিত হয়েছে`, 'success');
    if (selectedReq && selectedReq.id === id) {
      setSelectedReq(prev => prev ? { ...prev, status, adminNotes: adminNoteInput.trim() || prev.adminNotes } : null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('আপনি কি এই কাস্টম ডিজাইন অনুরোধটি মুছে ফেলতে চান?')) {
      customDesignService.deleteRequest(id);
      reload();
      showToast('অনুরোধ মুছে ফেলা হয়েছে', 'info');
      setSelectedReq(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">কাস্টম ডিজাইন অনুরোধ (Custom Design Requests)</h2>
          <p className="text-xs text-[#242424]/60">গ্রাহকদের প্রেরিত নিজস্ব ডিজাইন, রেফারেন্স ছবি ও স্পেশাল মাপসমূহ পর্যালোচনা করুন।</p>
        </div>
        <button
          onClick={syncFromServer}
          disabled={isSyncing}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#EDE5D9] text-xs font-semibold text-[#242424] hover:border-[#C5A46D] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'রিফ্রেশ'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#EDE5D9] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
              <th className="p-3">অনুরোধ আইডি ও তারিখ</th>
              <th className="p-3">গ্রাহক</th>
              <th className="p-3">পোশাকের ধরন</th>
              <th className="p-3 text-center">বহর ও গজ</th>
              <th className="p-3">রেফারেন্স ছবি</th>
              <th className="p-3 text-center">স্ট্যাটাস</th>
              <th className="p-3 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-[#242424]/50">
                  কোনো কাস্টম ডিজাইন অনুরোধ নেই।
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-[#FAF8F4]/50">
                  <td className="p-3">
                    <span className="font-mono font-bold text-[#242424] block">{req.id}</span>
                    <span className="text-[10px] text-[#242424]/50">
                      {new Date(req.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="font-semibold text-[#242424] block">{req.customerName}</span>
                    <span className="text-[11px] text-[#242424]/60">{req.phone}</span>
                  </td>

                  <td className="p-3 font-medium text-[#242424]">
                    <span>{req.outfitType}</span>
                    <span className="text-[10px] text-[#242424]/50 block">রং: {req.preferredColor}</span>
                  </td>

                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] text-[#C5A46D] font-bold rounded-xs block">
                      {req.fabricWidth} বহর
                    </span>
                    <span className="text-[10px] text-[#242424]/60 tabular-nums">{req.requiredYards} গজ</span>
                  </td>

                  <td className="p-3">
                    {req.referenceImageBase64 ? (
                      <div className="w-10 h-10 rounded-md overflow-hidden border border-[#EDE5D9] bg-[#FAF8F4]">
                        <img src={req.referenceImageBase64} alt="স্কেচ" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#242424]/40">ছবি নেই</span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] border ${
                      req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      req.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {req.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setAdminNoteInput(req.adminNotes || '');
                        }}
                        className="p-1.5 text-[#242424] hover:text-[#C5A46D] rounded-md transition-colors cursor-pointer"
                        title="অনুরোধের বিবরণ দেখুন"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="p-1.5 text-[#242424]/40 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#EDE5D9] p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A46D] block">কাস্টম ডিজাইন অনুরোধ</span>
                <h3 className="text-base font-bold text-[#242424]">{selectedReq.customerName} ({selectedReq.phone})</h3>
              </div>
              <button onClick={() => setSelectedReq(null)}>
                <X className="w-4 h-4 text-[#242424]" />
              </button>
            </div>

            {/* Reference Image Preview */}
            {selectedReq.referenceImageBase64 && (
              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-2">
                <span className="text-xs font-bold text-[#242424] block">গ্রাহকের আপলোডকৃত রেফারেন্স ডিজাইন ছবি:</span>
                <img
                  src={selectedReq.referenceImageBase64}
                  alt="রেফারেন্স ডিজাইন"
                  className="max-h-60 mx-auto rounded-md object-contain border border-[#EDE5D9]"
                />
              </div>
            )}

            {/* Description & Specs */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
                <span className="font-bold text-[#242424] block">ডিজাইনের বর্ণনা:</span>
                <p className="text-[#242424]/80 leading-relaxed">{selectedReq.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 bg-white border border-[#EDE5D9] rounded-md">
                  <span className="text-[#242424]/50 block text-[10px]">বহর:</span>
                  <span className="font-bold">{selectedReq.fabricWidth} বহর</span>
                </div>
                <div className="p-2.5 bg-white border border-[#EDE5D9] rounded-md">
                  <span className="text-[#242424]/50 block text-[10px]">প্রয়োজনীয় গজ:</span>
                  <span className="font-bold tabular-nums">{selectedReq.requiredYards} গজ</span>
                </div>
                <div className="p-2.5 bg-white border border-[#EDE5D9] rounded-md">
                  <span className="text-[#242424]/50 block text-[10px]">বাজেট:</span>
                  <span className="font-bold">{selectedReq.budget || 'উল্লেখ নেই'}</span>
                </div>
              </div>

              {/* Measurements */}
              {selectedReq.measurements && (
                <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1.5">
                  <span className="font-bold text-[#242424] block">প্রদত্ত শারীরিক মাপ:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>উচ্চতা: <span className="font-semibold">{selectedReq.measurements.height || '—'}</span></div>
                    <div>বডি: <span className="font-semibold">{selectedReq.measurements.chest || '—'}</span></div>
                    <div>কোমর: <span className="font-semibold">{selectedReq.measurements.waist || '—'}</span></div>
                    <div>ঝুল: <span className="font-semibold">{selectedReq.measurements.length || '—'}</span></div>
                  </div>
                  {selectedReq.measurements.notes && (
                    <p className="text-[11px] text-[#242424]/70 pt-1">নোট: {selectedReq.measurements.notes}</p>
                  )}
                </div>
              )}

              {/* Admin Internal Notes */}
              <div>
                <label className="block font-semibold text-[#242424] mb-1">অভ্যন্তরীণ নোট (Internal Notes):</label>
                <textarea
                  rows={2}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="যেমন: টেইলার কালামের কাছে পাঠানো হয়েছে, ফ্যাব্রিক কাটা সম্পন্ন..."
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-xs text-[#242424] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EDE5D9]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#242424]">স্ট্যাটাস:</span>
                <select
                  value={selectedReq.status}
                  onChange={(e) => handleUpdateStatus(selectedReq.id, e.target.value as any)}
                  className="text-xs font-semibold bg-white border border-[#EDE5D9] rounded-md px-2 py-1 text-[#242424]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Quoted">Quoted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedReq.id, selectedReq.status)}
                  className="px-2.5 py-1 bg-[#FAF8F4] hover:bg-[#EDE5D9] border border-[#EDE5D9] rounded-md text-xs font-semibold text-[#242424] flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>নোট সেভ</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${selectedReq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${selectedReq.customerName}, আপনার কাস্টম ডিজাইন অনুরোধ (${selectedReq.id}) সম্পর্কে Fashion Doniya BD থেকে যোগাযোগ করছি।`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#25D366] text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>গ্রাহকের হোয়াটসঅ্যাপে বার্তা</span>
                </a>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-1.5 bg-[#242424] text-white rounded-md text-xs font-semibold cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
