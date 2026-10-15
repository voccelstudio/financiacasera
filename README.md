# 🏡 Financia Casera

Aplicación web (instalable en el celular como app) para que una **familia paraguaya** controle sus finanzas y su economía casera: ingresos, gastos, presupuestos, cuentas fijas, deudas y reportes — todo en **guaraníes (₲) y dólares (US$)**.

## ✨ Qué incluye la v1

| Sección | Qué hace |
|---|---|
| 🏠 **Resumen** | Balance del mes, alertas de presupuesto, cuentas fijas por vencer, deudas y tasa de cambio |
| 💸 **Movimientos** | Registrar ingresos/gastos con categoría, fecha y filtros. Cada movimiento puede ser de la **familia en general** o asignado a **miembros específicos** |
| 🎯 **Presupuestos** | Límite mensual por categoría con barra de progreso y alertas |
| 📊 **Reportes** | Ingresos vs. gastos (6 meses), gastos por categoría y por miembro |
| 🔁 **Cuentas fijas** | Alquiler, luz (ANDE), agua (ESSAP), internet, cable... con botón «Pagar» que registra el gasto automáticamente |
| 💳 **Cuentas por pagar** | Deudas con progreso de pago y abonos parciales |
| 👨‍👩‍👧 **Familia** | Código de invitación, agregar miembros (con o sin cuenta) y **quitar miembros** de dos formas: archivar (conserva historial) o eliminar (borra solo sus gastos personales) |
| 💡 **Tips** | Consejos de ahorro con contexto paraguayo |
| 📱 **PWA** | Se instala en el celular desde el navegador y funciona con caché offline básica |

### 💡 Diseño de "separación de cuentas"

- Un gasto tiene alcance **`familia`** (compartido por todos) o **`miembros`** (repartido entre personas específicas).
- Cuando alguien se va de la familia (ej: una pareja que se separa), se puede:
  - **Archivar**: sale de la app pero su historial se conserva. Los gastos familiares compartidos no se tocan.
  - **Eliminar del todo**: además se borran únicamente sus gastos personales; lo compartido permanece.
- Cada fila en la base de datos está protegida con RLS: una familia **nunca** puede ver los datos de otra.

---

## 🚀 Puesta en marcha

### 1. Crear el proyecto en Supabase (gratis)

1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. En **SQL Editor** → pegá y ejecutá el archivo
   [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)
   (crea tablas, permisos, funciones y categorías por defecto).
3. En **Authentication → Providers → Email**, para probar sin complicaciones:
   desactivá *Confirm email* (o dejalo activo y usá el link del email).
4. En **Project Settings → API** copiá la *Project URL* y la *anon public key*.

### 2. Configurar el entorno local

```bash
cp .env.example .env.local
# editá .env.local con tu URL y clave de Supabase
```

### 3. Correr la app

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000), creá una cuenta, después creá tu
familia y listo. Desde **Familia** copiá el código para que otros se unan.

### 4. Publicar

Funciona en **Vercel**, **Netlify** o cualquier hosting Node. Variables de entorno
necesarias: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Para instalar en el celular: abrí la URL en Chrome/Safari → *Compartir* →
*Añadir a pantalla de inicio*.

---

## 🛠️ Stack técnico

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- **Recharts** para gráficos
- **PWA** (manifest + service worker propio, sin dependencias extra)

## 📁 Estructura

```
supabase/migrations/     → esquema SQL completo (tablas + RLS + funciones)
src/app/login/           → ingresar / crear cuenta
src/app/onboarding/      → crear familia o unirse con código
src/app/app/             → la app en sí (resumen, movimientos, reportes...)
src/components/          → componentes compartidos (nav, formularios, gráficos)
src/lib/                 → sesión, consultas, formato de dinero (₲/US$)
scripts/generate-icons.mjs → regenera los iconos PWA (node scripts/generate-icons.mjs)
```

## 🗺️ Ideas para la versión móvil nativa

La lógica de negocio (acciones del servidor, esquema) ya está separada de la UI, así
que más adelante se puede portar a **React Native / Expo** reutilizando Supabase tal
cual.
