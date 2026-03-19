"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking, getAvailableSlots } from '@/lib/actions';
import { SERVICES } from '@/lib/bookings'; // Keeping for common service names

export default function BookPage() {
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [slots, setSlots] = useState<{time: string, available: boolean}[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch slots from DB whenever date changes
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      const availableSlots = await getAvailableSlots(selectedDate);
      setSlots(availableSlots);
      setLoading(false);
    }
    fetchSlots();
  }, [selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name || !phone || !selectedService) return;
    
    const result = await createBooking({
      date: selectedDate,
      timeSlot: selectedSlot,
      customerName: name,
      customerPhone: phone,
    });
    
    if (result.success) {
      setIsSuccess(true);
    } else {
      alert("שגיאה בקביעת התור. ייתכן והסלוט כבר נתפס.");
    }
  };

  // Generate dates
  const dates = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <div className="premium-card text-center reveal shadow-gold p-12">
          <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">✓</div>
          <h2 className="text-4xl font-bold font-serif gold-gradient-text mb-4 tracking-tighter">הוזמן בהצלחה!</h2>
          <p className="text-white/40 text-lg mb-10 text-right leading-relaxed font-light">
             תודה {name}, התור נקבע! <br />
             בשיר {selectedDate} בשעה {selectedSlot}
          </p>
          <button onClick={() => router.push('/')} className="premium-btn-primary w-full h-16 rounded-2xl font-bold">חזרה לבית</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <div className="px-6 pt-12">
        <div className="flex items-center justify-between mb-12 reveal">
           <button onClick={() => router.push('/')} className="text-white/40 hover:text-white transition-colors">✕</button>
           <h1 className="text-3xl font-bold font-serif gold-gradient-text tracking-tighter">הזמנת תור</h1>
           <div className="text-[10px] text-primary/60 border border-primary/20 px-4 py-1.5 rounded-full font-black tracking-widest uppercase">גולן כרמלי</div>
        </div>

        <form onSubmit={handleBook} className="space-y-12">
          
          {/* Service Picker */}
          <div className="reveal">
             <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-6 block text-right">01. בחר שירות</label>
             <div className="grid grid-cols-1 gap-4">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedService(s.name)}
                    className={`p-6 rounded-[30px] transition-all text-right border ${
                      selectedService === s.name ? 'bg-primary/10 border-primary shadow-gold scale-[1.02]' : 'bg-white/[0.03] border-white/5 opacity-50'
                    }`}
                  >
                    <h3 className={`font-bold text-xl ${selectedService === s.name ? 'text-primary' : 'text-white'}`}>{s.name}</h3>
                  </button>
                ))}
             </div>
          </div>

          {/* Date & Time Picker */}
          <div className={`reveal transition-all duration-500 ${selectedService ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
             <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-6 block text-right">02. מתי תרצה להגיע?</label>
             <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar flex-row-reverse mb-8">
                {dates.slice(0, 14).map((date, i) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedDate(dateStr); setSelectedSlot(""); }}
                      className={`flex-shrink-0 w-20 h-28 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all ${
                        isSelected ? 'bg-gold-gradient text-black scale-105 shadow-gold' : 'bg-white/[0.03] border border-white/5 text-white/40'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase">{date.toLocaleDateString('he-IL', { weekday: 'short' })}</span>
                      <span className="text-2xl font-bold tracking-tighter">{date.getDate()}</span>
                      <span className="text-[10px] font-black opacity-60 uppercase">{date.toLocaleDateString('he-IL', { month: 'short' })}</span>
                    </button>
                  );
                })}
             </div>

             <div className="grid grid-cols-3 gap-3">
                {loading ? (
                  <div className="col-span-3 text-center py-10 text-white/20">טוען שעות...</div>
                ) : (
                  slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`py-5 rounded-2xl font-bold transition-all ${
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
          </div>

          {/* Contact Details */}
          <div className={`space-y-8 reveal transition-all duration-500 ${selectedSlot ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
             <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-6 block text-right">03. פרטים לסיים</label>
             <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-5 px-6 focus:border-primary/50 outline-none text-right placeholder:text-white/10"
                  required
                />
                <input 
                  type="tel" 
                  placeholder="מספר טלפון"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-5 px-6 focus:border-primary/50 outline-none text-right placeholder:text-white/10"
                  required
                />
             </div>
             <button 
                type="submit" 
                className="premium-btn-primary w-full h-20 rounded-[30px] font-bold text-xl shadow-gold"
              >
                אישור והזמנה
              </button>
          </div>

        </form>
      </div>
    </div>
  );
}
