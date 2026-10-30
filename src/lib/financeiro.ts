/**
 * Regras do módulo financeiro.
 * Datas são "somente dia" (yyyy-MM-dd) e comparadas como texto, no fuso local.
 */
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

export const TIPOS_TRANSACAO = ["Receita", "Despesa"] as const;
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

export const STATUS_TRANSACAO = ["Pendente", "Pago", "Atrasado"] as const;
export type StatusTransacao = (typeof STATUS_TRANSACAO)[number];

export const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;

export type TransacaoBase = {
  tipo: string;
  valor: number;
  status: string;
  data_vencimento: string;
  data_pagamento: string | null;
};

export function hojeDia(agora: Date = new Date()): string {
  return format(agora, "yyyy-MM-dd");
}

export function formatDia(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? format(d, "dd/MM/yyyy", { locale: ptBR }) : "—";
}

/**
 * Status exibido: pago continua pago; pendente com vencimento passado vira "Atrasado".
 */
export function statusEfetivo(t: Pick<TransacaoBase, "status" | "data_vencimento">, hoje: string = hojeDia()): StatusTransacao {
  if (t.status === "Pago") return "Pago";
  if (t.status === "Atrasado" || t.data_vencimento < hoje) return "Atrasado";
  return "Pendente";
}

/** Data em que o lançamento entra no fluxo de caixa: pagamento, ou vencimento se ainda não pago. */
export function dataReferencia(t: Pick<TransacaoBase, "status" | "data_vencimento" | "data_pagamento">): string {
  return t.status === "Pago" && t.data_pagamento ? t.data_pagamento : t.data_vencimento;
}

const arredondar = (n: number) => Math.round(n * 100) / 100;

/**
 * Converte o valor digitado ("1.234,56", "1234,56", "1234.56", "R$ 50") em número.
 * Retorna null quando não for um número válido.
 */
export function parseValor(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, "");
  if (!limpo || !/\d/.test(limpo)) return null;
  let normalizado: string;
  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    normalizado = limpo.replace(/\./g, "");
  } else {
    normalizado = limpo;
  }
  const n = Number(normalizado);
  return Number.isFinite(n) ? arredondar(n) : null;
}

/** Valor no formato do campo de digitação: 1.234,56 (sem "R$"). */
export function formatValorCampo(n: number | null | undefined): string {
  if (n == null) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function validarValor(texto: string): string | null {
  const n = parseValor(texto);
  if (n == null) return "Informe um valor válido";
  if (n <= 0) return "O valor deve ser maior que zero";
  if (n >= 1e12) return "Valor muito alto";
  return null;
}

export type ResumoFinanceiro = {
  receitaTotal: number;
  receitaRecebida: number;
  despesaTotal: number;
  despesaPaga: number;
  /** Receitas − despesas, contando também o que ainda está pendente. */
  saldoPrevisto: number;
  /** Só o que já foi efetivamente pago/recebido. */
  saldoRealizado: number;
  valorAtrasado: number;
  qtdAtrasadas: number;
  /** Fração (0–1) do valor de receitas já vencidas que está em atraso; null sem receitas vencidas. */
  inadimplencia: number | null;
};

export function resumoFinanceiro(lista: readonly TransacaoBase[], hoje: string = hojeDia()): ResumoFinanceiro {
  let receitaTotal = 0;
  let receitaRecebida = 0;
  let despesaTotal = 0;
  let despesaPaga = 0;
  let valorAtrasado = 0;
  let qtdAtrasadas = 0;
  let receitasVencidas = 0;

  for (const t of lista) {
    const valor = Number(t.valor) || 0;
    const status = statusEfetivo(t, hoje);
    if (t.tipo === "Receita") {
      receitaTotal += valor;
      if (status === "Pago") receitaRecebida += valor;
      if (status === "Atrasado") {
        valorAtrasado += valor;
        qtdAtrasadas++;
      }
      if (status === "Atrasado" || t.data_vencimento < hoje) receitasVencidas += valor;
    } else {
      despesaTotal += valor;
      if (status === "Pago") despesaPaga += valor;
    }
  }

  return {
    receitaTotal: arredondar(receitaTotal),
    receitaRecebida: arredondar(receitaRecebida),
    despesaTotal: arredondar(despesaTotal),
    despesaPaga: arredondar(despesaPaga),
    saldoPrevisto: arredondar(receitaTotal - despesaTotal),
    saldoRealizado: arredondar(receitaRecebida - despesaPaga),
    valorAtrasado: arredondar(valorAtrasado),
    qtdAtrasadas,
    inadimplencia: receitasVencidas > 0 ? valorAtrasado / receitasVencidas : null,
  };
}

export type MesFluxo = { mes: string; receitas: number; despesas: number; saldo: number; acumulado: number };

/** Fluxo de caixa dos 12 meses do ano, pela data de referência de cada lançamento. */
export function fluxoMensal(lista: readonly TransacaoBase[], ano: number): MesFluxo[] {
  const meses = MESES_CURTOS.map((mes) => ({ mes, receitas: 0, despesas: 0, saldo: 0, acumulado: 0 }));
  for (const t of lista) {
    const ref = dataReferencia(t);
    if (Number(ref.slice(0, 4)) !== ano) continue;
    const m = meses[Number(ref.slice(5, 7)) - 1];
    if (!m) continue;
    if (t.tipo === "Receita") m.receitas += Number(t.valor) || 0;
    else m.despesas += Number(t.valor) || 0;
  }
  let acumulado = 0;
  for (const m of meses) {
    m.receitas = arredondar(m.receitas);
    m.despesas = arredondar(m.despesas);
    m.saldo = arredondar(m.receitas - m.despesas);
    acumulado = arredondar(acumulado + m.saldo);
    m.acumulado = acumulado;
  }
  return meses;
}

/** Lançamentos cuja data de referência cai no ano informado. */
export function doAno<T extends TransacaoBase>(lista: readonly T[], ano: number): T[] {
  return lista.filter((t) => Number(dataReferencia(t).slice(0, 4)) === ano);
}

/** Anos com lançamentos, sempre incluindo o ano atual, do mais recente ao mais antigo. */
export function anosDisponiveis(lista: readonly TransacaoBase[], hoje: string = hojeDia()): number[] {
  const anos = new Set<number>([Number(hoje.slice(0, 4))]);
  for (const t of lista) anos.add(Number(dataReferencia(t).slice(0, 4)));
  return [...anos].filter(Number.isFinite).sort((a, b) => b - a);
}

/** Nome do arquivo a partir do caminho salvo (`<id>/<nome>`). */
export function nomeComprovante(path: string | null | undefined): string {
  if (!path) return "";
  return path.split("/").pop() ?? path;
}
