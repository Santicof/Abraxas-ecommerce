// Carga productos de ejemplo con las fotos autorizadas de la marca.
// Requiere haber aplicado las migraciones y el seed.sql. Uso: pnpm seed:productos
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const productos = [
  {
    nombre: "Jogger de gabardina con lazo",
    categoria: "pantalones",
    precio: 28900,
    descripcion: "Jogger cómodo de gabardina con lazo en la cintura y puño elastizado. Ideal con zapatillas y blazer.",
    destacado: true,
    foto: "jogger-gabardina.jpg",
    talles: ["S", "M", "L"],
    colores: ["Negro", "Verde militar", "Camel"],
    stock: 2,
  },
  {
    nombre: "Short de jean con strass",
    categoria: "polleras-y-shorts",
    precio: 34900,
    descripcion: "Short de jean tiro alto con aplicaciones de strass y ruedo desflecado.",
    destacado: true,
    foto: "short-jean-strass.jpg",
    talles: ["36", "38", "40", "42"],
    colores: ["Celeste"],
    stock: 2,
  },
  {
    nombre: "Musculosa con tachas",
    categoria: "remeras-y-tops",
    precio: 19900,
    precioOferta: 16900,
    descripcion: "Musculosa de algodón con tachas brillantes. Fresca y fácil de combinar.",
    foto: "musculosa-tachas.jpg",
    talles: ["S", "M", "L"],
    colores: ["Blanco"],
    stock: 4,
  },
  {
    nombre: "Pollera de lentejuelas",
    categoria: "polleras-y-shorts",
    precio: 38900,
    descripcion: "Mini pollera de lentejuelas para tus salidas. Forrada y con cierre lateral.",
    foto: "pollera-lentejuelas.jpg",
    talles: ["S", "M"],
    colores: ["Plateado"],
    stock: 1,
  },
  {
    nombre: "Vestido de lino con cinto de rafia",
    categoria: "vestidos",
    precio: 45900,
    descripcion: "Vestido corto de lino con botones y cinto de rafia incluido. El must de la temporada.",
    destacado: true,
    foto: "vestido-lino-rafia.jpg",
    talles: ["S", "M", "L"],
    colores: ["Verde oliva", "Terracota"],
    stock: 2,
  },
  {
    nombre: "Campera de jean clásica",
    categoria: "abrigos",
    precio: 59900,
    precioOferta: 52900,
    descripcion: "Campera de jean rígido, corte clásico. Va con todo.",
    foto: "campera-jean.jpg",
    talles: ["S", "M", "L"],
    colores: ["Azul"],
    stock: 3,
  },
  {
    nombre: "Vestido camisero tie-dye",
    categoria: "vestidos",
    precio: 36900,
    descripcion: "Vestido largo tie-dye, liviano y suelto. Perfecto para la playa o el verano en la ciudad.",
    foto: "vestido-tie-dye.jpg",
    talles: ["Único"],
    colores: ["Celeste"],
    stock: 3,
  },
];

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const { data: categorias, error: errCat } = await db.from("categorias").select("id, slug");
if (errCat) throw errCat;
const catId = Object.fromEntries(categorias.map((c) => [c.slug, c.id]));

for (const p of productos) {
  const slug = slugify(p.nombre);
  const { data: existente } = await db.from("productos").select("id").eq("slug", slug).maybeSingle();
  if (existente) {
    console.log(`= ${p.nombre} (ya existe)`);
    continue;
  }

  const { data: prod, error } = await db
    .from("productos")
    .insert({
      nombre: p.nombre,
      slug,
      descripcion: p.descripcion,
      precio: p.precio,
      precio_oferta: p.precioOferta ?? null,
      categoria_id: catId[p.categoria],
      destacado: Boolean(p.destacado),
    })
    .select("id")
    .single();
  if (error) throw error;

  const path = `${prod.id}/${p.foto}`;
  const archivo = readFileSync(join(process.cwd(), "supabase/seed-fotos", p.foto));
  const { error: errFoto } = await db.storage
    .from("productos")
    .upload(path, archivo, { contentType: "image/jpeg", upsert: true });
  if (errFoto) throw errFoto;
  await db.from("producto_fotos").insert({ producto_id: prod.id, path, orden: 0, alt: p.nombre });

  const variantes = p.talles.flatMap((talle) =>
    p.colores.map((color) => ({ producto_id: prod.id, talle, color, stock: p.stock })),
  );
  const { error: errVar } = await db.from("variantes").insert(variantes);
  if (errVar) throw errVar;

  console.log(`+ ${p.nombre}`);
}

console.log("Listo.");
