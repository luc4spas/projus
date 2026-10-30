import { describe, expect, it } from "vitest";
import {
  contarFiltros,
  FILTROS_PADRAO,
  filtrarTransacoes,
  filtrosParaUrl,
  gerarCsv,
  intervaloPeriodo,
  parseFiltros,
  visaoAtiva,
  type FiltrosFinanceiro,
  type TransacaoFiltravel,
} from "./financeiro-filtros";

const HOJE = "2026-10-30";

const t = (o: Partial<TransacaoFiltravel> & { id?: string }) => ({
  id: "x",
  tipo: "Receita",
  valor: 100,
  status: "Pendente",
  data_vencimento: "2026-11-10",
  data_pagamento: null,
  descricao: "Honorários",
  created_at: "2026-10-01T12:00:00Z",
  categoria_id: "cat-h",
  cliente_id: "cli-1",
  processo_id: null,
  comprovante_url: null,
  ...o,
});
const f = (o: Partial<FiltrosFinanceiro>) => ({ ...FILTROS_PADRAO, ...o });
const ids = (l: { id: string }[]) => l.map((x) => x.id);

describe("visões rápidas", () => {
  const lista = [
    t({ id: "receber" }),
    t({ id: "atrasada", data_vencimento: "2026-10-01" }),
    t({ id: "recebida", status: "Pago", data_pagamento: "2026-10-02" }),
    t({ id: "pagar", tipo: "Despesa" }),
  ];
  it("A receber = receitas pendentes ou atrasadas", () => {
    expect(ids(filtrarTransacoes(lista, f({ tipo: "Receita", status: "aberto" }), HOJE)).sort()).toEqual(["atrasada", "receber"]);
  });
  it("Em atraso inclui pendente com vencimento passado", () => {
    expect(ids(filtrarTransacoes(lista, f({ status: "Atrasado" }), HOJE))).toEqual(["atrasada"]);
  });
  it("identifica a visão a partir de tipo + status", () => {
    expect(visaoAtiva({ tipo: "Despesa", status: "aberto" })).toBe("pagar");
    expect(visaoAtiva({ tipo: "Despesa", status: "Atrasado" })).toBeNull();
  });
});

describe("período", () => {
  it("calcula este mês, mês passado e próximos 7 dias", () => {
    expect(intervaloPeriodo("mes", HOJE)).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
    expect(intervaloPeriodo("mes_passado", HOJE)).toEqual({ de: "2026-09-01", ate: "2026-09-30" });
    expect(intervaloPeriodo("7d", HOJE)).toEqual({ de: "2026-10-30", ate: "2026-11-05" });
  });
  it("por data de pagamento ignora o que não foi pago", () => {
    const lista = [t({ id: "pago", status: "Pago", data_pagamento: "2026-10-15" }), t({ id: "aberto", data_vencimento: "2026-10-15" })];
    expect(ids(filtrarTransacoes(lista, f({ periodo: "mes", base: "pagamento" }), HOJE))).toEqual(["pago"]);
    expect(ids(filtrarTransacoes(lista, f({ periodo: "mes", base: "vencimento" }), HOJE))).toEqual(["aberto"]);
  });
});

describe("demais filtros", () => {
  it("faixa de valor aceita formato brasileiro", () => {
    const lista = [t({ id: "a", valor: 50 }), t({ id: "b", valor: 1500 }), t({ id: "c", valor: 5000 })];
    expect(ids(filtrarTransacoes(lista, f({ min: "1.000,00", max: "2.000" }), HOJE))).toEqual(["b"]);
  });
  it("comprovante, vínculo com processo e advogado responsável", () => {
    const lista = [
      t({ id: "com", comprovante_url: "x/y.pdf", processo_id: "p1", processo: { titulo: "A", numero_cnj: null, advogado_responsavel: "adv-1" } }),
      t({ id: "sem" }),
    ];
    expect(ids(filtrarTransacoes(lista, f({ comprovante: "sem" }), HOJE))).toEqual(["sem"]);
    expect(ids(filtrarTransacoes(lista, f({ vinculo: "com" }), HOJE))).toEqual(["com"]);
    expect(ids(filtrarTransacoes(lista, f({ advogado: "adv-1" }), HOJE))).toEqual(["com"]);
  });
  it("ordena por valor crescente", () => {
    const lista = [t({ id: "b", valor: 200 }), t({ id: "a", valor: 10 })];
    expect(ids(filtrarTransacoes(lista, f({ ordem: "valor", dir: "asc" }), HOJE))).toEqual(["a", "b"]);
  });
});

describe("URL", () => {
  it("descarta valores inválidos e mantém só o que difere do padrão", () => {
    const lido = parseFiltros({ status: "Atrasado", tipo: "Qualquer", de: "ontem", periodo: "mes" });
    expect(lido.status).toBe("Atrasado");
    expect(lido.tipo).toBe("todos");
    expect(lido.de).toBe("");
    expect(filtrosParaUrl(lido)).toEqual({ status: "Atrasado", periodo: "mes" });
    expect(contarFiltros(lido)).toBe(2);
  });
});

describe("exportação", () => {
  it("gera CSV com ; e despesas negativas", () => {
    const csv = gerarCsv([t({ tipo: "Despesa", valor: 1234.5, descricao: 'Custas "iniciais"' })], HOJE);
    const linha = csv.split("\r\n")[1];
    expect(linha).toContain('"Custas ""iniciais"""');
    expect(linha?.endsWith(";-1234,50")).toBe(true);
  });
});
