/**
 * Filtros da tela Financeiro: visões rápidas (a receber, a pagar…), período por
 * data de vencimento/pagamento/cadastro, categoria, cliente, processo, advogado,
 * comprovante, vínculo, faixa de valor e ordenação. Tudo vive na URL.
 */
import { addDays, endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns";
import { formatDia, parseValor, statusEfetivo, type TransacaoBase } from "./financeiro";

export const PERIODOS = [
  ["todos", "Todo o período"],
  ["hoje", "Hoje"],
  ["7d", "Próximos 7 dias"],
  ["30d", "Próximos 30 dias"],
  ["ult30d", "Últimos 30 dias"],
  ["mes", "Este mês"],
  ["mes_passado", "Mês passado"],
  ["ano", "Este ano"],
  ["personalizado", "Personalizado"],
] as const;
export type Periodo = (typeof PERIODOS)[number][0];

export const BASES_DATA = [
  ["vencimento", "Vencimento"],
  ["pagamento", "Pagamento"],
  ["cadastro", "Cadastro"],
] as const;
export type BaseData = (typeof BASES_DATA)[number][0];

export const STATUS_FILTRO = [
  ["aberto", "Em aberto (pendente + atrasado)"],
  ["Pendente", "Pendente"],
  ["Atrasado", "Atrasado"],
  ["Pago", "Pago"],
] as const;
export type StatusFiltro = "todos" | (typeof STATUS_FILTRO)[number][0];

export const ORDENS = ["vencimento", "pagamento", "valor", "descricao"] as const;
export type Ordem = (typeof ORDENS)[number];

export type FiltrosFinanceiro = {
  q: string;
  tipo: "todos" | "Receita" | "Despesa";
  status: StatusFiltro;
  periodo: Periodo;
  base: BaseData;
  de: string;
  ate: string;
  categoria: string;
  cliente: string;
  processo: string;
  advogado: string;
  comprovante: "todos" | "com" | "sem";
  vinculo: "todos" | "com" | "sem";
  min: string;
  max: string;
  ordem: Ordem;
  dir: "asc" | "desc";
};

export const FILTROS_PADRAO: FiltrosFinanceiro = {
  q: "",
  tipo: "todos",
  status: "todos",
  periodo: "todos",
  base: "vencimento",
  de: "",
  ate: "",
  categoria: "todos",
  cliente: "todos",
  processo: "todos",
  advogado: "todos",
  comprovante: "todos",
  vinculo: "todos",
  min: "",
  max: "",
  ordem: "vencimento",
  dir: "desc",
};

/** Atalhos usados no dia a dia do financeiro do escritório. */
export const VISOES = [
  { id: "todas", label: "Todos", tipo: "todos", status: "todos" },
  { id: "receber", label: "A receber", tipo: "Receita", status: "aberto" },
  { id: "pagar", label: "A pagar", tipo: "Despesa", status: "aberto" },
  { id: "recebidas", label: "Recebidas", tipo: "Receita", status: "Pago" },
  { id: "pagas", label: "Pagas", tipo: "Despesa", status: "Pago" },
  { id: "atraso", label: "Em atraso", tipo: "todos", status: "Atrasado" },
] as const satisfies readonly { id: string; label: string; tipo: FiltrosFinanceiro["tipo"]; status: StatusFiltro }[];

export function visaoAtiva(f: Pick<FiltrosFinanceiro, "tipo" | "status">): string | null {
  return VISOES.find((v) => v.tipo === f.tipo && v.status === f.status)?.id ?? null;
}

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const ehUm = <T extends string>(lista: readonly T[], v: unknown): v is T => typeof v === "string" && (lista as readonly string[]).includes(v);
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");

/** Lê os filtros da URL, descartando valores inválidos. */
export function parseFiltros(search: Record<string, unknown>): FiltrosFinanceiro {
  const p = FILTROS_PADRAO;
  const de = str(search["de"]);
  const ate = str(search["ate"]);
  return {
    q: str(search["q"]),
    tipo: ehUm(["Receita", "Despesa"], search["tipo"]) ? search["tipo"] : p.tipo,
    status: ehUm(["aberto", "Pendente", "Atrasado", "Pago"], search["status"]) ? search["status"] : p.status,
    periodo: ehUm(PERIODOS.map((x) => x[0]), search["periodo"]) ? search["periodo"] : p.periodo,
    base: ehUm(BASES_DATA.map((x) => x[0]), search["base"]) ? search["base"] : p.base,
    de: DIA.test(de) ? de : "",
    ate: DIA.test(ate) ? ate : "",
    categoria: str(search["categoria"]) || p.categoria,
    cliente: str(search["cliente"]) || p.cliente,
    processo: str(search["processo"]) || p.processo,
    advogado: str(search["advogado"]) || p.advogado,
    comprovante: ehUm(["com", "sem"], search["comprovante"]) ? search["comprovante"] : p.comprovante,
    vinculo: ehUm(["com", "sem"], search["vinculo"]) ? search["vinculo"] : p.vinculo,
    min: str(search["min"], 20),
    max: str(search["max"], 20),
    ordem: ehUm(ORDENS, search["ordem"]) ? search["ordem"] : p.ordem,
    dir: search["dir"] === "asc" ? "asc" : p.dir,
  };
}

/** Só os filtros diferentes do padrão, para a URL ficar curta. */
export function filtrosParaUrl(f: FiltrosFinanceiro): Partial<FiltrosFinanceiro> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(FILTROS_PADRAO) as (keyof FiltrosFinanceiro)[]) {
    if (f[k] !== FILTROS_PADRAO[k]) out[k] = f[k];
  }
  if (f.periodo !== "personalizado") {
    delete out["de"];
    delete out["ate"];
  }
  return out as Partial<FiltrosFinanceiro>;
}

/** Quantos filtros (fora a ordenação) estão ativos. */
export function contarFiltros(f: FiltrosFinanceiro, chaves?: readonly (keyof FiltrosFinanceiro)[]): number {
  const u = filtrosParaUrl(f);
  const lista = chaves ?? (Object.keys(u) as (keyof FiltrosFinanceiro)[]);
  return lista.filter((k) => k in u && k !== "ordem" && k !== "dir" && k !== "base" && k !== "de" && k !== "ate").length;
}

const dia = (d: Date) => format(d, "yyyy-MM-dd");

/** Intervalo [de, até] (inclusive) do período escolhido; vazio = sem limite. */
export function intervaloPeriodo(periodo: Periodo, hoje: string, de = "", ate = ""): { de: string; ate: string } {
  const h = parse(hoje, "yyyy-MM-dd", new Date());
  switch (periodo) {
    case "hoje":
      return { de: hoje, ate: hoje };
    case "7d":
      return { de: hoje, ate: dia(addDays(h, 6)) };
    case "30d":
      return { de: hoje, ate: dia(addDays(h, 29)) };
    case "ult30d":
      return { de: dia(addDays(h, -29)), ate: hoje };
    case "mes":
      return { de: dia(startOfMonth(h)), ate: dia(endOfMonth(h)) };
    case "mes_passado": {
      const m = subMonths(h, 1);
      return { de: dia(startOfMonth(m)), ate: dia(endOfMonth(m)) };
    }
    case "ano":
      return { de: `${hoje.slice(0, 4)}-01-01`, ate: `${hoje.slice(0, 4)}-12-31` };
    case "personalizado":
      return { de, ate };
    default:
      return { de: "", ate: "" };
  }
}

export type TransacaoFiltravel = TransacaoBase & {
  descricao: string;
  created_at: string;
  categoria_id: string;
  cliente_id: string | null;
  processo_id: string | null;
  comprovante_url: string | null;
  categoria?: { nome: string } | null;
  cliente?: { nome: string } | null;
  processo?: { titulo: string | null; numero_cnj: string | null; advogado_responsavel?: string | null } | null;
};

function dataDaBase(t: TransacaoFiltravel, base: BaseData): string | null {
  if (base === "pagamento") return t.data_pagamento;
  if (base === "cadastro") return format(new Date(t.created_at), "yyyy-MM-dd");
  return t.data_vencimento;
}

export function filtrarTransacoes<T extends TransacaoFiltravel>(lista: readonly T[], f: FiltrosFinanceiro, hoje: string): T[] {
  const { de, ate } = intervaloPeriodo(f.periodo, hoje, f.de, f.ate);
  const q = f.q.trim().toLowerCase();
  const min = f.min ? parseValor(f.min) : null;
  const max = f.max ? parseValor(f.max) : null;

  const filtradas = lista.filter((t) => {
    if (f.tipo !== "todos" && t.tipo !== f.tipo) return false;
    if (f.status !== "todos") {
      const s = statusEfetivo(t, hoje);
      if (f.status === "aberto" ? s === "Pago" : s !== f.status) return false;
    }
    if (de || ate) {
      const d = dataDaBase(t, f.base);
      if (!d || (de && d < de) || (ate && d > ate)) return false;
    }
    if (f.categoria !== "todos" && t.categoria_id !== f.categoria) return false;
    if (f.cliente !== "todos" && t.cliente_id !== f.cliente) return false;
    if (f.processo !== "todos" && t.processo_id !== f.processo) return false;
    if (f.advogado !== "todos" && t.processo?.advogado_responsavel !== f.advogado) return false;
    if (f.comprovante === "com" && !t.comprovante_url) return false;
    if (f.comprovante === "sem" && t.comprovante_url) return false;
    if (f.vinculo === "com" && !t.processo_id) return false;
    if (f.vinculo === "sem" && t.processo_id) return false;
    const valor = Number(t.valor);
    if (min != null && valor < min) return false;
    if (max != null && valor > max) return false;
    if (q) {
      const alvo = [t.descricao, t.categoria?.nome, t.cliente?.nome, t.processo?.titulo, t.processo?.numero_cnj]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!alvo.includes(q)) return false;
    }
    return true;
  });

  const sinal = f.dir === "asc" ? 1 : -1;
  return filtradas.sort((a, b) => {
    let c = 0;
    if (f.ordem === "valor") c = Number(a.valor) - Number(b.valor);
    else if (f.ordem === "descricao") c = a.descricao.localeCompare(b.descricao, "pt-BR");
    else if (f.ordem === "pagamento") c = (a.data_pagamento ?? "").localeCompare(b.data_pagamento ?? "");
    else c = a.data_vencimento.localeCompare(b.data_vencimento);
    return c * sinal || b.created_at.localeCompare(a.created_at);
  });
}

const celula = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const valorCsv = (n: number) => n.toFixed(2).replace(".", ",");

/** Planilha (CSV separado por ";", padrão do Excel em português) dos lançamentos filtrados. */
export function gerarCsv(lista: readonly TransacaoFiltravel[], hoje: string): string {
  const cab = ["Vencimento", "Pagamento", "Tipo", "Categoria", "Descrição", "Cliente", "Processo", "Status", "Valor (R$)"];
  const linhas = lista.map((t) =>
    [
      formatDia(t.data_vencimento),
      t.data_pagamento ? formatDia(t.data_pagamento) : "",
      t.tipo,
      t.categoria?.nome ?? "",
      t.descricao,
      t.cliente?.nome ?? "",
      t.processo ? t.processo.titulo || t.processo.numero_cnj || "" : "",
      statusEfetivo(t, hoje),
      valorCsv(t.tipo === "Despesa" ? -Number(t.valor) : Number(t.valor)),
    ]
      .map(celula)
      .join(";"),
  );
  return "\uFEFF" + [cab.join(";"), ...linhas].join("\r\n");
}
