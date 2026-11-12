// Prueba las funciones SQL de pedidos contra la base real y limpia todo al terminar.
// Uso: pnpm db:verificar-pedidos
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let fallas = 0;
const ok = (nombre, cond, detalle = "") => {
  console.log(`${cond ? "✔" : "✘"} ${nombre}${detalle ? ` (${detalle})` : ""}`);
  if (!cond) fallas++;
};

const { data: variante } = await db.from("variantes").select("id, stock, producto_id").gt("stock", 0).limit(1).single();
const stockInicial = variante.stock;
const creados = [];

async function crearPedido(cantidad, total = 1000 * cantidad) {
  const { data: p, error } = await db
    .from("pedidos")
    .insert({
      cliente_nombre: "Prueba automática",
      cliente_email: "prueba@example.com",
      cliente_telefono: "1100000000",
      metodo_entrega: "retiro",
      subtotal: total,
      total,
      metodo_pago: "transferencia",
    })
    .select("id")
    .single();
  if (error) throw error;
  creados.push(p.id);
  await db.from("pedido_items").insert({
    pedido_id: p.id,
    variante_id: variante.id,
    producto_id: variante.producto_id,
    nombre: "Prueba",
    talle: "M",
    color: "Negro",
    precio_unitario: 1000,
    cantidad,
  });
  return p.id;
}
const stockActual = async () => (await db.from("variantes").select("stock").eq("id", variante.id).single()).data.stock;

try {
  const p1 = await crearPedido(1);
  const r1 = await db.rpc("confirmar_pago", { p_pedido_id: p1, p_payment_id: `test-${p1}`, p_monto: 1000 });
  ok("Confirmar pago descuenta stock", r1.data === "pagado" && (await stockActual()) === stockInicial - 1, r1.data);

  const r2 = await db.rpc("confirmar_pago", { p_pedido_id: p1, p_payment_id: `test-${p1}`, p_monto: 1000 });
  ok("Notificación repetida no descuenta dos veces", r2.data === "ya_procesado" && (await stockActual()) === stockInicial - 1, r2.data);

  const p2 = await crearPedido(1);
  const r3 = await db.rpc("confirmar_pago", { p_pedido_id: p2, p_payment_id: `test-${p2}`, p_monto: 5 });
  ok("Monto distinto queda para revisar", r3.data === "revision_monto", r3.data);

  const p3 = await crearPedido(stockInicial + 50);
  const r4 = await db.rpc("confirmar_pago", { p_pedido_id: p3, p_monto: 1000 * (stockInicial + 50) });
  const { data: ped3 } = await db.from("pedidos").select("estado, revision").eq("id", p3).single();
  ok("Sin stock suficiente: no deja stock negativo y marca revisión", r4.data === "revision_stock" && ped3.revision === "Revisar stock" && (await stockActual()) >= 0, r4.data);

  const r5 = await db.rpc("cancelar_pedido", { p_pedido_id: p1 });
  ok("Cancelar repone el stock", r5.data === "cancelado" && (await stockActual()) === stockInicial, r5.data);

  const r6 = await db.rpc("cancelar_pedido", { p_pedido_id: p1 });
  ok("Cancelar dos veces no repone de más", r6.data === "ya_cancelado" && (await stockActual()) === stockInicial, r6.data);

  const { count } = await db.from("pedido_eventos").select("id", { count: "exact", head: true }).eq("pedido_id", p1);
  ok("Queda el historial del pedido", count >= 2, `${count} eventos`);
} finally {
  if (creados.length) await db.from("pedidos").delete().in("id", creados);
  await db.from("variantes").update({ stock: stockInicial }).eq("id", variante.id);
}

console.log(fallas ? `\n${fallas} verificaciones fallaron` : "\nLas funciones de pago y stock andan bien. Datos de prueba borrados.");
process.exit(fallas ? 1 : 0);
