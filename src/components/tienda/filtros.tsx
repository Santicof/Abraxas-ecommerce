"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  talles: string[];
  colores: string[];
  total: number;
};

const ORDENES = [
  { valor: "nuevos", texto: "Más nuevos" },
  { valor: "menor-precio", texto: "Menor precio" },
  { valor: "mayor-precio", texto: "Mayor precio" },
];

export function Filtros({ talles, colores, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);

  const actual = (k: string) => params.get(k) ?? "";

  function aplicar(cambios: Record<string, string | null>) {
    const nuevos = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) nuevos.set(k, v);
      else nuevos.delete(k);
    }
    nuevos.delete("pagina");
    const qs = nuevos.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const alternar = (k: string, v: string) => aplicar({ [k]: actual(k) === v ? null : v });

  function onPrecio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    aplicar({ min: String(datos.get("min") ?? ""), max: String(datos.get("max") ?? "") });
  }

  const activos = ["talle", "color", "min", "max", "oferta"].filter((k) => params.has(k)).length;

  const contenido = (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Talle</legend>
        <div className="flex flex-wrap gap-2">
          {talles.map((t) => (
            <Chip key={t} activo={actual("talle") === t} onClick={() => alternar("talle", t)}>
              {t}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Color</legend>
        <div className="flex flex-wrap gap-2">
          {colores.map((c) => (
            <Chip key={c} activo={actual("color") === c} onClick={() => alternar("color", c)}>
              {c}
            </Chip>
          ))}
        </div>
      </fieldset>
      <form onSubmit={onPrecio} className="space-y-2" key={`${actual("min")}-${actual("max")}`}>
        <p className="text-sm font-semibold">Precio</p>
        <div className="flex items-center gap-2">
          <input
            name="min"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Desde $"
            defaultValue={actual("min")}
            aria-label="Precio desde"
            className="h-11 w-full rounded-lg border bg-background px-3"
          />
          <input
            name="max"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Hasta $"
            defaultValue={actual("max")}
            aria-label="Precio hasta"
            className="h-11 w-full rounded-lg border bg-background px-3"
          />
        </div>
        <button type="submit" className="h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-muted">
          Aplicar precio
        </button>
      </form>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={actual("oferta") === "1"}
          onChange={(e) => aplicar({ oferta: e.target.checked ? "1" : null })}
          className="size-5 accent-[var(--primary)]"
        />
        Solo ofertas
      </label>
      {activos > 0 && (
        <button
          type="button"
          onClick={() => aplicar({ talle: null, color: null, min: null, max: null, oferta: null })}
          className="inline-flex h-10 items-center gap-1 text-sm font-semibold underline underline-offset-4"
        >
          <X className="size-4" /> Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className={cn("transition-opacity", pendiente && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="flex min-w-0 flex-1 basis-full md:basis-auto"
          onSubmit={(e) => {
            e.preventDefault();
            aplicar({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() || null });
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={actual("q")}
            placeholder="Buscar: vestido, jean, campera…"
            aria-label="Buscar productos"
            className="h-11 w-full rounded-lg border bg-background px-4"
          />
        </form>

        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetTrigger className="inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold md:hidden">
            <SlidersHorizontal className="size-4" /> Filtrar{activos > 0 && ` (${activos})`}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-xl">Filtrar</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">{contenido}</div>
            <div className="sticky bottom-0 border-t bg-background p-4">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="h-12 w-full rounded-lg bg-primary font-semibold text-primary-foreground"
              >
                Ver {total} {total === 1 ? "producto" : "productos"}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <select
          aria-label="Ordenar"
          value={actual("orden") || "nuevos"}
          onChange={(e) => aplicar({ orden: e.target.value === "nuevos" ? null : e.target.value })}
          className="h-11 rounded-lg border bg-background px-3 text-sm font-semibold"
        >
          {ORDENES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      </div>

      <aside className="mt-6 hidden md:block">{contenido}</aside>
    </div>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "min-h-11 min-w-11 rounded-full border px-4 text-sm font-semibold transition",
        activo ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-foreground",
      )}
    >
      {children}
    </button>
  );
}
