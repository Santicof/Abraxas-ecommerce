import type { Metadata } from "next";
import { direccionCompleta, store } from "@/config/store";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";

export const metadata: Metadata = { title: "Cambios y devoluciones" };

export default async function CambiosPage() {
  const { politicaCambios } = await obtenerConfiguracion();
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-3xl md:text-4xl">Cambios y devoluciones</h1>
      <p className="whitespace-pre-line text-lg">
        {politicaCambios || `Consultanos por cambios en el local (${direccionCompleta()}) o por WhatsApp.`}
      </p>
      <p className="text-muted-foreground">
        Si tu compra fue online, también podés arrepentirte dentro de los 10 días corridos de recibirla (Ley 24.240 de
        Defensa del Consumidor). Escribinos y te indicamos cómo seguir. — {store.nombreCompleto}
      </p>
    </article>
  );
}
