---
name: ecommerce-stack
description: Convenciones técnicas del ecommerce Abraxas (Next.js App Router, TypeScript, Tailwind, shadcn/ui, Supabase, Vercel, pnpm). Usar al crear el proyecto, agregar páginas, componentes, rutas de API, acceso a datos o variables de entorno.
---

# Stack y convenciones

## Tecnologías
- Next.js (App Router, Server Components por defecto) + TypeScript `strict`.
- Tailwind CSS + shadcn/ui para componentes.
- Supabase (`@supabase/ssr`) para Postgres, Auth y Storage.
- Zod para validar todo input (formularios, server actions, webhooks).
- pnpm como gestor de paquetes. Deploy en Vercel.

## Inicialización (una sola vez)
```powershell
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
pnpm dlx shadcn@latest init
pnpm add @supabase/supabase-js @supabase/ssr zod mercadopago
```

## Estructura
```
src/
  app/
    (tienda)/            # sitio público: home, categorías, producto, carrito, checkout
    admin/               # panel de las dueñas (protegido)
    api/webhooks/        # webhooks (Mercado Pago)
  components/ui/         # shadcn/ui
  components/tienda/     # componentes del sitio
  components/admin/      # componentes del panel
  config/store.ts        # marca, contacto, envíos (ver skill marca-y-tema)
  lib/supabase/          # clientes server/browser/admin
  lib/validations/       # esquemas Zod
supabase/migrations/     # SQL versionado
```

## Reglas
- Mutaciones con Server Actions o Route Handlers; validar con Zod en el servidor.
- `SUPABASE_SERVICE_ROLE_KEY` y `MP_ACCESS_TOKEN` solo en servidor (nunca `NEXT_PUBLIC_`).
- Row Level Security activado en todas las tablas.
- Imágenes con `next/image`; textos de UI en español rioplatense.
- Precios en ARS como enteros (centavos no se usan): `number` entero en pesos.
- Formatear con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.

## Variables de entorno (`.env.local`, documentar en `.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # sb_publishable_… (también acepta el legacy ANON_KEY)
SUPABASE_SECRET_KEY=                    # sb_secret_… solo servidor (legacy: SUPABASE_SERVICE_ROLE_KEY)
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_SITE_URL=
```
