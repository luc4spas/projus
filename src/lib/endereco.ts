/**
 * Endereço do cliente: máscara de CEP, UFs e consulta pública ao ViaCEP.
 */
import { onlyDigits } from "./documento";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type Endereco = {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

export function formatCEP(value: string | null | undefined): string {
  const d = onlyDigits(value ?? "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function isValidCEP(value: string | null | undefined): boolean {
  return onlyDigits(value ?? "").length === 8;
}

/** Endereço em uma linha: "Rua X, 100 - Apto 2 - Centro, São Paulo/SP - CEP 01001-000". */
export function formatEnderecoLinha(e: Partial<Endereco>): string {
  const rua = [e.logradouro?.trim(), e.numero?.trim()].filter(Boolean).join(", ");
  const cidadeUf = [e.cidade?.trim(), e.uf?.trim()].filter(Boolean).join("/");
  const partes = [rua, e.complemento?.trim(), e.bairro?.trim()].filter(Boolean).join(" - ");
  const local = [partes, cidadeUf].filter(Boolean).join(", ");
  const cep = isValidCEP(e.cep) ? `CEP ${formatCEP(e.cep)}` : "";
  return [local, cep].filter(Boolean).join(" - ");
}

/** Consulta o CEP no ViaCEP. Retorna null quando não encontrado ou em falha de rede. */
export async function buscarCEP(cep: string): Promise<Partial<Endereco> | null> {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, string | boolean>;
    if (j["erro"]) return null;
    return {
      logradouro: (j["logradouro"] as string) || null,
      bairro: (j["bairro"] as string) || null,
      cidade: (j["localidade"] as string) || null,
      uf: (j["uf"] as string) || null,
    };
  } catch {
    return null;
  }
}
