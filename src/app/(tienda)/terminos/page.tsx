import type { Metadata } from "next";
import { direccionCompleta, store } from "@/config/store";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 [&_h2]:pt-4 [&_h2]:text-xl">
      <h1 className="text-3xl md:text-4xl">Términos y condiciones</h1>
      <p>
        Este sitio pertenece a {store.nombreCompleto}, con local en {direccionCompleta()}. Al comprar aceptás estas
        condiciones.
      </p>
      <h2>Precios y stock</h2>
      <p>
        Los precios están expresados en pesos argentinos e incluyen IVA. El stock se confirma al acreditarse el pago; si
        una prenda se agota en ese momento, te contactamos para cambiarla o devolverte el dinero.
      </p>
      <h2>Pagos</h2>
      <p>
        Podés pagar con Mercado Pago, transferencia bancaria o coordinando por WhatsApp. Los pedidos por transferencia
        se reservan por 48 horas hasta recibir el comprobante.
      </p>
      <h2>Envíos y retiros</h2>
      <p>
        Podés retirar sin cargo en el local en el horario de atención. Los envíos se despachan una vez acreditado el
        pago. Los plazos son estimados y pueden variar según el correo.
      </p>
      <h2>Datos personales</h2>
      <p>
        Usamos tus datos solo para gestionar tu pedido y contactarte por él. No los compartimos con terceros salvo con
        el medio de pago o el correo cuando corresponde.
      </p>
      <h2>Botón de arrepentimiento</h2>
      <p>
        Podés revocar tu compra dentro de los 10 días corridos desde que recibiste el producto. Escribinos por WhatsApp o
        email y te indicamos cómo seguir.
      </p>
    </article>
  );
}
