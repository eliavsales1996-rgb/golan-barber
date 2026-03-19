"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'בית', path: '/', icon: '🏠' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 h-20 bg-black/80 backdrop-blur-3xl border-t border-white/5 px-6 flex items-center justify-around z-50 md:hidden">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            pathname === item.path ? 'text-primary scale-110' : 'text-white/40'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
          {pathname === item.path && (
            <span className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full shadow-gold animate-pulse"></span>
          )}
        </Link>
      ))}
    </nav>
  );
}
