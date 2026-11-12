import { IconoWhatsApp } from "@/components/marca/iconos";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { enlaceWhatsApp, mensajes } from "@/lib/whatsapp";

export async function WhatsAppFlotante() {
  const { whatsapp } = await obtenerConfiguracion();
  if (!whatsapp) return null;

  return (
    <a
      href={enlaceWhatsApp(whatsapp, mensajes.saludo())}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed right-4 bottom-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
    >
      <IconoWhatsApp className="size-8" />
    </a>
  );
}
