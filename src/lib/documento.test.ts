import { describe, expect, it } from "vitest";
import { formatCNJ, formatDocumento, isValidCNJ, isValidCNPJ, isValidCPF, isValidDocumento } from "./documento";

describe("CPF", () => {
  it("aceita um CPF com dígitos verificadores corretos", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
  });
  it("rejeita CPF com dígito verificador errado", () => {
    expect(isValidCPF("529.982.247-24")).toBe(false);
  });
  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });
});

describe("CNPJ", () => {
  it("aceita um CNPJ válido", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
  });
  it("rejeita CNPJ com dígito verificador errado", () => {
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false);
  });
  it("isValidDocumento recusa tamanhos que não são CPF nem CNPJ", () => {
    expect(isValidDocumento("1234567890")).toBe(false);
  });
});

describe("máscaras", () => {
  it("formata CPF e CNPJ", () => {
    expect(formatDocumento("52998224725")).toBe("529.982.247-25");
    expect(formatDocumento("11222333000181")).toBe("11.222.333/0001-81");
  });
  it("formata número CNJ com 20 dígitos", () => {
    expect(formatCNJ("00012345620248260100")).toBe("0001234-56.2024.8.26.0100");
    expect(isValidCNJ("0001234-56.2024.8.26.0100")).toBe(true);
    expect(isValidCNJ("0001234-56.2024")).toBe(false);
  });
});
