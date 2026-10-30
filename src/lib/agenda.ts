/**
 * Regras da agenda mensal: grade de semanas (domingo a sábado) e agrupamento de prazos por dia.
 */
import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

/** Chave local do dia (yyyy-MM-dd), no fuso de quem usa o sistema. */
export const chaveDia = (d: Date | string) => format(new Date(d), "yyyy-MM-dd");

/** Todos os dias exibidos na grade do mês, incluindo o fim do mês anterior e o início do próximo. */
export function diasDaGrade(mes: Date): Date[] {
  const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: 0 });
  const fim = endOfWeek(endOfMonth(mes), { weekStartsOn: 0 });
  const dias: Date[] = [];
  for (let d = inicio; d <= fim; d = addDays(d, 1)) dias.push(d);
  return dias;
}

/** Agrupa itens pela data fatal, ordenados pelo horário dentro de cada dia. */
export function agruparPorDia<T extends { data_fatal: string }>(itens: T[]): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  const ordenados = [...itens].sort((a, b) => new Date(a.data_fatal).getTime() - new Date(b.data_fatal).getTime());
  for (const item of ordenados) {
    const k = chaveDia(item.data_fatal);
    const lista = mapa.get(k);
    if (lista) lista.push(item);
    else mapa.set(k, [item]);
  }
  return mapa;
}
