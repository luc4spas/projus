import { useState, type DragEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarClock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PrazoBadge } from "@/components/common/status-badges";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { processoLabel, STATUS_TAREFA, type StatusTarefa } from "@/lib/domain";
import { formatDateTime, initials } from "@/lib/format";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useEquipeMap } from "@/features/equipe/api";
import { usePermissions } from "@/features/auth/use-current-user";
import { useDeleteTarefa, useMoveTarefa, type TarefaComProcesso } from "./api";
import { TarefaFormDialog } from "./tarefa-form-dialog";

const COLUMN_STYLE: Record<StatusTarefa, string> = {
  Pendente: "bg-status-pendente",
  "Em Andamento": "bg-status-andamento",
  Cumprido: "bg-status-cumprido",
};

export function KanbanBoard({ tarefas }: { tarefas: TarefaComProcesso[] }) {
  const move = useMoveTarefa();
  const [dragOver, setDragOver] = useState<StatusTarefa | null>(null);

  const handleDrop = (status: StatusTarefa) => (e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/tarefa-id");
    const current = tarefas.find((t) => t.id === id);
    if (!current || current.status === status) return;
    moveTo(id, status);
  };

  const moveTo = (id: string, status: StatusTarefa) =>
    move.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`Movida para "${status}".`),
        onError: (e) => toast.error(friendlyError(e, "Não foi possível mover a tarefa.")),
      },
    );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STATUS_TAREFA.map((status) => {
        const items = tarefas.filter((t) => t.status === status);
        return (
          <section
            key={status}
            aria-label={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
            onDrop={handleDrop(status)}
            className={cn(
              "flex min-h-[420px] flex-col rounded-lg border bg-muted/40 transition-colors",
              dragOver === status && "kanban-drop-active",
            )}
          >
            <header className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", COLUMN_STYLE[status])} />
                <h2 className="font-sans text-sm font-semibold">{status}</h2>
              </div>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {items.length}
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {items.map((t) => (
                <TarefaCard key={t.id} tarefa={t} onMove={moveTo} />
              ))}
              {items.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Arraste tarefas para cá
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TarefaCard({ tarefa, onMove }: { tarefa: TarefaComProcesso; onMove: (id: string, s: StatusTarefa) => void }) {
  const { map } = useEquipeMap();
  const { canDelete } = usePermissions();
  const del = useDeleteTarefa();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const responsavel = tarefa.responsavel_id ? map.get(tarefa.responsavel_id) : undefined;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/tarefa-id", tarefa.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="group cursor-grab rounded-md border bg-card p-3.5 shadow-card transition-shadow hover:shadow-lift active:cursor-grabbing"
    >
      <TarefaFormDialog tarefa={tarefa} open={editing} onOpenChange={setEditing} />
      {canDelete && (
        <ConfirmDelete
          open={deleting}
          onOpenChange={setDeleting}
          title="Excluir tarefa?"
          description={`"${tarefa.titulo}" será removida permanentemente.`}
          onConfirm={() =>
            del.mutateAsync(tarefa.id).then(
              () => toast.success("Tarefa excluída."),
              (e) => toast.error(friendlyError(e)),
            )
          }
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className={cn("font-sans text-sm font-semibold leading-snug", tarefa.status === "Cumprido" && "text-muted-foreground line-through")}>
          {tarefa.titulo}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-1 -mt-1 size-7 shrink-0" aria-label="Ações da tarefa">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Mover para</DropdownMenuLabel>
            {STATUS_TAREFA.filter((s) => s !== tarefa.status).map((s) => (
              <DropdownMenuItem key={s} onClick={() => onMove(tarefa.id, s)}>
                {s}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Editar
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem onClick={() => setDeleting(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="size-4" /> Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {tarefa.descricao && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tarefa.descricao}</p>}

      {tarefa.processo && (
        <Link
          to="/processos/$processoId"
          params={{ processoId: tarefa.processo.id }}
          className="mt-2 inline-block text-[11px] text-primary underline-offset-2 hover:underline"
        >
          {processoLabel(tarefa.processo)}
        </Link>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarClock className="size-3.5 shrink-0" />
          <span className="truncate">{formatDateTime(tarefa.data_fatal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <PrazoBadge dataFatal={tarefa.data_fatal} status={tarefa.status} />
          <Avatar className="size-6" title={responsavel?.nome ?? "Sem responsável"}>
            <AvatarFallback className="bg-secondary text-[10px] font-semibold">{initials(responsavel?.nome)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </article>
  );
}
