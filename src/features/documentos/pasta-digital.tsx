import { useRef, useState, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Eye, FileText, FolderOpen, Loader2, Pencil, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/page";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { formatBytes, formatDateTime } from "@/lib/format";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useEquipeMap } from "@/features/equipe/api";
import { usePermissions } from "@/features/auth/use-current-user";
import { documentosQueryOptions, getDocumentoUrl, useDeleteDocumento, useUploadDocumento, type Documento } from "./api";
import { RenomearDocumentoDialog, VisualizarDocumentoDialog } from "./documento-dialogs";

export function PastaDigital({ processoId }: { processoId: string }) {
  const { data: docs, isLoading } = useQuery(documentosQueryOptions(processoId));
  const upload = useUploadDocumento(processoId);
  const del = useDeleteDocumento(processoId);
  const { canDelete, user } = usePermissions();
  const { map } = useEquipeMap();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [visualizar, setVisualizar] = useState<Documento | null>(null);
  const [renomear, setRenomear] = useState<Documento | null>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploadingCount(list.length);
    let ok = 0;
    for (const file of list) {
      try {
        await upload.mutateAsync(file);
        ok++;
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error && e.message.includes("50 MB") ? e.message : friendlyError(e, "falha no envio.")}`);
      }
    }
    setUploadingCount(0);
    if (ok) toast.success(ok === 1 ? "Documento anexado à pasta." : `${ok} documentos anexados.`);
  }

  async function downloadDoc(doc: Documento) {
    try {
      const link = document.createElement("a");
      link.href = await getDocumentoUrl(doc.arquivo_url, doc.nome_documento);
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível baixar o documento."));
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-card px-6 py-10 text-center transition-colors",
          dragging && "kanban-drop-active",
        )}
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-brass-soft text-brass-foreground">
          {uploadingCount ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
        </div>
        <div>
          <p className="text-sm font-medium">
            {uploadingCount ? `Enviando ${uploadingCount} arquivo(s)…` : "Arraste documentos para a pasta deste processo"}
          </p>
          <p className="text-xs text-muted-foreground">PDF, imagens ou documentos de até 50 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button variant="outline" size="sm" disabled={!!uploadingCount} onClick={() => inputRef.current?.click()}>
          Selecionar arquivos
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      ) : !docs?.length ? (
        <EmptyState icon={FolderOpen} title="Pasta vazia" description="Nenhum documento anexado a este processo ainda." />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.nome_documento}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(doc.data_upload)} · {formatBytes(doc.tamanho_bytes)}
                  {doc.uploader_id && map.get(doc.uploader_id) ? ` · ${map.get(doc.uploader_id)!.nome}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Visualizar documento" title="Visualizar" onClick={() => setVisualizar(doc)}>
                <Eye />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Baixar documento" title="Baixar" onClick={() => downloadDoc(doc)}>
                <Download />
              </Button>
              {(canDelete || doc.uploader_id === user.id) && (
                <Button variant="ghost" size="icon" aria-label="Renomear documento" title="Renomear" onClick={() => setRenomear(doc)}>
                  <Pencil />
                </Button>
              )}
              {canDelete && (
                <ConfirmDelete
                  title="Excluir documento?"
                  description={`"${doc.nome_documento}" será removido da pasta digital.`}
                  onConfirm={() =>
                    del.mutateAsync(doc).then(
                      () => toast.success("Documento excluído."),
                      (e) => toast.error(friendlyError(e)),
                    )
                  }
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Excluir documento" className="text-muted-foreground hover:text-destructive">
                      <Trash2 />
                    </Button>
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <VisualizarDocumentoDialog doc={visualizar} onOpenChange={(o) => !o && setVisualizar(null)} onDownload={downloadDoc} />
      <RenomearDocumentoDialog doc={renomear} processoId={processoId} onOpenChange={(o) => !o && setRenomear(null)} />
    </div>
  );
}
