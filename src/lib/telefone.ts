/**
 * Telefones de clientes: máscara brasileira, normalização e link de WhatsApp.
 */
import { onlyDigits } from "./documento";

export type Telefone = { numero: string; whatsapp: boolean };

/** Máscara progressiva: (11) 1234-5678 ou (11) 91234-5678. */
export function formatTelefone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Telefone válido: DDD + 8 ou 9 dígitos. */
export const isValidTelefone = (value: string) => {
  const len = onlyDigits(value).length;
  return len === 10 || len === 11;
};

/** Remove linhas vazias e garante no máximo um número marcado como WhatsApp. */
export function normalizeTelefones(list: Telefone[]): Telefone[] {
  let whatsappUsado = false;
  return list
    .map((t) => ({ numero: t.numero.trim(), whatsapp: !!t.whatsapp }))
    .filter((t) => onlyDigits(t.numero).length > 0)
    .map((t) => {
      const whatsapp = t.whatsapp && !whatsappUsado;
      if (whatsapp) whatsappUsado = true;
      return { numero: t.numero, whatsapp };
    });
}

/** Lê com segurança o campo JSON salvo no banco. */
export function parseTelefones(value: unknown): Telefone[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const numero = (item as { numero?: unknown }).numero;
    if (typeof numero !== "string" || !numero.trim()) return [];
    return [{ numero, whatsapp: (item as { whatsapp?: unknown }).whatsapp === true }];
  });
}

/** Link wa.me; números nacionais (10–11 dígitos) recebem o código do Brasil. */
export function whatsappLink(numero: string): string {
  const d = onlyDigits(numero);
  return `https://wa.me/${d.length === 10 || d.length === 11 ? `55${d}` : d}`;
}
