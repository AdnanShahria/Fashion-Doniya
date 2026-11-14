import React, { useState } from 'react';
import { Shield, RefreshCw, Database, Cloud, Lock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { ENV } from '../../config/env_proxy';
import { useSysadmStore } from '../../store/sysadmStore';

export const SysAdmPage: React.FC = () => {
  const { token, email: storedEmail, setSession } = useSysadmStore();
  const [email, setEmail] = useState(storedEmail || 'sysadm@fashiondoniyabd.com');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [statusInfo, setStatusInfo] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post(`${ENV.API_BASE_URL}/sysadm/request-otp`, { email });
      setOtpSent(true);
      setMessage(
        res.data?.devOtp
          ? `Dev OTP: ${res.data.devOtp}`
          : 'OTP sent to SuperAdmin email.'
      );
    } catch {
      setMessage('Failed to request OTP.');
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post(`${ENV.API_BASE_URL}/sysadm/verify-otp`, { email, otp });
      if (res.data?.token) {
        setSession(res.data.token, res.data.email);
        const st = await axios.get(`${ENV.API_BASE_URL}/sysadm/status`, {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        setStatusInfo(st.data);
      }
    } catch {
      setMessage('Invalid or expired OTP.');
    }
  };

  const purgeCache = async () => {
    const res = await axios.post(`${ENV.API_BASE_URL}/sysadm/cache/purge`, {}, { headers: authHeaders });
    setMessage(res.data?.message || 'Cache purged.');
  };

  const toggleDemoMode = async (enabled: boolean) => {
    const res = await axios.post(
      `${ENV.API_BASE_URL}/sysadm/demo-mode`,
      { enabled },
      { headers: authHeaders }
    );
    setStatusInfo((prev) => ({ ...(prev || {}), demoMode: res.data?.demoMode }));
    setMessage(`Demo mode ${enabled ? 'enabled' : 'disabled'}.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#242424] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white border border-[#EDE5D9] rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#C5A46D]" />
            <div>
              <h1 className="text-xl font-bold">Fashion Doniya SuperAdmin (/sysadm)</h1>
              <p className="text-xs text-[#242424]/60">Cloudflare Edge Control, Provisioning & Cache</p>
            </div>
          </div>
          {token && (
            <button
              onClick={() => {
                setSession(null, null);
                setStatusInfo(null);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#EDE5D9] hover:bg-[#FAF6F0] cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>

        {message && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-3 rounded-xl">
            {message}
          </div>
        )}

        {!token ? (
          <div className="bg-white border border-[#EDE5D9] rounded-2xl p-6 space-y-4">
            <form onSubmit={requestOtp} className="space-y-3">
              <label className="block text-xs font-semibold">SuperAdmin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#EDE5D9] rounded-lg text-sm"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#242424] text-white text-xs font-semibold rounded-lg hover:bg-[#C5A46D] cursor-pointer"
              >
                Send Login OTP
              </button>
            </form>

            {otpSent && (
              <form onSubmit={verifyOtp} className="space-y-3 pt-4 border-t border-[#EDE5D9]">
                <label className="block text-xs font-semibold">6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border border-[#EDE5D9] rounded-lg text-sm"
                  placeholder="Enter OTP"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A46D] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Verify & Enter Console
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#EDE5D9] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Cloud className="w-4 h-4 text-[#C5A46D]" /> Edge Cache Control
              </div>
              <p className="text-xs text-[#242424]/70">
                Purge KV + Cloudflare Cache API + Router micro-cache for /bulk/home.
              </p>
              <button
                onClick={purgeCache}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#242424] text-white text-xs font-semibold rounded-lg hover:bg-[#C5A46D] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Purge Edge Cache
              </button>
            </div>

            <div className="bg-white border border-[#EDE5D9] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Lock className="w-4 h-4 text-[#C5A46D]" /> Demo Mode Lock
              </div>
              <p className="text-xs text-[#242424]/70">
                Current: {statusInfo?.demoMode ? 'Read-Only Demo Active' : 'Live Mutations Enabled'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleDemoMode(true)}
                  className="px-3 py-1.5 border border-[#EDE5D9] rounded-lg text-xs hover:bg-[#FAF6F0] cursor-pointer"
                >
                  Enable Demo Lock
                </button>
                <button
                  onClick={() => toggleDemoMode(false)}
                  className="px-3 py-1.5 bg-[#242424] text-white rounded-lg text-xs cursor-pointer"
                >
                  Disable Demo Lock
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-[#EDE5D9] rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Database className="w-4 h-4 text-[#C5A46D]" /> Bindings Status
              </div>
              <pre className="text-xs bg-[#FAF8F4] p-3 rounded-lg overflow-auto">
                {JSON.stringify(statusInfo, null, 2)}
              </pre>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Authenticated as {storedEmail}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
