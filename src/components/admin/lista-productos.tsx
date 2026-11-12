"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, PackageOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  actualizarStockAccion,
  borrarProductoAccion,
  cambiarVisibilidadAccion,
  duplicarProductoAccion,
} from "@/app/admin/acciones";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { normalizarTexto } from "@/lib/catalogo/modelo";
import { stockTotalAdmin, type CategoriaAdmin, type ProductoAdmin } from "@/lib/admin/tipos";
import { formatearPrecio } from "@/lib/precio";
import { urlFoto } from "@/lib/supabase/util";
import { cn } from "@/lib/utils";
import { BotonGrande, Campo, claseEntrada, Confirmar, Contador, leerPrecio, SiNo } from "./ui";

type Filtro = "todos" | "visibles" | "ocultos" | "sin-stock";
const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "visibles", texto: "En la tienda" },
  { valor: "ocultos", texto: "Ocultos" },
  { valor: "sin-stock", texto: "Sin stock" },
];

export function ListaProductosAdmin({
  productos,
  categorias,
  filtroInicial,
}: {
  productos: ProductoAdmin[];
  categorias: CategoriaAdmin[];
  filtroInicial: Filtro;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [categoria, setCategoria] = useState("");

  const lista = useMemo(() => {
    const q = normalizarTexto(busqueda);
    return productos.filter((p) => {
      if (q && !normalizarTexto(p.nombre).includes(q)) return false;
      if (categoria && p.categoriaId !== categoria) return false;
      if (filtro === "visibles") return p.activo;
      if (filtro === "ocultos") return !p.activo;
      if (filtro === "sin-stock") return stockTotalAdmin(p) === 0;
      return true;
    });
  }, [productos, busqueda, filtro, categoria]);

  const nombreCategoria = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? "Sin categoría";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl md:text-4xl">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-marca px-5 text-lg font-bold text-marca-foreground"
        >
          <Plus className="size-6" /> Cargar nuevo
        </Link>
      </div>

      <div className="space-y-3 rounded-2xl bg-background p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar producto por nombre"
            className={cn(claseEntrada(), "pl-12")}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mostrar">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              role="radio"
              aria-checked={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
              className={cn(
                "min-h-12 rounded-full border-2 px-5 font-bold",
                filtro === f.valor ? "border-primary bg-primary text-primary-foreground" : "bg-background",
              )}
            >
              {f.texto}
            </button>
          ))}
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-label="Filtrar por categoría"
          className={claseEntrada()}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <p className="text-base text-muted-foreground">
        {lista.length} {lista.length === 1 ? "producto" : "productos"}
      </p>

      {lista.length === 0 ? (
        <div className="rounded-2xl bg-background p-8 text-center">
          <p className="text-xl font-bold">No hay productos para mostrar.</p>
          <p className="text-muted-foreground">Probá con otra búsqueda o tocá “Todos”.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {lista.map((p) => (
            <FilaProducto key={p.id} producto={p} categoria={nombreCategoria(p.categoriaId)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaProducto({ producto: p, categoria }: { producto: ProductoAdmin; categoria: string }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [borrar, setBorrar] = useState(false);
  const [stockAbierto, setStockAbierto] = useState(false);
  const total = stockTotalAdmin(p);

  const correr = (fn: () => Promise<{ ok: boolean; mensaje?: string; error?: string; datos?: { id: string } }>, despues?: (id?: string) => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.mensaje) toast.success(r.mensaje);
        despues?.(r.datos?.id);
        router.refresh();
      } else toast.error(r.error);
    });

  return (
    <li className={cn("rounded-2xl border-2 bg-background p-4 transition", pendiente && "opacity-60", !p.activo && "border-dashed")}>
      <div className="flex gap-4">
        <Link href={`/admin/productos/${p.id}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-muted md:w-28">
          <Image src={urlFoto(p.fotos[0]?.path)} alt={p.nombre} fill sizes="112px" className="object-cover" />
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <Link href={`/admin/productos/${p.id}`} className="block text-xl leading-snug font-bold hover:underline">
            {p.nombre}
          </Link>
          <p className="text-base text-muted-foreground">{categoria}</p>
          <p className="text-xl font-bold">
            {formatearPrecio(p.precioOferta ?? p.precio)}
            {p.precioOferta !== null && <s className="ml-2 text-base font-normal text-muted-foreground">{formatearPrecio(p.precio)}</s>}
          </p>
          <p className={cn("text-lg font-bold", total === 0 ? "text-destructive" : "text-foreground")}>
            {total === 0 ? "SIN STOCK" : `Quedan ${total} ${total === 1 ? "unidad" : "unidades"}`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="text-lg font-bold">¿Se ve en la tienda?</span>
        <SiNo
          etiqueta={`¿${p.nombre} se ve en la tienda?`}
          valor={p.activo}
          deshabilitado={pendiente}
          onCambio={(v) => v !== p.activo && correr(() => cambiarVisibilidadAccion(p.id, v))}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href={`/admin/productos/${p.id}`}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
        >
          <Pencil className="size-6" /> Editar
        </Link>
        <BotonGrande variante="secundario" icono={PackageOpen} onClick={() => setStockAbierto(true)}>
          Stock y precio
        </BotonGrande>
        <BotonGrande
          variante="suave"
          icono={Copy}
          className="text-base"
          onClick={() => correr(() => duplicarProductoAccion(p.id), (id) => id && router.push(`/admin/productos/${id}`))}
        >
          Hacer copia
        </BotonGrande>
        <BotonGrande variante="peligro" icono={Trash2} className="text-base" onClick={() => setBorrar(true)}>
          Borrar
        </BotonGrande>
      </div>

      <Confirmar
        abierto={borrar}
        onCerrar={() => setBorrar(false)}
        titulo={`¿Seguro que querés borrar “${p.nombre}”?`}
        descripcion="No se puede deshacer. Si sólo querés que no se vea, mejor elegí “No” en “¿Se ve en la tienda?”."
        textoSi="Sí, borrar"
        peligro
        cargando={pendiente}
        onSi={() => correr(() => borrarProductoAccion(p.id), () => setBorrar(false))}
      />

      {stockAbierto && <EditorRapido producto={p} onCerrar={() => setStockAbierto(false)} />}
    </li>
  );
}

function EditorRapido({ producto: p, onCerrar }: { producto: ProductoAdmin; onCerrar: () => void }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [stock, setStock] = useState(() => p.variantes.map((v) => ({ talle: v.talle, color: v.color, stock: v.stock })));
  const [precioTexto, setPrecioTexto] = useState(String(p.precio));
  const colores = [...new Set(stock.map((s) => s.color))];
  const precio = leerPrecio(precioTexto);

  function guardar() {
    if (!precio) {
      toast.error("Escribí el precio sin puntos, por ejemplo 25900");
      return;
    }
    start(async () => {
      const r = await actualizarStockAccion(p.id, stock, precio);
      if (r.ok) {
        toast.success(r.mensaje ?? "¡Listo!");
        router.refresh();
        onCerrar();
      } else toast.error(r.error);
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-h-[90dvh] max-w-lg gap-5 overflow-y-auto p-5">
        <DialogTitle className="pr-8 text-2xl leading-snug">{p.nombre}</DialogTitle>
        <Campo id="precio-rapido" etiqueta="Precio" ayuda="Sin puntos. Ejemplo: 25900">
          <input
            id="precio-rapido"
            inputMode="numeric"
            value={precioTexto}
            onChange={(e) => setPrecioTexto(e.target.value)}
            className={claseEntrada(precio ? undefined : "x")}
          />
        </Campo>
        <div className="space-y-4">
          <p className="text-lg font-bold">¿Cuántas unidades hay?</p>
          {colores.map((color) => (
            <div key={color} className="rounded-xl bg-arena p-3">
              <p className="mb-2 text-lg font-bold">{color}</p>
              <ul className="space-y-2">
                {stock
                  .map((s, i) => ({ ...s, i }))
                  .filter((s) => s.color === color)
                  .map((s) => (
                    <li key={s.talle} className="flex items-center justify-between gap-3">
                      <span className="text-lg">Talle {s.talle}</span>
                      <Contador
                        etiqueta={`${color} talle ${s.talle}`}
                        valor={s.stock}
                        onCambio={(v) => setStock((prev) => prev.map((x, j) => (j === s.i ? { ...x, stock: v } : x)))}
                      />
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <BotonGrande onClick={guardar} cargando={pendiente} ancho>
          Guardar
        </BotonGrande>
        <BotonGrande variante="suave" onClick={onCerrar} ancho disabled={pendiente}>
          Cancelar
        </BotonGrande>
      </DialogContent>
    </Dialog>
  );
}
