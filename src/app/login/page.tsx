"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "Golan" && password === "Golan") {
      router.push("/admin");
    } else {
      setError("שם משתמש או סיסמה שגויים");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="w-full max-w-md reveal">
        <div className="premium-card shadow-gold">
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-20 h-20 rounded-3xl overflow-hidden border border-white/10 p-0.5 mb-6 shadow-gold">
               <Image src="/logo.jpg" alt="Logo" width={80} height={80} className="rounded-3xl object-cover" />
            </div>
            <h2 className="text-3xl font-bold font-serif gold-gradient-text mb-3">כניסת מנהל</h2>
            <p className="text-white/40 font-light text-center text-sm">ניהול תורים ומערכת</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2">שם משתמש</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 focus:border-primary/50 transition-all outline-none"
                placeholder="הכנס שם משתמש"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2">סיסמה</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 focus:border-primary/50 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            
            <button type="submit" className="premium-btn-primary w-full h-16 rounded-2xl font-bold">התחבר למערכת</button>
          </form>
        </div>
      </div>
    </div>
  );
}
