import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  CheckCircle2 
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useStore();
  const contactCfg = settings.contentConfig?.contactPage;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('পণ্য ও গজ মাপ সংক্রান্ত');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!name.trim() || !phone.trim() || !message.trim()) {
      showToast('সবগুলো ঘর পূরণ করুন', 'error');
      return;
    }
    if (digits.length < 10) {
      showToast('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/contact-messages', {
        name: name.trim(),
        phone: phone.trim(),
        subject,
        message: message.trim()
      });
      if (res.data?.success) {
        setSubmitted(true);
        setName('');
        setPhone('');
        setMessage('');
        showToast('আপনার বার্তাটি পাঠানো হয়েছে। শীঘ্রই আমরা যোগাযোগ করব।', 'success');
      } else {
        showToast(res.data?.message || 'বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।', 'error');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'বার্তা পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।';
      showToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      
      {/* Intro */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
          {contactCfg?.eyebrow || 'সরাসরি কথা বলুন'}
        </span>
        <h1 className="text-3xl font-extrabold text-[#242424]">
          {contactCfg?.title || 'যোগাযোগ ও কাস্টমার সাপোর্ট'}
        </h1>
        <p className="text-xs sm:text-sm text-[#242424]/70">
          {contactCfg?.subtitle || 'যেকোনো কাপড়ের বিবরণ, গজ মাপ বা অর্ডার সম্পর্কিত প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন।'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Contact Info (Col 5) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-sm space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2">
              {contactCfg?.officeTitle || 'অফিস ও শোরুমের ঠিকানা'}
            </h2>

            <div className="space-y-4 text-[#242424]/80">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#C5A46D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#242424] block">প্রধান শোরুম ও আউটলেট:</span>
                  <span>{settings.address}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#C5A46D] shrink-0" />
                <div>
                  <span className="font-bold text-[#242424] block">হেল্পলাইন নম্বর:</span>
                  <span>{settings.supportPhone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#C5A46D] shrink-0" />
                <div>
                  <span className="font-bold text-[#242424] block">ইমেইল:</span>
                  <span>{settings.supportEmail}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#C5A46D] shrink-0" />
                <div>
                  <span className="font-bold text-[#242424] block">সেবা সময়:</span>
                  <span>{contactCfg?.serviceHours || contactCfg?.workingHours || 'সকাল ১০:০০ টা - রাত ৮:০০ টা (প্রতিদিন)'}</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Box */}
            <div className="pt-3 border-t border-[#EDE5D9]">
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপে কথা বলুন</span>
              </a>
            </div>
          </div>
        </div>

        {/* Message Form (Col 7) */}
        <div className="md:col-span-7">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE5D9] shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-3 mb-4">
              {contactCfg?.formTitle || 'বার্তা পাঠান'}
            </h2>

            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-[#242424]">আপনার বার্তাটি সফলভাবে পৌঁছাল!</h3>
                <p className="text-xs text-[#242424]/60">
                  আমাদের কাস্টমার কেয়ার টিম দ্রুত আপনার সাথে যোগাযোগ করবে।
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-4 py-2 bg-[#242424] text-white text-xs font-semibold rounded-md"
                >
                  আরেকটি বার্তা পাঠান
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">আপনার নাম *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="পুরো নাম"
                      required
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      required
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">বিষয়</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                  >
                    <option value="পণ্য ও গজ মাপ সংক্রান্ত">পণ্য ও গজ মাপ সংক্রান্ত</option>
                    <option value="অর্ডারের স্থিতি অনুসন্ধান">অর্ডারের স্থিতি অনুসন্ধান</option>
                    <option value="কাস্টম ডিজাইন পরামর্শ">কাস্টম ডিজাইন পরামর্শ</option>
                    <option value="হোলসেল বা বাল্ক কাপড়">হোলসেল বা বাল্ক কাপড়</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">আপনার বার্তা লিখুন *</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="আপনার প্রশ্ন বা মতামত বিস্তারিত লিখুন..."
                    required
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-3 text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#242424] hover:bg-[#C5A46D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}</span>
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
