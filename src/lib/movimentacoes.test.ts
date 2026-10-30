import { describe, expect, it } from "vitest";
import { formatDataMovimentacao, ordenarMovimentacoes, validarDataMovimentacao } from "./movimentacoes";

describe("validarDataMovimentacao", () => {
  it("exige a data", () => {
    expect(validarDataMovimentacao("", "2026-10-26")).toBe("Informe a data da movimentação");
  });
  it("aceita hoje e datas passadas", () => {
    expect(validarDataMovimentacao("2026-10-26", "2026-10-26")).toBeNull();
    expect(validarDataMovimentacao("2024-01-15", "2026-10-26")).toBeNull();
  });
  it("recusa datas futuras", () => {
    expect(validarDataMovimentacao("2026-10-27", "2026-10-26")).toBe("A data não pode ser futura");
  });
});

describe("formatDataMovimentacao", () => {
  it("mostra o mesmo dia salvo, sem voltar um dia por causa do fuso", () => {
    expect(formatDataMovimentacao("2026-10-26")).toBe("26/10/2026");
  });
});

describe("ordenarMovimentacoes", () => {
  it("coloca a mais recente primeiro e desempata pelo registro mais novo", () => {
    const lista = [
      { id: "a", data_movimentacao: "2026-01-10", created_at: "2026-01-10T10:00:00Z" },
      { id: "b", data_movimentacao: "2026-03-02", created_at: "2026-03-02T09:00:00Z" },
      { id: "c", data_movimentacao: "2026-03-02", created_at: "2026-03-02T15:00:00Z" },
    ];
    expect(ordenarMovimentacoes(lista).map((m) => m.id)).toEqual(["c", "b", "a"]);
  });
});
