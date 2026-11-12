import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { FormularioProducto } from "@/components/admin/formulario-producto";
import { obtenerSesionAdmin } from "@/lib/admin/auth";
import { listarCategoriasAdmin } from "@/lib/admin/repositorio";

async function Contenido() {
  await requireAdminPagina();
  const [categorias, sesion] = await Promise.all([listarCategoriasAdmin(), obtenerSesionAdmin()]);
  return <FormularioProducto categorias={categorias.filter((c) => c.activa)} demo={sesion?.demo ?? false} />;
}

export default function NuevoProductoPage() {
  return (
    <Suspense fallback={<p className="text-xl">Cargando…</p>}>
      <Contenido />
    </Suspense>
  );
}
