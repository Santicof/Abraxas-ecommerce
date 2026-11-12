// Prueba el enlace de acceso directo al panel contra el sitio publicado.
// Uso: node --env-file=.env.local scripts/verificar-enlace.mjs https://abraxas-monte-grande.vercel.app
const sitio = process.argv[2] ?? "http://localhost:3000";
const k = process.env.PANEL_ENLACE;

let fallas = 0;
const ok = (n, c, d = "") => {
  console.log(`${c ? "✔" : "✘"} ${n}${d ? ` (${d})` : ""}`);
  if (!c) fallas++;
};

const malo = await fetch(`${sitio}/admin/entrar?k=inventado-123456789012345`, { redirect: "manual" });
ok("Código inventado manda al login", malo.status === 307 && malo.headers.get("location")?.endsWith("/admin/login"), malo.status);

const bueno = await fetch(`${sitio}/admin/entrar?k=${encodeURIComponent(k)}`, { redirect: "manual" });
const cookies = bueno.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
ok("Código correcto entra al panel", bueno.status === 307 && bueno.headers.get("location")?.endsWith("/admin") && cookies.includes("sb-"), bueno.status);

const panel = await fetch(`${sitio}/admin`, { headers: { cookie: cookies }, redirect: "manual" });
const html = await panel.text();
ok("Con esa sesión ve el panel", panel.status === 200 && html.includes("¿Qué querés hacer hoy?"), panel.status);

console.log(fallas ? `\n${fallas} fallaron` : `\nEl enlace funciona:\n${sitio}/admin/entrar?k=${k}`);
process.exit(fallas ? 1 : 0);
