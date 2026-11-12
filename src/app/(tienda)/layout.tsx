import { AvisoDemo } from "@/components/tienda/aviso-demo";
import { Footer } from "@/components/tienda/footer";
import { Header } from "@/components/tienda/header";
import { WhatsAppFlotante } from "@/components/tienda/whatsapp-flotante";

export default function TiendaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AvisoDemo />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFlotante />
    </>
  );
}
