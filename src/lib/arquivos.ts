/**
 * Regras de nomes e pré-visualização de arquivos da pasta digital.
 */

const extensionOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i > 0 && i < name.length - 1 ? name.slice(i + 1).toLowerCase() : "";
};

/** Novo nome do documento; se o usuário apagar a extensão, a original é mantida. */
export function renameKeepingExtension(original: string, novo: string): string {
  const nome = novo.trim();
  if (!nome) return original;
  const extOriginal = extensionOf(original);
  if (extOriginal && !extensionOf(nome)) return `${nome}.${extOriginal}`;
  return nome;
}

export type TipoPreview = "pdf" | "imagem" | "texto" | null;

const IMAGENS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];
const TEXTOS = ["txt", "csv", "json", "xml", "md"];

/** Define como o arquivo pode ser exibido dentro do sistema (null = só download). */
export function tipoPreview(nomeOuCaminho: string): TipoPreview {
  const ext = extensionOf(nomeOuCaminho);
  if (ext === "pdf") return "pdf";
  if (IMAGENS.includes(ext)) return "imagem";
  if (TEXTOS.includes(ext)) return "texto";
  return null;
}
