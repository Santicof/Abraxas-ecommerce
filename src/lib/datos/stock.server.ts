import "server-only";
import type { ProductoDetalle } from "@/lib/catalogo/modelo";
import { createAdminClient } from "@/lib/supabase/admin";

/** Lee de la base (sin caché) los productos de las variantes pedidas, con stock actualizado. */
export async function leerProductosDeVariantes(varianteIds: string[]): Promise<ProductoDetalle[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("variantes")
    .select(
      "id, talle, color, stock, productos!inner(id, slug, nombre, descripcion, precio, precio_oferta, destacado, activo, created_at, categorias!inner(slug, nombre, activa), producto_fotos(path, alt, orden))",
    )
    .in("id", varianteIds)
    .eq("productos.activo", true)
    .eq("productos.categorias.activa", true);
  if (error) throw new Error(`No se pudo leer el stock: ${error.message}`);

  const productos = new Map<string, ProductoDetalle>();
  for (const v of data) {
    const p = v.productos;
    const existente = productos.get(p.id);
    const variante = { id: v.id, talle: v.talle, color: v.color, stock: v.stock };
    if (existente) {
      existente.variantes.push(variante);
      continue;
    }
    const fotos = [...p.producto_fotos].sort((a, b) => a.orden - b.orden);
    productos.set(p.id, {
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
      fotos: fotos.map((f) => ({ path: f.path, alt: f.alt })),
      variantes: [variante],
    });
  }
  return [...productos.values()];
}
