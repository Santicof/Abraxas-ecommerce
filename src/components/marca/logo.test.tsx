import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Logo } from "./logo";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));

describe("Logo", () => {
  it("muestra el archivo de logo cuando existe", () => {
    render(<Logo />);
    const img = screen.getByAltText("Abraxas");
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toBe("/brand/logo.svg");
  });

  it("muestra el nombre en texto con la X destacada si falta el archivo", () => {
    render(<Logo src="/brand/no-existe.svg" />);
    const texto = screen.getByRole("img", { name: "Abraxas" });
    expect(texto.tagName).toBe("SPAN");
    expect(texto.textContent).toBe("AbraXas");
  });
});
