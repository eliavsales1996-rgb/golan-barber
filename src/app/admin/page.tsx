"use client";

import { useState, useEffect } from "react";
import { getBookingsForDate, getAvailableSlots } from "@/lib/actions";

export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      </div>
    </div>
  );
}
