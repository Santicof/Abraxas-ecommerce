import { ImageResponse } from "next/og";
import { logoTrazos } from "@/config/logo-trazos";
import { direccionCompleta, store } from "@/config/store";

export const alt = `${store.nombreCompleto} – ${store.eslogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const anchoLogo = 760;
  const altoLogo = (anchoLogo * logoTrazos.alto) / logoTrazos.ancho;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          borderBottom: `24px solid ${logoTrazos.colorX}`,
        }}
      >
        <svg viewBox={logoTrazos.viewBox} width={anchoLogo} height={altoLogo}>
          <path d={logoTrazos.texto} fill={logoTrazos.colorTexto} />
          <path d={logoTrazos.x} fill={logoTrazos.colorX} />
        </svg>
        <div style={{ marginTop: 40, fontSize: 40, color: "#2B2B2B" }}>{store.eslogan}</div>
        <div style={{ marginTop: 12, fontSize: 28, color: "#6B6460" }}>{direccionCompleta()}</div>
      </div>
    ),
    size,
  );
}
