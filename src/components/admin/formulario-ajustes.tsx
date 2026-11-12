"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { guardarConfiguracionAccion } from "@/app/admin/acciones";
import { comprimirFoto, subirFoto } from "@/lib/admin/fotos";
import type { Configuracion, ZonaEnvio } from "@/lib/datos/configuracion";
import { formatearPrecio } from "@/lib/precio";
import { urlFoto } from "@/lib/supabase/util";
import { normalizarWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { BotonGrande, Campo, claseEntrada, leerPrecio, SiNo } from "./ui";

export function FormularioAjustes({ config, zonas, demo }: { config: Configuracion; zonas: ZonaEnvio[]; demo: boolean }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);

  const [whatsapp, setWhatsapp] = useState(config.whatsapp);
  const [transferencia, setTransferencia] = useState(config.transferencia);
  const [costos, setCostos] = useState(() => Object.fromEntries(zonas.map((z) => [z.id, String(z.costo)])));
  const [conGratis, setConGratis] = useState(config.envioGratisDesde !== null);
  const [gratisTexto, setGratisTexto] = useState(config.envioGratisDesde ? String(config.envioGratisDesde) : "80000");
  const [nacional, setNacional] = useState(config.envioNacionalModo);
  const [nacionalTexto, setNacionalTexto] = useState(config.envioNacionalCosto ? String(config.envioNacionalCosto) : "");
  const [banner, setBanner] = useState(config.banner);
  const [politica, setPolitica] = useState(config.politicaCambios);

  const waValido = !whatsapp || normalizarWhatsApp(whatsapp) !== "";

  async function cambiarPortada(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const path = await subirFoto(await comprimirFoto(archivo), demo);
      setBanner((b) => ({ ...b, imagen: path }));
      toast.success("Foto lista. Tocá “Guardar cambios” para publicarla.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }

  function guardar() {
    if (!waValido) {
      setErrores({ whatsapp: "Escribí el número con código de área, sin 0 ni 15. Ejemplo: 11 2345 6789" });
      return;
    }
    start(async () => {
      const r = await guardarConfiguracionAccion({
        whatsapp: whatsapp.trim(),
        transferencia,
        envioGratisDesde: conGratis ? leerPrecio(gratisTexto) : null,
        envioNacionalModo: nacional,
        envioNacionalCosto: nacional === "tarifa_fija" ? leerPrecio(nacionalTexto) ?? 0 : null,
        banner,
        politicaCambios: politica,
        zonas: zonas.map((z) => ({ id: z.id, costo: Number((costos[z.id] ?? "0").replace(/\D/g, "")) || 0 })),
      });
      if (r.ok) {
        setErrores({});
        toast.success(r.mensaje ?? "¡Listo!");
        router.refresh();
      } else {
        setErrores(r.campos ?? {});
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl">Datos de la tienda</h1>
        <p className="text-lg text-muted-foreground">Cambiá lo que necesites y tocá “Guardar cambios” al final.</p>
      </div>

      <Seccion titulo="WhatsApp de ventas">
        <Campo
          id="whatsapp"
          etiqueta="Número de WhatsApp"
          ayuda={waValido && whatsapp ? "✓ Número correcto. A este número escriben las clientas." : "Con código de área, sin 0 ni 15. Ejemplo: 11 2345 6789"}
          error={errores.whatsapp || (!waValido ? "Revisá el número: tiene que tener 10 números con el código de área" : undefined)}
        >
          <input id="whatsapp" type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={claseEntrada(!waValido ? "x" : undefined)} />
        </Campo>
      </Seccion>

      <Seccion titulo="Datos para transferencias">
        <Campo id="alias" etiqueta="Alias" ayuda="Ejemplo: abraxas.mg">
          <input id="alias" value={transferencia.alias} onChange={(e) => setTransferencia({ ...transferencia, alias: e.target.value })} className={claseEntrada()} />
        </Campo>
        <Campo id="cbu" etiqueta="CBU o CVU" ayuda="Son 22 números" error={errores["transferencia.cbu"]}>
          <input id="cbu" inputMode="numeric" value={transferencia.cbu} onChange={(e) => setTransferencia({ ...transferencia, cbu: e.target.value.replace(/\D/g, "") })} className={claseEntrada(errores["transferencia.cbu"])} maxLength={22} />
        </Campo>
        <Campo id="titular" etiqueta="Titular de la cuenta">
          <input id="titular" value={transferencia.titular} onChange={(e) => setTransferencia({ ...transferencia, titular: e.target.value })} className={claseEntrada()} />
        </Campo>
      </Seccion>

      <Seccion titulo="Envíos">
        <p className="text-lg font-bold">Costo del envío por zona</p>
        <ul className="space-y-4">
          {zonas.map((z) => (
            <li key={z.id} className="rounded-xl bg-arena p-4">
              <Campo id={`zona-${z.id}`} etiqueta={z.nombre} ayuda={z.localidades.join(", ")}>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold">$</span>
                  <input
                    id={`zona-${z.id}`}
                    inputMode="numeric"
                    value={costos[z.id] ?? ""}
                    onChange={(e) => setCostos({ ...costos, [z.id]: e.target.value })}
                    className={cn(claseEntrada(), "pl-9 text-xl font-bold")}
                  />
                </div>
              </Campo>
            </li>
          ))}
        </ul>

        <div className="space-y-3 border-t pt-5">
          <p className="text-lg font-bold">¿Envío gratis desde cierto monto?</p>
          <SiNo etiqueta="¿Envío gratis?" valor={conGratis} onCambio={setConGratis} />
          {conGratis && (
            <Campo id="gratis" etiqueta="Envío gratis en compras desde" ayuda={leerPrecio(gratisTexto) ? `Desde ${formatearPrecio(leerPrecio(gratisTexto)!)}` : "Sin puntos. Ejemplo: 80000"}>
              <input id="gratis" inputMode="numeric" value={gratisTexto} onChange={(e) => setGratisTexto(e.target.value)} className={claseEntrada()} />
            </Campo>
          )}
        </div>

        <fieldset className="space-y-3 border-t pt-5">
          <legend className="text-lg font-bold">Envíos al resto del país</legend>
          {(
            [
              ["a_cotizar", "Se cotiza por WhatsApp", "La clienta compra y después le pasan el costo"],
              ["tarifa_fija", "Precio fijo", "Mismo costo para todo el país"],
              ["deshabilitado", "No hacemos", "No aparece la opción en la tienda"],
            ] as const
          ).map(([valor, titulo, ayuda]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={nacional === valor}
              onClick={() => setNacional(valor)}
              className={cn("flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left", nacional === valor ? "border-foreground bg-arena" : "")}
            >
              <span className={cn("mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2", nacional === valor && "border-foreground")}>
                {nacional === valor && <span className="size-3 rounded-full bg-foreground" />}
              </span>
              <span>
                <span className="block font-bold">{titulo}</span>
                <span className="block text-base text-muted-foreground">{ayuda}</span>
              </span>
            </button>
          ))}
          {nacional === "tarifa_fija" && (
            <Campo id="nacional" etiqueta="Precio del envío a todo el país" ayuda="Sin puntos. Ejemplo: 9500">
              <input id="nacional" inputMode="numeric" value={nacionalTexto} onChange={(e) => setNacionalTexto(e.target.value)} className={claseEntrada()} />
            </Campo>
          )}
        </fieldset>
      </Seccion>

      <Seccion titulo="Foto de portada" id="portada">
        <p className="text-base text-muted-foreground">Es la imagen grande que se ve al entrar a la tienda.</p>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl bg-muted">
          <Image src={urlFoto(banner.imagen)} alt="Foto de portada" fill sizes="320px" loading="eager" className="object-cover" />
        </div>
        <label className={cn("flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-foreground text-lg font-bold hover:bg-muted", subiendo && "opacity-50")}>
          <Camera className="size-6" /> {subiendo ? "Subiendo…" : "Cambiar foto"}
          <input type="file" accept="image/*" className="sr-only" disabled={subiendo} onChange={(e) => cambiarPortada(e.target.files?.[0])} />
        </label>
        <Campo id="titulo" etiqueta="Título grande" ayuda="Ejemplo: Nueva temporada" error={errores["banner.titulo"]}>
          <input id="titulo" value={banner.titulo} onChange={(e) => setBanner({ ...banner, titulo: e.target.value })} className={claseEntrada(errores["banner.titulo"])} maxLength={80} />
        </Campo>
        <Campo id="subtitulo" etiqueta="Texto de abajo" ayuda="Una frase corta">
          <textarea
            id="subtitulo"
            rows={3}
            value={banner.subtitulo}
            onChange={(e) => setBanner({ ...banner, subtitulo: e.target.value })}
            className={cn(claseEntrada(), "h-auto py-3 leading-snug")}
            maxLength={200}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Política de cambios">
        <Campo id="politica" etiqueta="¿Cómo son los cambios?" ayuda="Se muestra en la tienda y en la compra. Ej: 30 días, sin uso y con etiqueta.">
          <textarea id="politica" rows={5} value={politica} onChange={(e) => setPolitica(e.target.value)} className={cn(claseEntrada(), "h-auto py-3")} maxLength={3000} />
        </Campo>
      </Seccion>

      <div className="sticky bottom-[84px] z-30 -mx-4 border-t bg-background/95 p-4 backdrop-blur md:bottom-0 md:mx-0 md:rounded-2xl md:border">
        <BotonGrande variante="marca" icono={Save} onClick={guardar} cargando={pendiente} disabled={subiendo} ancho>
          Guardar cambios
        </BotonGrande>
      </div>
    </div>
  );
}

function Seccion({ titulo, id, children }: { titulo: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4 rounded-2xl bg-background p-5 md:p-6">
      <h2 className="text-2xl">{titulo}</h2>
      {children}
    </section>
  );
}
