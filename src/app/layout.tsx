import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MiFinanzas - Control de Finanzas Personal",
  description: "Aplicación para el control de tus finanzas personales. Gestiona ingresos, gastos y metas de ahorro de forma sencilla.",
  keywords: ["finanzas", "presupuesto", "gastos", "ingresos", "ahorro", "metas"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const APP_CACHE_VERSION = 'v3.8-separate-key';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />

        {/* This script writes projected incomes to a SEPARATE localStorage key
            that is NOT in the Gist sync list. The Gist sync only syncs:
            mf_settings, mf_categories, mf_transactions, mf_goals, mf_accounts, mf_seeded
            So mf_projected_incomes will NEVER be overwritten by sync. */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var DEFAULT_INCOMES = [
                  {id:'pi-1',date:'2026-06-05',amount:41760,description:'Sueldo',received:false},
                  {id:'pi-2',date:'2026-06-20',amount:21000,description:'1/2 Aguinaldo',received:false},
                  {id:'pi-3',date:'2026-07-01',amount:40000,description:'Sueldo',received:false},
                  {id:'pi-4',date:'2026-07-30',amount:9000,description:'Ingreso extra',received:false},
                  {id:'pi-5',date:'2026-08-03',amount:40000,description:'Sueldo',received:false}
                ];
                var KEY = 'mf_projected_incomes';
                var existing = localStorage.getItem(KEY);
                if (!existing) {
                  localStorage.setItem(KEY, JSON.stringify(DEFAULT_INCOMES));
                } else {
                  // Merge: add any missing default incomes, preserve received state
                  var stored = JSON.parse(existing);
                  var changed = false;
                  for (var i = 0; i < DEFAULT_INCOMES.length; i++) {
                    var found = false;
                    for (var j = 0; j < stored.length; j++) {
                      if (stored[j].id === DEFAULT_INCOMES[i].id) {
                        found = true;
                        break;
                      }
                    }
                    if (!found) {
                      stored.push(DEFAULT_INCOMES[i]);
                      changed = true;
                    }
                  }
                  if (changed) {
                    localStorage.setItem(KEY, JSON.stringify(stored));
                  }
                }
              } catch(e) {}
            })();
          `
        }} />

        {/* Cache bust */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var CURR = '${APP_CACHE_VERSION}';
              var prev = localStorage.getItem('mf_cache_ver');
              var hasBust = location.search.indexOf('_cb=') !== -1;
              if (hasBust) {
                history.replaceState(null, '', location.pathname);
              }
              if (prev !== CURR || hasBust) {
                localStorage.setItem('mf_cache_ver', CURR);
                if (!hasBust) {
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      names.forEach(function(n) { caches.delete(n); });
                    });
                  }
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      regs.forEach(function(r) { r.unregister(); });
                    });
                  }
                  location.replace(location.pathname + '?_cb=' + Date.now() + location.hash);
                }
              }
            })();
          `
        }} />

        {/* Service worker */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/misfinanzas/sw.js', { scope: '/misfinanzas/' }).catch(function() {});
              }
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
