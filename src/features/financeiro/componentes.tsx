import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, Download, FileQuestion, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { nomeComprovante, statusEfetivo, type StatusTransacao } from "@/lib/financeiro";
import { tipoPreview } from "@/lib/arquivos";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { getComprovanteUrl } from "./api";

const STATUS_VARIANT: Record<StatusTransacao, "cumprido" | "pendente" | "vencido"> = {
  Pago: "cumprido",
  Pendente: "pendente",
  Atrasado: "vencido",
};

export function StatusTransacaoBadge({ status, dataVencimento }: { status: string; dataVencimento: string }) {
  const efetivo = statusEfetivo({ status, data_vencimento: dataVencimento });
  const Icon = efetivo === "Pago" ? CheckCircle2 : efetivo === "Atrasado" ? AlertTriangle : CircleDashed;
  return (
    <Badge variant={STATUS_VARIANT[efetivo]}>
      <Icon className="size-3" />
      {efetivo}
    </Badge>
  );
}

export function ValorTransacao({ tipo, valor, className }: { tipo: string; valor: number; className?: string }) {
  const receita = tipo === "Receita";
  return (
    <span className={cn("whitespace-nowrap font-medium tabular-nums", receita ? "text-status-cumprido" : "text-status-vencido", className)}>
      {receita ? "+ " : "− "}
      {formatCurrency(valor)}
    </span>
  );
}

export async function baixarComprovante(path: string) {
  try {
    const link = document.createElement("a");
    link.href = await getComprovanteUrl(path, nomeComprovante(path));
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    toast.error(friendlyError(e, "Não foi possível baixar o comprovante."));
  }
}

/** Visualização do comprovante dentro do sistema (PDF e imagens). */
export function ComprovanteDialog({ path, onOpenChange }: { path: string | null; onOpenChange: (open: boolean) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  const nome = nomeComprovante(path);
  const tipo = path ? tipoPreview(path) : null;

  useEffect(() => {
    setUrl(null);
    setErro(false);
    if (!path || !tipo) return;
    let ativo = true;
    getComprovanteUrl(path).then(
      (u) => ativo && setUrl(u),
      () => ativo && setErro(true),
    );
    return () => {
      ativo = false;
    };
  }, [path, tipo]);

  return (
    <Dialog open={!!path} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-3 p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate text-lg">Comprovante · {nome}</DialogTitle>
          <DialogDescription className="sr-only">Visualização do comprovante do lançamento</DialogDescription>
        </DialogHeader>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
          {!tipo || erro ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <FileQuestion className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {erro ? "Não foi possível carregar o comprovante." : "Este tipo de arquivo não pode ser visualizado aqui. Faça o download para abrir."}
              </p>
            </div>
          ) : !url ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : tipo === "imagem" ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <img src={url} alt={nome} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <iframe src={url} title={nome} className="h-full w-full bg-card" />
          )}
        </div>
        <DialogFooter>
          {path && (
            <Button variant="outline" onClick={() => baixarComprovante(path)}>
              <Download /> Baixar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MiniResumo({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positivo" | "negativo" | "alerta";
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-2xl font-semibold tabular-nums",
          tone === "positivo" && "text-status-cumprido",
          tone === "negativo" && "text-status-vencido",
          tone === "alerta" && "text-status-pendente",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
