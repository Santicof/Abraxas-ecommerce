import type { Metadata } from "next";
import { Dancing_Script, Nunito_Sans, Questrial } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/config/store";
import { env } from "@/lib/env";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const questrial = Questrial({
  variable: "--font-questrial",
  weight: "400",
  subsets: ["latin"],
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  weight: "600",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${store.nombreCompleto} | Ropa de mujer en ${store.local.localidad}`,
    template: `%s | ${store.nombre}`,
  },
  description: store.descripcion,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${nunito.variable} ${questrial.variable} ${dancing.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" theme="light" richColors closeButton />
      </body>
    </html>
  );
}
