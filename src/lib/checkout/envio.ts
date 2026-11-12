import type { Configuracion, ZonaEnvio } from "@/lib/datos/configuracion";
import { normalizarTexto } from "@/lib/catalogo/modelo";

export type MetodoEntrega = "retiro" | "envio_zona" | "envio_nacional";

export type ResultadoEnvio =
  | { ok: true; costo: number; gratis: boolean; zona: string | null; aCotizar: boolean }
  | { ok: false; error: string };

type ConfigEnvio = Pick<Configuracion, "envioGratisDesde" | "envioNacionalModo" | "envioNacionalCosto">;

export function zonaDeLocalidad(localidad: string, zonas: ZonaEnvio[]): ZonaEnvio | null {
  const buscada = normalizarTexto(localidad);
  return zonas.find((z) => z.activa && z.localidades.some((l) => normalizarTexto(l) === buscada)) ?? null;
}

export function calcularEnvio(
  metodo: MetodoEntrega,
  localidad: string | undefined,
  subtotal: number,
  config: ConfigEnvio,
  zonas: ZonaEnvio[],
): ResultadoEnvio {
  if (metodo === "retiro") return { ok: true, costo: 0, gratis: false, zona: null, aCotizar: false };

  const superaMinimo = config.envioGratisDesde !== null && subtotal >= config.envioGratisDesde;

  if (metodo === "envio_zona") {
    const zona = localidad ? zonaDeLocalidad(localidad, zonas) : null;
    if (!zona) return { ok: false, error: "No llegamos con envío propio a esa localidad. Elegí envío nacional o retiro en el local." };
    return superaMinimo
      ? { ok: true, costo: 0, gratis: true, zona: zona.nombre, aCotizar: false }
      : { ok: true, costo: zona.costo, gratis: false, zona: zona.nombre, aCotizar: false };
  }

  if (config.envioNacionalModo === "deshabilitado") return { ok: false, error: "Por ahora no hacemos envíos al resto del país." };
  if (config.envioNacionalModo === "a_cotizar" || config.envioNacionalCosto === null) {
    return { ok: true, costo: 0, gratis: false, zona: null, aCotizar: true };
  }
  return { ok: true, costo: config.envioNacionalCosto, gratis: false, zona: null, aCotizar: false };
}
