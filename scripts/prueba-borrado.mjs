// Crea o limpia datos de prueba para verificar el borrado de productos con pedidos.
// Uso: node --env-file=.env.local scripts/prueba-borrado.mjs crear|limpiar
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);
const PREFIJO = "ZZ Prueba borrado";

async function crear(nombre, estado) {
  const { data: cat } = await db.from("categorias").select("id").limit(1).single();
  const { data: p, error } = await db
    .from("productos")
    .insert({ nombre: `${PREFIJO} ${nombre}`, slug: `zz-prueba-borrado-${nombre}`, precio: 1000, categoria_id: cat.id, activo: false })
    .select("id")
    .single();
  if (error) throw error;
  const { data: v } = await db.from("variantes").insert({ producto_id: p.id, talle: "U", color: "Negro", stock: 1 }).select("id").single();
  const { data: o, error: e2 } = await db
    .from("pedidos")
    .insert({ estado, cliente_nombre: "Prueba", cliente_email: "prueba@example.com", cliente_telefono: "1100000000", metodo_entrega: "retiro", subtotal: 1000, total: 1000, metodo_pago: "transferencia" })
    .select("id, numero")
    .single();
  if (e2) throw e2;
  await db.from("pedido_items").insert({ pedido_id: o.id, variante_id: v.id, producto_id: p.id, nombre: `${PREFIJO} ${nombre}`, talle: "U", color: "Negro", precio_unitario: 1000, cantidad: 1 });
  console.log(`${nombre}: producto ${p.id}, pedido #${o.numero} (${estado})`);
}

if (process.argv[2] === "crear") {
  await crear("cancelado", "cancelado");
  await crear("en-curso", "pendiente_pago");
} else {
  const { data: items } = await db.from("pedido_items").select("pedido_id").like("nombre", `${PREFIJO}%`);
  if (items?.length) await db.from("pedidos").delete().in("id", items.map((i) => i.pedido_id));
  await db.from("productos").delete().like("nombre", `${PREFIJO}%`);
  const { data: restos } = await db.from("productos").select("nombre").like("nombre", `${PREFIJO}%`);
  console.log(`Limpieza: ${items?.length ?? 0} pedidos borrados, quedan ${restos.length} productos de prueba`);
}
