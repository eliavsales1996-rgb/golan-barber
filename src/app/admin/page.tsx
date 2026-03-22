"use client";

import { useState, useEffect } from "react";
import { getBookingsForDate, getAvailableSlots, getDaysOff, addDayOff, deleteDayOff } from "@/lib/actions";

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <div className="px-6 pt-12 flex items-center justify-between mb-10 reveal">
        <div className="text-right">
          <h1 className="text-3xl font-bold font-serif gold-gradient-text tracking-tighter">שלום, גולן</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.3em]">Management Console (Live DB)</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">📊</div>
      </div>

      <div className="px-6 space-y-10">
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
             <div className="space-y-4">
                {slots.map((slot) => {
                  const booking = bookings.find(b => b.timeSlot === slot.time);
                  return (
                    <div
                      key={slot.time}
                      className={`p-6 rounded-[28px] border transition-all flex items-center justify-between flex-row-reverse ${
                        booking ? 'bg-white/[0.05] border-white/10' : 'bg-transparent border-white/5 opacity-40'
                      }`}
                    >
                      <div className="text-right">
                         <p className="text-xs font-black text-primary mb-1">{slot.time}</p>
                         <h4 className="font-bold text-lg">{booking ? booking.customerName : 'סלוט פנוי'}</h4>
                         {booking && <p className="text-[10px] text-white/40">{booking.customerPhone}</p>}
                      </div>

                      {booking && (
                        <div className="flex gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                           Confirmed
                        </div>
                      )}
                    </div>
                  );
                })}
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
      </div>
    </div>
  );
}
