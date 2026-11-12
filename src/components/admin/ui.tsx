"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Variante = "principal" | "marca" | "secundario" | "peligro" | "suave";

const estilos: Record<Variante, string> = {
  principal: "bg-primary text-primary-foreground hover:bg-primary/90",
  marca: "bg-marca text-marca-foreground hover:brightness-95",
  secundario: "border-2 border-foreground bg-background text-foreground hover:bg-muted",
  peligro: "border-2 border-destructive bg-background text-destructive hover:bg-destructive/10",
  suave: "bg-muted text-foreground hover:bg-border",
};

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  icono?: LucideIcon;
  cargando?: boolean;
  textoCargando?: string;
  ancho?: boolean;
};

/** Botón grande (56 px) con ícono + palabra. */
export const BotonGrande = forwardRef<HTMLButtonElement, BotonProps>(function BotonGrande(
  { variante = "principal", icono: Icono, cargando, textoCargando = "Guardando…", ancho, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || cargando}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        estilos[variante],
        ancho && "w-full",
        className,
      )}
      {...props}
    >
      {cargando ? <Loader2 className="size-6 animate-spin" /> : Icono && <Icono className="size-6 shrink-0" />}
      {cargando ? textoCargando : children}
    </button>
  );
});

/** Clases para botones en grilla de 2 columnas en celular: ícono arriba y texto en una línea. */
export const claseMosaico = "min-h-16 flex-col gap-1 px-2 py-2 text-base leading-tight whitespace-nowrap";

export function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  children,
  className,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-lg font-bold">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-base font-bold text-destructive">
          ⚠ {error}
        </p>
      ) : (
        ayuda && <p className="text-base text-muted-foreground">{ayuda}</p>
      )}
    </div>
  );
}

export const claseEntrada = (error?: string) =>
  cn(
    "h-14 w-full rounded-xl border-2 bg-background px-4 text-lg outline-none focus:border-foreground focus:ring-4 focus:ring-marca/40",
    error ? "border-destructive" : "border-input",
  );

/** Elección explícita entre dos opciones (más claro que un interruptor). */
export function SiNo({
  valor,
  onCambio,
  textoSi = "Sí",
  textoNo = "No",
  etiqueta,
  deshabilitado,
}: {
  valor: boolean;
  onCambio: (v: boolean) => void;
  textoSi?: string;
  textoNo?: string;
  etiqueta: string;
  deshabilitado?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex rounded-xl border-2 border-foreground p-1">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={valor === v}
          disabled={deshabilitado}
          onClick={() => onCambio(v)}
          className={cn(
            "min-h-12 min-w-20 rounded-lg px-4 text-lg font-bold transition disabled:opacity-50",
            valor === v ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted",
          )}
        >
          {v ? textoSi : textoNo}
        </button>
      ))}
    </div>
  );
}

/** Pregunta de confirmación en lenguaje simple. */
export function Confirmar({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  textoSi,
  onSi,
  peligro = false,
  cargando,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  textoSi: string;
  onSi: () => void;
  peligro?: boolean;
  cargando?: boolean;
}) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent showCloseButton={false} className="max-w-md gap-5 p-6">
        <DialogTitle className="text-2xl leading-snug">{titulo}</DialogTitle>
        {descripcion && <DialogDescription className="text-lg text-foreground">{descripcion}</DialogDescription>}
        <div className="flex flex-col gap-3">
          <BotonGrande variante={peligro ? "peligro" : "principal"} onClick={onSi} cargando={cargando} textoCargando="Un momento…" ancho>
            {textoSi}
          </BotonGrande>
          <BotonGrande variante="suave" onClick={onCerrar} ancho disabled={cargando}>
            No, volver
          </BotonGrande>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Contador grande con − y + para stock y cantidades. */
export function Contador({
  valor,
  onCambio,
  etiqueta,
  min = 0,
  max = 9999,
}: {
  valor: number;
  onCambio: (v: number) => void;
  etiqueta: string;
  min?: number;
  max?: number;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const fijar = (v: number) => onCambio(Math.max(min, Math.min(max, Number.isFinite(v) ? Math.floor(v) : min)));
  return (
    <div className="inline-flex items-center rounded-xl border-2 border-input bg-background">
      <button
        type="button"
        onClick={() => fijar(valor - 1)}
        disabled={valor <= min}
        aria-label={`Restar uno a ${etiqueta}`}
        className="flex size-12 items-center justify-center text-2xl font-bold disabled:opacity-30"
      >
        −
      </button>
      <input
        inputMode="numeric"
        aria-label={etiqueta}
        value={texto ?? String(valor)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setTexto(e.target.value.replace(/\D/g, ""))}
        onBlur={() => {
          if (texto !== null) fijar(Number(texto || 0));
          setTexto(null);
        }}
        className="h-12 w-14 bg-transparent text-center text-xl font-bold outline-none"
      />
      <button
        type="button"
        onClick={() => fijar(valor + 1)}
        disabled={valor >= max}
        aria-label={`Sumar uno a ${etiqueta}`}
        className="flex size-12 items-center justify-center text-2xl font-bold disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

/** Lee un número escrito por la dueña aceptando "25.900", "$25900" o "25 900". */
export function leerPrecio(texto: string): number | null {
  const limpio = texto.replace(/[^\d]/g, "");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? n : null;
}
