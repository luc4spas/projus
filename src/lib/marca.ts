/** Identidade do sistema (white-label): nome e subtítulo exibidos para cada escritório. */
export type Marca = { nome: string; subtitulo: string };

export const MARCA_PADRAO: Marca = { nome: "Toga", subtitulo: "Gestão Jurídica" };

export const NOME_MIN = 2;
export const NOME_MAX = 60;
export const SUBTITULO_MAX = 60;

/** Retorna a mensagem de erro do nome do sistema, ou null quando válido. */
export function validarNomeSistema(valor: string): string | null {
  const v = valor.trim();
  if (v.length < NOME_MIN) return `O nome precisa ter pelo menos ${NOME_MIN} caracteres.`;
  if (v.length > NOME_MAX) return `O nome pode ter no máximo ${NOME_MAX} caracteres.`;
  return null;
}

/** Retorna a mensagem de erro do subtítulo, ou null quando válido (pode ficar vazio). */
export function validarSubtitulo(valor: string): string | null {
  if (valor.trim().length > SUBTITULO_MAX) return `O subtítulo pode ter no máximo ${SUBTITULO_MAX} caracteres.`;
  return null;
}

/** Título da aba do navegador: "Página — Nome do sistema". */
export function tituloPagina(pagina: string, marca?: Marca | null): string {
  const nome = marca?.nome?.trim() || MARCA_PADRAO.nome;
  return `${pagina} — ${nome}`;
}
