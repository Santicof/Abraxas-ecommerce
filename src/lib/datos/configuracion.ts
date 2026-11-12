import { cacheLife, cacheTag } from "next/cache";
import { store } from "@/config/store";
import { estadoDemo } from "@/lib/admin/demo-estado";
import { createPublicClient } from "@/lib/supabase/public";
import type { Enums, Json } from "@/lib/supabase/database.types";
import { supabaseConfigurado } from "@/lib/supabase/util";
import { TAGS } from "./tags";

export type Transferencia = { alias: string; cbu: string; titular: string };
export type Banner = { titulo: string; subtitulo: string; imagen: string };

export type Configuracion = {
  whatsapp: string;
  transferencia: Transferencia;
  envioGratisDesde: number | null;
  envioNacionalModo: Enums<"envio_nacional_modo">;
  envioNacionalCosto: number | null;
  banner: Banner;
  politicaCambios: string;
};

export type ZonaEnvio = { id: string; nombre: string; costo: number; localidades: string[]; orden: number; activa: boolean };

const CONFIG_POR_DEFECTO: Configuracion = {
  whatsapp: store.contacto.whatsapp,
  transferencia: { alias: "", cbu: "", titular: "" },
  envioGratisDesde: null,
  envioNacionalModo: "a_cotizar",
  envioNacionalCosto: null,
  banner: { titulo: "Nueva temporada", subtitulo: store.eslogan, imagen: "/brand/banner.jpg" },
  politicaCambios: "",
};

function objeto(json: Json): Record<string, unknown> {
  return json && typeof json === "object" && !Array.isArray(json) ? json : {};
}

const texto = (v: unknown, defecto = "") => (typeof v === "string" ? v : defecto);

export function mapearConfiguracion(fila: {
  whatsapp: string;
  transferencia: Json;
  envio_gratis_desde: number | null;
  envio_nacional_modo: Enums<"envio_nacional_modo">;
  envio_nacional_costo: number | null;
  banner: Json;
  politica_cambios: string;
}): Configuracion {
  const t = objeto(fila.transferencia);
  const b = objeto(fila.banner);
  return {
    whatsapp: fila.whatsapp || CONFIG_POR_DEFECTO.whatsapp,
    transferencia: { alias: texto(t.alias), cbu: texto(t.cbu), titular: texto(t.titular) },
    envioGratisDesde: fila.envio_gratis_desde,
    envioNacionalModo: fila.envio_nacional_modo,
    envioNacionalCosto: fila.envio_nacional_costo,
    banner: {
      titulo: texto(b.titulo, CONFIG_POR_DEFECTO.banner.titulo),
      subtitulo: texto(b.subtitulo, CONFIG_POR_DEFECTO.banner.subtitulo),
      imagen: texto(b.imagen) || CONFIG_POR_DEFECTO.banner.imagen,
    },
    politicaCambios: fila.politica_cambios,
  };
}

export async function obtenerConfiguracion(): Promise<Configuracion> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.config);

  if (!supabaseConfigurado()) return structuredClone(estadoDemo().config);

  const { data, error } = await createPublicClient().from("configuracion").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`No se pudo leer la configuración: ${error.message}`);
  return data ? mapearConfiguracion(data) : CONFIG_POR_DEFECTO;
}

export async function obtenerZonasEnvio(): Promise<ZonaEnvio[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.config);

  if (!supabaseConfigurado()) return structuredClone(estadoDemo().zonas.filter((z) => z.activa));

  const { data, error } = await createPublicClient()
    .from("zonas_envio")
    .select("*")
    .eq("activa", true)
    .order("orden");
  if (error) throw new Error(`No se pudieron leer las zonas de envío: ${error.message}`);
  return data;
}
