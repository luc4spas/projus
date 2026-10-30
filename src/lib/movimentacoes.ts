/**
 * Regras do histórico de movimentações (andamentos) do processo.
 * As datas são "somente dia" (yyyy-MM-dd) e tratadas no fuso local,
 * para que 26/10 não apareça como 25/10 no Brasil.
 */
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

export const MAX_DESCRICAO_MOVIMENTACAO = 8000;

type Ordenavel = { data_movimentacao: string; created_at: string };

/** Data de hoje no formato aceito por <input type="date">. */
export function hojeISO(agora: Date = new Date()): string {
  return format(agora, "yyyy-MM-dd");
}

export function parseDataMovimentacao(value: string): Date {
  return parse(value, "yyyy-MM-dd", new Date());
}

export function formatDataMovimentacao(value: string): string {
  const d = parseDataMovimentacao(value);
  return isValid(d) ? format(d, "dd/MM/yyyy", { locale: ptBR }) : "—";
}

/** Retorna a mensagem de erro, ou null quando a data é válida (obrigatória e não futura). */
export function validarDataMovimentacao(value: string, hoje: string = hojeISO()): string | null {
  if (!value) return "Informe a data da movimentação";
  if (!isValid(parseDataMovimentacao(value))) return "Data inválida";
  if (value > hoje) return "A data não pode ser futura";
  return null;
}

/** Mais recente primeiro; no mesmo dia, a registrada por último vem antes. */
export function ordenarMovimentacoes<T extends Ordenavel>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) =>
    a.data_movimentacao === b.data_movimentacao
      ? b.created_at.localeCompare(a.created_at)
      : b.data_movimentacao.localeCompare(a.data_movimentacao),
  );
}
