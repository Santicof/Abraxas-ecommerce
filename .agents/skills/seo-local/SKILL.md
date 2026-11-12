---
name: seo-local
description: SEO local y presencia online para una tienda de ropa femenina en Monte Grande (metadata, datos estructurados, sitemap, Open Graph para Instagram/WhatsApp, Google Business, rendimiento). Usar al crear páginas públicas, metadata o mejorar posicionamiento.
---

# SEO local y redes

## Metadata
- `generateMetadata` en cada página; `lang="es-AR"` en `<html>`.
- Títulos: `{Producto} | {store.nombre} – Ropa de mujer en Monte Grande`.
- Open Graph e imagen por producto (portada) para que se vea bien al compartir por WhatsApp e Instagram.

## Datos estructurados (JSON-LD)
- Home: `ClothingStore` (LocalBusiness) con dirección, horarios, teléfono, `sameAs` → Instagram.
- Producto: `Product` + `Offer` (`priceCurrency: "ARS"`, `availability` según stock).
- Breadcrumbs en categorías y productos.

## Técnico
- `app/sitemap.ts` y `app/robots.ts` dinámicos desde la base.
- URLs limpias: `/categoria/{slug}`, `/producto/{slug}`.
- Imágenes optimizadas (`next/image`, WebP, `sizes` correctos); objetivo Lighthouse mobile ≥ 90.
- Excluir `/admin` y `/checkout` de la indexación.

## Local y redes
- Recomendar a las dueñas crear/actualizar el perfil de Google Business con link a la tienda.
- Link de la tienda en la bio de Instagram; catálogo compatible con Instagram Shopping/Meta (feed de productos opcional en `/api/feed`).
