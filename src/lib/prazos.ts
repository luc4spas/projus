/**
 * Regras de urgência de prazos.
 * - "cumprido": status Cumprido (independe da data)
 * - "vencido": data fatal já passou
 * - "hoje": vence no mesmo dia
 * - "proximo": vence em até 3 dias
 * - "futuro": demais casos
 */
import type { StatusTarefa } from "./domain";

export type Urgencia = "cumprido" | "vencido" | "hoje" | "proximo" | "futuro";

export const DIAS_ALERTA_PROXIMO = 3;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function diasAte(dataFatal: Date | string, now: Date = new Date()): number {
  const target = startOfDay(new Date(dataFatal));
  return Math.round((target.getTime() - startOfDay(now).getTime()) / 86_400_000);
}

export function urgenciaPrazo(
  dataFatal: Date | string,
  status: StatusTarefa | string,
  now: Date = new Date(),
): Urgencia {
  if (status === "Cumprido") return "cumprido";
  if (new Date(dataFatal).getTime() < now.getTime()) return "vencido";
  const dias = diasAte(dataFatal, now);
  if (dias === 0) return "hoje";
  if (dias <= DIAS_ALERTA_PROXIMO) return "proximo";
  return "futuro";
}

export function descreverPrazo(dataFatal: Date | string, status: string, now: Date = new Date()): string {
  const u = urgenciaPrazo(dataFatal, status, now);
  const dias = diasAte(dataFatal, now);
  switch (u) {
    case "cumprido":
      return "Cumprido";
    case "vencido":
      return dias === 0 ? "Venceu hoje" : `Vencido há ${Math.abs(dias)}d`;
    case "hoje":
      return "Vence hoje";
    default:
      return dias === 1 ? "Amanhã" : `Em ${dias} dias`;
  }
}
