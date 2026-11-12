import { notFound } from "next/navigation";
import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { DetallePedido } from "@/components/admin/pedidos";
import { obtenerPedidoAdmin } from "@/lib/admin/repositorio";

async function Contenido({ params }: { params: PageProps<"/admin/pedidos/[id]">["params"] }) {
  await requireAdminPagina();
  const { id } = await params;
  const pedido = await obtenerPedidoAdmin(id);
  if (!pedido) notFound();
  return <DetallePedido key={`${pedido.id}-${pedido.estado}`} pedido={pedido} />;
}

export default function PedidoPage(props: PageProps<"/admin/pedidos/[id]">) {
  return (
    <Suspense fallback={<p className="text-xl">Cargando pedido…</p>}>
      <Contenido params={props.params} />
    </Suspense>
  );
}
