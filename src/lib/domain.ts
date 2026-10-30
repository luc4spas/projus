/**
 * Constantes de domínio jurídico compartilhadas entre módulos.
 */
import type { Database } from "@/integrations/supabase/types";

export type Papel = Database["public"]["Enums"]["app_role"];

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: "Administrador",
  advogado: "Advogado",
  cliente: "Cliente",
};

export const STATUS_TAREFA = ["Pendente", "Em Andamento", "Cumprido"] as const;
export type StatusTarefa = (typeof STATUS_TAREFA)[number];

export const TIPOS_CLIENTE = ["Pessoa Física", "Pessoa Jurídica"] as const;
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];

export const FASES_PROCESSO = [
  "Conhecimento",
  "Instrução",
  "Sentença",
  "Recursal",
  "Execução",
  "Cumprimento de Sentença",
  "Suspenso",
  "Arquivado",
] as const;
export type FaseProcesso = (typeof FASES_PROCESSO)[number];

/** Sistemas processuais eletrônicos mais usados nos tribunais brasileiros. */
export const SISTEMAS_PROCESSUAIS = [
  "PJe",
  "e-SAJ",
  "eproc",
  "Projudi",
  "SEEU",
  "e-STF",
  "e-STJ",
  "Processo físico",
  "Outro",
] as const;

/** Fases que não contam como processo ativo. */
export const FASES_INATIVAS: readonly string[] = ["Arquivado"];

export function isProcessoAtivo(fase: string | null | undefined): boolean {
  return !!fase && !FASES_INATIVAS.includes(fase);
}

/** Nome exibido do processo: título, ou número CNJ quando não houver título. */
export function processoLabel(p: { titulo?: string | null; numero_cnj?: string | null }): string {
  return p.titulo?.trim() || p.numero_cnj?.trim() || "Processo sem título";
}
