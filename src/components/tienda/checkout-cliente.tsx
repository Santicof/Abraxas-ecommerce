"use client";

import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { IconoWhatsApp } from "@/components/marca/iconos";
import { useRevalidarCarrito } from "@/components/tienda/carrito-cliente";
import { crearPedido, type ResumenDemo } from "@/app/(tienda)/checkout/acciones";
import { direccionCompleta, horariosTexto } from "@/config/store";
import { lineaComprable, subtotal as calcularSubtotal } from "@/lib/carrito/logica";
import { useCarrito } from "@/lib/carrito/store";
import { calcularEnvio, type MetodoEntrega } from "@/lib/checkout/envio";
import { esquemaCliente, esquemaDireccion, PROVINCIAS } from "@/lib/checkout/esquemas";
import type { Configuracion, ZonaEnvio } from "@/lib/datos/configuracion";
import { formatearPrecio } from "@/lib/precio";
import { useHidratado } from "@/lib/use-hidratado";
import { enlaceWhatsApp, mensajes } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Pago = "mercadopago" | "transferencia" | "whatsapp";
type Errores = Record<string, string>;

const NOMBRES_ENTREGA: Record<MetodoEntrega, string> = {
  retiro: "Retiro en el local",
  envio_zona: "Envío a domicilio (zona sur)",
  envio_nacional: "Envío a todo el país",
};
const NOMBRES_PAGO: Record<Pago, string> = {
  mercadopago: "Mercado Pago (tarjetas, cuotas, dinero en cuenta)",
  transferencia: "Transferencia bancaria",
  whatsapp: "Coordinar el pago por WhatsApp",
};

function erroresDe(r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, prefijo = "") {
  const e: Errores = {};
  if (!r.success) for (const i of r.error!.issues) e[prefijo + i.path.join(".")] ??= i.message;
  return e;
}

export function CheckoutCliente({
  config,
  zonas,
  demo,
  mercadoPago,
}: {
  config: Configuracion;
  zonas: ZonaEnvio[];
  demo: boolean;
  mercadoPago: boolean;
}) {
  const hidratado = useHidratado();
  const { lineas, vaciar } = useCarrito();
  const { revalidando, cambios } = useRevalidarCarrito();
  const [paso, setPaso] = useState(1);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();
  const [resumenDemo, setResumenDemo] = useState<ResumenDemo | null>(null);

  const [cliente, setCliente] = useState({ nombre: "", email: "", telefono: "" });
  const [entrega, setEntrega] = useState<MetodoEntrega>("retiro");
  const [direccion, setDireccion] = useState({
    calle: "",
    numero: "",
    pisoDepto: "",
    localidad: "",
    partido: "",
    provincia: "Buenos Aires",
    codigoPostal: "",
    referencias: "",
  });
  const [pago, setPago] = useState<Pago>(mercadoPago || demo ? "mercadopago" : "transferencia");
  const [acepta, setAcepta] = useState(false);

  const comprables = lineas.filter(lineaComprable);
  const subtotal = calcularSubtotal(lineas);
  const envio = calcularEnvio(entrega, direccion.localidad, subtotal, config, zonas);
  const total = subtotal + (envio.ok ? envio.costo : 0);
  const aCotizar = envio.ok && envio.aCotizar;
  const localidadesZona = useMemo(
    () => zonas.flatMap((z) => z.localidades).sort((a, b) => a.localeCompare(b, "es")),
    [zonas],
  );

  if (!hidratado) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;

  if (resumenDemo) return <ConfirmacionDemo resumen={resumenDemo} config={config} />;

  if (comprables.length === 0) {
    return (
      <div className="rounded-2xl bg-arena p-10 text-center">
        <p className="text-lg font-semibold">No hay productos para comprar en tu carrito.</p>
        <Link href="/tienda" className="mt-4 inline-block font-semibold underline underline-offset-4">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  function validarPaso1() {
    const e = erroresDe(esquemaCliente.safeParse(cliente), "cliente.");
    setErrores(e);
    if (Object.keys(e).length === 0) setPaso(2);
  }

  function validarPaso2() {
    let e: Errores = {};
    if (entrega !== "retiro") e = erroresDe(esquemaDireccion.safeParse(direccion), "direccion.");
    if (!envio.ok) e["direccion.localidad"] = envio.error;
    setErrores(e);
    if (Object.keys(e).length === 0) {
      if (aCotizar && pago === "mercadopago") setPago("transferencia");
      setPaso(3);
    }
  }

  function confirmar() {
    setErrorGeneral(null);
    if (!acepta) {
      setErrores({ aceptaPoliticas: "Tenés que aceptar la política de cambios y los términos" });
      return;
    }
    startTransition(async () => {
      const r = await crearPedido({
        cliente,
        entrega,
        direccion: entrega === "retiro" ? undefined : direccion,
        pago,
        aceptaPoliticas: acepta,
        items: comprables.map((l) => ({ varianteId: l.varianteId, cantidad: l.cantidad })),
      });
      if (!r.ok) {
        setErrorGeneral(r.sinStock?.length ? `${r.error} ${r.sinStock.join(". ")}.` : r.error);
        setErrores(r.campos ?? {});
        if (r.campos && Object.keys(r.campos).some((k) => k.startsWith("cliente."))) setPaso(1);
        else if (r.campos && Object.keys(r.campos).some((k) => k.startsWith("direccion."))) setPaso(2);
        return;
      }
      if (r.tipo === "demo") {
        vaciar();
        setResumenDemo(r.resumen);
        window.scrollTo({ top: 0 });
        return;
      }
      if (pago !== "mercadopago") vaciar();
      window.location.href = r.url;
    });
  }

  const campo = (nombre: string) => errores[nombre];

  return (
    <div className="md:grid md:grid-cols-[1fr_360px] md:gap-10">
      <div className="space-y-4">
        {cambios.length > 0 && (
          <p role="status" className="rounded-lg bg-accent p-3 text-sm font-semibold">
            Actualizamos precios o stock de tu carrito. Revisá el resumen antes de confirmar.
          </p>
        )}

        <Paso numero={1} titulo="Tus datos" activo={paso === 1} completo={paso > 1} onEditar={() => setPaso(1)}>
          {paso === 1 ? (
            <div className="space-y-4">
              <Campo id="nombre" etiqueta="Nombre y apellido" error={campo("cliente.nombre")}>
                <input
                  id="nombre"
                  autoComplete="name"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                  className={claseInput(campo("cliente.nombre"))}
                />
              </Campo>
              <Campo id="email" etiqueta="Email" error={campo("cliente.email")}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={cliente.email}
                  onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                  className={claseInput(campo("cliente.email"))}
                />
              </Campo>
              <Campo id="telefono" etiqueta="Celular (WhatsApp)" ayuda="Con código de área, ej. 11 2345 6789" error={campo("cliente.telefono")}>
                <input
                  id="telefono"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={cliente.telefono}
                  onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                  className={claseInput(campo("cliente.telefono"))}
                />
              </Campo>
              <BotonPrimario onClick={validarPaso1}>Continuar</BotonPrimario>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {cliente.nombre} · {cliente.email} · {cliente.telefono}
            </p>
          )}
        </Paso>

        <Paso numero={2} titulo="Entrega" activo={paso === 2} completo={paso > 2} onEditar={paso > 2 ? () => setPaso(2) : undefined}>
          {paso === 2 && (
            <div className="space-y-4">
              <div className="space-y-2" role="radiogroup" aria-label="Método de entrega">
                {(["retiro", "envio_zona", ...(config.envioNacionalModo !== "deshabilitado" ? ["envio_nacional" as const] : [])] as MetodoEntrega[]).map(
                  (m) => (
                    <Opcion key={m} activa={entrega === m} onClick={() => setEntrega(m)} titulo={NOMBRES_ENTREGA[m]}>
                      {m === "retiro" && `Sin cargo. ${direccionCompleta()}. ${horariosTexto()}.`}
                      {m === "envio_zona" && "Monte Grande y alrededores. Costo según tu localidad."}
                      {m === "envio_nacional" &&
                        (config.envioNacionalModo === "a_cotizar"
                          ? "Por Correo Argentino o Andreani. El costo se coordina por WhatsApp."
                          : `Por Correo Argentino o Andreani: ${formatearPrecio(config.envioNacionalCosto ?? 0)}.`)}
                    </Opcion>
                  ),
                )}
              </div>
              {entrega !== "retiro" && (
                <div className="grid grid-cols-2 gap-3">
                  <Campo id="calle" etiqueta="Calle" error={campo("direccion.calle")} className="col-span-2">
                    <input id="calle" autoComplete="address-line1" value={direccion.calle} onChange={(e) => setDireccion({ ...direccion, calle: e.target.value })} className={claseInput(campo("direccion.calle"))} />
                  </Campo>
                  <Campo id="numero" etiqueta="Altura" error={campo("direccion.numero")}>
                    <input id="numero" inputMode="numeric" value={direccion.numero} onChange={(e) => setDireccion({ ...direccion, numero: e.target.value })} className={claseInput(campo("direccion.numero"))} />
                  </Campo>
                  <Campo id="piso" etiqueta="Piso / Depto (opcional)">
                    <input id="piso" autoComplete="address-line2" value={direccion.pisoDepto} onChange={(e) => setDireccion({ ...direccion, pisoDepto: e.target.value })} className={claseInput()} />
                  </Campo>
                  <Campo id="localidad" etiqueta="Localidad" error={campo("direccion.localidad")} className="col-span-2">
                    {entrega === "envio_zona" ? (
                      <select id="localidad" value={direccion.localidad} onChange={(e) => setDireccion({ ...direccion, localidad: e.target.value })} className={claseInput(campo("direccion.localidad"))}>
                        <option value="">Elegí tu localidad</option>
                        {localidadesZona.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input id="localidad" autoComplete="address-level2" value={direccion.localidad} onChange={(e) => setDireccion({ ...direccion, localidad: e.target.value })} className={claseInput(campo("direccion.localidad"))} />
                    )}
                  </Campo>
                  <Campo id="provincia" etiqueta="Provincia" error={campo("direccion.provincia")}>
                    <select id="provincia" value={direccion.provincia} onChange={(e) => setDireccion({ ...direccion, provincia: e.target.value })} className={claseInput(campo("direccion.provincia"))}>
                      {PROVINCIAS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo id="cp" etiqueta="Código postal" error={campo("direccion.codigoPostal")}>
                    <input id="cp" inputMode="numeric" maxLength={4} autoComplete="postal-code" value={direccion.codigoPostal} onChange={(e) => setDireccion({ ...direccion, codigoPostal: e.target.value })} className={claseInput(campo("direccion.codigoPostal"))} />
                  </Campo>
                  <Campo id="referencias" etiqueta="Referencias (opcional)" className="col-span-2">
                    <input id="referencias" placeholder="Entre calles, timbre, etc." value={direccion.referencias} onChange={(e) => setDireccion({ ...direccion, referencias: e.target.value })} className={claseInput()} />
                  </Campo>
                </div>
              )}
              {envio.ok && envio.gratis && <p className="text-sm font-semibold">¡Tenés envío gratis!</p>}
              <BotonPrimario onClick={validarPaso2}>Continuar</BotonPrimario>
            </div>
          )}
          {paso > 2 && (
            <p className="text-sm text-muted-foreground">
              {NOMBRES_ENTREGA[entrega]}
              {entrega !== "retiro" && ` · ${direccion.calle} ${direccion.numero}, ${direccion.localidad}`}
            </p>
          )}
        </Paso>

        <Paso numero={3} titulo="Pago" activo={paso === 3} completo={false}>
          {paso === 3 && (
            <div className="space-y-4">
              <div className="space-y-2" role="radiogroup" aria-label="Medio de pago">
                {(["mercadopago", "transferencia", "whatsapp"] as Pago[]).map((p) => {
                  const sinMP = p === "mercadopago" && !mercadoPago && !demo;
                  const deshabilitada = (p === "mercadopago" && aCotizar) || sinMP;
                  return (
                    <Opcion
                      key={p}
                      activa={pago === p}
                      deshabilitada={deshabilitada}
                      onClick={() => !deshabilitada && setPago(p)}
                      titulo={NOMBRES_PAGO[p]}
                    >
                      {p === "mercadopago" &&
                        (sinMP
                          ? "Próximamente. Por ahora pagá por transferencia o coordiná por WhatsApp."
                          : deshabilitada
                            ? "No disponible con envío a cotizar."
                            : "Te llevamos a Mercado Pago para pagar de forma segura.")}
                      {p === "transferencia" && "Te mostramos el alias y CBU al confirmar. Mandanos el comprobante por WhatsApp."}
                      {p === "whatsapp" && "Confirmamos stock y forma de pago por WhatsApp."}
                    </Opcion>
                  );
                })}
              </div>
              {campo("pago") && <p className="text-sm font-semibold text-destructive">{campo("pago")}</p>}
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
                <span>
                  Acepto la{" "}
                  <Link href="/cambios-y-devoluciones" target="_blank" className="font-semibold underline">
                    política de cambios y devoluciones
                  </Link>{" "}
                  y los{" "}
                  <Link href="/terminos" target="_blank" className="font-semibold underline">
                    términos y condiciones
                  </Link>
                  .
                </span>
              </label>
              {campo("aceptaPoliticas") && <p className="text-sm font-semibold text-destructive">{campo("aceptaPoliticas")}</p>}
              {errorGeneral && (
                <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                  {errorGeneral}
                </p>
              )}
              <BotonPrimario onClick={confirmar} disabled={enviando || revalidando}>
                {enviando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Procesando…
                  </>
                ) : pago === "mercadopago" ? (
                  `Pagar ${formatearPrecio(total)}`
                ) : (
                  "Confirmar pedido"
                )}
              </BotonPrimario>
              {demo && <p className="text-center text-xs text-muted-foreground">Modo demostración: no se cobra ni se guarda el pedido.</p>}
            </div>
          )}
        </Paso>
      </div>

      <aside className="mt-6 h-fit space-y-3 rounded-2xl bg-arena p-5 md:sticky md:top-24 md:mt-0">
        <h2 className="text-xl">Tu pedido</h2>
        <ul className="space-y-2 text-sm">
          {comprables.map((l) => (
            <li key={l.varianteId} className="flex justify-between gap-3">
              <span>
                {l.cantidad} × {l.nombre}
                <span className="block text-muted-foreground">
                  {l.talle !== "Único" && `${l.talle} · `}
                  {l.color}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{formatearPrecio(l.precio * l.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t pt-3 text-sm">
          <Fila etiqueta="Subtotal" valor={formatearPrecio(subtotal)} />
          <Fila
            etiqueta="Envío"
            valor={!envio.ok ? "—" : envio.aCotizar ? "A cotizar" : envio.gratis ? "Gratis" : envio.costo === 0 ? "Sin cargo" : formatearPrecio(envio.costo)}
          />
        </div>
        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold">{formatearPrecio(total)}</span>
        </div>
        {config.envioGratisDesde !== null && entrega === "envio_zona" && subtotal < config.envioGratisDesde && (
          <p className="text-xs text-muted-foreground">
            Sumá {formatearPrecio(config.envioGratisDesde - subtotal)} más y el envío es gratis.
          </p>
        )}
      </aside>
    </div>
  );
}

function ConfirmacionDemo({ resumen, config }: { resumen: ResumenDemo; config: Configuracion }) {
  const mensaje = mensajes.pedidoCarrito({
    lineas: resumen.lineas.map((l) => ({ ...l })),
    subtotal: resumen.subtotal,
    entrega: NOMBRES_ENTREGA[resumen.entrega as MetodoEntrega],
  });
  return (
    <div className="mx-auto max-w-xl space-y-5 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-marca">
        <Check className="size-8 text-marca-foreground" />
      </div>
      <h2 className="text-3xl">¡Gracias por tu pedido!</h2>
      <p className="text-muted-foreground">
        Pedido de ejemplo <strong className="text-foreground">#{resumen.numero}</strong> por{" "}
        <strong className="text-foreground">{formatearPrecio(resumen.total)}</strong>
        {resumen.envioACotizar && " + envío a cotizar"}.
      </p>
      {resumen.pago === "transferencia" && (
        <div className="rounded-2xl bg-arena p-5 text-left text-sm">
          <p className="font-semibold">Datos para transferir</p>
          <p>Alias: {config.transferencia.alias}</p>
          <p>CBU: {config.transferencia.cbu}</p>
          <p>Titular: {config.transferencia.titular}</p>
          <p className="mt-2 font-semibold">Monto: {formatearPrecio(resumen.total)}</p>
        </div>
      )}
      {resumen.pago === "mercadopago" && (
        <p className="rounded-2xl bg-arena p-5 text-sm">
          En la tienda real, acá te llevaríamos a Mercado Pago para pagar con tarjeta, cuotas o dinero en cuenta.
        </p>
      )}
      {config.whatsapp && (
        <a
          href={enlaceWhatsApp(config.whatsapp, resumen.pago === "transferencia" ? mensajes.comprobanteTransferencia(resumen) : mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#25D366] font-semibold text-white"
        >
          <IconoWhatsApp className="size-5" />
          {resumen.pago === "transferencia" ? "Enviar comprobante por WhatsApp" : "Avisar por WhatsApp"}
        </a>
      )}
      <p className="rounded-lg bg-accent p-3 text-xs font-semibold">Esto es una demostración: el pedido no se guardó ni se cobró.</p>
      <Link href="/tienda" className="inline-block font-semibold underline underline-offset-4">
        Seguir comprando
      </Link>
    </div>
  );
}

function Paso({
  numero,
  titulo,
  activo,
  completo,
  onEditar,
  children,
}: {
  numero: number;
  titulo: string;
  activo: boolean;
  completo: boolean;
  onEditar?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border p-5", activo && "border-foreground")}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 font-sans text-lg font-bold">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-sm",
              completo ? "bg-marca text-marca-foreground" : activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {completo ? <Check className="size-4" /> : numero}
          </span>
          {titulo}
        </h2>
        {completo && onEditar && (
          <button type="button" onClick={onEditar} className="min-h-11 px-2 text-sm font-semibold underline underline-offset-4">
            Editar
          </button>
        )}
      </div>
      {(activo || completo) && <div className="mt-4">{children}</div>}
    </section>
  );
}

function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  className,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p>}
      {error && (
        <p className="mt-1 text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const claseInput = (error?: string) =>
  cn("h-12 w-full rounded-lg border bg-background px-3 text-base", error && "border-destructive ring-2 ring-destructive/20");

function Opcion({
  activa,
  deshabilitada,
  onClick,
  titulo,
  children,
}: {
  activa: boolean;
  deshabilitada?: boolean;
  onClick: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activa}
      aria-disabled={deshabilitada}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition",
        activa ? "border-foreground bg-arena" : "hover:border-foreground",
        deshabilitada && "cursor-not-allowed opacity-50",
      )}
    >
      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2", activa && "border-foreground")}>
        {activa && <span className="size-2.5 rounded-full bg-foreground" />}
      </span>
      <span>
        <span className="block font-semibold">{titulo}</span>
        <span className="block text-sm text-muted-foreground">{children}</span>
      </span>
    </button>
  );
}

function BotonPrimario({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="font-semibold">{valor}</span>
    </div>
  );
}
