import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { GestionCategorias } from "@/components/admin/gestion-categorias";
import { listarCategoriasAdmin } from "@/lib/admin/repositorio";

async function Contenido() {
  await requireAdminPagina();
  return <GestionCategorias categorias={await listarCategoriasAdmin()} />;
}

export default function CategoriasPage() {
  return (
    <Suspense fallback={<p className="text-xl">Cargando…</p>}>
      <Contenido />
    </Suspense>
  );
}
