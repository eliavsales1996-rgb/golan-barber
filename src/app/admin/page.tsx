"use client";

import { useState, useEffect } from "react";
import { getBookingsForDate, getAvailableSlots, getDaysOff, addDayOff, deleteDayOff, approveBooking, rejectBooking, cancelBooking, getStoreSettings, saveStoreSettings, getWaitlist, removeFromWaitlist, addBlockedHours, getBlockedHours, deleteBlockedHours } from "@/lib/actions";

export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysOff, setDaysOff] = useState<{ id: string; date: string; reason: string | null }[]>([]);
  const [dayOffStart, setDayOffStart] = useState(new Date().toISOString().split("T")[0]);
  const [dayOffEnd, setDayOffEnd] = useState(new Date().toISOString().split("T")[0]);
  const [dayOffReason, setDayOffReason] = useState("");
  const [dayOffLoading, setDayOffLoading] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "waitlist">("bookings");
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [blockedHours, setBlockedHours] = useState<{ id: string; date: string; startTime: string; endTime: string; reason: string | null }[]>([]);
  const [bhDate, setBhDate] = useState(new Date().toISOString().split("T")[0]);
  const [bhStart, setBhStart] = useState("14:00");
  const [bhEnd, setBhEnd] = useState("16:00");
  const [bhReason, setBhReason] = useState("");
  const [bhLoading, setBhLoading] = useState(false);

  useEffect(() => {
    getStoreSettings().then((s) => {
      if (s) {
        setAnnouncementMessage(s.message);
        setAnnouncementActive(s.isActive);
      }
    });
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [dbBookings, dbSlots] = await Promise.all([
        getBookingsForDate(selectedDate),
        getAvailableSlots(selectedDate)
      ]);
      setBookings(dbBookings);
      setSlots(dbSlots);
      setLoading(false);
    }
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    getDaysOff().then(setDaysOff);
  }, []);

  useEffect(() => {
    getWaitlist().then(setWaitlist);
  }, []);

  useEffect(() => {
    getBlockedHours().then(setBlockedHours);
  }, []);

  async function handleAddDayOff() {
    if (dayOffEnd < dayOffStart) {
      alert("תאריך סיום חייב להיות אחרי תאריך התחלה");
      return;
    }
    setDayOffLoading(true);
    const result = await addDayOff(dayOffStart, dayOffEnd, dayOffReason || undefined);
    if (!result.success) alert(result.error || "שגיאה בחסימת הימים");
    const updated = await getDaysOff();
    setDaysOff(updated);
    setDayOffLoading(false);
  }

  async function handleDeleteDayOff(id: string) {
    await deleteDayOff(id);
    const updated = await getDaysOff();
    setDaysOff(updated);
  }

  async function handleAddBlockedHours() {
    if (bhEnd <= bhStart) {
      alert("שעת הסיום חייבת להיות אחרי שעת ההתחלה");
      return;
    }
    setBhLoading(true);
    const result = await addBlockedHours(bhDate, bhStart, bhEnd, bhReason || undefined);
    if (!result.success) alert(result.error || "שגיאה בחסימת השעות");
    const updated = await getBlockedHours();
    setBlockedHours(updated);
    setBhLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <div className="px-6 pt-12 flex items-center justify-between mb-10 reveal">
        <div className="text-right">
          <h1 className="text-3xl font-bold font-serif gold-gradient-text tracking-tighter">שלום, גולן</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.3em]">Management Console (Live DB)</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">📊</div>
      </div>

      {/* Tab Bar */}
      <div className="px-6 mb-8 flex gap-3 flex-row-reverse">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 h-11 rounded-2xl font-bold text-sm transition-all ${activeTab === "bookings" ? "bg-primary/15 border border-primary/40 text-primary" : "bg-white/[0.03] border border-white/[0.08] text-white/30"}`}
        >
          תורים
        </button>
        <button
          onClick={() => setActiveTab("waitlist")}
          className={`flex-1 h-11 rounded-2xl font-bold text-sm transition-all relative ${activeTab === "waitlist" ? "bg-primary/15 border border-primary/40 text-primary" : "bg-white/[0.03] border border-white/[0.08] text-white/30"}`}
        >
          רשימת המתנה
          {waitlist.length > 0 && (
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-black text-[10px] font-black flex items-center justify-center">
              {waitlist.length}
            </span>
          )}
        </button>
      </div>

      <div className="px-6 space-y-10">
        {activeTab === "bookings" && <>
        {/* Announcement Section */}
        <section className="reveal text-right">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2 mb-4 block underline">הודעת מערכת ללקוחות</label>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] p-6 space-y-4">
            <textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="לדוג׳: הספרייה סגורה לרגל חג..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-primary/50 text-right placeholder:text-white/20 resize-none"
            />
            <div className="flex items-center justify-between flex-row-reverse">
              <label className="flex items-center gap-3 cursor-pointer flex-row-reverse">
                <span className="text-[11px] font-black uppercase tracking-widest text-white/40">הצג ללקוחות</span>
                <button
                  type="button"
                  onClick={() => setAnnouncementActive((v) => !v)}
                  className={`w-12 h-6 rounded-full transition-all relative ${announcementActive ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${announcementActive ? 'right-1' : 'left-1'}`} />
                </button>
              </label>
              <button
                onClick={async () => {
                  setAnnouncementLoading(true);
                  await saveStoreSettings(announcementMessage, announcementActive);
                  setAnnouncementLoading(false);
                }}
                disabled={announcementLoading}
                className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all disabled:opacity-40"
              >
                {announcementLoading ? "שומר..." : "שמור הודעה"}
              </button>
            </div>
          </div>
        </section>

        <section className="reveal text-right">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2 mb-4 block underline">בחר תאריך</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-5 px-6 font-bold text-white outline-none focus:border-primary/50 text-right"
          />
        </section>

        <section className="reveal">
           {loading ? (
             <div className="text-center py-20 text-white/20">מתחבר למסד נתונים...</div>
           ) : (
             <div className="space-y-8">
               {/* Pending Approvals */}
               {(() => {
                 const pending = bookings.filter((b: any) => b.status === "PENDING");
                 return pending.length > 0 ? (
                   <div>
                     <p className="text-[10px] uppercase tracking-[0.3em] font-black text-yellow-400/70 mb-3 text-right">ממתינים לאישור ({pending.length})</p>
                     <div className="space-y-3">
                       {pending.map((booking: any) => (
                         <div key={booking.id} className="p-5 rounded-[24px] border bg-yellow-400/[0.05] border-yellow-400/20 flex items-center justify-between flex-row-reverse">
                           <div className="text-right">
                             <p className="text-xs font-black text-primary mb-1">{booking.timeSlot}</p>
                             <h4 className="font-bold text-base">{booking.customerName}</h4>
                             <p className="text-[10px] text-white/40">{booking.customerPhone}</p>
                           </div>
                           <div className="flex gap-2">
                             <button
                               onClick={async () => {
                                 await approveBooking(booking.id);
                                 const updated = await getBookingsForDate(selectedDate);
                                 setBookings(updated);
                               }}
                               className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all"
                             >
                               אשר
                             </button>
                             <button
                               onClick={async () => {
                                 await rejectBooking(booking.id);
                                 const updated = await getBookingsForDate(selectedDate);
                                 setBookings(updated);
                               }}
                               className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                             >
                               דחה
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ) : null;
               })()}

               {/* Confirmed Bookings */}
               {(() => {
                 const confirmed = bookings.filter((b: any) => b.status === "APPROVED");
                 return (
                   <div>
                     <p className="text-[10px] uppercase tracking-[0.3em] font-black text-green-400/70 mb-3 text-right">תורים מאושרים ({confirmed.length})</p>
                     <div className="space-y-3">
                       {slots.map((slot) => {
                         const booking = confirmed.find((b: any) => b.timeSlot === slot.time);
                         return (
                           <div
                             key={slot.time}
                             className={`p-5 rounded-[24px] border transition-all flex items-center justify-between flex-row-reverse ${
                               booking ? 'bg-white/[0.05] border-white/10' : 'bg-transparent border-white/5 opacity-30'
                             }`}
                           >
                             <div className="text-right">
                               <p className="text-xs font-black text-primary mb-1">{slot.time}</p>
                               <h4 className="font-bold text-base">{booking ? booking.customerName : 'סלוט פנוי'}</h4>
                               {booking && <p className="text-[10px] text-white/40">{booking.customerPhone}</p>}
                             </div>
                             {booking && (
                               <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">מאושר</span>
                                 <button
                                   onClick={async () => {
                                     await cancelBooking(booking.id);
                                     const updated = await getBookingsForDate(selectedDate);
                                     setBookings(updated);
                                   }}
                                   className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                                 >
                                   ביטול
                                 </button>
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 );
               })()}
             </div>
           )}
        </section>

        {/* Days Off Management */}
        <section className="reveal text-right">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2 mb-4 block underline">ימי חופש / חסימת ימים</label>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] p-6 mb-4 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black">בחר טווח ימים לחסימה</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-right">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-2">מתאריך</p>
                <input
                  type="date"
                  value={dayOffStart}
                  onChange={(e) => setDayOffStart(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-primary/50 text-right"
                />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-2">עד תאריך</p>
                <input
                  type="date"
                  value={dayOffEnd}
                  onChange={(e) => setDayOffEnd(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-primary/50 text-right"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder='סיבה (לדוג׳: חופשה משפחתית)'
              value={dayOffReason}
              onChange={(e) => setDayOffReason(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-primary/50 text-right placeholder:text-white/20"
            />
            <button
              onClick={handleAddDayOff}
              disabled={dayOffLoading}
              className="w-full h-12 rounded-2xl font-bold text-sm bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-40"
            >
              {dayOffLoading ? "חוסם..." : "חסום ימים אלו"}
            </button>
          </div>

          <div className="space-y-3">
            {daysOff.length === 0 ? (
              <p className="text-center text-white/20 text-sm py-4">אין ימים חסומים כרגע</p>
            ) : (
              daysOff.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-[20px] bg-red-500/[0.07] border border-red-500/20 flex items-center justify-between flex-row-reverse"
                >
                  <div className="text-right">
                    <span className="font-bold text-red-400 tracking-widest block">{d.date}</span>
                    {d.reason && <span className="text-[11px] text-white/40 mt-0.5 block">{d.reason}</span>}
                  </div>
                  <button
                    onClick={() => handleDeleteDayOff(d.id)}
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-4 py-2 rounded-xl hover:border-red-500/40 hover:text-red-400 transition-all"
                  >
                    בטל חסימה
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Blocked Hours Management */}
        <section className="reveal text-right">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2 mb-4 block underline">חסום שעות ביום מסוים</label>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] p-6 mb-4 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black">בחר יום וטווח שעות</p>
            <input
              type="date"
              value={bhDate}
              onChange={(e) => setBhDate(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-primary/50 text-right"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="text-right">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-2">משעה</p>
                <input
                  type="time"
                  value={bhStart}
                  onChange={(e) => setBhStart(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-primary/50 text-right"
                />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-2">עד שעה</p>
                <input
                  type="time"
                  value={bhEnd}
                  onChange={(e) => setBhEnd(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-primary/50 text-right"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="סיבה (אופציונלי)"
              value={bhReason}
              onChange={(e) => setBhReason(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-primary/50 text-right placeholder:text-white/20"
            />
            <button
              onClick={handleAddBlockedHours}
              disabled={bhLoading}
              className="w-full h-12 rounded-2xl font-bold text-sm bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-all disabled:opacity-40"
            >
              {bhLoading ? "חוסם..." : "חסום שעות אלו"}
            </button>
          </div>

          <div className="space-y-3">
            {blockedHours.length === 0 ? (
              <p className="text-center text-white/20 text-sm py-4">אין שעות חסומות כרגע</p>
            ) : (
              blockedHours.map((h) => (
                <div
                  key={h.id}
                  className="p-5 rounded-[20px] bg-orange-500/[0.07] border border-orange-500/20 flex items-center justify-between flex-row-reverse"
                >
                  <div className="text-right">
                    <span className="font-bold text-orange-400 tracking-widest block">{h.date}</span>
                    <span className="text-sm text-white/60 block">{h.startTime} – {h.endTime}</span>
                    {h.reason && <span className="text-[11px] text-white/40 mt-0.5 block">{h.reason}</span>}
                  </div>
                  <button
                    onClick={async () => {
                      await deleteBlockedHours(h.id);
                      setBlockedHours((prev) => prev.filter((e) => e.id !== h.id));
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-4 py-2 rounded-xl hover:border-orange-500/40 hover:text-orange-400 transition-all"
                  >
                    בטל חסימה
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
        </>}

        {activeTab === "waitlist" && (
          <section className="reveal text-right">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2 mb-4 block underline">
              רשימת המתנה ({waitlist.length})
            </label>
            {waitlist.length === 0 ? (
              <p className="text-center text-white/20 text-sm py-10">רשימת המתנה ריקה כרגע</p>
            ) : (
              <div className="space-y-3">
                {waitlist.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 rounded-[24px] bg-white/[0.03] border border-white/10 flex items-center justify-between flex-row-reverse"
                  >
                    <div className="text-right">
                      <p className="text-xs font-black text-primary mb-1">{entry.requestedDate}</p>
                      <h4 className="font-bold text-base">{entry.customerName}</h4>
                      <p className="text-[10px] text-white/40">{entry.phoneNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/972${entry.phoneNumber.replace(/^0/, '')}?text=${encodeURIComponent(`שלום ${entry.customerName}! פנה מקום בתאריך ${entry.requestedDate} אצל גולן ברבר 💈 ניתן להזמין תור באתר`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all"
                      >
                        הודע
                      </a>
                      <button
                        onClick={async () => {
                          await removeFromWaitlist(entry.id);
                          setWaitlist((prev) => prev.filter((e) => e.id !== entry.id));
                        }}
                        className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/30 hover:border-red-500/40 hover:text-red-400 transition-all"
                      >
                        הסר
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
