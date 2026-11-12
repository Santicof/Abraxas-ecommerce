# Design

## Context

- El repositorio solo tiene OpenSpec y las skills de dominio. No hay código todavía. La motivación está en proposal.md (Why).
- La marca existe y tiene identidad propia. Ver imágenes en `referencias/`:
  - **Logo oficial** (provisto por las dueñas): "Abraxas" en sans geométrica fina (estilo Century Gothic) gris carbón sobre fondo blanco, con la "X" manuscrita en amarillo. La bolsa de la marca usa la misma versión. La variante coral sobre foto de playa que aparece en redes es una pieza de temporada, no el logo base.
  - **Fotos**: las dueñas autorizaron publicar las fotos públicas de la marca (`referencias/`).
  - **Estética de las fotos**: verano, playa, cielo azul. Looks casuales urbanos (joggers, blazers, jeans, tops), vestidos de lino en verde oliva y terracota con cinturones de rafia, prendas con estampas y colores vivos. También fotos en el local, con percheros y piso de madera.
  - **Rubros que publican**: ropa de mujer, carteras y mochilas (marca Extra Large), accesorios. Tienen local a la calle desde 2024.
- **Datos públicos verificados**:
  - dirección: Dr. Emilio Cardeza 98, B1842 Monte Grande;
  - teléfono fijo: (011) 4367-2436;
  - horario publicado: lunes a sábado de 10 a 19/20 h;
  - redes: Instagram @abraxas_monte_grande y Facebook /abraxasmg.
- **Restricciones**:
  - lo mantiene una sola persona técnica;
  - lo usan dueñas no técnicas desde el celular;
  - presupuesto de infraestructura cercano a cero (planes gratuitos de Vercel y Supabase).

## Goals / Non-Goals

**Goals:**
- Sitio rápido en celulares de gama media, con LCP < 2,5 s en 4G.
- Cambiar de marca editando solo `src/config/store.ts`, las variables de tema y `public/brand/`.
- Datos operativos (WhatsApp, envíos, transferencia, banner) editables desde el panel sin redeploy.
- Seguridad en el servidor para precios, stock, pagos y permisos.

**Non-Goals:**
- Multi-tienda o multi-tenant en una sola instalación. Adaptar a otra marca significa clonar y configurar.
- Tiempo real en el panel (websockets). Alcanza con recargar o revalidar.
- App nativa. La tienda y el panel son web responsivos.

## Decisions

### 1. Next.js App Router + Server Components + Server Actions
Las páginas públicas se renderizan en el servidor con caché y revalidación por tags (`productos`, `categorias`, `config`). Las acciones del panel invalidan esos tags, así un cambio se ve "al instante". Las mutaciones van por Server Actions validadas con Zod.
- **Alternativas**: Tiendanube, Shopify o WooCommerce son rápidas de lanzar, pero tienen costo mensual en dólares o comisiones, menos control de la marca y un panel genérico y recargado para el celular. Una SPA con API separada duplica el trabajo de mantenimiento.

### 2. Supabase como backend único
Postgres con RLS para los datos, Auth para las dueñas y Storage para las fotos. Un solo servicio, con plan gratuito suficiente para el MVP.
- **Alternativa**: Sanity o Decap CMS + Stripe-like. Un CMS headless no resuelve stock, pedidos ni permisos sin código extra.

### 3. Modelo de datos

```
categorias(id, nombre, slug unique, orden, activa)
productos(id, nombre, slug unique, descripcion, precio int, precio_oferta int null,
          categoria_id fk, destacado bool, activo bool, busqueda text generated, created_at)
producto_fotos(id, producto_id fk, path, orden, alt)
variantes(id, producto_id fk, talle text, color text, stock int check >= 0,
          unique(producto_id, talle, color))
pedidos(id, numero serial desde 1001, estado enum, cliente_*, metodo_entrega enum,
        direccion jsonb, costo_envio int, subtotal int, total int, metodo_pago enum,
        mp_payment_id text unique null, revision text null, created_at)
pedido_items(id, pedido_id fk, variante_id fk, nombre, talle, color, precio_unitario int, cantidad int)
pedido_eventos(id, pedido_id fk, estado, autor_id null, created_at)
zonas_envio(id, nombre, costo int, localidades text[], activa)
configuracion(id = 1, whatsapp, transferencia jsonb, envio_gratis_desde int null,
              envio_nacional_modo enum, banner jsonb, politica_cambios text)
admins(user_id pk fk auth.users)
```

- Los precios son enteros en pesos. El IVA está incluido.
- `busqueda` es una columna generada con `unaccent(lower(nombre || ' ' || descripcion))` para buscar sin tildes.
- `pedido_items` guarda una copia del nombre, talle, color y precio para no depender de cambios futuros en el producto.
- **Alternativa**: variantes en JSON dentro del producto. Se descartó porque complica el stock atómico y los filtros por talle.

### 4. Dónde vive cada configuración
- **Estática** (`src/config/store.ts` + `globals.css`): nombre, logo, paleta, tipografías, redes, dirección y horarios. Cambia poco y conviene versionarla.
- **Operativa** (tabla `configuracion` + `zonas_envio`, editable en el panel): WhatsApp de ventas, alias, CBU y titular, costos de envío, envío gratis, banner y política de cambios.
- **Alternativa**: todo en la base. Se descartó porque obliga a armar un editor de temas y suma riesgo de romper la marca.

### 5. Tema visual inicial (derivado del logo)

| Token | Uso | Valor inicial |
|---|---|---|
| `--primary` | botones, links, precios | gris carbón `#2B2B2B` (texto blanco) |
| `--accent` | badges "Nuevo/Oferta", subrayados, detalles | amarillo del logo `#F2C318` (texto carbón) |
| `--secondary` | fondos de secciones, chips | arena `#F5F0E8` |
| `--background` | fondo | blanco `#FFFFFF` |
| `--foreground` | texto | `#2B2B2B` |
| `--muted` | bordes, fondos suaves | `#EDE8E0` |

- Tipografías con `next/font`: **Questrial** para títulos (geométrica fina, cercana a la del logo), **Nunito Sans** para textos y **Dancing Script** solo para la "X" del logo en texto de respaldo.
- Los valores exactos se toman con un cuentagotas del logo oficial.
- El amarillo nunca se usa como color de texto sobre blanco (no cumple AA). Va solo como fondo de badges con texto carbón o como detalle decorativo.
- **Estilo**: minimalista y luminoso, con mucho blanco para que las fotos coloridas de las prendas sean protagonistas. Grillas de 2 columnas en celular y 4 en escritorio, fotos 3:4, bordes apenas redondeados y banner con foto de temporada.

### 6. Carrito en el cliente con revalidación en el servidor
- Se usa un store liviano (Zustand con `persist` en localStorage) que guarda solo `variante_id` y `cantidad`.
- Al abrir el carrito o el checkout, una Server Action devuelve precios y stock vigentes.
- **Alternativa**: carrito en la base, que necesita una sesión anónima. Es innecesario sin cuentas de clientas.

### 7. Pagos y stock
- Una Server Action crea el pedido `pendiente_pago` con montos del servidor y genera la preferencia de Mercado Pago (`external_reference = pedido.id`, `notification_url = /api/webhooks/mercadopago`).
- El webhook valida `x-signature` con HMAC-SHA256 sobre `id:{data.id};request-id:{x-request-id};ts:{ts};` usando `MP_WEBHOOK_SECRET`, consulta `Payment.get` y llama a la función SQL `confirmar_pago(pedido_id, payment_id)`.
- La función bloquea las variantes (`FOR UPDATE`), verifica stock y monto, descuenta, marca `pagado` o `revision` y registra el evento, todo en una transacción.
- La idempotencia se apoya en `mp_payment_id unique`.
- La transferencia confirmada desde el panel reutiliza la misma función.
- La cancelación usa `cancelar_pedido(pedido_id)`, que repone stock si ya se había descontado.
- **Alternativa**: reservar stock al crear el pedido. Se descartó en el MVP: con poco volumen, reservar deja stock bloqueado por carritos abandonados.

### 8. Fotos
- Se comprimen en el navegador con `browser-image-compression` (máximo 1600 px, WebP, alrededor de 300 KB).
- Se suben directo al bucket público `productos`, con políticas de Storage que permiten escribir solo a `admins`.
- Se muestran con `next/image` y `sizes` adecuados.

### 9. Acceso al panel
- Supabase Auth con email y contraseña, más magic link opcional. Las cuentas de las dueñas se crean a mano desde Supabase y no hay registro público.
- El middleware protege `/admin/**`, y cada Server Action vuelve a verificar la pertenencia a `admins`.
- Las políticas RLS usan una función `es_admin()`.

### 10. WhatsApp
- Un helper arma enlaces `https://wa.me/<número>?text=<mensaje codificado>`.
- Las plantillas de mensajes (consulta, pedido, avisos de estado) quedan en un único módulo para editarlas fácil.

### 11. Modo demostración
- Si faltan las variables de Supabase, la capa de datos usa un catálogo local (`src/lib/catalogo/demo.ts`, fotos en `public/demo/`, precios inventados). Así se puede mostrar la tienda sin backend.
- Se ve una franja "Vista previa" y el checkout muestra una confirmación de ejemplo sin guardar ni cobrar.
- Con Supabase configurado, el modo demo se desactiva solo.
- Next 16 usa Cache Components: el catálogo se lee una vez con `"use cache"` + `cacheTag("catalogo")`, y se filtra y pagina en memoria con una función pura testeada.

## Risks / Trade-offs

- [Las fotos públicas tienen baja resolución (~600 px) y no son fotos de producto con fondo neutro] → Se usan en el banner, en la home y como productos de ejemplo del seed. Las dueñas las reemplazan con fotos propias desde el panel.
- [El logo oficial disponible es una captura de 115×100 px (`referencias/00-logo-oficial.png`, copia en `public/brand/logo-original.png`)] → Se redibuja en SVG con una tipografía geométrica fina equivalente y la "X" manuscrita amarilla trazada a mano. Las dueñas lo validan, y si aparece el archivo original de la diseñadora se reemplaza.
- [Las notificaciones de Mercado Pago pueden demorar o fallar] → Hay un botón "Verificar pago" en el detalle del pedido, que consulta la API de Mercado Pago y aplica la misma función idempotente.
- [El stock del local y el online se desincronizan si venden en el local y no lo descuentan] → La edición rápida de stock desde el celular está pensada para hacerlo en segundos. Además, el pedido marcado "Revisar stock" funciona como red de seguridad.
- [Plan gratuito de Supabase: el proyecto se pausa tras una semana sin actividad] → Con tráfico real no ocurre. Si hace falta, se agrega un cron de Vercel que hace un ping diario.
- [El amarillo del logo tiene contraste bajo sobre blanco] → Se usa solo como fondo o detalle, nunca como texto. Los botones van en carbón, verificados con un checker AA.

## Migration Plan

1. Crear proyectos en Supabase y Vercel, y cargar las variables de entorno (las de prueba de Mercado Pago primero).
2. Aplicar las migraciones SQL y el seed de categorías iniciales y zonas de envío.
3. Crear las cuentas de las dueñas e insertarlas en `admins`.
4. Las dueñas cargan los primeros productos desde el panel, con el sitio todavía sin publicar.
5. Probar compras con usuarios de prueba de Mercado Pago, pasar a credenciales de producción y conectar el dominio.
6. **Rollback**: el sitio es nuevo y no reemplaza nada. Ante un problema se despublica en Vercel y la venta sigue por Instagram y WhatsApp.

## Open Questions

- Número de WhatsApp de ventas (el fijo publicado es (011) 4367-2436).
- Alias, CBU y titular para transferencias.
- Costos y localidades de cada zona de envío, y monto de envío gratis.
- Dominio deseado (por ejemplo, `abraxasmontegrande.com.ar`).
- Emails de las dueñas que van a administrar el panel.
- Texto de la política de cambios y devoluciones.
