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

// This version must change on every deploy that needs cache busting
const APP_CACHE_VERSION = 'v3.7-inline-fix';

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

        {/* CRITICAL FIX: This script runs BEFORE any JS chunks load.
            It ensures projected incomes are ALWAYS in localStorage,
            even if the Gist sync overwrites them with empty data.
            This is immune to browser caching of JS chunks. */}
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
                var raw = localStorage.getItem('mf_goals');
                if (!raw) return;
                var goals = JSON.parse(raw);
                var changed = false;
                for (var i = 0; i < goals.length; i++) {
                  var g = goals[i];
                  if (g.id === 'quinceanera-2026') {
                    if (!g.projectedIncomes || g.projectedIncomes.length === 0) {
                      g.projectedIncomes = DEFAULT_INCOMES;
                      changed = true;
                    } else {
                      // Merge: add any missing incomes, preserve received state
                      for (var j = 0; j < DEFAULT_INCOMES.length; j++) {
                        var found = false;
                        for (var k = 0; k < g.projectedIncomes.length; k++) {
                          if (g.projectedIncomes[k].id === DEFAULT_INCOMES[j].id) {
                            found = true;
                            break;
                          }
                        }
                        if (!found) {
                          g.projectedIncomes.push(DEFAULT_INCOMES[j]);
                          changed = true;
                        }
                      }
                    }
                  }
                }
                if (changed) {
                  localStorage.setItem('mf_goals', JSON.stringify(goals));
                }
              } catch(e) {}
            })();
          `
        }} />

        {/* Cache bust: force new URL if version changed */}
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
                  var newUrl = location.pathname + '?_cb=' + Date.now() + location.hash;
                  location.replace(newUrl);
                }
              }
            })();
          `
        }} />

        {/* Register service worker to prevent future caching */}
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
