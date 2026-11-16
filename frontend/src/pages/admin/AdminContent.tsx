import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { api } from '../../services/api';
import {
  WebsiteContentConfig,
  FaqItem,
  PolicyDocumentConfig,
  ContactMessageRecord
} from '../../types';
import { INITIAL_CONTENT_CONFIG } from '../../data/seedData';
import {
  Save,
  Plus,
  Trash2,
  Mail
} from 'lucide-react';

export const AdminContent: React.FC = () => {
  const { settings, refreshData, showToast } = useStore();

  const hasEditedRef = useRef(false);
  const [contentConfig, setContentConfigRaw] = useState<WebsiteContentConfig>(() => {
    const existing = settings.contentConfig || INITIAL_CONTENT_CONFIG;
    return JSON.parse(JSON.stringify(existing));
  });
  const setContentConfig: React.Dispatch<React.SetStateAction<WebsiteContentConfig>> = (val) => {
    hasEditedRef.current = true;
    setContentConfigRaw(val);
  };

  useEffect(() => {
    if (!hasEditedRef.current && settings.contentConfig) {
      setContentConfigRaw(JSON.parse(JSON.stringify(settings.contentConfig)));
    }
  }, [settings.contentConfig]);

  const [activeTab, setActiveTab] = useState<
    | 'about'
    | 'contact'
    | 'faq'
    | 'deliveryPolicy'
    | 'returnPolicy'
    | 'privacyPolicy'
    | 'termsConditions'
    | 'footer'
  >('about');

  const [contactMessages, setContactMessages] = useState<ContactMessageRecord[]>([]);

  const loadContactMessages = () => {
    api.get('/admin/contact-messages')
      .then((r) => {
        if (r.data && Array.isArray(r.data.messages)) {
          setContactMessages(r.data.messages);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadContactMessages();
  }, []);

  const handleSaveAllContent = () => {
    hasEditedRef.current = false;
    settingsService.updateSettings({ contentConfig });
    refreshData();
    showToast('ওয়েবসাইটের পেজ ও কন্টেন্ট সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  // FAQ Helpers
  const addFaq = () => {
    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      q: 'নতুন প্রশ্ন এখানে লিখুন?',
      a: 'প্রশ্নের বিস্তারিত উত্তর এখানে লিখুন।',
      order: contentConfig.faqs.length + 1,
      isActive: true
    };
    setContentConfig((prev) => ({
      ...prev,
      faqs: [...prev.faqs, newFaq]
    }));
  };

  const updateFaq = (id: string, patch: Partial<FaqItem>) => {
    setContentConfig((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f))
    }));
  };

  const removeFaq = (id: string) => {
    setContentConfig((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id)
    }));
  };

  // Policy Editor Helper
  const renderPolicyEditor = (
    policyKey: 'deliveryPolicy' | 'returnPolicy' | 'privacyPolicy' | 'termsConditions',
    label: string
  ) => {
    const doc: PolicyDocumentConfig = contentConfig[policyKey];

    const updateDoc = (patch: Partial<PolicyDocumentConfig>) => {
      setContentConfig((prev) => ({
        ...prev,
        [policyKey]: { ...prev[policyKey], ...patch }
      }));
    };

    return (
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
          <h3 className="text-sm font-bold text-[#242424]">{label}</h3>
          <button
            type="button"
            onClick={() =>
              updateDoc({
                sections: [
                  ...doc.sections,
                  { heading: 'নতুন অনুচ্ছেদ শিরোনাম', body: 'বিস্তারিত নীতিমালা লিখুন...' }
                ]
              })
            }
            className="px-3 py-1.5 bg-[#242424] hover:bg-[#C5A46D] text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন অনুচ্ছেদ যোগ করুন</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">পেজের শিরোনাম (Page Title)</label>
            <input
              type="text"
              value={doc.title}
              onChange={(e) => updateDoc({ title: e.target.value })}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">ভূমিকা টেক্সট (Subtitle / Intro)</label>
            <input
              type="text"
              value={doc.subtitle || doc.intro || ''}
              onChange={(e) => updateDoc({ subtitle: e.target.value, intro: e.target.value })}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {doc.sections.map((sec, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={sec.heading}
                  onChange={(e) => {
                    const next = [...doc.sections];
                    next[idx] = { ...next[idx], heading: e.target.value };
                    updateDoc({ sections: next });
                  }}
                  className="flex-1 bg-white border border-[#EDE5D9] rounded-md px-3 py-1.5 font-bold text-[#242424]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = doc.sections.filter((_, i) => i !== idx);
                    updateDoc({ sections: next });
                  }}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={3}
                value={sec.body || sec.paragraph || ''}
                onChange={(e) => {
                  const next = [...doc.sections];
                  next[idx] = { ...next[idx], body: e.target.value, paragraph: e.target.value };
                  updateDoc({ sections: next });
                }}
                className="w-full bg-white border border-[#EDE5D9] rounded-md p-2.5 text-[#242424]"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">
            ওয়েবসাইট কন্টেন্ট ও পেজ ম্যানেজমেন্ট (Content Management)
          </h2>
          <p className="text-xs text-[#242424]/60 mt-0.5">
            About Us, Contact, FAQ, পলিসি পেজসমূহ এবং ফুটারের সকল লেখা কোড স্পর্শ না করেই পরিবর্তন করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAllContent}
          className="px-5 py-2.5 bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4 text-[#D5A64A]" />
          <span>কন্টেন্ট সংরক্ষণ করুন</span>
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-[#EDE5D9] text-xs">
        {[
          { id: 'about', label: 'আমাদের সম্পর্কে (About Us)' },
          { id: 'contact', label: `যোগাযোগ পেজ ও ইনবক্স (${contactMessages.length})` },
          { id: 'faq', label: `প্রশ্নোত্তর (FAQ - ${contentConfig.faqs.length})` },
          { id: 'deliveryPolicy', label: 'ডেলিভারি পলিসি' },
          { id: 'returnPolicy', label: 'রিটার্ন পলিসি' },
          { id: 'privacyPolicy', label: 'প্রাইভেসী পলিসি' },
          { id: 'termsConditions', label: 'শর্তাবলী (Terms)' },
          { id: 'footer', label: 'ফুটার কন্টেন্ট (Footer)' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeTab === t.id
                ? 'bg-[#242424] text-white font-bold'
                : 'text-[#242424]/75 hover:bg-[#FAF8F4]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. ABOUT US PAGE */}
      {activeTab === 'about' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-[#242424] border-b border-[#EDE5D9] pb-2">
            আমাদের সম্পর্কে (About Us Page) সম্পাদনা
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">উপরের ট্যাগ (Badge / Eyebrow)</label>
              <input
                type="text"
                value={contentConfig.aboutPage.badge}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    aboutPage: {
                      ...contentConfig.aboutPage,
                      badge: e.target.value,
                      eyebrow: e.target.value
                    }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">প্রধান শিরোনাম (Hero Title)</label>
              <input
                type="text"
                value={contentConfig.aboutPage.heroTitle}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    aboutPage: {
                      ...contentConfig.aboutPage,
                      heroTitle: e.target.value,
                      title: e.target.value
                    }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">হিরো বিবরণ (Hero Description)</label>
              <input
                type="text"
                value={contentConfig.aboutPage.heroDescription}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    aboutPage: {
                      ...contentConfig.aboutPage,
                      heroDescription: e.target.value,
                      subtitle: e.target.value
                    }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">গল্পের শিরোনাম (Story Heading)</label>
              <input
                type="text"
                value={contentConfig.aboutPage.storyTitle}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    aboutPage: { ...contentConfig.aboutPage, storyTitle: e.target.value }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">প্রথম অনুচ্ছেদ</label>
              <textarea
                rows={3}
                value={contentConfig.aboutPage.storyParagraph1}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    aboutPage: { ...contentConfig.aboutPage, storyParagraph1: e.target.value }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">দ্বিতীয় অনুচ্ছেদ</label>
              <textarea
                rows={3}
                value={contentConfig.aboutPage.storyParagraph2}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    aboutPage: { ...contentConfig.aboutPage, storyParagraph2: e.target.value }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTACT PAGE & CUSTOMER MESSAGES INBOX */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#242424] border-b border-[#EDE5D9] pb-2">
              যোগাযোগ পেজের লেখা সম্পাদনা (Contact Page Content)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">শিরোনাম (Title)</label>
                <input
                  type="text"
                  value={contentConfig.contactPage.title}
                  onChange={(e) =>
                    setContentConfig({
                      ...contentConfig,
                      contactPage: { ...contentConfig.contactPage, title: e.target.value }
                    })
                  }
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">সেবা সময় (Working Hours)</label>
                <input
                  type="text"
                  value={contentConfig.contactPage.workingHours}
                  onChange={(e) =>
                    setContentConfig({
                      ...contentConfig,
                      contactPage: {
                        ...contentConfig.contactPage,
                        workingHours: e.target.value,
                        serviceHours: e.target.value
                      }
                    })
                  }
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">সাবটাইটেল</label>
                <input
                  type="text"
                  value={contentConfig.contactPage.subtitle}
                  onChange={(e) =>
                    setContentConfig({
                      ...contentConfig,
                      contactPage: { ...contentConfig.contactPage, subtitle: e.target.value }
                    })
                  }
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Customer Contact Form Messages Inbox */}
          <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#C5A46D]" />
              <span>গ্রাহকদের পাঠানো বার্তা ইনবক্স ({contactMessages.length}টি)</span>
            </h3>

            {contactMessages.length === 0 ? (
              <p className="text-[#242424]/50 py-4 text-center">কোনো বার্তা নেই।</p>
            ) : (
              <div className="space-y-2.5">
                {contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#242424]">{msg.name}</span>
                        <span className="font-mono text-[#850B1B] font-semibold">{msg.phone}</span>
                        {msg.subject && (
                          <span className="px-2 py-0.5 bg-white border border-[#EDE5D9] rounded text-[10px]">
                            {msg.subject}
                          </span>
                        )}
                      </div>
                      <p className="text-[#242424]/85">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {msg.status !== 'read' ? (
                        <button
                          type="button"
                          onClick={() => {
                            api
                              .patch(`/admin/contact-messages/${encodeURIComponent(msg.id)}`, {
                                status: 'read'
                              })
                              .then(() => {
                                loadContactMessages();
                                window.dispatchEvent(new CustomEvent('admin-stats-updated'));
                                showToast('বার্তাটি পঠিত হিসেবে চিহ্নিত করা হয়েছে', 'success');
                              })
                              .catch(() => {
                                showToast('বার্তাটি আপডেট করা যায়নি', 'error');
                              });
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold cursor-pointer"
                        >
                          পঠিত করুন
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 bg-white border border-[#EDE5D9] text-[#242424]/50 rounded text-[10px] font-medium">
                          পঠিত
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          api.delete(`/admin/contact-messages/${encodeURIComponent(msg.id)}`)
                            .then(() => {
                              loadContactMessages();
                              showToast('বার্তাটি মুছে ফেলা হয়েছে', 'info');
                            })
                            .catch(() => {});
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. FAQ PAGE */}
      {activeTab === 'faq' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
            <h3 className="text-sm font-bold text-[#242424]">
              সাধারণ প্রশ্নোত্তর (FAQ) ম্যানেজমেন্ট
            </h3>
            <button
              type="button"
              onClick={addFaq}
              className="px-3.5 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন প্রশ্ন যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {contentConfig.faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#850B1B]">প্রশ্ন #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={faq.isActive !== false}
                        onChange={(e) => updateFaq(faq.id, { isActive: e.target.checked })}
                        className="accent-emerald-600"
                      />
                      <span>সক্রিয়</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFaq(faq.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={faq.q || faq.question || ''}
                  onChange={(e) =>
                    updateFaq(faq.id, { q: e.target.value, question: e.target.value })
                  }
                  placeholder="প্রশ্ন..."
                  className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold"
                />
                <textarea
                  rows={2}
                  value={faq.a || faq.answer || ''}
                  onChange={(e) =>
                    updateFaq(faq.id, { a: e.target.value, answer: e.target.value })
                  }
                  placeholder="উত্তর..."
                  className="w-full bg-white border border-[#EDE5D9] rounded-lg p-2.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4-7. POLICY PAGES */}
      {activeTab === 'deliveryPolicy' &&
        renderPolicyEditor('deliveryPolicy', 'ডেলিভারি পলিসি ও চার্জ (Delivery Policy)')}
      {activeTab === 'returnPolicy' &&
        renderPolicyEditor('returnPolicy', 'রিটার্ন ও এক্সচেঞ্জ পলিসি (Return Policy)')}
      {activeTab === 'privacyPolicy' &&
        renderPolicyEditor('privacyPolicy', 'গোপনীয়তা ও প্রাইভেসী নীতি (Privacy Policy)')}
      {activeTab === 'termsConditions' &&
        renderPolicyEditor('termsConditions', 'শর্তাবলী ও নিয়মাবলী (Terms & Conditions)')}

      {/* 8. FOOTER CONTENT */}
      {activeTab === 'footer' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-[#242424] border-b border-[#EDE5D9] pb-2">
            ফুটার কন্টেন্ট ও কপিরাইট (Footer Content)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">ব্র্যান্ড বিবরণ (Brand Description)</label>
              <textarea
                rows={2}
                value={contentConfig.footerContent.brandDescription}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    footerContent: {
                      ...contentConfig.footerContent,
                      brandDescription: e.target.value
                    }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">বটম ট্যাগলাইন (Bottom Tagline)</label>
              <input
                type="text"
                value={contentConfig.footerContent.bottomTagline}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    footerContent: {
                      ...contentConfig.footerContent,
                      bottomTagline: e.target.value
                    }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">কপিরাইট টেক্সট (Copyright Text)</label>
              <input
                type="text"
                value={contentConfig.footerContent.copyrightText}
                onChange={(e) =>
                  setContentConfig({
                    ...contentConfig,
                    footerContent: {
                      ...contentConfig.footerContent,
                      copyrightText: e.target.value
                    }
                  })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
