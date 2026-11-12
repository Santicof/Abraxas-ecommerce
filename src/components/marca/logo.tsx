import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { store } from "@/config/store";
import { cn } from "@/lib/utils";
import { LogoTexto } from "./logo-texto";

type Props = {
  variante?: "oscuro" | "claro";
  className?: string;
  prioridad?: boolean;
  /** Para tests: fuerza la ruta del archivo de logo. */
  src?: string;
};

function existeEnPublic(src: string) {
  return existsSync(join(process.cwd(), "public", src));
}

export function Logo({ variante = "oscuro", className, prioridad = false, src }: Props) {
  const archivo = src ?? (variante === "claro" ? store.logo.srcClaro : store.logo.src);

  if (existeEnPublic(archivo)) {
    return (
      <Image
        src={archivo}
        alt={store.nombre}
        width={store.logo.ancho}
        height={store.logo.alto}
        priority={prioridad}
        unoptimized={archivo.endsWith(".svg")}
        className={cn("h-9 w-auto", className)}
      />
    );
  }

  return <LogoTexto variante={variante} className={className} />;
}

export { LogoTexto };
