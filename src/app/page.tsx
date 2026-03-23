"use client";

import Image from "next/image";
import { useState, useEffect } from 'react';
import { createBooking, getAvailableSlots, getDaysOff, getStoreSettings, addToWaitlist } from '../lib/actions';
import { SERVICES } from '../lib/bookings';

export default function Page() {
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [slots, setSlots] = useState<{time: string, available: boolean}[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Map<string, string | null>>(new Map());
  const [announcement, setAnnouncement] = useState<{ message: string; isActive: boolean } | null>(null);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

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
    async function fetchSlots() {
      setLoading(true);
      try {
        const availableSlots = await getAvailableSlots(selectedDate);
        setSlots(availableSlots);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
      }
      setLoading(false);
    }
    fetchSlots();
  }, [selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name || !phone || !selectedService) return;
    
    if (blockedDates.has(selectedDate)) {
      alert(blockedDates.get(selectedDate) || "הספר לא עובד ביום זה");
      return;
    }

    const result = await createBooking({
      date: selectedDate,
      timeSlot: selectedSlot,
      customerName: name,
      customerPhone: phone,
    });

    if (result.success) {
      setIsSuccess(true);
    } else if (result.error === "הספר לא עובד ביום זה") {
      alert("הספר לא עובד ביום זה");
    } else {
      alert("שגיאה בקביעת התור. ייתכן והסלוט כבר נתפס.");
    }
  };

  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
        <div className="premium-card text-center reveal shadow-gold p-12 scale-up">
          <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">✓</div>
          <h2 className="text-4xl font-bold font-serif gold-gradient-text mb-4 tracking-tighter uppercase">הבקשה התקבלה!</h2>
          <p className="text-white/40 text-lg mb-10 text-right leading-relaxed font-light">
             תודה {name}! <br />
             התור התקבל וממתין לאישור הספר.<br />
             <span className="text-white/25 text-base">{selectedDate} בשעה {selectedSlot}</span>
          </p>
          <button onClick={() => window.location.reload()} className="premium-btn-primary w-full h-16 rounded-2xl font-bold">הזמן תור נוסף</button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden pb-40">
      {/* System Announcement Banner */}
      {announcement?.isActive && announcement.message && (
        <div className="w-full px-6 pt-6 z-50 relative">
          <div className="max-w-xl mx-auto flex items-start gap-3 flex-row-reverse bg-primary/10 border border-primary/30 rounded-2xl px-5 py-4 shadow-gold">
            <span className="text-primary text-lg mt-0.5">📢</span>
            <p className="text-right text-sm font-bold text-primary/90 leading-relaxed">{announcement.message}</p>
          </div>
        </div>
      )}

      {/* Cinematic Header Overlay */}
      <div className="relative h-[60vh] w-full flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_70%)] animate-pulse-slow" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full animate-float-slow" />
        </div>

        {/* Branded Logo & Title */}
        <div className="relative z-20 text-center space-y-4 reveal">
           <div className="w-40 h-40 relative mx-auto mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/20 shadow-gold">
                 <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
              </div>
           </div>
           <h1 className="text-5xl md:text-7xl font-black font-serif gold-gradient-text tracking-tighter leading-none mb-2">GOLAN BARBER</h1>
           <div className="inline-block px-4 py-1 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-[0.4em] text-primary">Barbershop Excellence</div>
        </div>
      </div>

      {/* Integrated Booking Flow */}
      <div className="max-w-xl mx-auto px-6 relative z-30 -mt-20">
        <div className="premium-card p-8 md:p-12 shadow-gold-intense reveal">
          <form onSubmit={handleBook} className="space-y-12">
            
            {/* Step 1: Service */}
            <div>
               <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-6 block text-right">01. בחר שירות</label>
               <div className="grid grid-cols-1 gap-4">
                  {SERVICES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedService(s.name)}
                      className={`p-6 rounded-[25px] transition-all text-right border ${
                        selectedService === s.name ? 'bg-primary/10 border-primary shadow-gold scale-[1.02]' : 'bg-white/[0.03] border-white/5 opacity-50'
                      }`}
                    >
                      <h3 className={`font-bold text-lg ${selectedService === s.name ? 'text-primary' : 'text-white'}`}>{s.name}</h3>
                    </button>
                  ))}
               </div>
            </div>

            {/* Step 2: Date & Time */}
            <div className={`transition-all duration-700 ${selectedService ? 'opacity-100' : 'opacity-10 pointer-events-none'}`}>
               <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-6 block text-right">02. בחר זמן</label>
               {/* Blocked days with reasons banner */}
               {(() => {
                 const upcomingBlocked = dates
                   .map(d => ({ dateStr: d.toISOString().split('T')[0], date: d }))
                   .filter(({ dateStr }) => blockedDates.has(dateStr) && blockedDates.get(dateStr));
                 return upcomingBlocked.length > 0 ? (
                   <div className="mb-6 p-4 rounded-2xl bg-red-500/[0.07] border border-red-500/20 space-y-1 text-right">
                     <p className="text-[9px] uppercase tracking-[0.3em] font-black text-red-400/70 mb-2">ימים חסומים קרובים</p>
                     {upcomingBlocked.map(({ dateStr, date }) => (
                       <p key={dateStr} className="text-[11px] text-white/40 leading-relaxed">
                         <span className="text-red-400/80 font-bold">{date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}</span>
                         {' — '}{blockedDates.get(dateStr)}
                       </p>
                     ))}
                   </div>
                 ) : null;
               })()}

               <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar flex-row-reverse mb-8">
                  {dates.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    const isBlocked = blockedDates.has(dateStr);
                    const blockReason = blockedDates.get(dateStr);
                    return (
                      <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isBlocked) return;
                            setSelectedDate(dateStr);
                            setSelectedSlot("");
                          }}
                          disabled={isBlocked}
                          className={`w-16 h-24 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                            isBlocked
                              ? 'bg-white/[0.02] border border-white/5 text-white/20 opacity-40 cursor-not-allowed'
                              : isSelected
                                ? 'bg-gold-gradient text-black scale-110 shadow-gold'
                                : 'bg-white/[0.03] border border-white/5 text-white/40'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase">{date.toLocaleDateString('he-IL', { weekday: 'short' })}</span>
                          <span className="text-xl font-bold tracking-tighter">{date.getDate()}</span>
                          {isBlocked && <span className="text-[8px] text-red-400/60 font-black">סגור</span>}
                        </button>
                        {isBlocked && blockReason && (
                          <span className="text-[8px] text-red-400/50 text-center leading-tight max-w-[64px] break-words">{blockReason}</span>
                        )}
                      </div>
                    );
                  })}
               </div>

               <div className="grid grid-cols-3 gap-2">
                  {loading ? (
                    <div className="col-span-3 text-center py-10 text-white/10 uppercase tracking-widest animate-pulse">Loading Hours...</div>
                  ) : (
                    slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-4 rounded-xl font-bold text-sm transition-all ${
                          selectedSlot === slot.time
                            ? 'bg-gold-gradient text-black shadow-gold scale-105'
                            : slot.available
                              ? 'bg-white/[0.03] border border-white/5 text-white/60 hover:border-primary/40'
                              : 'opacity-10 bg-white/5 line-through'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))
                  )}
               </div>

               {/* Waitlist — shown when day is blocked OR all slots are taken */}
               {!loading && (blockedDates.has(selectedDate) || (slots.length > 0 && slots.every(s => !s.available))) && (
                 <div className="mt-8 p-6 rounded-[24px] bg-white/[0.03] border border-white/10 text-right">
                   {waitlistDone ? (
                     <div className="text-center py-2">
                       <p className="text-green-400 font-bold text-base mb-1">✓ נרשמת לרשימת המתנה!</p>
                       <p className="text-white/30 text-sm">נודיע לך כשיפנה מקום ב־{selectedDate}</p>
                     </div>
                   ) : (
                     <>
                       <p className="text-[10px] uppercase tracking-[0.25em] font-black text-primary/60 mb-1">היום מלא או חסום</p>
                       <p className="text-white/50 text-sm mb-5">רוצה שנודיע לך אם יפנה מקום?</p>
                       <div className="space-y-3 mb-4">
                         <input
                           type="text"
                           placeholder="שם מלא"
                           value={waitlistName}
                           onChange={(e) => setWaitlistName(e.target.value)}
                           className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3 px-5 text-white outline-none focus:border-primary/50 text-right placeholder:text-white/20 text-sm"
                         />
                         <input
                           type="tel"
                           placeholder="מספר טלפון"
                           value={waitlistPhone}
                           onChange={(e) => setWaitlistPhone(e.target.value)}
                           className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3 px-5 text-white outline-none focus:border-primary/50 text-right placeholder:text-white/20 text-sm"
                         />
                       </div>
                       <button
                         type="button"
                         disabled={waitlistLoading || !waitlistName || !waitlistPhone}
                         onClick={async () => {
                           setWaitlistLoading(true);
                           await addToWaitlist(waitlistName, waitlistPhone, selectedDate);
                           setWaitlistLoading(false);
                           setWaitlistDone(true);
                         }}
                         className="w-full h-12 rounded-2xl font-bold text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all disabled:opacity-30"
                       >
                         {waitlistLoading ? "שומר..." : "הכנס אותי לרשימת המתנה"}
                       </button>
                     </>
                   )}
                 </div>
               )}
            </div>

            {/* Step 3: Identity */}
            <div className={`space-y-6 transition-all duration-700 ${selectedSlot ? 'opacity-100' : 'opacity-10 pointer-events-none'}`}>
               <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-6 block text-right">03. פרטי לקוח</label>
               <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="שם מלא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 focus:border-primary/50 outline-none text-right placeholder:text-white/10"
                    required
                  />
                  <input 
                    type="tel" 
                    placeholder="מספר טלפון"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 focus:border-primary/50 outline-none text-right placeholder:text-white/10"
                    required
                  />
               </div>
               <button 
                  type="submit" 
                  className="premium-btn-primary w-full h-16 rounded-[20px] font-bold text-lg shadow-gold group relative overflow-hidden"
                >
                  <span className="relative z-10">אישור תור</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
