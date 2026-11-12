---
name: marca-y-tema
description: Identidad visual y configuración de marca adaptable (logo, colores, tipografías, textos, contacto, redes) del ecommerce Abraxas. Usar al tocar estilos, el header/footer, la home, el logo o al adaptar la tienda a otra marca.
---

# Marca y tema adaptable

## Fuente única de verdad
Todo lo específico de la marca vive en `src/config/store.ts`. Ningún componente debe tener hardcodeado el nombre, teléfono, colores ni redes.

```ts
export const store = {
  nombre: "Abraxas",
  descripcion: "Indumentaria femenina en Monte Grande",
  logo: "/brand/logo.svg",
  logoClaro: "/brand/logo-blanco.svg",
  favicon: "/brand/favicon.png",
  contacto: {
    whatsapp: "54911XXXXXXXX", // completar
    email: "",
    direccion: "Monte Grande, Buenos Aires",
    horarios: "Lun a Sáb 10 a 20 h",
    mapsUrl: "",
  },
  redes: { instagram: "https://www.instagram.com/abraxas_monte_grande/" },
} as const;
```

## Logo
- Guardar en `public/brand/`: `logo.svg` (o PNG transparente ≥ 512px), versión clara para fondos oscuros y `favicon.png` 512×512.
- Generar `app/icon.png` y `app/opengraph-image.png` a partir del logo.

## Colores y tipografía
- Definir la paleta como variables CSS en `globals.css` (formato shadcn/ui: `--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, `--muted`).
- Abraxas: logo "Abraxas" en sans geométrica fina gris carbón (`#2B2B2B`) con la "X" manuscrita amarilla (`#F2C318`) sobre blanco. Primario carbón, acento amarillo (nunca como texto sobre blanco), neutros arena.
- Cambiar de marca = cambiar estas variables.
- Tipografías con `next/font`: una display/serif elegante para títulos y una sans legible para textos.

## Estilo visual (moda femenina)
- Fotos protagonistas: grillas de 2 columnas en mobile, 3–4 en desktop, proporción 3:4.
- Mucho espacio en blanco, bordes suaves, microanimaciones sutiles.
- Badges: "Nuevo", "Oferta", "Últimas unidades".
- Botón flotante de WhatsApp en todo el sitio.

## Tono de los textos
Español rioplatense con voseo, cercano y cálido ("Elegí tu talle", "Escribinos por WhatsApp").
