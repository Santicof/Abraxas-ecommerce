import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/util";
import type { Configuracion, ZonaEnvio } from "@/lib/datos/configuracion";
import { mapearConfiguracion } from "@/lib/datos/configuracion";
import type { Json } from "@/lib/supabase/database.types";
import { estadoDemo } from "./demo-estado";
import {
  slugUnico,
  type CategoriaAdmin,
  type EstadoPedido,
  type PedidoAdmin,
  type ProductoAdmin,
  type VarianteAdmin,
} from "./tipos";

export type DatosProducto = Omit<ProductoAdmin, "id" | "slug" | "createdAt"> & { id?: string };

const demo = () => !supabaseConfigurado();
const nuevoId = () => crypto.randomUUID();

function falla(contexto: string, error: { message: string } | null): never {
  throw new Error(`${contexto}: ${error?.message ?? "error desconocido"}`);
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export async function listarProductosAdmin(): Promise<ProductoAdmin[]> {
  if (demo()) return structuredClone(estadoDemo().productos).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const db = await createClient();
  const { data, error } = await db
    .from("productos")
    .select("*, producto_fotos(path, alt, orden), variantes(id, talle, color, stock)")
    .order("created_at", { ascending: false });
  if (error) falla("Listar productos", error);
  return data.map((p) => ({
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    precioOferta: p.precio_oferta,
    categoriaId: p.categoria_id,
    destacado: p.destacado,
    activo: p.activo,
    createdAt: p.created_at,
    fotos: [...p.producto_fotos].sort((a, b) => a.orden - b.orden).map((f) => ({ path: f.path, alt: f.alt })),
    variantes: p.variantes,
  }));
}

export async function obtenerProductoAdmin(id: string): Promise<ProductoAdmin | null> {
  return (await listarProductosAdmin()).find((p) => p.id === id) ?? null;
}

export async function guardarProducto(datos: DatosProducto): Promise<ProductoAdmin> {
  if (demo()) {
    const estado = estadoDemo();
    const existente = datos.id ? estado.productos.find((p) => p.id === datos.id) : undefined;
    const usados = new Set(estado.productos.filter((p) => p.id !== datos.id).map((p) => p.slug));
    const producto: ProductoAdmin = {
      ...datos,
      id: existente?.id ?? nuevoId(),
      slug: existente && existente.nombre === datos.nombre ? existente.slug : slugUnico(datos.nombre, usados),
      createdAt: existente?.createdAt ?? new Date().toISOString(),
      variantes: datos.variantes.map((v) => ({ ...v, id: v.id ?? nuevoId() })),
    };
    if (existente) Object.assign(existente, producto);
    else estado.productos.unshift(producto);
    return structuredClone(producto);
  }

  const db = await createClient();
  let id = datos.id;
  let slug: string;

  if (id) {
    const { data: actual, error } = await db.from("productos").select("slug, nombre").eq("id", id).single();
    if (error) falla("Leer producto", error);
    slug = actual.nombre === datos.nombre ? actual.slug : await slugLibre(db, datos.nombre, id);
    const { error: e2 } = await db
      .from("productos")
      .update({
        nombre: datos.nombre,
        slug,
        descripcion: datos.descripcion,
        precio: datos.precio,
        precio_oferta: datos.precioOferta,
        categoria_id: datos.categoriaId,
        destacado: datos.destacado,
        activo: datos.activo,
      })
      .eq("id", id);
    if (e2) falla("Guardar producto", e2);
  } else {
    slug = await slugLibre(db, datos.nombre);
    const { data, error } = await db
      .from("productos")
      .insert({
        nombre: datos.nombre,
        slug,
        descripcion: datos.descripcion,
        precio: datos.precio,
        precio_oferta: datos.precioOferta,
        categoria_id: datos.categoriaId,
        destacado: datos.destacado,
        activo: datos.activo,
      })
      .select("id")
      .single();
    if (error) falla("Crear producto", error);
    id = data.id;
  }

  // Fotos: se reemplaza el orden completo.
  const { error: eDelFotos } = await db.from("producto_fotos").delete().eq("producto_id", id);
  if (eDelFotos) falla("Actualizar fotos", eDelFotos);
  if (datos.fotos.length) {
    const { error } = await db
      .from("producto_fotos")
      .insert(datos.fotos.map((f, orden) => ({ producto_id: id, path: f.path, alt: f.alt || datos.nombre, orden })));
    if (error) falla("Guardar fotos", error);
  }

  await sincronizarVariantes(db, id, datos.variantes);
  return (await obtenerProductoAdmin(id))!;
}

type Db = Awaited<ReturnType<typeof createClient>>;

async function slugLibre(db: Db, nombre: string, excepto?: string) {
  const { data, error } = await db.from("productos").select("id, slug");
  if (error) falla("Leer slugs", error);
  return slugUnico(nombre, new Set(data.filter((p) => p.id !== excepto).map((p) => p.slug)));
}

/** Actualiza stock de las variantes existentes, crea las nuevas y borra las que se quitaron (si no tienen pedidos). */
async function sincronizarVariantes(db: Db, productoId: string, variantes: VarianteAdmin[]) {
  const { data: actuales, error } = await db.from("variantes").select("id, talle, color").eq("producto_id", productoId);
  if (error) falla("Leer variantes", error);
  const clave = (v: { talle: string; color: string }) => `${v.talle}|${v.color}`;
  const porClave = new Map(actuales.map((v) => [clave(v), v.id]));
  const deseadas = new Set(variantes.map(clave));

  const filas = variantes.map((v) => ({
    ...(porClave.has(clave(v)) ? { id: porClave.get(clave(v)) } : {}),
    producto_id: productoId,
    talle: v.talle,
    color: v.color,
    stock: v.stock,
  }));
  // defaultToNull: false → las filas nuevas (sin id) usan el default de la columna en vez de null.
  const { error: eUp } = await db.from("variantes").upsert(filas, { onConflict: "producto_id,talle,color", defaultToNull: false });
  if (eUp) falla("Guardar talles y colores", eUp);

  const sobrantes = actuales.filter((v) => !deseadas.has(clave(v))).map((v) => v.id);
  if (sobrantes.length) {
    // Las variantes con pedidos quedan referenciadas como null en pedido_items (on delete set null).
    const { error: eDel } = await db.from("variantes").delete().in("id", sobrantes);
    if (eDel) falla("Quitar talles y colores", eDel);
  }
}

export async function cambiarVisibilidad(id: string, activo: boolean) {
  if (demo()) {
    const p = estadoDemo().productos.find((x) => x.id === id);
    if (p) p.activo = activo;
    return;
  }
  const db = await createClient();
  const { error } = await db.from("productos").update({ activo }).eq("id", id);
  if (error) falla("Cambiar visibilidad", error);
}

export async function actualizarStockYPrecio(id: string, cambios: { precio?: number; stock?: { talle: string; color: string; stock: number }[] }) {
  const producto = await obtenerProductoAdmin(id);
  if (!producto) throw new Error("Producto no encontrado");
  const variantes = producto.variantes.map((v) => {
    const nuevo = cambios.stock?.find((s) => s.talle === v.talle && s.color === v.color);
    return nuevo ? { ...v, stock: nuevo.stock } : v;
  });
  const precio = cambios.precio ?? producto.precio;
  const precioOferta = producto.precioOferta !== null && producto.precioOferta < precio ? producto.precioOferta : null;
  return guardarProducto({ ...producto, precio, precioOferta, variantes });
}

export async function duplicarProducto(id: string): Promise<ProductoAdmin> {
  const original = await obtenerProductoAdmin(id);
  if (!original) throw new Error("Producto no encontrado");
  return guardarProducto({
    ...original,
    id: undefined,
    nombre: `Copia de ${original.nombre}`,
    activo: false,
    destacado: false,
    variantes: original.variantes.map(({ talle, color, stock }) => ({ talle, color, stock })),
  });
}

const ESTADOS_CERRADOS: EstadoPedido[] = ["cancelado", "entregado"];

/**
 * Borra el producto. Si está en pedidos en curso sólo lo oculta (el pedido necesita sus talles para
 * descontar o reponer stock) y devuelve los números de esos pedidos. Los pedidos cerrados guardan
 * nombre, talle, color, foto y precio propios, así que no impiden borrar.
 */
export async function borrarProducto(id: string): Promise<{ resultado: "borrado" } | { resultado: "ocultado"; pedidos: number[] }> {
  if (demo()) {
    const estado = estadoDemo();
    const p = estado.productos.find((x) => x.id === id);
    const abiertos = p
      ? estado.pedidos.filter((o) => !ESTADOS_CERRADOS.includes(o.estado) && o.items.some((i) => i.nombre === p.nombre)).map((o) => o.numero)
      : [];
    if (p && abiertos.length) {
      p.activo = false;
      return { resultado: "ocultado", pedidos: abiertos };
    }
    estado.productos = estado.productos.filter((x) => x.id !== id);
    return { resultado: "borrado" };
  }
  const db = await createClient();
  const { data, error } = await db
    .from("pedido_items")
    .select("pedidos!inner(numero, estado)")
    .eq("producto_id", id)
    .not("pedidos.estado", "in", `(${ESTADOS_CERRADOS.join(",")})`);
  if (error) falla("Revisar pedidos", error);
  const abiertos = [...new Set(data.map((i) => i.pedidos.numero))].sort((a, b) => a - b);
  if (abiertos.length) {
    await cambiarVisibilidad(id, false);
    return { resultado: "ocultado", pedidos: abiertos };
  }
  const { error: eDel } = await db.from("productos").delete().eq("id", id);
  if (eDel) falla("Borrar producto", eDel);
  return { resultado: "borrado" };
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export async function listarCategoriasAdmin(): Promise<CategoriaAdmin[]> {
  if (demo()) {
    const { categorias, productos } = estadoDemo();
    return categorias
      .map((c) => ({ ...c, cantidadProductos: productos.filter((p) => p.categoriaId === c.id).length }))
      .sort((a, b) => a.orden - b.orden);
  }
  const db = await createClient();
  const { data, error } = await db.from("categorias").select("*, productos(count)").order("orden");
  if (error) falla("Listar categorías", error);
  return data.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    slug: c.slug,
    orden: c.orden,
    activa: c.activa,
    cantidadProductos: (c.productos as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function crearCategoria(nombre: string) {
  const actuales = await listarCategoriasAdmin();
  const slug = slugUnico(nombre, new Set(actuales.map((c) => c.slug)));
  const orden = Math.max(0, ...actuales.map((c) => c.orden)) + 1;
  if (demo()) {
    estadoDemo().categorias.push({ id: nuevoId(), nombre, slug, orden, activa: true });
    return;
  }
  const db = await createClient();
  const { error } = await db.from("categorias").insert({ nombre, slug, orden });
  if (error) falla("Crear categoría", error);
}

export async function editarCategoria(id: string, cambios: { nombre?: string; activa?: boolean }) {
  if (demo()) {
    const c = estadoDemo().categorias.find((x) => x.id === id);
    if (c) Object.assign(c, cambios);
    return;
  }
  const db = await createClient();
  const { error } = await db.from("categorias").update(cambios).eq("id", id);
  if (error) falla("Editar categoría", error);
}

export async function moverCategoria(id: string, direccion: -1 | 1) {
  const lista = await listarCategoriasAdmin();
  const i = lista.findIndex((c) => c.id === id);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  const nuevos = lista.map((c, orden) => ({ id: c.id, orden: orden + 1 }));
  if (demo()) {
    for (const n of nuevos) {
      const c = estadoDemo().categorias.find((x) => x.id === n.id);
      if (c) c.orden = n.orden;
    }
    return;
  }
  const db = await createClient();
  for (const n of nuevos) {
    const { error } = await db.from("categorias").update({ orden: n.orden }).eq("id", n.id);
    if (error) falla("Ordenar categorías", error);
  }
}

export async function borrarCategoria(id: string): Promise<"borrada" | "tiene_productos"> {
  const c = (await listarCategoriasAdmin()).find((x) => x.id === id);
  if (!c) return "borrada";
  if (c.cantidadProductos > 0) return "tiene_productos";
  if (demo()) {
    estadoDemo().categorias = estadoDemo().categorias.filter((x) => x.id !== id);
    return "borrada";
  }
  const db = await createClient();
  const { error } = await db.from("categorias").delete().eq("id", id);
  if (error) falla("Borrar categoría", error);
  return "borrada";
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

export async function leerConfiguracionAdmin(): Promise<{ config: Configuracion; zonas: ZonaEnvio[] }> {
  if (demo()) {
    const e = estadoDemo();
    return { config: structuredClone(e.config), zonas: structuredClone(e.zonas) };
  }
  const db = await createClient();
  const [{ data: c, error: e1 }, { data: z, error: e2 }] = await Promise.all([
    db.from("configuracion").select("*").eq("id", 1).single(),
    db.from("zonas_envio").select("*").order("orden"),
  ]);
  if (e1) falla("Leer configuración", e1);
  if (e2) falla("Leer zonas", e2);
  return { config: mapearConfiguracion(c), zonas: z };
}

export async function guardarConfiguracion(config: Configuracion, zonas: Pick<ZonaEnvio, "id" | "costo">[]) {
  if (demo()) {
    const e = estadoDemo();
    e.config = structuredClone(config);
    for (const z of zonas) {
      const zona = e.zonas.find((x) => x.id === z.id);
      if (zona) zona.costo = z.costo;
    }
    return;
  }
  const db = await createClient();
  const { error } = await db
    .from("configuracion")
    .update({
      whatsapp: config.whatsapp,
      transferencia: config.transferencia as unknown as Json,
      envio_gratis_desde: config.envioGratisDesde,
      envio_nacional_modo: config.envioNacionalModo,
      envio_nacional_costo: config.envioNacionalCosto,
      banner: config.banner as unknown as Json,
      politica_cambios: config.politicaCambios,
    })
    .eq("id", 1);
  if (error) falla("Guardar configuración", error);
  for (const z of zonas) {
    const { error: ez } = await db.from("zonas_envio").update({ costo: z.costo }).eq("id", z.id);
    if (ez) falla("Guardar zonas", ez);
  }
}

// ---------------------------------------------------------------------------
// Pedidos (lectura; los cambios con efectos de stock van por funciones SQL)
// ---------------------------------------------------------------------------

export async function listarPedidosAdmin(): Promise<PedidoAdmin[]> {
  if (demo()) return structuredClone(estadoDemo().pedidos).sort((a, b) => b.numero - a.numero);
  const db = await createClient();
  const { data, error } = await db
    .from("pedidos")
    .select("*, pedido_items(nombre, talle, color, foto_path, precio_unitario, cantidad), pedido_eventos(estado, nota, created_at)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) falla("Listar pedidos", error);
  return data.map((p) => ({
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    creadoEn: p.created_at,
    cliente: { nombre: p.cliente_nombre, email: p.cliente_email, telefono: p.cliente_telefono },
    entrega: p.metodo_entrega,
    direccion: (p.direccion as Record<string, string> | null) ?? null,
    zonaEnvio: p.zona_envio,
    costoEnvio: p.costo_envio,
    subtotal: p.subtotal,
    total: p.total,
    pago: p.metodo_pago,
    mpPaymentId: p.mp_payment_id,
    revision: p.revision,
    seguimiento: p.seguimiento,
    items: p.pedido_items.map((i) => ({
      nombre: i.nombre,
      talle: i.talle,
      color: i.color,
      foto: i.foto_path,
      precioUnitario: i.precio_unitario,
      cantidad: i.cantidad,
    })),
    eventos: [...p.pedido_eventos]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((e) => ({ estado: e.estado, nota: e.nota, fecha: e.created_at })),
  }));
}

export async function obtenerPedidoAdmin(id: string): Promise<PedidoAdmin | null> {
  return (await listarPedidosAdmin()).find((p) => p.id === id) ?? null;
}

/** Sólo para modo demo: aplica un cambio de estado en memoria (con reposición/descuento simulados). */
export function cambiarEstadoDemo(id: string, estado: EstadoPedido, nota?: string, seguimiento?: string) {
  const p = estadoDemo().pedidos.find((x) => x.id === id);
  if (!p) return;
  p.estado = estado;
  if (seguimiento !== undefined) p.seguimiento = seguimiento || null;
  p.revision = null;
  p.eventos.push({ estado, nota: nota ?? null, fecha: new Date().toISOString() });
}
