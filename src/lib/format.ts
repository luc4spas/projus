import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatCurrency = (value: number | null | undefined) =>
  value == null ? "—" : currency.format(Number(value));

export const formatDate = (value: string | Date | null | undefined) =>
  value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : "—";

export const formatDateTime = (value: string | Date | null | undefined) =>
  value ? format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—";

export const formatDiaMes = (value: string | Date) => format(new Date(value), "dd MMM", { locale: ptBR });

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

/** Converte ISO para o valor aceito por <input type="datetime-local">. */
export function toDateTimeLocal(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
