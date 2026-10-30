import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Download, FileQuestion, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { renameKeepingExtension, tipoPreview } from "@/lib/arquivos";
import { friendlyError } from "@/lib/errors";
import { getDocumentoUrl, useRenameDocumento, type Documento } from "./api";

/** Visualização do documento dentro do sistema (PDF, imagens e textos). */
export function VisualizarDocumentoDialog({
  doc,
  onOpenChange,
  onDownload,
}: {
  doc: Documento | null;
  onOpenChange: (open: boolean) => void;
  onDownload: (doc: Documento) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  const tipo = doc ? tipoPreview(doc.nome_documento) ?? tipoPreview(doc.arquivo_url) : null;

  useEffect(() => {
    setUrl(null);
    setErro(false);
    if (!doc || !tipo) return;
    let ativo = true;
    getDocumentoUrl(doc.arquivo_url).then(
      (u) => ativo && setUrl(u),
      () => ativo && setErro(true),
    );
    return () => {
      ativo = false;
    };
  }, [doc, tipo]);

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-w-5xl flex-col gap-3 p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate text-lg">{doc?.nome_documento}</DialogTitle>
          <DialogDescription className="sr-only">Visualização do documento da pasta digital</DialogDescription>
        </DialogHeader>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
          {!tipo || erro ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <FileQuestion className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {erro ? "Não foi possível carregar o documento." : "Este tipo de arquivo não pode ser visualizado aqui. Faça o download para abrir."}
              </p>
            </div>
          ) : !url ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : tipo === "imagem" ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <img src={url} alt={doc?.nome_documento ?? ""} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <iframe src={url} title={doc?.nome_documento ?? "Documento"} className="h-full w-full bg-card" />
          )}
        </div>
        <DialogFooter>
          {doc && (
            <Button variant="outline" onClick={() => onDownload(doc)}>
              <Download /> Baixar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RenomearDocumentoDialog({
  doc,
  processoId,
  onOpenChange,
}: {
  doc: Documento | null;
  processoId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const rename = useRenameDocumento(processoId);
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (doc) setNome(doc.nome_documento);
  }, [doc]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!doc) return;
    const final = renameKeepingExtension(doc.nome_documento, nome);
    if (final === doc.nome_documento) {
      onOpenChange(false);
      return;
    }
    try {
      await rename.mutateAsync({ id: doc.id, nome: final });
      toast.success("Nome do documento atualizado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível renomear o documento."));
    }
  }

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Renomear documento</DialogTitle>
          <DialogDescription>Se você apagar a extensão (.pdf, .docx…), a original será mantida.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nome do arquivo" htmlFor="nome-documento">
            <Input id="nome-documento" value={nome} maxLength={255} autoFocus onChange={(e) => setNome(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={rename.isPending || !nome.trim()}>
              {rename.isPending && <Loader2 className="animate-spin" />}
              Salvar nome
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
