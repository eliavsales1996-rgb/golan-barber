"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Cinematic 3D Background Header */}
      <div className="relative h-[85vh] w-full flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_70%)] animate-pulse-slow" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 blur-[120px] rounded-full animate-float-delayed" />
        </div>

        {/* 3D Asset Integration */}
        <div className="relative z-10 w-full max-w-lg perspective-2000 mb-12 flex justify-center reveal">
           <div className="relative w-64 h-64 md:w-80 md:h-80 rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-all duration-1000 ease-out-expo shadow-gold-intense rounded-[40px] overflow-hidden">
              <Image 
                src="/premium_3d_barber_asset_1773892107951.png" 
                alt="3D Premium Clipper" 
                fill 
                className="object-cover scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
           </div>
        </div>

        {/* Hero Content Area */}
        <div className="relative z-20 w-full max-w-6xl flex flex-col md:flex-row-reverse items-center justify-between gap-12 px-6 reveal">
          
          {/* Right Side: Logo */}
          <div className="w-48 h-48 md:w-80 md:h-80 relative group">
             <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/40 transition-all duration-700" />
             <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary/20 shadow-gold group-hover:scale-105 transition-transform duration-700">
                <Image 
                  src="/logo.jpg" 
                  alt="Golan Barber Logo" 
                  fill 
                  className="object-cover"
                />
             </div>
          </div>

          {/* Left Side: Text Content (centered in mobile) */}
          <div className="text-center md:text-right space-y-8 flex-1" style={{ animationDelay: "0.2s" }}>
            <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 animate-fade-in">
              Barbershop Excellence
            </div>
            <h1 className="text-6xl md:text-9xl font-black font-serif gold-gradient-text tracking-tighter leading-[0.9]">
              GOLAN <br /> CARMELI
            </h1>
            <p className="text-white/40 font-light text-xl md:text-2xl leading-relaxed tracking-tight max-w-md md:ml-0 md:mr-auto">
               חווית טיפוח יוקרתית ודיוק ללא פשרות. <br /> המקום שלך למראה מושלם.
            </p>

            <div className="flex flex-col gap-4 mt-12 w-full max-w-sm ml-auto mr-auto md:mr-0">
               <Link href="/book">
                  <button className="premium-btn-primary w-full h-20 rounded-[30px] font-bold text-xl shadow-gold group">
                     <span className="relative z-10">קבע תור עכשיו</span>
                     <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>
               </Link>
            </div>
          </div>
        </div>

        {/* Minimal Header Links */}
        <div className="absolute top-10 left-10 z-30 reveal">
           <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors">כניסת מנהל</Link>
        </div>
      </div>

      {/* Simplified Mobile-First Service Section */}
      <section className="px-6 py-24 pb-40 space-y-12">
        <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-white/20 text-center mb-16">שירותי הפרימיום שלנו</h2>
        
        <div className="grid grid-cols-1 gap-6 max-w-lg mx-auto">
           {/* Service 1 */}
           <Link href="/book" className="group">
              <div className="premium-card group-hover:scale-[1.03] group-hover:border-primary/50 transition-all duration-500 p-8 flex items-center justify-between flex-row-reverse text-right relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-1">תספורת</h3>
                    <p className="text-white/30 text-xs font-light">דיוק מקסימלי וסטייל אישי</p>
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:bg-primary group-hover:text-black transition-all">💇‍♂️</div>
                 <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
              </div>
           </Link>

           {/* Service 2 */}
           <Link href="/book" className="group">
              <div className="premium-card group-hover:scale-[1.03] group-hover:border-primary/50 transition-all duration-500 p-8 flex items-center justify-between flex-row-reverse text-right relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-1">זקן</h3>
                    <p className="text-white/30 text-xs font-light">עיצוב וסידור זקן ברמה הגבוהה ביותר</p>
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:bg-primary group-hover:text-black transition-all">🧔</div>
                 <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
              </div>
           </Link>
        </div>
      </section>
    </main>
  );
}
