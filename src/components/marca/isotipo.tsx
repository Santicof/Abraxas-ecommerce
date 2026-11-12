import { ImageResponse } from "next/og";
import { isotipoTrazos, logoTrazos } from "@/config/logo-trazos";

/** Isotipo: la "X" amarilla del logo sobre fondo carbón. */
export function renderIsotipo(lado: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: logoTrazos.colorTexto,
          borderRadius: lado * 0.18,
        }}
      >
        <svg viewBox={isotipoTrazos.viewBox} width={lado * 0.9} height={lado * 0.9}>
          <path d={isotipoTrazos.x} fill={logoTrazos.colorX} />
        </svg>
      </div>
    ),
    { width: lado, height: lado },
  );
}
