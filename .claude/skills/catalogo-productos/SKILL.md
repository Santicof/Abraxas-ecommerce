---
name: catalogo-productos
description: Modelo de datos del catálogo de ropa femenina (productos, variantes talle/color, stock, categorías, fotos, pedidos) y su esquema en Supabase. Usar al diseñar tablas, migraciones, filtros, listados o fichas de producto.
---

# Catálogo de indumentaria

## Entidades
- **categorias**: `id, nombre, slug, orden, activa`. Ej: Remeras, Vestidos, Jeans, Abrigos, Accesorios.
- **productos**: `id, nombre, slug, descripcion, precio, precio_oferta (nullable), categoria_id, destacado, activo, created_at`.
- **producto_fotos**: `id, producto_id, path (Storage), orden, alt`. La de `orden = 0` es la portada.
- **variantes**: `id, producto_id, talle, color, stock, sku (opcional)`. Única por `(producto_id, talle, color)`.
- **pedidos**: `id, numero, estado, cliente_nombre, cliente_email, cliente_telefono, metodo_entrega, direccion, costo_envio, total, metodo_pago, mp_payment_id, created_at`.
- **pedido_items**: `id, pedido_id, variante_id, nombre_snapshot, talle, color, precio_unitario, cantidad`.

Estados de pedido: `pendiente_pago`, `pagado`, `preparando`, `listo_para_retirar`, `enviado`, `entregado`, `cancelado`.

## Reglas de negocio
- Talles libres en texto (S/M/L, 1/2/3, 36–46, "Único") para adaptarse a cada prenda.
- Un producto sin variantes con stock > 0 se muestra como "Sin stock", no se oculta.
- El stock se descuenta al confirmarse el pago (webhook), no al agregar al carrito.
- El precio del pedido se calcula SIEMPRE en el servidor desde la base; nunca confiar en el cliente.
- `slug` generado automáticamente desde el nombre (sin tildes, único).
- Borrado lógico: `activo = false` en vez de eliminar productos con pedidos.

## Storage
- Bucket público `productos` para fotos; escritura solo para usuarios admin.
- Path: `productos/{producto_id}/{uuid}.webp`.

## RLS
- Lectura pública de `categorias`, `productos`, `producto_fotos`, `variantes` donde `activo = true`.
- Escritura solo para rol admin (tabla `admins(user_id)` o claim en `app_metadata.role = 'admin'`).
- `pedidos` y `pedido_items`: inserción vía servidor con service role; lectura solo admin.

## Filtros del listado
Categoría, talle, color, rango de precio, "en oferta", orden (nuevos, menor precio, mayor precio).
