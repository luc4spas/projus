import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCheck, Eye, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { processoLabel } from "@/lib/domain";
import { friendlyError } from "@/lib/errors";
import { formatDia } from "@/lib/financeiro";
import { useDeleteTransacao, useMarcarComoPago, type Transacao } from "./api";
import { ComprovanteDialog, StatusTransacaoBadge, ValorTransacao } from "./componentes";
import { TransacaoFormDialog } from "./transacao-form-dialog";

export function TabelaTransacoes({
  transacoes,
  podeEditar,
  mostrarProcesso = true,
  vazio = "Nenhum lançamento encontrado.",
}: {
  transacoes: Transacao[];
  podeEditar: boolean;
  mostrarProcesso?: boolean;
  vazio?: string;
}) {
  const [comprovante, setComprovante] = useState<string | null>(null);
  const del = useDeleteTransacao();
  const pagar = useMarcarComoPago();

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-28">Vencimento</TableHead>
            <TableHead>Descrição</TableHead>
            {mostrarProcesso && <TableHead className="hidden lg:table-cell">Cliente / Processo</TableHead>}
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Pagamento</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transacoes.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="tabular-nums text-sm">{formatDia(t.data_vencimento)}</TableCell>
              <TableCell>
                <p className="font-medium">{t.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {t.tipo} · {t.categoria?.nome ?? "Sem categoria"}
                </p>
              </TableCell>
              {mostrarProcesso && (
                <TableCell className="hidden max-w-64 text-sm lg:table-cell">
                  <p className="truncate">{t.cliente?.nome ?? "—"}</p>
                  {t.processo && (
                    <Link
                      to="/processos/$processoId"
                      params={{ processoId: t.processo.id }}
                      className="block truncate text-xs text-primary hover:underline"
                    >
                      {processoLabel(t.processo)}
                    </Link>
                  )}
                </TableCell>
              )}
              <TableCell className="text-right">
                <ValorTransacao tipo={t.tipo} valor={Number(t.valor)} />
              </TableCell>
              <TableCell>
                <StatusTransacaoBadge status={t.status} dataVencimento={t.data_vencimento} />
              </TableCell>
              <TableCell className="hidden tabular-nums text-sm text-muted-foreground md:table-cell">{formatDia(t.data_pagamento)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {t.comprovante_url ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ver comprovante de ${t.descricao}`}
                      title="Ver comprovante"
                      onClick={() => setComprovante(t.comprovante_url)}
                    >
                      <Eye />
                    </Button>
                  ) : (
                    <span className="inline-flex size-9 items-center justify-center text-muted-foreground/30" title="Sem comprovante">
                      <Paperclip className="size-4" />
                    </span>
                  )}
                  {podeEditar && (
                    <>
                      {t.status !== "Pago" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Marcar ${t.descricao} como pago`}
                          title="Marcar como pago hoje"
                          className="text-status-cumprido"
                          disabled={pagar.isPending}
                          onClick={() =>
                            pagar.mutate(t.id, {
                              onSuccess: () => toast.success("Lançamento marcado como pago."),
                              onError: (e) => toast.error(friendlyError(e)),
                            })
                          }
                        >
                          <CheckCheck />
                        </Button>
                      )}
                      <TransacaoFormDialog
                        transacao={t}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Editar ${t.descricao}`} title="Editar">
                            <Pencil />
                          </Button>
                        }
                      />
                      <ConfirmDelete
                        title="Excluir lançamento?"
                        description={`"${t.descricao}" e o comprovante anexado serão removidos.`}
                        onConfirm={() =>
                          del.mutateAsync(t).then(
                            () => toast.success("Lançamento excluído."),
                            (e) => toast.error(friendlyError(e)),
                          )
                        }
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Excluir ${t.descricao}`} className="text-muted-foreground hover:text-destructive">
                            <Trash2 />
                          </Button>
                        }
                      />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {transacoes.length === 0 && (
            <TableRow>
              <TableCell colSpan={mostrarProcesso ? 7 : 6} className="py-10 text-center text-sm text-muted-foreground">
                {vazio}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <ComprovanteDialog path={comprovante} onOpenChange={(o) => !o && setComprovante(null)} />
    </div>
  );
}
