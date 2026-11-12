# Proposal

## Why

Abraxas (Cardeza 98, Monte Grande) vende hoy por el local, Instagram (@abraxas_monte_grande, ~10K seguidores) y WhatsApp. Las consultas de talle, color, precio y stock se responden a mano, una por una, y no hay forma de comprar y pagar online. Una tienda propia con catálogo, carrito y pago con Mercado Pago convierte el tráfico de Instagram en ventas, también fuera del horario del local. Además, las dueñas tienen que poder mantenerla solas desde el celular.

## What Changes

- **Sitio público con la identidad de Abraxas**: el logo oficial ("Abraxas" en sans geométrica fina gris carbón, con la "X" manuscrita en amarillo), una paleta minimalista tomada del logo (carbón, amarillo y neutros cálidos), las fotos reales de la marca y un tono cercano con voseo. Todos los datos de marca quedan en un archivo de configuración para que sea fácil cambiarlos.
- **Home**: banner editable, novedades, destacados, categorías, ubicación del local, horarios y botón flotante de WhatsApp.
- **Catálogo** con filtros por categoría, talle, color, precio y oferta. Incluye orden y paginación. Categorías iniciales según lo que la marca publica: Remeras y Tops, Camisas y Blusas, Pantalones, Jeans, Polleras y Shorts, Vestidos, Abrigos (camperas, chalecos, blazers), Carteras y Mochilas, Accesorios.
- **Ficha de producto**: galería de fotos, elección de talle y color con stock real, precio y precio de oferta, y botón "Consultar por WhatsApp".
- **Carrito** guardado en el navegador, con cantidades limitadas por el stock.
- **Checkout** como invitado (sin cuenta), con tres formas de entrega: retiro en el local, envío propio por zona en zona sur GBA y envío nacional a cotizar.
- **Pagos**: Mercado Pago Checkout Pro con confirmación por webhook firmado, transferencia (confirmación manual) y "Pedir por WhatsApp", que arma un mensaje con el detalle del carrito.
- **Panel `/admin` para las dueñas**, pensado para el celular:
  - login;
  - alta, edición y duplicado de productos;
  - subida de fotos desde la cámara con compresión automática;
  - grilla de talle × color con el stock;
  - publicar u ocultar productos;
  - categorías;
  - gestión de pedidos con aviso por WhatsApp.
- **SEO local básico**: metadata, Open Graph para compartir en Instagram y WhatsApp, y datos estructurados `ClothingStore` con la dirección real.

### Fuera de alcance (MVP)

- Cuentas de clientas, historial de compras, favoritos y reseñas.
- Integración por API con Correo Argentino o Andreani: en el MVP el envío nacional es a cotizar o con tarifa fija.
- Cupones y descuentos por código, promociones automáticas (2x1) y programa de puntos.
- Facturación electrónica AFIP/ARCA.
- Sincronización automática con Instagram Shopping o Meta Catalog.
- Carga masiva por CSV.
- Varios locales o sucursales y varios idiomas.

## Capabilities

### New Capabilities
- `identidad-marca`: configuración centralizada de la marca (nombre, logo, colores, tipografías, contacto, horarios, redes, textos de la home) y su uso en todo el sitio.
- `catalogo`: categorías, listado con filtros y orden, ficha de producto con variantes talle/color y disponibilidad.
- `carrito`: agregar, quitar y modificar productos, validación de stock y persistencia en el navegador.
- `checkout`: datos de la clienta, método de entrega con cálculo de costo, creación del pedido con precios calculados en el servidor.
- `pagos`: Mercado Pago Checkout Pro, webhook de confirmación, transferencia con confirmación manual y pedido por WhatsApp.
- `admin-acceso`: login de las dueñas y protección del panel y de sus acciones.
- `admin-productos`: alta, edición, duplicado, fotos, variantes, stock, publicación de productos y categorías desde el celular.
- `admin-pedidos`: listado y detalle de pedidos, cambio de estado y aviso a la clienta por WhatsApp.

### Modified Capabilities
<!-- Ninguna: es el primer cambio del proyecto. -->

## Impact

- **Código nuevo**: proyecto Next.js completo (App Router, TypeScript, Tailwind, shadcn/ui) en la raíz del repo.
- **Servicios externos**: proyecto Supabase (Postgres, Auth, Storage), cuenta de Mercado Pago de las dueñas (credenciales de producción y de prueba) y deploy en Vercel.
- **Datos que deben aportar las dueñas**:
  - el número de WhatsApp de ventas;
  - el alias o CBU para transferencias;
  - las zonas y costos de envío;
  - la política de cambios;
  - las fotos reales de los productos.
- **Impacto para las dueñas**:
  - cargan y actualizan productos y stock desde el celular sin depender de nadie;
  - reciben los pedidos ordenados en el panel en lugar de mensajes sueltos;
  - siguen usando WhatsApp como canal principal de contacto, ahora con mensajes prearmados.
- **Logo y fotos**: el logo oficial ya fue provisto. Las fotos públicas de la marca en `referencias/` están autorizadas para publicarse y se usan en el banner y como productos de ejemplo hasta que las dueñas carguen las suyas.
