import { describe, expect, it } from "vitest";
import { formatCEP, formatEnderecoLinha, isValidCEP } from "./endereco";

describe("endereço do cliente", () => {
  it("aplica máscara de CEP", () => {
    expect(formatCEP("01001000")).toBe("01001-000");
    expect(formatCEP("0100")).toBe("0100");
  });

  it("CEP precisa de 8 dígitos", () => {
    expect(isValidCEP("01001-000")).toBe(true);
    expect(isValidCEP("01001-00")).toBe(false);
  });

  it("monta o endereço completo em uma linha", () => {
    expect(
      formatEnderecoLinha({
        logradouro: "Praça da Sé",
        numero: "100",
        complemento: "Sala 2",
        bairro: "Sé",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01001000",
      }),
    ).toBe("Praça da Sé, 100 - Sala 2 - Sé, São Paulo/SP - CEP 01001-000");
  });

  it("endereço vazio vira texto vazio", () => {
    expect(formatEnderecoLinha({})).toBe("");
  });
});
