# 🏡 Financia Casera

Aplicación web (instalable en el celular como app) para que una **familia paraguaya** controle sus finanzas y su economía casera: ingresos, gastos, presupuestos, cuentas fijas, deudas y reportes — todo en **guaraníes (₲) y dólares (US$)**.

## ✨ Qué incluye la v1

| Sección | Qué hace |
|---|---|
| 🏠 **Resumen** | Balance del mes, **alertas de presupuesto (80%/100%)**, cuentas fijas por vencer, deudas, tasa de cambio y **logros/rachas de la familia** |
| 💸 **Movimientos** | Registrar ingresos/gastos con categoría, fecha, **búsqueda de texto**, rango de fechas y filtros. Cada movimiento puede ser de la **familia en general** o asignado a **miembros específicos** |
| 📥 **Importar extracto** | Subí o pegá el CSV de tu banco (Bancard, Continental, Itaú…) con vista previa, categorías sugeridas y confirmación antes de guardar |
| 📤 **Exportar CSV** | Descarga los movimientos filtrados en CSV listo para Excel (con resumen al final) |
| 🎯 **Presupuestos** | Límite mensual por categoría con barra de progreso y alertas |
| 🐷 **Metas de ahorro** | «Heladera nueva», «Fondo de emergencia»… con aportes por miembro, progreso y fecha límite |
| 📊 **Reportes** | Ingresos vs. gastos (6 meses), gastos por categoría y por miembro, y **resumen del mes como imagen** para compartir por WhatsApp |
| 🤖 **Asistente** | Preguntas frecuentes («¿cuánto nos sobra?», «¿pagamos la luz?») respondidas con los datos de la familia, **sin internet ni servicios externos** |
| 🔁 **Cuentas fijas** | Alquiler, luz (ANDE), agua (ESSAP), internet, cable... con botón «Pagar», **historial de pagos por cuenta** (¿subió la tarifa?) y estado «pagado este mes» |
| 💳 **Cuentas por pagar** | Deudas con progreso de pago y abonos parciales |
| 👨‍👩‍👧 **Familia** | Código de invitación, agregar miembros (con o sin cuenta) y **quitar miembros** de dos formas: archivar (conserva historial) o eliminar (borra solo sus gastos personales) |
| 💡 **Tips** | Consejos de ahorro con contexto paraguayo |
| 🎨 **Temas de color** | 7 paletas (Guaraní, Río, Sol, Lapacho, Orquídea, Tierra y Alto contraste accesible) elegibles por la familia; ingresos verdes y gastos rojos siempre |
| 🌙 **Modo nocturno** | Tema claro/oscuro/según el sistema, con preferencia guardada y sin parpadeo |
| 💱 **Dólar del día** | Botón «Traer tasa del día» que consulta la planilla oficial del **Banco Central del Paraguay** (sin clave de API) |
| 📱 **PWA** | Se instala en el celular desde el navegador y funciona con caché offline básica |

### 💡 Diseño de "separación de cuentas"

- Un gasto tiene alcance **`familia`** (compartido por todos) o **`miembros`** (repartido entre personas específicas).
- Cuando alguien se va de la familia (ej: una pareja que se separa), se puede:
  - **Archivar**: sale de la app pero su historial se conserva. Los gastos familiares compartidos no se tocan.
  - **Eliminar del todo**: además se borran únicamente sus gastos personales; lo compartido permanece.
- Cada fila en la base de datos está protegida con RLS: una familia **nunca** puede ver los datos de otra.

---

## 🚀 Puesta en marcha

### 🧪 Modo demo (sin backend)

Para ver y probar la app **sin configurar nada**, el repo trae un modo demo con los
datos de una familia paraguaya ficticia (Familia González) en memoria:

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) y entrás directo a la app (sin
login). Todo es interactivo: podés agregar gastos, presupuestos, deudas, miembros, etc.
Para activarlo/desactivarlo usá la variable `NEXT_PUBLIC_DEMO_MODE` en `.env.local`.

Cuando quieras pasar al backend real, poné `NEXT_PUBLIC_DEMO_MODE=0` y seguí el paso 1.

### 1. Crear el proyecto en Supabase (gratis)

1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. En **SQL Editor** → pegá y ejecutá los archivos en orden:
   [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)
   (tablas, permisos, funciones y categorías por defecto) y después
   [`supabase/migrations/0002_savings_and_history.sql`](supabase/migrations/0002_savings_and_history.sql)
   (metas de ahorro, aportes e historial de pagos).
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

## 🧭 Próximos pasos (requieren backend o servicios)

Estas ideas ya están esbozadas pero necesitan Supabase conectado u otros servicios:

- **Notificaciones push** de vencimientos y de «te pasaste del presupuesto»
- **Comprobantes con foto** de cada gasto (Supabase Storage)
- **Roles de solo lectura** para niños/adolescentes
- **Modo offline completo** con cola de sincronización
- **App en Play Store** (generar APK con [PWABuilder](https://pwabuilder.com))
- **Copiloto con IA** (el asistente actual es 100% local y sin costo)

## 🗺️ Ideas para la versión móvil nativa

La lógica de negocio (acciones del servidor, esquema) ya está separada de la UI, así
que más adelante se puede portar a **React Native / Expo** reutilizando Supabase tal
cual.
