import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, ClipboardList, ImageIcon, PackageX, Plus, type LucideIcon } from "lucide-react";
import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { listarPedidosAdmin, listarProductosAdmin } from "@/lib/admin/repositorio";
import { stockTotalAdmin } from "@/lib/admin/tipos";
import { cn } from "@/lib/utils";

async function Contenido() {
  await requireAdminPagina();
  const [productos, pedidos] = await Promise.all([listarProductosAdmin(), listarPedidosAdmin()]);
  const paraPreparar = pedidos.filter((p) => p.estado === "pagado").length;
  const transferencias = pedidos.filter((p) => p.estado === "pendiente_pago" && p.pago !== "mercadopago").length;
  const revisar = pedidos.filter((p) => p.revision);
  const sinStock = productos.filter((p) => p.activo && stockTotalAdmin(p) === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl">¡Hola! 👋</h1>
        <p className="mt-1 text-xl text-muted-foreground">¿Qué querés hacer hoy?</p>
      </div>

      {revisar.map((p) => (
        <Link
          key={p.id}
          href={`/admin/pedidos/${p.id}`}
          className="flex items-center gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-4 font-bold text-destructive"
        >
          <AlertTriangle className="size-7 shrink-0" />
          Pedido #{p.numero}: {p.revision}. Tocá para revisarlo.
        </Link>
      ))}

      <Link
        href="/admin/productos/nuevo"
        className="flex min-h-24 items-center gap-4 rounded-2xl bg-marca p-5 text-marca-foreground shadow-sm transition hover:brightness-95"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/70">
          <Plus className="size-8" />
        </span>
        <span>
          <span className="block text-2xl font-bold">Cargar producto nuevo</span>
          <span className="block text-lg">Sacale fotos con el celular y listo</span>
        </span>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tarjeta
          href="/admin/pedidos?ver=preparar"
          icono={ClipboardList}
          titulo="Pedidos para preparar"
          numero={paraPreparar}
          ayuda={paraPreparar ? "Ya están pagados" : "No hay pedidos nuevos"}
          destacar={paraPreparar > 0}
        />
        <Tarjeta
          href="/admin/pedidos?ver=transferencias"
          icono={Banknote}
          titulo="Transferencias por confirmar"
          numero={transferencias}
          ayuda="Fijate si llegó la plata y confirmalas"
          destacar={transferencias > 0}
        />
        <Tarjeta
          href="/admin/productos?ver=sin-stock"
          icono={PackageX}
          titulo="Productos sin stock"
          numero={sinStock}
          ayuda="Se ven en la tienda como agotados"
        />
        <Tarjeta href="/admin/ajustes#portada" icono={ImageIcon} titulo="Cambiar la foto de portada" ayuda="La imagen grande del inicio de la tienda" />
      </div>
    </div>
  );
}

function Tarjeta({
  href,
  icono: Icono,
  titulo,
  numero,
  ayuda,
  destacar,
}: {
  href: string;
  icono: LucideIcon;
  titulo: string;
  numero?: number;
  ayuda: string;
  destacar?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-2xl border-2 bg-background p-5 transition hover:border-foreground",
        destacar && "border-foreground",
      )}
    >
      <Icono className="size-9 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-bold">
          {titulo}
          {numero !== undefined && <span className={cn("ml-2 rounded-full px-2.5", destacar ? "bg-marca" : "bg-muted")}>{numero}</span>}
        </span>
        <span className="block text-base text-muted-foreground">{ayuda}</span>
      </span>
      <ArrowRight className="size-6 shrink-0" />
    </Link>
  );
}

export default function InicioAdmin() {
  return (
    <Suspense fallback={<p className="text-xl">Cargando…</p>}>
      <Contenido />
    </Suspense>
  );
}
