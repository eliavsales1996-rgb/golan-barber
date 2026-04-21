"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/actions";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await adminLogin(username, password);
    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error ?? "שגיאה בהתחברות");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#030d08]">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(64,145,108,0.10),transparent_65%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="premium-card p-10">
          {/* Logo / icon */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#52b788" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8 2 4 5 4 9c0 5 8 13 8 13s8-8 8-13c0-4-4-7-8-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold font-serif gold-gradient-text mb-1">כניסת מנהל</h2>
            <p className="text-white/30 text-xs tracking-wide">גולן ברבר · פאנל ניהול</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-[0.25em] font-black text-primary/50 block text-right">
                שם משתמש
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-5 focus:border-primary/50 focus:bg-primary/5 outline-none text-right placeholder:text-white/15 transition-all text-white"
                placeholder="הכנס שם משתמש"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-[0.25em] font-black text-primary/50 block text-right">
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-5 focus:border-primary/50 focus:bg-primary/5 outline-none text-right placeholder:text-white/15 transition-all text-white"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="text-red-400/80 text-xs text-center py-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="premium-btn-primary w-full h-14 rounded-2xl font-bold text-base mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{animationDelay:'300ms'}}/>
                </span>
              ) : "כניסה למערכת"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
