import { Suspense } from "react";
import { ShellAdmin } from "@/components/admin/shell";
import { requireAdminPagina } from "@/lib/admin/auth";
import { listarPedidosAdmin } from "@/lib/admin/repositorio";
import { salirAccion } from "../sesion";

async function Panel({ children }: { children: React.ReactNode }) {
  const sesion = await requireAdminPagina();
  const pedidos = await listarPedidosAdmin();
  const nuevos = pedidos.filter((p) => p.estado === "pagado" || (p.estado === "pendiente_pago" && p.pago !== "mercadopago")).length;
  return (
    <ShellAdmin demo={sesion.demo} email={sesion.email} pedidosNuevos={nuevos} salir={salirAccion}>
      {children}
    </ShellAdmin>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-xl">Cargando el panel…</div>}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}
