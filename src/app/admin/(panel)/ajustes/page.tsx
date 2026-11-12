import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { FormularioAjustes } from "@/components/admin/formulario-ajustes";
import { obtenerSesionAdmin } from "@/lib/admin/auth";
import { leerConfiguracionAdmin } from "@/lib/admin/repositorio";

async function Contenido() {
  await requireAdminPagina();
  const [{ config, zonas }, sesion] = await Promise.all([leerConfiguracionAdmin(), obtenerSesionAdmin()]);
  return <FormularioAjustes config={config} zonas={zonas} demo={sesion?.demo ?? false} />;
}

export default function AjustesPage() {
  return (
    <Suspense fallback={<p className="text-xl">Cargando…</p>}>
      <Contenido />
    </Suspense>
  );
}
