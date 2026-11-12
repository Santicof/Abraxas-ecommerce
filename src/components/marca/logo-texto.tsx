import { store } from "@/config/store";
import { cn } from "@/lib/utils";

/** Nombre de la marca en texto con la "X" destacada (respaldo del logo y uso en el panel). */
export function LogoTexto({ variante = "oscuro", className }: { variante?: "oscuro" | "claro"; className?: string }) {
  const nombre = store.nombre;
  const i = nombre.toLowerCase().indexOf("x");
  const color = variante === "claro" ? "text-white" : "text-foreground";

  return (
    <span className={cn("font-heading text-3xl leading-none", color, className)} aria-label={nombre} role="img">
      {i >= 0 ? (
        <>
          {nombre.slice(0, i)}
          <span className="font-script text-[1.25em] text-marca">{nombre[i].toUpperCase()}</span>
          {nombre.slice(i + 1)}
        </>
      ) : (
        nombre
      )}
    </span>
  );
}
