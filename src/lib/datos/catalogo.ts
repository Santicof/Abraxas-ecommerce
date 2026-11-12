import { cacheLife, cacheTag } from "next/cache";
import { estadoDemo } from "@/lib/admin/demo-estado";
import { filtrarProductos, type Filtros, type ProductoDetalle, type ProductoResumen } from "@/lib/catalogo/modelo";
import { createPublicClient } from "@/lib/supabase/public";
import { supabaseConfigurado } from "@/lib/supabase/util";
import { TAGS } from "./tags";

export type Catalogo = { productos: ProductoDetalle[]; generadoEn: number };

/** Todos los productos publicados de categorías activas, con fotos y variantes. */
export async function obtenerCatalogo(): Promise<Catalogo> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.catalogo);
  const generadoEn = Date.now();

  if (!supabaseConfigurado()) {
    const { productos, categorias } = estadoDemo();
    const activas = new Map(categorias.filter((c) => c.activa).map((c) => [c.id, c]));
    return {
      productos: productos
        .filter((p) => p.activo && activas.has(p.categoriaId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p) => {
          const c = activas.get(p.categoriaId)!;
          return {
            id: p.id,
            slug: p.slug,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            precioOferta: p.precioOferta,
            destacado: p.destacado,
            createdAt: p.createdAt,
            categoria: { slug: c.slug, nombre: c.nombre },
            foto: p.fotos[0]?.path ?? null,
            fotos: p.fotos,
            variantes: p.variantes.map((v) => ({ id: v.id ?? `${p.id}-${v.talle}-${v.color}`, talle: v.talle, color: v.color, stock: v.stock })),
          };
        }),
      generadoEn,
    };
  }

  const { data, error } = await createPublicClient()
    .from("productos")
    .select(
      "id, slug, nombre, descripcion, precio, precio_oferta, destacado, created_at, categorias!inner(slug, nombre, activa), producto_fotos(path, alt, orden), variantes(id, talle, color, stock)",
    )
    .eq("activo", true)
    .eq("categorias.activa", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);

  const productos: ProductoDetalle[] = data.map((p) => {
    const fotos = [...p.producto_fotos].sort((a, b) => a.orden - b.orden).map((f) => ({ path: f.path, alt: f.alt || p.nombre }));
    return {
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      precioOferta: p.precio_oferta,
      destacado: p.destacado,
      createdAt: p.created_at,
      categoria: { slug: p.categorias.slug, nombre: p.categorias.nombre },
      foto: fotos[0]?.path ?? null,
      fotos,
      variantes: p.variantes,
    };
  });
  return { productos, generadoEn };
}

const resumen = (p: ProductoDetalle): ProductoResumen => ({
  id: p.id,
  slug: p.slug,
  nombre: p.nombre,
  precio: p.precio,
  precioOferta: p.precioOferta,
  foto: p.foto,
  categoria: p.categoria,
  destacado: p.destacado,
  createdAt: p.createdAt,
  variantes: p.variantes,
});

export async function listarProductos(filtros: Filtros) {
  const { productos, generadoEn } = await obtenerCatalogo();
  return { ...filtrarProductos(productos.map(resumen), filtros), generadoEn };
}

export async function obtenerProducto(slug: string): Promise<{ producto: ProductoDetalle | null; generadoEn: number }> {
  const { productos, generadoEn } = await obtenerCatalogo();
  return { producto: productos.find((p) => p.slug === slug) ?? null, generadoEn };
}

export async function productosHome() {
  const { productos, generadoEn } = await obtenerCatalogo();
  const lista = productos.map(resumen);
  return {
    destacados: lista.filter((p) => p.destacado).slice(0, 8),
    nuevos: lista.slice(0, 8),
    generadoEn,
  };
}
