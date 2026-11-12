import Link from "next/link";
import { filtrosDesdeURL } from "@/lib/catalogo/modelo";
import { listarProductos } from "@/lib/datos/catalogo";
import { Filtros } from "./filtros";
import { GrillaProductos } from "./tarjeta-producto";

type SearchParams = Record<string, string | string[] | undefined>;

export async function Listado({
  titulo,
  categoria,
  searchParams,
  basePath,
}: {
  titulo: string;
  categoria?: string;
  searchParams: SearchParams;
  basePath: string;
}) {
  const filtros = { ...filtrosDesdeURL(searchParams), categoria };
  const r = await listarProductos(filtros);

  const siguiente = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string") siguiente.set(k, v);
  siguiente.set("pagina", String(r.pagina + 1));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl md:text-4xl">{titulo}</h1>
        <p className="text-sm text-muted-foreground">
          {r.total} {r.total === 1 ? "producto" : "productos"}
        </p>
      </div>
      <div className="md:grid md:grid-cols-[240px_1fr] md:gap-10">
        <div className="mb-6 md:mb-0">
          <Filtros talles={r.opciones.talles} colores={r.opciones.colores} total={r.total} />
        </div>
        <div>
          {r.productos.length > 0 ? (
            <GrillaProductos productos={r.productos} ahora={r.generadoEn} />
          ) : (
            <div className="rounded-2xl bg-arena p-10 text-center">
              <p className="text-lg font-semibold">No encontramos productos con esos filtros.</p>
              <Link href={basePath} className="mt-3 inline-block font-semibold underline underline-offset-4">
                Ver todos
              </Link>
            </div>
          )}
          {r.pagina < r.paginas && (
            <div className="mt-10 text-center">
              <Link
                href={`${basePath}?${siguiente.toString()}`}
                scroll={false}
                className="inline-flex h-12 items-center rounded-lg border border-foreground px-8 font-semibold hover:bg-muted"
              >
                Ver más productos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ListadoCargando() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 h-10 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
