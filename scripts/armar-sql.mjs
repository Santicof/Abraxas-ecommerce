// Une las migraciones y el seed en supabase/instalar.sql para pegarlo en el SQL Editor de Supabase.
// Uso: pnpm db:sql
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "supabase");
const migraciones = readdirSync(join(dir, "migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const partes = [
  "-- Instalación completa de la base de Abraxas. Generado por scripts/armar-sql.mjs: no editar a mano.",
  "-- Pegalo entero en Supabase → SQL Editor → New query y tocá Run.",
  ...migraciones.map((f) => `\n-- ===== ${f} =====\n${readFileSync(join(dir, "migrations", f), "utf8")}`),
  `\n-- ===== seed.sql =====\n${readFileSync(join(dir, "seed.sql"), "utf8")}`,
];

writeFileSync(join(dir, "instalar.sql"), partes.join("\n"));
console.log(`supabase/instalar.sql listo (${migraciones.length} migraciones + seed)`);
