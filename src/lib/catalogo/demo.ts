import type { Configuracion, ZonaEnvio } from "@/lib/datos/configuracion";
import type { Categoria } from "@/lib/datos/categorias";
import type { ProductoDetalle } from "./modelo";

/**
 * Catálogo de demostración: se usa solo cuando Supabase no está configurado.
 * Fotos públicas de @abraxas_monte_grande (autorizadas) y precios inventados.
 */
export const categoriasDemo: Categoria[] = [
  { id: "c1", nombre: "Remeras y Tops", slug: "remeras-y-tops", orden: 1 },
  { id: "c3", nombre: "Pantalones", slug: "pantalones", orden: 3 },
  { id: "c5", nombre: "Polleras y Shorts", slug: "polleras-y-shorts", orden: 5 },
  { id: "c6", nombre: "Vestidos", slug: "vestidos", orden: 6 },
  { id: "c7", nombre: "Abrigos", slug: "abrigos", orden: 7 },
];

const cat = (slug: string) => {
  const c = categoriasDemo.find((x) => x.slug === slug)!;
  return { slug: c.slug, nombre: c.nombre };
};

type Base = Omit<ProductoDetalle, "variantes" | "fotos" | "foto" | "categoria"> & {
  categoria: string;
  foto: string;
  talles: string[];
  colores: string[];
  stock: number | ((talle: string, color: string) => number);
};

const base: Base[] = [
  {
    id: "p1",
    slug: "campera-de-gabardina-lila",
    nombre: "Campera de gabardina lila",
    descripcion: "Campera corta de gabardina con botones y bolsillos. El toque de color que levanta cualquier look.",
    precio: 49900,
    precioOferta: null,
    categoria: "abrigos",
    destacado: true,
    createdAt: "2026-11-10T12:00:00Z",
    foto: "/demo/look-lila-vichy.jpg",
    talles: ["S", "M", "L"],
    colores: ["Lila"],
    stock: 3,
  },
  {
    id: "p2",
    slug: "jogger-de-gabardina-con-lazo",
    nombre: "Jogger de gabardina con lazo",
    descripcion: "Jogger cómodo de gabardina con lazo en la cintura y puño elastizado. Ideal con zapatillas y blazer.",
    precio: 28900,
    precioOferta: null,
    categoria: "pantalones",
    destacado: true,
    createdAt: "2026-11-08T12:00:00Z",
    foto: "/demo/jogger-gabardina.jpg",
    talles: ["S", "M", "L"],
    colores: ["Negro", "Verde militar", "Camel"],
    stock: (t, c) => (c === "Camel" && t === "L" ? 0 : 2),
  },
  {
    id: "p3",
    slug: "vestido-de-lino-con-cinto-de-rafia",
    nombre: "Vestido de lino con cinto de rafia",
    descripcion: "Vestido corto de lino con botones y cinto de rafia incluido. El must de la temporada.",
    precio: 45900,
    precioOferta: null,
    categoria: "vestidos",
    destacado: true,
    createdAt: "2026-11-05T12:00:00Z",
    foto: "/demo/vestido-lino-rafia.jpg",
    talles: ["S", "M", "L"],
    colores: ["Verde oliva", "Terracota"],
    stock: 2,
  },
  {
    id: "p4",
    slug: "short-de-jean-con-strass",
    nombre: "Short de jean con strass",
    descripcion: "Short de jean tiro alto con aplicaciones de strass y ruedo desflecado.",
    precio: 34900,
    precioOferta: null,
    categoria: "polleras-y-shorts",
    destacado: true,
    createdAt: "2026-11-03T12:00:00Z",
    foto: "/demo/short-jean-strass.jpg",
    talles: ["36", "38", "40", "42"],
    colores: ["Celeste"],
    stock: (t) => (t === "42" ? 0 : 2),
  },
  {
    id: "p5",
    slug: "musculosa-con-tachas",
    nombre: "Musculosa con tachas",
    descripcion: "Musculosa de algodón con tachas brillantes. Fresca y fácil de combinar.",
    precio: 19900,
    precioOferta: 16900,
    categoria: "remeras-y-tops",
    destacado: false,
    createdAt: "2026-10-28T12:00:00Z",
    foto: "/demo/musculosa-tachas.jpg",
    talles: ["S", "M", "L"],
    colores: ["Blanco", "Negro"],
    stock: (t, c) => (c === "Negro" && t === "M" ? 0 : 4),
  },
  {
    id: "p6",
    slug: "top-fruncido-con-lazo",
    nombre: "Top fruncido con lazo",
    descripcion: "Top corto fruncido al frente con lazo para regular. Va perfecto con polleras de tiro alto.",
    precio: 17900,
    precioOferta: null,
    categoria: "remeras-y-tops",
    destacado: false,
    createdAt: "2026-10-25T12:00:00Z",
    foto: "/demo/look-lila-vichy.jpg",
    talles: ["S", "M"],
    colores: ["Verde agua", "Blanco"],
    stock: 3,
  },
  {
    id: "p7",
    slug: "pollera-de-lentejuelas",
    nombre: "Pollera de lentejuelas",
    descripcion: "Mini pollera de lentejuelas para tus salidas. Forrada y con cierre lateral.",
    precio: 38900,
    precioOferta: null,
    categoria: "polleras-y-shorts",
    destacado: false,
    createdAt: "2026-10-20T12:00:00Z",
    foto: "/demo/pollera-lentejuelas.jpg",
    talles: ["S", "M"],
    colores: ["Plateado"],
    stock: (t) => (t === "S" ? 1 : 0),
  },
  {
    id: "p8",
    slug: "campera-de-jean-clasica",
    nombre: "Campera de jean clásica",
    descripcion: "Campera de jean rígido, corte clásico. Va con todo.",
    precio: 59900,
    precioOferta: 52900,
    categoria: "abrigos",
    destacado: false,
    createdAt: "2026-10-15T12:00:00Z",
    foto: "/demo/campera-jean.jpg",
    talles: ["S", "M", "L"],
    colores: ["Azul"],
    stock: 3,
  },
  {
    id: "p9",
    slug: "vestido-largo-tie-dye",
    nombre: "Vestido largo tie-dye",
    descripcion: "Vestido largo tie-dye, liviano y suelto. Perfecto para la playa o el verano en la ciudad.",
    precio: 36900,
    precioOferta: null,
    categoria: "vestidos",
    destacado: false,
    createdAt: "2026-10-10T12:00:00Z",
    foto: "/demo/vestido-tie-dye.jpg",
    talles: ["Único"],
    colores: ["Celeste"],
    stock: 3,
  },
  {
    id: "p10",
    slug: "pollera-vichy",
    nombre: "Pollera vichy",
    descripcion: "Pollera corta de vichy blanco y negro con volado. Un clásico que vuelve cada verano.",
    precio: 26900,
    precioOferta: null,
    categoria: "polleras-y-shorts",
    destacado: false,
    createdAt: "2026-10-05T12:00:00Z",
    foto: "/demo/look-lila-vichy.jpg",
    talles: ["S", "M", "L"],
    colores: ["Blanco y negro"],
    stock: 0,
  },
];

export const productosDemo: ProductoDetalle[] = base.map((b) => {
  const { talles, colores, stock, foto, categoria, ...resto } = b;
  return {
    ...resto,
    categoria: cat(categoria),
    foto,
    fotos: [{ path: foto, alt: b.nombre }],
    variantes: talles.flatMap((talle) =>
      colores.map((color) => ({
        id: `${b.id}-${talle}-${color}`.toLowerCase().replace(/\s+/g, "-"),
        talle,
        color,
        stock: typeof stock === "function" ? stock(talle, color) : stock,
      })),
    ),
  };
});

export const configuracionDemo: Configuracion = {
  whatsapp: "11 4367 2436",
  transferencia: { alias: "abraxas.demo", cbu: "0000000000000000000000", titular: "Abraxas (dato de ejemplo)" },
  envioGratisDesde: 80000,
  envioNacionalModo: "a_cotizar",
  envioNacionalCosto: null,
  banner: {
    titulo: "Nueva temporada",
    subtitulo: "Tu outfit en un solo lugar. Vení a conocernos a Cardeza 98, Monte Grande.",
    imagen: "/brand/banner.jpg",
  },
  politicaCambios:
    "Tenés 30 días desde la compra para cambiar tu prenda, sin uso y con etiqueta. Los cambios se hacen en el local (Cardeza 98, Monte Grande) presentando el comprobante. Las prendas en oferta no tienen cambio.",
};

export const zonasDemo: ZonaEnvio[] = [
  { id: "z1", nombre: "Zona 1 (cerca del local)", costo: 3000, localidades: ["Monte Grande", "Luis Guillón", "El Jagüel", "9 de Abril"], orden: 1, activa: true },
  { id: "z2", nombre: "Zona 2", costo: 4500, localidades: ["Lomas de Zamora", "Adrogué", "Burzaco", "Ezeiza", "Canning", "Tristán Suárez", "Temperley", "Banfield"], orden: 2, activa: true },
  { id: "z3", nombre: "Zona 3 (resto de zona sur)", costo: 6000, localidades: ["Lanús", "Quilmes", "Florencio Varela", "Berazategui", "Longchamps", "Glew", "Turdera", "Llavallol", "José Mármol", "Rafael Calzada", "Claypole", "San Vicente", "Spegazzini"], orden: 3, activa: true },
];
