import type { Metadata } from "next";
import { CheckoutCliente } from "@/components/tienda/checkout-cliente";
import { obtenerConfiguracion, obtenerZonasEnvio } from "@/lib/datos/configuracion";
import { supabaseConfigurado } from "@/lib/supabase/util";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const [config, zonas] = await Promise.all([obtenerConfiguracion(), obtenerZonasEnvio()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-3xl md:text-4xl">Finalizar compra</h1>
      <CheckoutCliente
        config={config}
        zonas={zonas}
        demo={!supabaseConfigurado()}
        mercadoPago={Boolean(process.env.MP_ACCESS_TOKEN)}
      />
    </div>
  );
}
