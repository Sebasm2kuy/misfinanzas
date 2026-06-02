import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const APP_CACHE_VERSION = 'v4.5-detailed-breakdown';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Ensure stable projected incomes key always has data */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var KEY = 'mf_projected_incomes';
                var DEFAULTS = [
                  {id:'pi-1',date:'2026-06-05',amount:41760,description:'Sueldo',received:false},
                  {id:'pi-2',date:'2026-06-20',amount:21000,description:'1/2 Aguinaldo',received:false},
                  {id:'pi-3',date:'2026-07-01',amount:40000,description:'Sueldo',received:false},
                  {id:'pi-4',date:'2026-07-30',amount:9000,description:'Ingreso extra',received:false},
                  {id:'pi-5',date:'2026-08-03',amount:40000,description:'Sueldo',received:false}
                ];
                if (!localStorage.getItem(KEY)) {
                  localStorage.setItem(KEY, JSON.stringify(DEFAULTS));
                }
              } catch(e) {}
            })();
          `
        }} />
        {/* Migrate theoretical expenses schema (v4.3 -> v4.4) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var KEY = 'mf_theoretical_expenses';
                var SCHEMA_KEY = 'mf_theo_exp_schema';
                if (localStorage.getItem(SCHEMA_KEY) !== 'v2') {
                  localStorage.setItem(SCHEMA_KEY, 'v2');
                  localStorage.removeItem(KEY);
                }
              } catch(e) {}
            })();
          `
        }} />
        {/* Cache bust on version change */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var prev = localStorage.getItem('mf_cache_version');
                if (prev !== '${APP_CACHE_VERSION}') {
                  localStorage.setItem('mf_cache_version', '${APP_CACHE_VERSION}');
                  var pathname = window.location.pathname.replace(/[?&]_cb=.*$/, '');
                  window.location.replace(pathname + '?_cb=' + Date.now());
                }
              } catch(e) {}
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
