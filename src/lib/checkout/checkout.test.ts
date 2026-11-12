import { describe, expect, it } from "vitest";
import { configuracionDemo, zonasDemo } from "@/lib/catalogo/demo";
import { calcularEnvio } from "./envio";
import { esquemaCheckout, esquemaCliente, esquemaDireccion } from "./esquemas";

describe("calcularEnvio", () => {
  const config = { envioGratisDesde: 80000, envioNacionalModo: "a_cotizar" as const, envioNacionalCosto: null };

  it("retiro en el local cuesta $ 0", () => {
    expect(calcularEnvio("retiro", undefined, 10000, config, zonasDemo)).toMatchObject({ ok: true, costo: 0 });
  });

  it("aplica el costo de la zona según la localidad (sin importar tildes)", () => {
    expect(calcularEnvio("envio_zona", "luis guillon", 10000, config, zonasDemo)).toMatchObject({
      ok: true,
      costo: 3000,
      zona: "Zona 1 (cerca del local)",
    });
  });

  it("bonifica el envío desde el mínimo configurado", () => {
    expect(calcularEnvio("envio_zona", "Adrogué", 95000, config, zonasDemo)).toMatchObject({ ok: true, costo: 0, gratis: true });
  });

  it("rechaza localidades fuera de las zonas", () => {
    expect(calcularEnvio("envio_zona", "Rosario", 10000, config, zonasDemo).ok).toBe(false);
  });

  it("envío nacional a cotizar", () => {
    expect(calcularEnvio("envio_nacional", "Rosario", 10000, configuracionDemo, zonasDemo)).toMatchObject({
      ok: true,
      aCotizar: true,
    });
  });

  it("envío nacional con tarifa fija", () => {
    const fija = { ...config, envioNacionalModo: "tarifa_fija" as const, envioNacionalCosto: 9000 };
    expect(calcularEnvio("envio_nacional", "Rosario", 10000, fija, zonasDemo)).toMatchObject({ ok: true, costo: 9000 });
  });
});

describe("esquemas", () => {
  it("acepta datos válidos de clienta y normaliza el teléfono", () => {
    const r = esquemaCliente.parse({ nombre: "Sofía Pérez", email: "sofia@mail.com", telefono: "11 2345-6789" });
    expect(r.telefono).toBe("1123456789");
  });

  it("rechaza email y teléfono inválidos", () => {
    const r = esquemaCliente.safeParse({ nombre: "Sofía Pérez", email: "sofia@", telefono: "123" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["email", "telefono"]);
  });

  it("valida código postal de 4 dígitos", () => {
    const base = { calle: "Alem", numero: "100", localidad: "Monte Grande", provincia: "Buenos Aires" };
    expect(esquemaDireccion.safeParse({ ...base, codigoPostal: "1842" }).success).toBe(true);
    const mal = esquemaDireccion.safeParse({ ...base, codigoPostal: "18420" });
    expect(mal.error?.issues[0].message).toBe("Ingresá un código postal válido");
  });

  it("exige aceptar políticas y dirección si no es retiro", () => {
    const base = {
      cliente: { nombre: "Sofía Pérez", email: "sofia@mail.com", telefono: "1123456789" },
      entrega: "envio_zona",
      pago: "transferencia",
      items: [{ varianteId: "v1", cantidad: 1 }],
    };
    const sinAceptar = esquemaCheckout.safeParse({ ...base, aceptaPoliticas: false });
    expect(sinAceptar.error?.issues.map((i) => i.path.join("."))).toContain("aceptaPoliticas");

    const sinDireccion = esquemaCheckout.safeParse({ ...base, aceptaPoliticas: true });
    expect(sinDireccion.error?.issues.map((i) => i.path.join("."))).toEqual(["direccion"]);

    expect(esquemaCheckout.safeParse({ ...base, entrega: "retiro", aceptaPoliticas: true }).success).toBe(true);
  });
});
