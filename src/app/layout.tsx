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
const APP_CACHE_VERSION = 'v3.6-force-bust';

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

        {/* AGGRESSIVE cache bust: uses URL parameter to force completely new request */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var CURR = '${APP_CACHE_VERSION}';
              var prev = localStorage.getItem('mf_cache_ver');
              // Check if we just busted (URL has _cb param)
              var hasBust = location.search.indexOf('_cb=') !== -1;
              if (hasBust) {
                // Clean URL without reloading (keep version stored)
                history.replaceState(null, '', location.pathname);
              }
              if (prev !== CURR || hasBust) {
                localStorage.setItem('mf_cache_ver', CURR);
                if (!hasBust) {
                  // Clear all caches
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      names.forEach(function(n) { caches.delete(n); });
                    });
                  }
                  // Unregister old service workers
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      regs.forEach(function(r) { r.unregister(); });
                    });
                  }
                  // Force completely new URL to bypass ALL browser caching
                  // reload(true) is deprecated and ignored by modern browsers
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
