// Alta y baja de cuentas para el panel.
// Crear:  pnpm admin:crear correo@ejemplo.com "Nombre"       (genera una contraseña y la muestra una sola vez)
// Borrar: pnpm admin:crear --borrar correo@ejemplo.com
// Opcional: --sin-permiso crea la cuenta sin acceso al panel (sólo para pruebas).
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const args = process.argv.slice(2);
const borrar = args.includes("--borrar");
const sinPermiso = args.includes("--sin-permiso");
const [email, nombre = ""] = args.filter((a) => !a.startsWith("--"));

if (!email?.includes("@")) {
  console.error('Uso: pnpm admin:crear correo@ejemplo.com "Nombre"');
  process.exit(1);
}

async function buscar(correo) {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === correo.toLowerCase());
    if (u || data.users.length < 200) return u ?? null;
  }
}

if (borrar) {
  const u = await buscar(email);
  if (u) await db.auth.admin.deleteUser(u.id);
  console.log(u ? `Cuenta ${email} borrada.` : `No existe ${email}.`);
  process.exit(0);
}

// Contraseña fácil de dictar por teléfono: 3 bloques de letras y números sin caracteres confusos.
const alfabeto = "abcdefghjkmnpqrstuvwxyz23456789";
const bloque = () => [...randomBytes(4)].map((b) => alfabeto[b % alfabeto.length]).join("");
const clave = `${bloque()}-${bloque()}-${bloque()}`;

let usuario = await buscar(email);
if (usuario) {
  await db.auth.admin.updateUserById(usuario.id, { password: clave });
} else {
  const { data, error } = await db.auth.admin.createUser({ email, password: clave, email_confirm: true });
  if (error) throw error;
  usuario = data.user;
}

if (!sinPermiso) {
  const { error } = await db.from("admins").upsert({ user_id: usuario.id, nombre });
  if (error) throw error;
}

console.log(`\nCuenta lista${sinPermiso ? " (SIN permiso de panel)" : ""}:`);
console.log(`  Email:      ${email}`);
console.log(`  Contraseña: ${clave}`);
console.log("\nAnotala ahora: no se vuelve a mostrar. Si se la olvida, puede usar \"Mandarme un enlace por email\".");
