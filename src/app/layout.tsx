import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew"],
});

export const metadata: Metadata = {
  title: "גולן ברבר | Golan Barber - עיצוב שיער וטיפוח",
  description: "תספורות פרימיום וטיפוח לגברים אצל גולן ברבר. הזמן תור עכשיו!",
};

import BottomNav from "@/components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased pb-20 md:pb-0">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
