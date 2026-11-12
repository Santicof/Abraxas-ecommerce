import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { ListaPedidos } from "@/components/admin/pedidos";
import { listarPedidosAdmin } from "@/lib/admin/repositorio";

async function Contenido({ searchParams }: { searchParams: PageProps<"/admin/pedidos">["searchParams"] }) {
  await requireAdminPagina();
  const [sp, pedidos] = await Promise.all([searchParams, listarPedidosAdmin()]);
  const vista = sp.ver === "transferencias" ? "pago" : sp.ver === "todos" ? "todos" : "hacer";
  return <ListaPedidos pedidos={pedidos} vistaInicial={vista} />;
}

export default function PedidosPage(props: PageProps<"/admin/pedidos">) {
  return (
    <Suspense fallback={<p className="text-xl">Cargando pedidos…</p>}>
      <Contenido searchParams={props.searchParams} />
    </Suspense>
  );
}
