import { describe, expect, it } from "vitest";
import { tituloPagina, validarNomeSistema, validarSubtitulo } from "./marca";

describe("nome do sistema", () => {
  it("rejeita nome com menos de 2 caracteres (após espaços)", () => {
    expect(validarNomeSistema("  A ")).not.toBeNull();
  });
  it("aceita um nome de escritório comum", () => {
    expect(validarNomeSistema("Silva & Associados")).toBeNull();
  });
  it("rejeita nome com mais de 60 caracteres", () => {
    expect(validarNomeSistema("x".repeat(61))).not.toBeNull();
  });
  it("aceita subtítulo vazio e rejeita acima de 60", () => {
    expect(validarSubtitulo("")).toBeNull();
    expect(validarSubtitulo("y".repeat(61))).not.toBeNull();
  });
});

describe("título da página", () => {
  it("usa o nome configurado pelo escritório", () => {
    expect(tituloPagina("Painel", { nome: "Silva Advocacia", subtitulo: "" })).toBe("Painel — Silva Advocacia");
  });
  it("volta ao nome padrão quando não há configuração", () => {
    expect(tituloPagina("Painel", null)).toBe("Painel — Toga");
  });
});
