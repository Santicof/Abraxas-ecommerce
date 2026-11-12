// Prueba el guardado de talles/colores (upsert mixto) contra Supabase y deja todo como estaba.
// Uso: node --env-file=.env.local scripts/verificar-variantes.mjs
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: prod, error } = await db.from("productos").select("id, nombre, variantes(id, talle, color, stock)").limit(1).single();
if (error) throw error;
const originales = prod.variantes;
console.log(`Producto: ${prod.nombre} (${originales.length} variantes)`);

let fallas = 0;
const ok = (n, c, d = "") => {
  console.log(`${c ? "✔" : "✘"} ${n}${d ? ` (${d})` : ""}`);
  if (!c) fallas++;
};

const filas = (vs) => vs.map((v) => ({ ...(v.id ? { id: v.id } : {}), producto_id: prod.id, talle: v.talle, color: v.color, stock: v.stock }));

// 1) Solo stock, con el comportamiento anterior y el nuevo
const masUno = originales.map((v) => ({ ...v, stock: v.stock + 1 }));
const r1 = await db.from("variantes").upsert(filas(masUno), { onConflict: "producto_id,talle,color", defaultToNull: false });
ok("Cambiar stock", !r1.error, r1.error?.message);

// 2) Agregar un talle nuevo junto a los existentes
const nueva = { talle: "PRUEBA", color: "Prueba", stock: 3 };
const r2a = await db.from("variantes").upsert(filas([...originales, nueva]), { onConflict: "producto_id,talle,color" });
ok("Antes: agregar talle falla (bug reproducido)", !!r2a.error, r2a.error?.message);
const r2 = await db.from("variantes").upsert(filas([...originales, nueva]), { onConflict: "producto_id,talle,color", defaultToNull: false });
ok("Ahora: agregar talle funciona", !r2.error, r2.error?.message);

// Restaurar
await db.from("variantes").delete().eq("producto_id", prod.id).eq("talle", "PRUEBA");
const r3 = await db.from("variantes").upsert(filas(originales), { onConflict: "producto_id,talle,color", defaultToNull: false });
const { data: fin } = await db.from("variantes").select("id, stock").eq("producto_id", prod.id);
const igual = fin.length === originales.length && originales.every((o) => fin.find((f) => f.id === o.id)?.stock === o.stock);
ok("Datos restaurados", !r3.error && igual);

process.exit(fallas ? 1 : 0);
