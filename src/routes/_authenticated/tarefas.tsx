import { createFileRoute, Link } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { KanbanSquare, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { PrazoBadge, StatusTarefaBadge } from "@/components/common/status-badges";
import { tarefasQueryOptions } from "@/features/tarefas/api";
import { KanbanBoard } from "@/features/tarefas/kanban-board";
import { TarefaFormDialog } from "@/features/tarefas/tarefa-form-dialog";
import { equipeQueryOptions, useEquipeMap } from "@/features/equipe/api";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { urgenciaPrazo } from "@/lib/prazos";
import { formatDateTime } from "@/lib/format";
import { processoLabel } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Prazos e Tarefas", match.context.marca) },
      { name: "description", content: "Quadro de prazos e tarefas da equipe com responsáveis e datas fatais." },
      { property: "og:title", content: tituloPagina("Prazos e Tarefas", match.context.marca) },
      { property: "og:description", content: "Quadro de prazos e tarefas da equipe com responsáveis e datas fatais." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(tarefasQueryOptions()),
      context.queryClient.ensureQueryData(equipeQueryOptions()),
    ]),
  pendingComponent: () => <PageSkeleton variant="kanban" />,
  component: TarefasPage,
});

function TarefasPage() {
  const user = useCurrentUser();
  const { data: tarefas } = useSuspenseQuery(tarefasQueryOptions());
  const { staff, map } = useEquipeMap();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [busca, setBusca] = useState("");
  const [responsavel, setResponsavel] = useState("todos");
  const [urgencia, setUrgencia] = useState("todas");

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return tarefas.filter((t) => {
      if (responsavel === "meus" && t.responsavel_id !== user.id) return false;
      if (responsavel !== "todos" && responsavel !== "meus" && t.responsavel_id !== responsavel) return false;
      if (urgencia !== "todas") {
        const u = urgenciaPrazo(t.data_fatal, t.status);
        if (urgencia === "atrasadas" && u !== "vencido") return false;
        if (urgencia === "semana" && !(u === "hoje" || u === "proximo")) return false;
      }
      return !q || t.titulo.toLowerCase().includes(q) || (t.processo ? processoLabel(t.processo).toLowerCase().includes(q) || !!t.processo.numero_cnj?.includes(q) : false) || t.descricao?.toLowerCase().includes(q);
    });
  }, [tarefas, busca, responsavel, urgencia, user.id]);

  return (
    <PageContainer className="max-w-[1500px]">
      <PageHeader
        eyebrow="Pauta da equipe"
        title="Prazos e tarefas"
        description="Arraste os cards entre as colunas para atualizar o andamento. Cada tarefa tem um responsável e uma data fatal."
        actions={
          <TarefaFormDialog
            trigger={
              <Button variant="brass">
                <Plus /> Nova tarefa
              </Button>
            }
          />
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título, descrição ou número do processo" className="pl-9" />
        </div>
        <Select value={responsavel} onValueChange={setResponsavel}>
          <SelectTrigger className="lg:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda a equipe</SelectItem>
            <SelectItem value="meus">Atribuídas a mim</SelectItem>
            {staff
              .filter((m) => m.id !== user.id)
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={urgencia} onValueChange={setUrgencia}>
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Qualquer prazo</SelectItem>
            <SelectItem value="atrasadas">Vencidos</SelectItem>
            <SelectItem value="semana">Próximos 3 dias</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "kanban" | "lista")} variant="outline">
          <ToggleGroupItem value="kanban" aria-label="Visualizar em quadro">
            <KanbanSquare className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="lista" aria-label="Visualizar em lista">
            <List className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {tarefas.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Nenhuma tarefa ainda"
          description="Crie a primeira tarefa e atribua a um membro da equipe."
          action={<TarefaFormDialog trigger={<Button><Plus /> Criar tarefa</Button>} />}
        />
      ) : view === "kanban" ? (
        <KanbanBoard tarefas={filtradas} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Tarefa</TableHead>
                <TableHead className="hidden md:table-cell">Processo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data fatal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <TarefaFormDialog
                      tarefa={t}
                      trigger={<button className="text-left font-medium hover:underline">{t.titulo}</button>}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {t.processo ? (
                      <Link to="/processos/$processoId" params={{ processoId: t.processo.id }} className="text-xs text-primary hover:underline">
                        {processoLabel(t.processo)}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Interna</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{(t.responsavel_id && map.get(t.responsavel_id)?.nome) || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs text-muted-foreground">{formatDateTime(t.data_fatal)}</span>
                      <PrazoBadge dataFatal={t.data_fatal} status={t.status} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusTarefaBadge status={t.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma tarefa para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
