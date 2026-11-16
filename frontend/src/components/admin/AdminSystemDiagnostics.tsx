import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import {
  Activity,
  Bot,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  FileCode2,
  FlaskConical,
  HardDrive,
  Image as ImageIcon,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';

type EmailProviderName = 'orbitmail' | 'sendpulse' | 'resend' | 'ses' | 'google_script';

interface DiagnosticsStatus {
  runtime: 'cloudflare-d1' | 'libsql-sqlite';
  nodeEnv: string;
  siteUrl: string;
  demoMode: boolean;
  bindings: {
    d1: boolean;
    turso: boolean;
    r2: boolean;
    kv: boolean;
  };
  storage: {
    activeProvider: 'r2' | 'imgbb' | 'inline-dev';
    r2Bound: boolean;
    imgbbConfigured: boolean;
  };
  email: {
    orbitmail: boolean;
    sendpulse: boolean;
    resend: boolean;
    ses: boolean;
    google_script: boolean;
    order: EmailProviderName[];
    fromEmail: string;
    fromName: string;
    orbitmailFrom: string;
    orbitmailDomain?: string;
  };
  sms: {
    enabled: boolean;
    configured: boolean;
    alwaysSend: boolean;
    providers: {
      greenweb: boolean;
      bulksmsbd: boolean;
    };
  };
  secretsConfigured: {
    jwtSecretCustom: boolean;
    adminApiKey: boolean;
    geminiApiKey: boolean;
    courierWebhookSecret: boolean;
    indexNowKey: boolean;
  };
  timestamp: string;
}

interface EmailAttempt {
  provider: EmailProviderName;
  ok: boolean;
  status?: number;
  error?: string;
  messageId?: string;
  durationMs?: number;
}

interface EmailTestResult {
  success: boolean;
  delivered: boolean;
  provider: string;
  messageId?: string;
  durationMs?: number;
  to?: string;
  requestedProvider?: string;
  attempts: EmailAttempt[];
  errorMessage?: string;
}

interface UploadTestResult {
  success: boolean;
  provider: 'r2' | 'imgbb' | 'inline-dev';
  url: string;
  key?: string;
  contentType: string;
  sizeBytes: number;
  durationMs: number;
  verifiedReadback?: boolean;
  previewStatus?: 'loading' | 'loaded' | 'error';
  errorMessage?: string;
}

interface DatabaseTestResult {
  success: boolean;
  runtime: string;
  readDurationMs?: number;
  writeRoundTripMs?: number;
  totalDurationMs?: number;
  writeReadMatch?: boolean;
  counts?: {
    products: number;
    categories: number;
    orders: number;
    users: number;
    systemSettings: number;
  };
  error?: string;
}

interface CacheTestResult {
  success: boolean;
  action: 'test' | 'purge';
  backend: string;
  readBackMatch?: boolean;
  durationMs: number;
  message?: string;
}

interface AiTestResult {
  success: boolean;
  configured: boolean;
  status?: number;
  durationMs?: number;
  modelCount?: number;
  sampleModels?: string[];
  message?: string;
}

interface SmsTestResult {
  success: boolean;
  dryRun?: boolean;
  delivered?: boolean;
  provider?: string;
  validPhone?: boolean;
  normalizedPhone?: string;
  smsEnabled?: boolean;
  smsConfigured?: boolean;
  durationMs?: number;
  message?: string;
  error?: string;
}

interface EndpointCheckRow {
  path: string;
  label: string;
  ok: boolean;
  status: number;
  contentType: string;
  sizeBytes: number;
  durationMs: number;
}

const EMAIL_PROVIDER_LABELS: Record<EmailProviderName, string> = {
  orbitmail: 'OrbitMail',
  sendpulse: 'SendPulse',
  resend: 'Resend',
  ses: 'Amazon SES',
  google_script: 'Apps Script',
};

const EMAIL_PRESETS: Array<{ id: string; label: string; subject: string; message: string }> = [
  {
    id: 'ping',
    label: 'ডায়াগনস্টিক পিং (Ping)',
    subject: 'Fashion Doniya BD — Email Pipeline Diagnostic Test',
    message:
      'এটি Fashion Doniya BD অ্যাডমিন প্যানেল থেকে পাঠানো একটি টেস্ট ইমেইল। আপনার ইমেইল ডেলিভারি পাইপলাইন সঠিকভাবে কাজ করছে।',
  },
  {
    id: 'order',
    label: 'স্যাম্পল অর্ডার অ্যালার্ট',
    subject: 'Order Confirmation Test #FD-TEST-2026 — Fashion Doniya BD',
    message:
      'স্যাম্পল অর্ডার কনফার্মেশন টেস্ট: ৩.৫ বহর কটন প্রিন্ট (৩ গজ) — মোট ৳১,২৫০। এটি শুধুমাত্র ফরম্যাট ও ডেলিভারি যাচাইয়ের জন্য পাঠানো হয়েছে।',
  },
  {
    id: 'otp',
    label: 'স্যাম্পল OTP টেস্ট',
    subject: 'Security Verification Code Test — Fashion Doniya BD',
    message:
      'আপনার স্যাম্পল ভেরিফিকেশন কোড (টেস্ট): 482910। এটি একটি সিস্টেম টেস্ট ইমেইল।',
  },
];

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || axiosErr?.message || fallback;
}

function StatusPill({ ok, okText, failText }: { ok: boolean; okText: string; failText: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        ok
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-stone-100 text-stone-600 border-stone-200'
      }`}
    >
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3 opacity-70" />}
      <span>{ok ? okText : failText}</span>
    </span>
  );
}

export const AdminSystemDiagnostics: React.FC = () => {
  const { settings, showToast } = useStore();

  const [status, setStatus] = useState<DiagnosticsStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);

  // Email tester state
  const [emailTo, setEmailTo] = useState(settings.supportEmail || 'admin@fashiondoniyabd.com');
  const [emailProvider, setEmailProvider] = useState<'auto' | EmailProviderName>('auto');
  const [emailSubject, setEmailSubject] = useState(EMAIL_PRESETS[0].subject);
  const [emailMessage, setEmailMessage] = useState(EMAIL_PRESETS[0].message);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailTestResult | null>(null);

  // Image upload tester state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadTestResult | null>(null);
  const [deletingTestKey, setDeletingTestKey] = useState(false);

  // Database, Cache, AI, SMS, Endpoints states
  const [dbTesting, setDbTesting] = useState(false);
  const [dbResult, setDbResult] = useState<DatabaseTestResult | null>(null);

  const [cacheTesting, setCacheTesting] = useState(false);
  const [cacheResult, setCacheResult] = useState<CacheTestResult | null>(null);

  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<AiTestResult | null>(null);

  const [smsPhone, setSmsPhone] = useState('01712345678');
  const [smsMessage, setSmsMessage] = useState('Fashion Doniya BD: Admin SMS diagnostic test.');
  const [smsDryRun, setSmsDryRun] = useState(true);
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsResult, setSmsResult] = useState<SmsTestResult | null>(null);

  const [endpointsTesting, setEndpointsTesting] = useState(false);
  const [endpointRows, setEndpointRows] = useState<EndpointCheckRow[]>([]);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await api.get<DiagnosticsStatus & { success: boolean }>('/admin/diagnostics/status');
      if (res.data?.success) {
        setStatus(res.data);
      }
    } catch (err) {
      showToast(extractErrorMessage(err, 'সিস্টেম স্ট্যাটাস লোড করা যায়নি।'), 'error');
    } finally {
      setStatusLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim()) {
      showToast('প্রাপকের ইমেইল দিন।', 'error');
      return;
    }
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await api.post<EmailTestResult>('/admin/diagnostics/test-email', {
        to: emailTo.trim(),
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
        provider: emailProvider,
      });
      setEmailResult(res.data);
      if (res.data.delivered) {
        showToast(`টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে (${res.data.provider})`, 'success');
      } else {
        showToast('ইমেইল পাঠানো ব্যর্থ হয়েছে (বিস্তারিত লগ দেখুন)।', 'error');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'ইমেইল টেস্ট অনুরোধ ব্যর্থ হয়েছে।');
      setEmailResult({
        success: false,
        delivered: false,
        provider: 'error',
        attempts: [],
        errorMessage: msg,
      });
      showToast(msg, 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleTestUpload = async (useSynthetic: boolean) => {
    if (!useSynthetic && !selectedFile) {
      showToast('অনুগ্রহ করে একটি ছবি নির্বাচন করুন অথবা সিন্থেটিক টেস্ট ব্যবহার করুন।', 'error');
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      let res;
      if (useSynthetic) {
        res = await api.post<UploadTestResult>('/admin/diagnostics/test-upload', {
          synthetic: true,
          fileName: 'diag_synthetic_test',
        });
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await api.post<UploadTestResult>('/admin/diagnostics/test-upload', formData);
      }
      if (res?.data) {
        setUploadResult({ ...res.data, previewStatus: 'loading' });
        showToast(`ইমেজ আপলোড টেস্ট সফল (${res.data.provider})`, 'success');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'ইমেজ আপলোড টেস্ট ব্যর্থ হয়েছে।');
      setUploadResult({
        success: false,
        provider: 'inline-dev',
        url: '',
        contentType: '',
        sizeBytes: 0,
        durationMs: 0,
        errorMessage: msg,
      });
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTestUpload = async () => {
    if (!uploadResult?.key) return;
    setDeletingTestKey(true);
    try {
      await api.delete('/admin/diagnostics/test-upload', {
        data: { key: uploadResult.key },
      });
      showToast('টেস্ট ইমেজ R2 বাকেট থেকে মুছে ফেলা হয়েছে।', 'info');
      setUploadResult(null);
    } catch (err) {
      showToast(extractErrorMessage(err, 'টেস্ট ফাইল মুছে ফেলা যায়নি।'), 'error');
    } finally {
      setDeletingTestKey(false);
    }
  };

  const runDbTest = async () => {
    setDbTesting(true);
    try {
      const res = await api.post<DatabaseTestResult>('/admin/diagnostics/test-database', {});
      setDbResult(res.data);
      return res.data;
    } catch (err) {
      const errRes: DatabaseTestResult = {
        success: false,
        runtime: status?.runtime || 'unknown',
        error: extractErrorMessage(err, 'ডাটাবেজ টেস্ট ব্যর্থ হয়েছে।'),
      };
      setDbResult(errRes);
      return errRes;
    } finally {
      setDbTesting(false);
    }
  };

  const runCacheTest = async (action: 'test' | 'purge') => {
    setCacheTesting(true);
    try {
      const res = await api.post<CacheTestResult>('/admin/diagnostics/test-cache', { action });
      setCacheResult(res.data);
      if (action === 'purge') {
        showToast(res.data.message || 'ক্যাশ ক্লিয়ার করা হয়েছে।', 'success');
      }
      return res.data;
    } catch (err) {
      const errRes: CacheTestResult = {
        success: false,
        action,
        backend: 'unknown',
        durationMs: 0,
        message: extractErrorMessage(err, 'ক্যাশ টেস্ট ব্যর্থ হয়েছে।'),
      };
      setCacheResult(errRes);
      return errRes;
    } finally {
      setCacheTesting(false);
    }
  };

  const runAiTest = async () => {
    setAiTesting(true);
    try {
      const res = await api.post<AiTestResult>('/admin/diagnostics/test-ai', {});
      setAiResult(res.data);
      return res.data;
    } catch (err) {
      const errRes: AiTestResult = {
        success: false,
        configured: false,
        message: extractErrorMessage(err, 'AI কানেক্টিভিটি টেস্ট ব্যর্থ হয়েছে।'),
      };
      setAiResult(errRes);
      return errRes;
    } finally {
      setAiTesting(false);
    }
  };

  const runSmsTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsTesting(true);
    try {
      const res = await api.post<SmsTestResult>('/admin/diagnostics/test-sms', {
        to: smsPhone.trim(),
        message: smsMessage.trim(),
        dryRun: smsDryRun,
      });
      setSmsResult(res.data);
      if (res.data.delivered) {
        showToast(`টেস্ট SMS পাঠানো হয়েছে (${res.data.provider})`, 'success');
      } else if (res.data.dryRun) {
        showToast('SMS ড্রাই-রান চেক সম্পন্ন হয়েছে।', 'info');
      }
    } catch (err) {
      setSmsResult({
        success: false,
        error: extractErrorMessage(err, 'SMS টেস্ট ব্যর্থ হয়েছে।'),
      });
    } finally {
      setSmsTesting(false);
    }
  };

  const runEndpointsTest = async () => {
    setEndpointsTesting(true);
    const base = import.meta.env.VITE_API_URL || '';
    const targets = [
      { path: '/api/health', label: 'API Health' },
      { path: '/api/v1/settings', label: 'Store Settings API' },
      { path: '/sitemap.xml', label: 'XML Sitemap' },
      { path: '/feed.xml', label: 'Merchant Feed XML' },
    ];

    const results: EndpointCheckRow[] = [];
    for (const target of targets) {
      const started = performance.now();
      try {
        const resp = await fetch(`${base}${target.path}`, { cache: 'no-store' });
        const text = await resp.text();
        results.push({
          path: target.path,
          label: target.label,
          ok: resp.ok,
          status: resp.status,
          contentType: resp.headers.get('content-type') || 'unknown',
          sizeBytes: new Blob([text]).size,
          durationMs: Math.round(performance.now() - started),
        });
      } catch {
        results.push({
          path: target.path,
          label: target.label,
          ok: false,
          status: 0,
          contentType: 'network-error',
          sizeBytes: 0,
          durationMs: Math.round(performance.now() - started),
        });
      }
    }
    setEndpointRows(results);
    setEndpointsTesting(false);
    return results;
  };

  const handleRunAllChecks = async () => {
    setRunningAll(true);
    await Promise.allSettled([
      fetchStatus(),
      runDbTest(),
      runCacheTest('test'),
      runAiTest(),
      runEndpointsTest(),
    ]);
    setRunningAll(false);
    showToast('সকল সিস্টেম ডায়াগনস্টিক চেক সম্পন্ন হয়েছে!', 'success');
  };

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => showToast('ক্লিপবোর্ডে কপি করা হয়েছে', 'success'),
      () => showToast('কপি করা যায়নি', 'error')
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Diagnostic Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#EDE5D9] flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-[#850B1B]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#242424]">
                সিস্টেম টেস্টিং ও ডায়াগনস্টিকস ল্যাব (System Diagnostics &amp; Test Suite)
              </h3>
              <p className="text-xs text-[#242424]/60 mt-0.5">
                লাইভ ইমেইল ডেলিভারি, R2/ImgBB ইমেজ আপলোড, ডাটাবেজ, এজ ক্যাশ, Gemini AI, SMS ও এন্ডপয়েন্ট টেস্ট করুন।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchStatus}
              disabled={statusLoading || runningAll}
              className="px-3.5 py-2 rounded-lg border border-[#EDE5D9] bg-[#FAF8F4] hover:bg-[#FAF6F0] text-xs font-semibold text-[#242424] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              type="button"
              onClick={handleRunAllChecks}
              disabled={runningAll}
              className="px-4 py-2 rounded-lg bg-[#242424] hover:bg-[#850B1B] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {runningAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-[#D5A64A]" />}
              <span>সব সিস্টেম টেস্ট করুন</span>
            </button>
          </div>
        </div>

        {/* Quick Runtime Pills */}
        {status && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#EDE5D9] text-xs">
            <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
              <p className="text-[10px] font-semibold text-[#242424]/55 uppercase">Database Runtime</p>
              <p className="font-bold text-[#242424] mt-0.5">
                {status.bindings.d1 ? 'Cloudflare D1' : 'LibSQL / SQLite'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
              <p className="text-[10px] font-semibold text-[#242424]/55 uppercase">Media Storage</p>
              <p className="font-bold text-[#242424] mt-0.5 uppercase">
                {status.storage.activeProvider}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
              <p className="text-[10px] font-semibold text-[#242424]/55 uppercase">Edge Cache</p>
              <p className="font-bold text-[#242424] mt-0.5">
                {status.bindings.kv ? 'Cloudflare KV + Memory' : 'In-Memory Only'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
              <p className="text-[10px] font-semibold text-[#242424]/55 uppercase">Environment / Mode</p>
              <p className="font-bold text-[#242424] mt-0.5">
                {status.nodeEnv} {status.demoMode ? '· DEMO READ-ONLY' : '· Live'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 1. Email Testing System */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE5D9] pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#850B1B]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              ১. ইমেইল ডেলিভারি টেস্টিং সিস্টেম (Email Pipeline Tester)
            </h4>
          </div>
          {status && (
            <span className="text-[11px] text-[#242424]/65 font-mono">
              From: {status.email.orbitmail ? status.email.orbitmailFrom : status.email.fromEmail}
              {status.email.orbitmailDomain ? ` · Domain: ${status.email.orbitmailDomain}` : ''}
            </span>
          )}
        </div>

        {/* Provider Status Matrix */}
        {status && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-[#242424]/60 mr-1">Failover Order:</span>
            {status.email.order.map((p, idx) => {
              const configured = status.email[p];
              return (
                <div
                  key={p}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                    configured
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-[#FAF8F4] border-[#EDE5D9] text-[#242424]/50'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-60">{idx + 1}.</span>
                  <span>{EMAIL_PROVIDER_LABELS[p]}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleTestEmail} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                প্রাপক ইমেইল (Recipient Email) *
              </label>
              <input
                type="email"
                required
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                ইমেইল প্রোভাইডার (Provider Target)
              </label>
              <select
                value={emailProvider}
                onChange={(e) => setEmailProvider(e.target.value as 'auto' | EmailProviderName)}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-semibold"
              >
                <option value="auto">Automatic Failover Pipeline (Recommended)</option>
                {(status?.email.order || ['orbitmail', 'sendpulse', 'resend', 'ses', 'google_script']).map((p) => (
                  <option key={p} value={p}>
                    {EMAIL_PROVIDER_LABELS[p as EmailProviderName]} Only{' '}
                    {status ? (status.email[p as EmailProviderName] ? '(Configured)' : '(Not Configured)') : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#242424]/60 mr-1">দ্রুত টেমপ্লেট:</span>
            {EMAIL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setEmailSubject(preset.subject);
                  setEmailMessage(preset.message);
                }}
                className="px-2.5 py-1 rounded-md bg-[#FAF8F4] hover:bg-[#FAF6F0] border border-[#EDE5D9] text-[11px] font-semibold text-[#242424] cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-[#242424] mb-1">বিষয় (Subject)</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#242424] mb-1">মেসেজ বডি (Test Message)</label>
            <textarea
              rows={2}
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={emailSending}
              className="px-5 py-2.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {emailSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>টেস্ট ইমেইল পাঠান</span>
            </button>
          </div>
        </form>

        {emailResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2.5 ${
              emailResult.delivered
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold">
                {emailResult.delivered ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  {emailResult.delivered
                    ? `ইমেইল ডেলিভারি সফল — Provider: ${emailResult.provider}`
                    : `ইমেইল ডেলিভারি ব্যর্থ (${emailResult.errorMessage || emailResult.provider})`}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {emailResult.messageId && <span>ID: {emailResult.messageId}</span>}
                {typeof emailResult.durationMs === 'number' && <span>{emailResult.durationMs}ms</span>}
              </div>
            </div>

            {emailResult.attempts?.length > 0 && (
              <div className="bg-white/80 rounded-lg border border-black/10 overflow-hidden">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-black/5 font-bold">
                    <tr>
                      <th className="px-3 py-1.5">Provider</th>
                      <th className="px-3 py-1.5">Result</th>
                      <th className="px-3 py-1.5">Status</th>
                      <th className="px-3 py-1.5">Latency</th>
                      <th className="px-3 py-1.5">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailResult.attempts.map((a, idx) => (
                      <tr key={`${a.provider}-${idx}`} className="border-t border-black/5">
                        <td className="px-3 py-1.5 font-semibold">{a.provider}</td>
                        <td className="px-3 py-1.5">
                          <span className={a.ok ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {a.ok ? 'OK' : 'FAILED'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 font-mono">{a.status ?? '—'}</td>
                        <td className="px-3 py-1.5 font-mono">
                          {typeof a.durationMs === 'number' ? `${a.durationMs}ms` : '—'}
                        </td>
                        <td className="px-3 py-1.5 font-mono truncate max-w-[260px]">
                          {a.messageId || a.error || 'Delivered'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Image Upload & Media Pipeline Tester */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE5D9] pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#850B1B]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              ২. ইমেজ আপলোড ও মিডিয়া স্টোরেজ টেস্ট (Image Upload Pipeline)
            </h4>
          </div>
          {status && (
            <div className="flex items-center gap-2">
              <StatusPill ok={status.storage.r2Bound} okText="R2 Bound" failText="R2 Unbound" />
              <StatusPill ok={status.storage.imgbbConfigured} okText="ImgBB Ready" failText="No ImgBB" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-dashed border-[#C5A46D] bg-[#FAF8F4] space-y-3">
            <label className="block font-bold text-[#242424]">
              নিজের ছবি আপলোড করে টেস্ট করুন (PNG, JPG, WEBP, GIF, SVG — Max 10MB)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-[#242424] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#242424] file:text-white hover:file:bg-[#C5A46D] cursor-pointer"
            />
            {selectedFile && (
              <p className="text-[11px] text-[#242424]/70 font-mono">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'image'})
              </p>
            )}
            <button
              type="button"
              disabled={uploading || !selectedFile}
              onClick={() => handleTestUpload(false)}
              className="px-4 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white font-bold rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>ফাইল আপলোড টেস্ট করুন</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#EDE5D9] bg-[#FAF8F4] flex flex-col justify-between space-y-3">
            <div>
              <p className="font-bold text-[#242424]">দ্রুত সিন্থেটিক ইমেজ টেস্ট (1-Click Synthetic PNG)</p>
              <p className="text-[11px] text-[#242424]/65 mt-1">
                কোনো ফাইল সিলেক্ট না করেই সার্ভার থেকে একটি ১×১ PNG তৈরি করে R2 / ImgBB / Fallback আপলোড ও রিড-ব্যাক যাচাই করুন।
              </p>
            </div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => handleTestUpload(true)}
              className="px-4 py-2 bg-[#850B1B] hover:bg-[#6B0812] text-white font-bold rounded-lg flex items-center gap-2 self-start cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />}
              <span>১-ক্লিক সিন্থেটিক আপলোড টেস্ট</span>
            </button>
          </div>
        </div>

        {uploadResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 ${
              uploadResult.success
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}
          >
            {uploadResult.success ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-24 h-24 rounded-lg border border-[#EDE5D9] bg-white overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={uploadResult.url}
                    alt="Uploaded diagnostic preview"
                    onLoad={() =>
                      setUploadResult((prev) => (prev ? { ...prev, previewStatus: 'loaded' } : prev))
                    }
                    onError={() =>
                      setUploadResult((prev) => (prev ? { ...prev, previewStatus: 'error' } : prev))
                    }
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#242424] text-white font-bold uppercase text-[10px]">
                      Provider: {uploadResult.provider}
                    </span>
                    <span className="font-mono text-[11px] text-[#242424]/75">
                      {uploadResult.sizeBytes} bytes · {uploadResult.durationMs}ms
                    </span>
                    {uploadResult.verifiedReadback !== undefined && (
                      <StatusPill
                        ok={uploadResult.verifiedReadback}
                        okText="R2 Head Verified"
                        failText="R2 Readback Failed"
                      />
                    )}
                    <StatusPill
                      ok={uploadResult.previewStatus === 'loaded'}
                      okText="Browser Render OK"
                      failText={
                        uploadResult.previewStatus === 'error' ? 'Browser Load Error' : 'Loading...'
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-[#EDE5D9] rounded-lg px-2.5 py-1.5">
                    <span className="font-mono text-[11px] truncate flex-1">{uploadResult.url}</span>
                    <button
                      type="button"
                      onClick={() => copyText(uploadResult.url)}
                      className="p-1 text-[#242424]/70 hover:text-[#242424] cursor-pointer"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {!uploadResult.url.startsWith('data:') && (
                      <a
                        href={uploadResult.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[#242424]/70 hover:text-[#242424]"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {uploadResult.key && uploadResult.key.startsWith('uploads/diag_') && (
                    <button
                      type="button"
                      disabled={deletingTestKey}
                      onClick={handleDeleteTestUpload}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>টেস্ট ফাইল R2 থেকে মুছুন</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-rose-800 font-semibold">{uploadResult.errorMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Other Testing Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3A. Database Health */}
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
            <div className="flex items-center gap-2 font-bold text-[#242424]">
              <Database className="w-4 h-4 text-[#C5A46D]" />
              <span>৩. ডাটাবেজ রিড/রাইট টেস্ট (D1 / LibSQL)</span>
            </div>
            <button
              type="button"
              onClick={runDbTest}
              disabled={dbTesting}
              className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {dbTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              <span>টেস্ট চালান</span>
            </button>
          </div>

          {dbResult ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill ok={dbResult.success} okText="DB Connected" failText="DB Error" />
                {dbResult.writeReadMatch !== undefined && (
                  <StatusPill
                    ok={dbResult.writeReadMatch}
                    okText="Write/Read Round-Trip OK"
                    failText="Write Mismatch"
                  />
                )}
                {typeof dbResult.totalDurationMs === 'number' && (
                  <span className="font-mono text-[11px] text-[#242424]/70">
                    Read {dbResult.readDurationMs}ms · Write {dbResult.writeRoundTripMs}ms
                  </span>
                )}
              </div>
              {dbResult.counts && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                  {Object.entries(dbResult.counts).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] text-center">
                      <p className="text-[10px] text-[#242424]/60 truncate">{k}</p>
                      <p className="font-bold text-sm text-[#242424] tabular-nums">{v}</p>
                    </div>
                  ))}
                </div>
              )}
              {dbResult.error && <p className="text-rose-700 font-mono">{dbResult.error}</p>}
            </div>
          ) : (
            <p className="text-[#242424]/60">
              মূল টেবিলগুলোর row count এবং একটি non-destructive write/read/delete রাউন্ড-ট্রিপ যাচাই করবে।
            </p>
          )}
        </div>

        {/* 3B. Edge Cache & Purge */}
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-[#EDE5D9] pb-2 flex-wrap">
            <div className="flex items-center gap-2 font-bold text-[#242424]">
              <Layers className="w-4 h-4 text-[#C5A46D]" />
              <span>৪. এজ ক্যাশ (KV / Memory) টেস্ট ও পার্জ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => runCacheTest('test')}
                disabled={cacheTesting}
                className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {cacheTesting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>রাউন্ড-ট্রিপ টেস্ট</span>
              </button>
              <button
                type="button"
                onClick={() => runCacheTest('purge')}
                disabled={cacheTesting}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold cursor-pointer disabled:opacity-50"
              >
                হোম ক্যাশ ক্লিয়ার
              </button>
            </div>
          </div>

          {cacheResult ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  ok={cacheResult.success}
                  okText={cacheResult.action === 'purge' ? 'Purged' : 'Cache R/W OK'}
                  failText="Cache Failed"
                />
                <span className="font-mono text-[11px] text-[#242424]/70">
                  {cacheResult.backend} · {cacheResult.durationMs}ms
                </span>
              </div>
              {cacheResult.message && <p className="text-[#242424]/80">{cacheResult.message}</p>}
            </div>
          ) : (
            <p className="text-[#242424]/60">
              KV বা ইন-মেমরি ক্যাশে একটি টেম্পোরারি কী লিখে পড়ে যাচাই করবে, অথবা হোমপেজ ক্যাশ পার্জ করবে।
            </p>
          )}
        </div>

        {/* 3C. AI Gemini Studio Test */}
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
            <div className="flex items-center gap-2 font-bold text-[#242424]">
              <Bot className="w-4 h-4 text-[#C5A46D]" />
              <span>৫. AI আউটফিট স্টুডিও (Gemini API) টেস্ট</span>
            </div>
            <button
              type="button"
              onClick={runAiTest}
              disabled={aiTesting}
              className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {aiTesting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>API কানেকশন টেস্ট</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill
              ok={Boolean(status?.secretsConfigured.geminiApiKey)}
              okText="GEMINI_API_KEY Configured"
              failText="GEMINI_API_KEY Missing"
            />
          </div>

          {aiResult && (
            <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] space-y-1">
              <div className="flex items-center gap-2">
                <StatusPill ok={aiResult.success} okText="Gemini Reachable" failText="Check Failed" />
                {typeof aiResult.durationMs === 'number' && (
                  <span className="font-mono text-[11px]">{aiResult.durationMs}ms</span>
                )}
                {typeof aiResult.modelCount === 'number' && (
                  <span className="text-[11px] font-semibold">{aiResult.modelCount} models listed</span>
                )}
              </div>
              {aiResult.sampleModels && aiResult.sampleModels.length > 0 && (
                <p className="font-mono text-[10px] text-[#242424]/70">
                  Models: {aiResult.sampleModels.join(', ')}
                </p>
              )}
              {aiResult.message && <p className="text-rose-700">{aiResult.message}</p>}
            </div>
          )}
        </div>

        {/* 3D. SMS Gateway Test */}
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
            <div className="flex items-center gap-2 font-bold text-[#242424]">
              <MessageSquare className="w-4 h-4 text-[#C5A46D]" />
              <span>৬. SMS গেটওয়ে টেস্ট (Secondary Channel)</span>
            </div>
            {status && (
              <StatusPill
                ok={status.sms.enabled}
                okText="SMS_ENABLED=true"
                failText="SMS Disabled by Policy"
              />
            )}
          </div>

          <form onSubmit={runSmsTest} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="01712345678"
                className="bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-mono"
              />
              <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsDryRun}
                  onChange={(e) => setSmsDryRun(e.target.checked)}
                  className="accent-[#242424]"
                />
                <span>Dry-Run Only (No carrier charge)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="flex-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5"
              />
              <button
                type="submit"
                disabled={smsTesting}
                className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold cursor-pointer disabled:opacity-50"
              >
                {smsTesting ? 'Testing...' : 'SMS টেস্ট'}
              </button>
            </div>
          </form>

          {smsResult && (
            <div className="p-2.5 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill ok={smsResult.success} okText="Check OK" failText="Failed" />
                {smsResult.normalizedPhone && (
                  <span className="font-mono text-[11px]">Phone: {smsResult.normalizedPhone}</span>
                )}
                {smsResult.provider && (
                  <span className="font-mono text-[11px]">Provider: {smsResult.provider}</span>
                )}
              </div>
              {(smsResult.message || smsResult.error) && (
                <p className="text-[11px] text-[#242424]/80">{smsResult.message || smsResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Storefront Endpoints + Security/Env Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-2">
            <div className="flex items-center gap-2 font-bold text-[#242424]">
              <FileCode2 className="w-4 h-4 text-[#C5A46D]" />
              <span>৭. স্টোরফ্রন্ট ও SEO HTTP এন্ডপয়েন্ট চেক</span>
            </div>
            <button
              type="button"
              onClick={runEndpointsTest}
              disabled={endpointsTesting}
              className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {endpointsTesting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>এন্ডপয়েন্ট চেক</span>
            </button>
          </div>

          {endpointRows.length > 0 ? (
            <div className="space-y-1.5">
              {endpointRows.map((row) => (
                <div
                  key={row.path}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#242424]">{row.label}</p>
                    <p className="font-mono text-[10px] text-[#242424]/60 truncate">
                      {row.path} · {row.contentType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    <span>{(row.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span>{row.durationMs}ms</span>
                    <StatusPill ok={row.ok} okText={`${row.status}`} failText={`${row.status || 'ERR'}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#242424]/60">
              ব্রাউজার থেকে সরাসরি `/api/health`, `/api/v1/settings`, `/sitemap.xml` এবং `/feed.xml` রেসপন্স চেক করুন।
            </p>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#242424] border-b border-[#EDE5D9] pb-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A46D]" />
            <span>৮. সিকিউরিটি, বাইন্ডিং ও এনভায়রনমেন্ট চেকলিস্ট</span>
          </div>

          {status ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
                <span className="font-semibold">Custom JWT Secret (32+ chars)</span>
                <StatusPill ok={status.secretsConfigured.jwtSecretCustom} okText="Set" failText="Dev Default" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
                <span className="font-semibold">ADMIN_API_KEY</span>
                <StatusPill ok={status.secretsConfigured.adminApiKey} okText="Set" failText="Missing" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
                <span className="font-semibold">COURIER_WEBHOOK_SECRET</span>
                <StatusPill ok={status.secretsConfigured.courierWebhookSecret} okText="Set" failText="Default" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
                <span className="font-semibold">INDEXNOW_KEY</span>
                <StatusPill ok={status.secretsConfigured.indexNowKey} okText="Set" failText="Default" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
                <span className="font-semibold flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> R2 / Turso / D1
                </span>
                <span className="font-mono text-[10px] font-bold text-[#242424]">
                  {status.bindings.d1 ? 'D1' : status.bindings.turso ? 'Turso/SQLite' : 'Local'} ·{' '}
                  {status.bindings.r2 ? 'R2' : 'No-R2'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9]">
                <span className="font-semibold">SITE_URL</span>
                <span className="font-mono text-[10px] truncate max-w-[140px]">
                  {status.siteUrl || 'Not Set'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[#242424]/60">লোড হচ্ছে...</p>
          )}
        </div>
      </div>
    </div>
  );
};
