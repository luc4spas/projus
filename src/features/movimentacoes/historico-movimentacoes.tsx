import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { History, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/page";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { friendlyError } from "@/lib/errors";
import { formatDataMovimentacao } from "@/lib/movimentacoes";
import { useEquipeMap } from "@/features/equipe/api";
import { usePermissions } from "@/features/auth/use-current-user";
import { movimentacoesQueryOptions, useDeleteMovimentacao, type Movimentacao } from "./api";
import { MovimentacaoFormDialog } from "./movimentacao-form-dialog";

export function HistoricoMovimentacoes({ processoId }: { processoId: string }) {
  const { data: lista } = useSuspenseQuery(movimentacoesQueryOptions(processoId));
  const { map } = useEquipeMap();
  const { user, isAdmin, isStaff, canDelete } = usePermissions();
  const del = useDeleteMovimentacao(processoId);
  const [form, setForm] = useState<{ open: boolean; mov: Movimentacao | null }>({ open: false, mov: null });

  const podeEditar = (m: Movimentacao) => isAdmin || (isStaff && m.autor_id === user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {lista.length ? `${lista.length} movimentaç${lista.length === 1 ? "ão" : "ões"} registrada${lista.length === 1 ? "" : "s"}` : ""}
        </p>
        {isStaff && (
          <Button size="sm" onClick={() => setForm({ open: true, mov: null })}>
            <Plus /> Nova movimentação
          </Button>
        )}
      </div>

      {!lista.length ? (
        <EmptyState icon={History} title="Sem movimentações" description="Registre cada andamento do processo com a data em que aconteceu." />
      ) : (
        <ol className="relative space-y-0 rounded-lg border bg-card p-6 shadow-card">
          {lista.map((m, i) => {
            const autor = m.autor_id ? map.get(m.autor_id)?.nome : undefined;
            const ultima = i === lista.length - 1;
            return (
              <li key={m.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!ultima && <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-border" />}
                <span
                  aria-hidden
                  className={i === 0 ? "relative mt-1.5 size-[11px] shrink-0 rounded-full bg-brass ring-4 ring-brass-soft" : "relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-muted-foreground/40 bg-card"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <time dateTime={m.data_movimentacao} className="font-mono text-sm font-semibold">
                      {formatDataMovimentacao(m.data_movimentacao)}
                    </time>
                    {i === 0 && <span className="eyebrow text-brass">Mais recente</span>}
                    {autor && <span className="text-xs text-muted-foreground">por {autor}</span>}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{m.descricao}</p>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  {podeEditar(m) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar movimentação"
                      title="Editar"
                      onClick={() => setForm({ open: true, mov: m })}
                    >
                      <Pencil />
                    </Button>
                  )}
                  {canDelete && (
                    <ConfirmDelete
                      title="Excluir movimentação?"
                      description={`A movimentação de ${formatDataMovimentacao(m.data_movimentacao)} será removida do histórico.`}
                      onConfirm={() =>
                        del.mutateAsync(m.id).then(
                          () => toast.success("Movimentação excluída."),
                          (e) => toast.error(friendlyError(e)),
                        )
                      }
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Excluir movimentação" className="text-muted-foreground hover:text-destructive">
                          <Trash2 />
                        </Button>
                      }
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <MovimentacaoFormDialog
        processoId={processoId}
        movimentacao={form.mov}
        open={form.open}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
      />
    </div>
  );
}

/** Resumo exibido na aba de detalhes: a movimentação mais recente. */
export function UltimaMovimentacao({ processoId }: { processoId: string }) {
  const { data: lista } = useSuspenseQuery(movimentacoesQueryOptions(processoId));
  const ultima = lista[0];
  return (
    <div className="sm:col-span-2">
      <dt className="eyebrow">Último andamento</dt>
      <dd className="mt-1 text-sm leading-relaxed">
        {ultima ? (
          <>
            <span className="font-mono font-semibold">{formatDataMovimentacao(ultima.data_movimentacao)}</span>
            {" — "}
            <span className="whitespace-pre-line">{ultima.descricao}</span>
          </>
        ) : (
          "—"
        )}
      </dd>
    </div>
  );
}
