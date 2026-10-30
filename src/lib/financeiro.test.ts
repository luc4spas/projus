import { describe, expect, it } from "vitest";
import { anosDisponiveis, dataReferencia, fluxoMensal, parseValor, resumoFinanceiro, statusEfetivo, validarValor } from "./financeiro";

const HOJE = "2026-10-27";

const t = (o: Partial<Parameters<typeof resumoFinanceiro>[0][number]>) => ({
  tipo: "Receita",
  valor: 100,
  status: "Pendente",
  data_vencimento: "2026-11-10",
  data_pagamento: null,
  ...o,
});

describe("statusEfetivo", () => {
  it("pendente com vencimento passado aparece como Atrasado", () => {
    expect(statusEfetivo({ status: "Pendente", data_vencimento: "2026-10-26" }, HOJE)).toBe("Atrasado");
  });
  it("pendente que vence hoje ainda não está atrasado", () => {
    expect(statusEfetivo({ status: "Pendente", data_vencimento: HOJE }, HOJE)).toBe("Pendente");
  });
  it("pago nunca fica atrasado", () => {
    expect(statusEfetivo({ status: "Pago", data_vencimento: "2020-01-01" }, HOJE)).toBe("Pago");
  });
});

describe("parseValor", () => {
  it("entende o formato brasileiro", () => {
    expect(parseValor("1.234,56")).toBe(1234.56);
    expect(parseValor("R$ 50")).toBe(50);
    expect(parseValor("1.500")).toBe(1500);
    expect(parseValor("99.9")).toBe(99.9);
  });
  it("rejeita texto sem número e valor zero", () => {
    expect(parseValor("abc")).toBeNull();
    expect(validarValor("0,00")).toBe("O valor deve ser maior que zero");
  });
});

describe("resumoFinanceiro", () => {
  const lista = [
    t({ valor: 1000, status: "Pago", data_vencimento: "2026-10-01", data_pagamento: "2026-10-02" }),
    t({ valor: 500, data_vencimento: "2026-10-20" }), // atrasada
    t({ valor: 300, data_vencimento: "2026-12-01" }), // a receber
    t({ tipo: "Despesa", valor: 200, status: "Pago", data_vencimento: "2026-10-05", data_pagamento: "2026-10-05" }),
    t({ tipo: "Despesa", valor: 100, data_vencimento: "2026-11-05" }),
  ];
  const r = resumoFinanceiro(lista, HOJE);

  it("saldo previsto inclui o que ainda está pendente", () => {
    expect(r.receitaTotal).toBe(1800);
    expect(r.despesaTotal).toBe(300);
    expect(r.saldoPrevisto).toBe(1500);
    expect(r.saldoRealizado).toBe(800);
  });
  it("inadimplência = receitas em atraso ÷ receitas já vencidas", () => {
    expect(r.valorAtrasado).toBe(500);
    expect(r.qtdAtrasadas).toBe(1);
    expect(r.inadimplencia).toBeCloseTo(500 / 1500);
  });
  it("sem receitas vencidas não há índice", () => {
    expect(resumoFinanceiro([t({ data_vencimento: "2026-12-01" })], HOJE).inadimplencia).toBeNull();
  });
});

describe("fluxoMensal", () => {
  it("lançamento pago entra no mês do pagamento", () => {
    const pago = t({ status: "Pago", data_vencimento: "2026-09-30", data_pagamento: "2026-10-03" });
    expect(dataReferencia(pago)).toBe("2026-10-03");
    const fluxo = fluxoMensal([pago, t({ tipo: "Despesa", valor: 40, data_vencimento: "2026-10-15" })], 2026);
    expect(fluxo[8]?.receitas).toBe(0);
    expect(fluxo[9]).toMatchObject({ receitas: 100, despesas: 40, saldo: 60, acumulado: 60 });
    expect(fluxo[11]?.acumulado).toBe(60);
  });
  it("ignora outros anos", () => {
    expect(fluxoMensal([t({ data_vencimento: "2025-03-01" })], 2026).every((m) => m.receitas === 0)).toBe(true);
    expect(anosDisponiveis([t({ data_vencimento: "2025-03-01" })], HOJE)).toEqual([2026, 2025]);
  });
});
