"use client";

import { useState, useEffect, useRef } from 'react';
import { createBooking, getAvailableSlots, getDaysOff, getStoreSettings, addToWaitlist, getBookingsByPhone, cancelBookingByCustomer } from '../lib/actions';
import { SERVICES } from '../lib/bookings';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush(): Promise<string | undefined> {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    return JSON.stringify(sub);
  } catch {
    return undefined;
  }
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function GolanLogo() {
  return (
    <svg viewBox="0 0 240 240" width="200" height="200" xmlns="http://www.w3.org/2000/svg" aria-label="Golan Barber">
      {/* Outer decorative rings */}
      <circle cx="120" cy="120" r="116" fill="none" stroke="#40916c" strokeWidth="0.6" opacity="0.2" className="logo-ring-1" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="#74c69d" strokeWidth="0.4" opacity="0.15" className="logo-ring-2" />

      {/* Inner background disc */}
      <circle cx="120" cy="120" r="100" fill="rgba(3,13,8,0.65)" />
      <circle cx="120" cy="120" r="100" fill="none" stroke="#40916c" strokeWidth="1" opacity="0.35" />

      {/* Ghost G behind — for depth */}
      <text x="120" y="148"
        fill="#40916c"
        fontSize="110"
        fontFamily="Playfair Display, Georgia, serif"
        fontWeight="700"
        textAnchor="middle"
        opacity="0.06">G</text>

      {/* Compass tick marks */}
      <line x1="120" y1="21" x2="120" y2="30" stroke="#40916c" strokeWidth="1.2" opacity="0.5" />
      <line x1="120" y1="210" x2="120" y2="219" stroke="#40916c" strokeWidth="1.2" opacity="0.5" />
      <line x1="21" y1="120" x2="30" y2="120" stroke="#40916c" strokeWidth="1.2" opacity="0.5" />
      <line x1="210" y1="120" x2="219" y2="120" stroke="#40916c" strokeWidth="1.2" opacity="0.5" />

      {/* Small corner diamonds */}
      <polygon points="120,17 123,20 120,23 117,20" fill="#74c69d" opacity="0.6" />
      <polygon points="120,217 123,220 120,223 117,220" fill="#74c69d" opacity="0.6" />

      {/* GOLAN — main serif display */}
      <text x="120" y="108"
        fill="white"
        fontSize="30"
        fontFamily="Playfair Display, Georgia, serif"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="8">GOLAN</text>

      {/* Center divider — lines + diamond */}
      <line x1="44" y1="121" x2="101" y2="121" stroke="#40916c" strokeWidth="0.8" opacity="0.8" />
      <polygon points="120,114 127,121 120,128 113,121" fill="#40916c" opacity="0.9" />
      <line x1="139" y1="121" x2="196" y2="121" stroke="#40916c" strokeWidth="0.8" opacity="0.8" />

      {/* BARBER — tracked emerald caps */}
      <text x="120" y="146"
        fill="#74c69d"
        fontSize="11.5"
        fontFamily="Assistant, sans-serif"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="9">BARBER</text>

      {/* Inner glow ring */}
      <circle cx="120" cy="120" r="100" fill="none"
        stroke="url(#ringGrad)" strokeWidth="1.5" opacity="0.5" />

      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#74c69d" />
          <stop offset="50%" stopColor="#40916c" />
          <stop offset="100%" stopColor="#1b4332" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const SERVICE_ICONS: Record<string, string> = {
  'תספורת פרימיום': '✦',
  'עיצוב זקן': '◈',
  'קומבו (תספורת + זקן)': '❖',
};

export default function Page() {
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [slots, setSlots] = useState<{time: string, available: boolean}[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Map<string, string | null>>(new Map());
  const [announcement, setAnnouncement] = useState<{ message: string; isActive: boolean } | null>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistPushSub, setWaitlistPushSub] = useState<string | undefined>(undefined);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookingsPhone, setMyBookingsPhone] = useState("");
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [myBookingsSearched, setMyBookingsSearched] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(toLocalDateStr(today));
    const upcoming: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      upcoming.push(d);
    }
    setDates(upcoming);
  }, []);

  useEffect(() => {
    getStoreSettings().then((s) => {
      if (s) setAnnouncement({ message: s.message, isActive: s.isActive });
    });
  }, []);

  useEffect(() => {
    getDaysOff().then((days) => {
      setBlockedDates(new Map(days.map((d) => [d.date, d.reason])));
    });
  }, []);

  useEffect(() => {
    setWaitlistDone(false);
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedSlot) return;
    const timer = setTimeout(() => {
      step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedSlot]);

  useEffect(() => {
    if (!selectedDate) return;
    async function fetchSlots() {
      setLoading(true);
      try {
        const availableSlots = await getAvailableSlots(selectedDate);
        setSlots(availableSlots);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setSlots([]);
      }
      setLoading(false);
    }
    fetchSlots();
  }, [selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) { alert("אנא בחר שירות קודם"); return; }
    if (!selectedSlot) { alert("אנא בחר שעה קודם"); return; }
    if (!name || !phone) return;

    if (blockedDates.has(selectedDate)) {
      alert(blockedDates.get(selectedDate) || "הספר לא עובד ביום זה");
      return;
    }

    const pushSubscription = await subscribeToPush();

    const result = await createBooking({
      date: selectedDate,
      timeSlot: selectedSlot,
      customerName: name,
      customerPhone: phone,
      pushSubscription,
    });

    if (result.success) {
      setIsSuccess(true);
    } else if (result.error === "הספר לא עובד ביום זה") {
      alert("הספר לא עובד ביום זה");
    } else {
      alert("שגיאה בקביעת התור. ייתכן והסלוט כבר נתפס.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#030d08] flex flex-col items-center justify-center px-6">
        {/* Background glow */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(64,145,108,0.12),transparent_65%)] pointer-events-none" />

        <div className="premium-card text-center reveal p-12 max-w-sm w-full">
          {/* Animated check */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
            <div className="relative w-24 h-24 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center">
              <svg viewBox="0 0 40 40" width="36" height="36">
                <polyline points="8,20 16,28 32,12" fill="none" stroke="#52b788" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold font-serif gold-gradient-text mb-3 tracking-tight">הבקשה התקבלה!</h2>
          <div className="w-12 h-px bg-primary/40 mx-auto mb-6" />
          <p className="text-white/40 text-base mb-2 text-right leading-relaxed font-light">
            תודה <span className="text-white/70 font-semibold">{name}</span>!
          </p>
          <p className="text-white/30 text-sm mb-2 text-right">התור ממתין לאישור הספר.</p>
          <p className="text-primary/50 text-xs text-right mb-10 font-mono">{selectedDate} · {selectedSlot}</p>

          <button
            onClick={() => window.location.reload()}
            className="premium-btn-primary w-full h-14 rounded-2xl shimmer-btn"
          >
            הזמן תור נוסף
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#030d08] text-white overflow-hidden pb-40">

      {/* Background atmosphere layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(64,145,108,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(27,67,50,0.08),transparent)]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:'linear-gradient(rgba(64,145,108,1) 1px,transparent 1px),linear-gradient(90deg,rgba(64,145,108,1) 1px,transparent 1px)', backgroundSize:'60px 60px'}} />
      </div>

      {/* Announcement Banner */}
      {announcement?.isActive && announcement.message && (
        <div className="w-full px-6 pt-6 z-50 relative">
          <div className="max-w-xl mx-auto flex items-start gap-3 flex-row-reverse bg-primary/8 border border-primary/25 rounded-2xl px-5 py-4">
            <span className="text-primary/80 text-sm mt-0.5 flex-shrink-0">◈</span>
            <p className="text-right text-sm font-semibold text-primary/80 leading-relaxed">{announcement.message}</p>
          </div>
        </div>
      )}

      {/* My Bookings Button */}
      <div className="w-full px-6 pt-4 z-50 relative flex justify-end">
        <button
          onClick={() => setShowMyBookings((v) => !v)}
          className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 hover:border-primary/30 hover:text-primary/60 transition-all"
        >
          הזמנות שלי
        </button>
      </div>

      {/* My Bookings Panel */}
      {showMyBookings && (
        <div className="w-full px-6 pt-3 z-50 relative max-w-xl mx-auto">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-6 text-right space-y-4">
            <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary/50">בדוק / בטל תור קיים</p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="מספר טלפון"
                value={myBookingsPhone}
                onChange={(e) => setMyBookingsPhone(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl py-3 px-4 text-white outline-none focus:border-primary/45 text-right placeholder:text-white/15 text-sm"
              />
              <button
                onClick={async () => {
                  if (!myBookingsPhone) return;
                  setMyBookingsLoading(true);
                  const results = await getBookingsByPhone(myBookingsPhone);
                  setMyBookings(results);
                  setMyBookingsSearched(true);
                  setMyBookingsLoading(false);
                }}
                disabled={myBookingsLoading || !myBookingsPhone}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all disabled:opacity-30"
              >
                {myBookingsLoading ? "..." : "חפש"}
              </button>
            </div>

            {myBookingsSearched && myBookings.length === 0 && (
              <p className="text-white/30 text-sm text-center py-2">לא נמצאו תורים פעילים</p>
            )}

            {myBookings.map((b) => {
              const [slotHours, slotMinutes] = b.timeSlot.split(":").map(Number);
              const appointmentMs = new Date(b.date + "T00:00:00.000Z").getTime() + (slotHours * 60 + slotMinutes) * 60000;
              const canCancel = Date.now() < appointmentMs - 3 * 60 * 60 * 1000;

              return (
                <div key={b.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{b.timeSlot} · {b.date}</p>
                    <p className="text-sm font-bold text-white/80">{b.customerName}</p>
                    <p className="text-[10px] text-white/30">{b.status === "APPROVED" ? "מאושר" : "ממתין לאישור"}</p>
                  </div>
                  <button
                    disabled={!canCancel || cancellingId === b.id}
                    title={canCancel ? "בטל תור" : "לא ניתן לבטל פחות מ-3 שעות לפני"}
                    onClick={async () => {
                      if (!canCancel) return;
                      setCancellingId(b.id);
                      const result = await cancelBookingByCustomer(b.id, myBookingsPhone);
                      if (result.success) {
                        setMyBookings((prev) => prev.filter((x) => x.id !== b.id));
                      } else {
                        alert(result.error || "שגיאה בביטול");
                      }
                      setCancellingId(null);
                    }}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                      canCancel
                        ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                        : "opacity-25 bg-white/[0.03] border border-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {cancellingId === b.id ? "מבטל..." : "בטל תור"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hero Section ── */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-16 pb-8 px-6">

        {/* Logo glow halo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-[60px] rounded-full bg-primary/20 float-glow" />
          <div className="relative reveal">
            <GolanLogo />
          </div>
        </div>

        {/* Tagline */}
        <div className="reveal reveal-delay-1 text-center space-y-3">
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-px bg-primary/30" />
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/60">Barbershop Excellence</span>
            <div className="w-12 h-px bg-primary/30" />
          </div>
          <p className="text-white/20 text-xs tracking-[0.15em]">הרב עובדיה · עכו · המתחם החדש</p>
        </div>
      </div>

      {/* ── Booking Card ── */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 relative z-20">
        <div className="premium-card p-7 md:p-10 shadow-gold-intense reveal reveal-delay-2">
          <form onSubmit={handleBook} className="space-y-10">

            {/* ── Step 1: Service ── */}
            <div>
              <div className="step-label">
                <div className="step-label-line" />
                <span className="step-label-text">בחר שירות</span>
                <span className="step-label-num">١</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {SERVICES.map((s) => {
                  const selected = selectedService === s.name;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedService(s.name)}
                      className={`relative p-5 rounded-2xl transition-all duration-500 text-right border overflow-hidden ${
                        selected
                          ? 'bg-primary/10 border-primary/60 shadow-gold'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {selected && (
                        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                      )}
                      <div className="flex items-center justify-between flex-row-reverse relative">
                        <div className="flex items-center gap-3 flex-row-reverse">
                          <span className={`text-xs font-black ${selected ? 'text-primary' : 'text-white/20'}`}>
                            {SERVICE_ICONS[s.name] ?? '·'}
                          </span>
                          <span className={`font-bold text-base tracking-tight ${selected ? 'text-white' : 'text-white/70'}`}>
                            {s.name}
                          </span>
                        </div>
                        {selected && (
                          <svg viewBox="0 0 20 20" width="16" height="16">
                            <circle cx="10" cy="10" r="9" fill="none" stroke="#40916c" strokeWidth="1.5" />
                            <polyline points="6,10 9,13 14,7" fill="none" stroke="#40916c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Step 2: Date & Time ── */}
            <div>
              <div className="step-label">
                <div className="step-label-line" />
                <span className="step-label-text">בחר זמן</span>
                <span className="step-label-num">٢</span>
              </div>

              {/* Blocked days notice */}
              {(() => {
                const upcomingBlocked = dates
                  .map(d => ({ dateStr: toLocalDateStr(d), date: d }))
                  .filter(({ dateStr }) => blockedDates.has(dateStr) && blockedDates.get(dateStr));
                return upcomingBlocked.length > 0 ? (
                  <div className="mb-5 p-4 rounded-xl bg-red-500/[0.06] border border-red-500/15 text-right space-y-1.5">
                    <p className="text-[8px] uppercase tracking-[0.35em] font-black text-red-400/60 mb-2">ימים חסומים קרובים</p>
                    {upcomingBlocked.map(({ dateStr, date }) => (
                      <p key={dateStr} className="text-[11px] text-white/35 leading-relaxed">
                        <span className="text-red-400/70 font-bold">
                          {date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
                        </span>
                        {' — '}{blockedDates.get(dateStr)}
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Date carousel */}
              <div className="flex gap-3 overflow-x-auto pb-5 no-scrollbar flex-row-reverse mb-7">
                {dates.map((date, i) => {
                  const dateStr = toLocalDateStr(date);
                  const isSelected = selectedDate === dateStr;
                  const isBlocked = blockedDates.has(dateStr);
                  const blockReason = blockedDates.get(dateStr);
                  return (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isBlocked) return;
                          setSelectedDate(dateStr);
                          setSelectedSlot("");
                        }}
                        disabled={isBlocked}
                        className={`w-[58px] h-[80px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                          isBlocked
                            ? 'border border-white/5 text-white/15 opacity-35 cursor-not-allowed'
                            : isSelected
                              ? 'bg-gold-gradient text-white scale-110 shadow-gold font-bold'
                              : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:border-primary/30 hover:text-white/60'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-wide">
                          {date.toLocaleDateString('he-IL', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                        {isBlocked && <span className="text-[7px] text-red-400/50 font-black">סגור</span>}
                      </button>
                      {isBlocked && blockReason && (
                        <span className="text-[7px] text-red-400/40 text-center leading-tight max-w-[58px] break-words">{blockReason}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-3 gap-2">
                {loading ? (
                  <div className="col-span-3 flex items-center justify-center py-10 gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay:'0ms'}} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay:'150ms'}} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                ) : (
                  slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 tracking-wide ${
                        selectedSlot === slot.time
                          ? 'bg-gold-gradient text-white shadow-gold scale-105'
                          : slot.available
                            ? 'bg-white/[0.03] border border-white/[0.06] text-white/55 hover:border-primary/35 hover:text-white/80 hover:bg-primary/5'
                            : 'opacity-[0.12] text-white/30 line-through cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))
                )}
              </div>

              {/* Waitlist panel */}
              {!loading && (blockedDates.has(selectedDate) || (slots.length > 0 && slots.every(s => !s.available))) && (
                <div className="mt-7 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-right">
                  {waitlistDone ? (
                    <div className="text-center py-3">
                      <div className="w-10 h-10 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <svg viewBox="0 0 20 20" width="14" height="14">
                          <polyline points="4,10 8,14 16,6" fill="none" stroke="#52b788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-primary/80 font-bold text-sm mb-1">נרשמת לרשימת המתנה!</p>
                      <p className="text-white/25 text-xs">נודיע לך כשיפנה מקום ב־{selectedDate}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary/50 mb-1">היום מלא או חסום</p>
                      <p className="text-white/40 text-sm mb-5">רוצה שנודיע לך כשיפנה מקום?</p>
                      <div className="space-y-3 mb-4">
                        <input
                          type="text"
                          placeholder="שם מלא"
                          value={waitlistName}
                          onChange={(e) => setWaitlistName(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl py-3 px-5 text-white outline-none focus:border-primary/45 text-right placeholder:text-white/15 text-sm transition-colors"
                        />
                        <input
                          type="tel"
                          placeholder="מספר טלפון"
                          value={waitlistPhone}
                          onChange={(e) => setWaitlistPhone(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl py-3 px-5 text-white outline-none focus:border-primary/45 text-right placeholder:text-white/15 text-sm transition-colors"
                        />
                      </div>
                      {!waitlistPushSub && (
                        <button
                          type="button"
                          onClick={async () => {
                            const sub = await subscribeToPush();
                            if (sub) setWaitlistPushSub(sub);
                          }}
                          className="w-full h-10 rounded-xl font-bold text-xs bg-white/[0.03] border border-white/[0.07] text-white/40 hover:border-primary/30 hover:text-primary/60 transition-all mb-3"
                        >
                          🔔 אפשר התראה כשיפנה מקום
                        </button>
                      )}
                      {waitlistPushSub && (
                        <p className="text-[11px] text-primary/60 text-right mb-3">✓ תקבל התראה כשיפנה מקום</p>
                      )}
                      <button
                        type="button"
                        disabled={waitlistLoading || !waitlistName || !waitlistPhone}
                        onClick={async () => {
                          setWaitlistLoading(true);
                          await addToWaitlist(waitlistName, waitlistPhone, selectedDate, waitlistPushSub);
                          setWaitlistLoading(false);
                          setWaitlistDone(true);
                        }}
                        className="w-full h-11 rounded-xl font-bold text-sm bg-primary/8 border border-primary/25 text-primary/80 hover:bg-primary/15 hover:border-primary/45 transition-all disabled:opacity-30"
                      >
                        {waitlistLoading ? "שומר..." : "הכנס אותי לרשימת המתנה"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Step 3: Details ── */}
            <div ref={step3Ref} className="space-y-5">
              <div className="step-label">
                <div className="step-label-line" />
                <span className="step-label-text">פרטי לקוח</span>
                <span className="step-label-num">٣</span>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl py-4 px-6 focus:border-primary/50 focus:bg-primary/5 outline-none text-right placeholder:text-white/15 transition-all duration-300 text-white"
                  required
                />
                <input
                  type="tel"
                  placeholder="מספר טלפון"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl py-4 px-6 focus:border-primary/50 focus:bg-primary/5 outline-none text-right placeholder:text-white/15 transition-all duration-300 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="premium-btn-primary shimmer-btn w-full h-[58px] rounded-2xl text-base shadow-gold"
              >
                אישור תור
              </button>
            </div>

          </form>
        </div>

        {/* Bottom signature */}
        <div className="text-center mt-8 mb-4 space-y-2">
          <span className="text-white/10 text-[10px] tracking-[0.3em] uppercase">Golan Barber · Premium Grooming</span>
          <p className="text-white/15 text-[10px] tracking-wide">נבנה ועוצב ע&quot;י בוטיגו פתרונות טכנולוגיים לעסקים</p>
        </div>
      </div>
    </main>
  );
}
