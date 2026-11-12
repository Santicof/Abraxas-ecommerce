import type { Metadata } from "next";
import { CarritoCliente } from "@/components/tienda/carrito-cliente";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default async function CarritoPage() {
  const { whatsapp } = await obtenerConfiguracion();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-3xl md:text-4xl">Tu carrito</h1>
      <CarritoCliente whatsapp={whatsapp} />
    </div>
  );
}
