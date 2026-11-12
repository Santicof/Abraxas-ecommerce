// Verifica los permisos (RLS) de la base usando sólo la clave pública, como lo haría cualquier visitante.
// Uso: pnpm db:verificar
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const db = createClient(url, key, { auth: { persistSession: false } });

let fallas = 0;
const ok = (nombre, cond, detalle = "") => {
  console.log(`${cond ? "✔" : "✘"} ${nombre}${detalle ? ` (${detalle})` : ""}`);
  if (!cond) fallas++;
};

const cat = await db.from("categorias").select("nombre").limit(1);
ok("Visitante puede leer categorías", !cat.error && cat.data.length > 0);

const ocultos = await db.from("productos").select("id").eq("activo", false);
ok("Visitante no ve productos ocultos", !ocultos.error && ocultos.data.length === 0);

const pedidos = await db.from("pedidos").select("id");
ok("Visitante no ve pedidos", !pedidos.error && pedidos.data.length === 0);

const admins = await db.from("admins").select("user_id");
ok("Visitante no ve administradoras", !admins.error && admins.data.length === 0);

const insCat = await db.from("categorias").insert({ nombre: "Prueba RLS", slug: "prueba-rls" });
ok("Visitante no puede crear categorías", Boolean(insCat.error), insCat.error?.code);

const insPed = await db.from("pedidos").insert({
  cliente_nombre: "x",
  cliente_email: "x@x.com",
  cliente_telefono: "1",
  metodo_entrega: "retiro",
  subtotal: 1,
  total: 1,
  metodo_pago: "whatsapp",
});
ok("Visitante no puede crear pedidos directo en la base", Boolean(insPed.error), insPed.error?.code);

const antes = await db.from("configuracion").select("whatsapp").single();
await db.from("configuracion").update({ whatsapp: "999" }).eq("id", 1);
const despues = await db.from("configuracion").select("whatsapp").single();
ok("Visitante no puede cambiar la configuración", antes.data?.whatsapp === despues.data?.whatsapp);

const rpc = await db.rpc("confirmar_pago", { p_pedido_id: "00000000-0000-0000-0000-000000000000" });
ok("Visitante no puede confirmar pagos", Boolean(rpc.error), rpc.error?.code);

const subida = await db.storage.from("productos").upload(`prueba-rls-${Date.now()}.webp`, new Blob(["x"], { type: "image/webp" }));
ok("Visitante no puede subir fotos", Boolean(subida.error), subida.error?.message);

console.log(fallas ? `\n${fallas} verificaciones fallaron` : "\nTodos los permisos están bien.");
process.exit(fallas ? 1 : 0);
