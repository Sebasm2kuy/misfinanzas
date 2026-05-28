# 💰 MiFinanzas - Control de Finanzas Personales

App web completa para controlar tus finanzas personales. Construida con Next.js, TypeScript, Tailwind CSS, shadcn/ui y Prisma.

## ✨ Características

- **Dashboard** con resumen financiero, gráficos y estadísticas
- **Transacciones** — registro de ingresos y gastos con categorías
- **Metas de ahorro** con seguimiento de ítems
- **Meta de Quinceañera** precargada con checklist de gastos
- **Promedios mensuales** de ingresos y gastos
- **Gráficos** de los últimos 6 meses
- **100% en español** — interfaz intuitiva y responsive

## 🚀 Despliegue en Vercel

Esta app usa Next.js con API Routes y base de datos (Prisma + SQLite), por lo que **no funciona en GitHub Pages**.

### Pasos para desplegar:

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Haz clic en **"Add New Project"**
3. Selecciona tu repositorio `Sebasm2kuy/misfinanzas`
4. Vercel detectará automáticamente que es un proyecto Next.js
5. En **Build Command**, ingresa:
   ```
   npx prisma generate && npx prisma db push && next build
   ```
6. Haz clic en **Deploy**

> ⚠️ **Nota:** Para producción se recomienda usar una base de datos externa (PostgreSQL/MySQL) en lugar de SQLite. Puedes cambiar la configuración en `prisma/schema.prisma`.

## 🛠️ Desarrollo local

```bash
# Instalar dependencias
npm install

# Generar cliente de Prisma y crear la base de datos
npx prisma generate
npx prisma db push

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Tech Stack

- [Next.js 16](https://nextjs.org/) — React Framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling
- [shadcn/ui](https://ui.shadcn.com/) — Component library
- [Prisma](https://www.prisma.io/) — ORM
- [Recharts](https://recharts.org/) — Charts
- [Framer Motion](https://www.framer.com/motion/) — Animations
