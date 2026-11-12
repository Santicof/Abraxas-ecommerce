// Prueba de punta a punta del acceso al panel por HTTP (sin navegador).
// Uso: node --env-file=.env.local scripts/verificar-login.mjs <email-admin> <clave-admin> <email-sin-permiso> <clave-sin-permiso>
import { createServerClient } from "@supabase/ssr";

const [emailAdmin, claveAdmin, emailComun, claveComun] = process.argv.slice(2);
const sitio = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function cookiesDeSesion(email, clave) {
  const jar = new Map();
  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (lista) => lista.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await db.auth.signInWithPassword({ email, password: clave });
  return { error, cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; ") };
}

const pedir = (ruta, cookie) => fetch(`${sitio}${ruta}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });

let fallas = 0;
const ok = (nombre, cond, detalle = "") => {
  console.log(`${cond ? "✔" : "✘"} ${nombre}${detalle ? ` (${detalle})` : ""}`);
  if (!cond) fallas++;
};

const anon = await pedir("/admin/productos");
ok("Sin sesión redirige al login", anon.status === 307 && anon.headers.get("location")?.includes("/admin/login"), anon.status);

const mala = await cookiesDeSesion(emailAdmin, "clave-incorrecta-123");
ok("Contraseña incorrecta es rechazada", Boolean(mala.error));

const comun = await cookiesDeSesion(emailComun, claveComun);
const rComun = await pedir("/admin", comun.cookie);
const htmlComun = await rComun.text();
ok(
  "Cuenta sin permiso no entra al panel",
  !htmlComun.includes("¿Qué querés hacer hoy?") && (htmlComun.includes("error=permiso") || rComun.status === 307),
  rComun.status,
);

const admin = await cookiesDeSesion(emailAdmin, claveAdmin);
ok("Administradora inicia sesión", !admin.error, admin.error?.message);
const rAdmin = await pedir("/admin", admin.cookie);
const htmlAdmin = await rAdmin.text();
ok("Administradora ve el panel", rAdmin.status === 200 && htmlAdmin.includes("¿Qué querés hacer hoy?"), rAdmin.status);

const rProd = await pedir("/admin/productos", admin.cookie);
const htmlProd = await rProd.text();
ok("Ve los productos de la base", htmlProd.includes("Jogger de gabardina con lazo"));

const robots = htmlAdmin.includes('name="robots" content="noindex');
ok("El panel no se indexa en buscadores", robots);

console.log(fallas ? `\n${fallas} verificaciones fallaron` : "\nEl acceso al panel funciona bien.");
process.exit(fallas ? 1 : 0);
