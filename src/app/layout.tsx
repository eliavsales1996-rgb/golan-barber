import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import BottomNav from "../components/BottomNav";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew"],
});

export const metadata: Metadata = {
  title: "גולן ברבר | Golan Barber - עיצוב שיער וטיפוח",
  description: "תספורות פרימיום וטיפוח לגברים אצל גולן ברבר. הזמן תור עכשיו!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "גולן מספרה",
  },
  icons: {
    apple: "/premium_3d_barber_asset_1773892107951.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#40916c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="גולן מספרה" />
        <link rel="apple-touch-icon" href="/premium_3d_barber_asset_1773892107951.png" />
      </head>
      <body className="antialiased pb-20 md:pb-0 font-sans bg-[#030d08]">
        {children}
        <BottomNav />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
