import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, CalendarPlus, FolderOpen, History, ListChecks, Pencil, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageContainer, PageSkeleton } from "@/components/common/page";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { FaseBadge, PrazoBadge, StatusTarefaBadge } from "@/components/common/status-badges";
import { processoQueryOptions, useDeleteProcesso } from "@/features/processos/api";
import { ProcessoFormDialog } from "@/features/processos/processo-form-dialog";
import { PastaDigital } from "@/features/documentos/pasta-digital";
import { movimentacoesQueryOptions } from "@/features/movimentacoes/api";
import { HistoricoMovimentacoes, UltimaMovimentacao } from "@/features/movimentacoes/historico-movimentacoes";
import { tarefasQueryOptions } from "@/features/tarefas/api";
import { FinanceiroDoProcesso } from "@/features/financeiro/financeiro-do-processo";
import { TarefaFormDialog } from "@/features/tarefas/tarefa-form-dialog";
import { equipeQueryOptions, useEquipeMap } from "@/features/equipe/api";
import { usePermissions } from "@/features/auth/use-current-user";
import { formatDocumento } from "@/lib/documento";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { friendlyError } from "@/lib/errors";
import { processoLabel } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/processos/$processoId")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Processo", match.context.marca) },
      { name: "description", content: "Detalhes do caso, histórico de andamentos, pasta digital, prazos e financeiro vinculados." },
      { property: "og:title", content: tituloPagina("Processo", match.context.marca) },
      { property: "og:description", content: "Detalhes do caso, histórico de andamentos, pasta digital, prazos e financeiro vinculados." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context, params }) => {
    const [processo] = await Promise.all([
      context.queryClient.ensureQueryData(processoQueryOptions(params.processoId)),
      context.queryClient.ensureQueryData(equipeQueryOptions()),
      context.queryClient.ensureQueryData(movimentacoesQueryOptions(params.processoId)),
    ]);
    if (!processo) throw notFound();
    return processo;
  },
  pendingComponent: () => <PageSkeleton variant="detail" />,
  notFoundComponent: ProcessoNaoEncontrado,
  component: ProcessoDetalhePage,
});

function ProcessoNaoEncontrado() {
  return (
    <PageContainer>
      <EmptyState
        icon={Briefcase}
        title="Processo indisponível"
        description="Este processo não existe ou você não tem permissão para acessá-lo."
        action={
          <Button asChild variant="outline">
            <Link to="/processos">Voltar aos processos</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}

function ProcessoDetalhePage() {
  const { processoId } = Route.useParams();
  const { data: processo } = useSuspenseQuery(processoQueryOptions(processoId));
  const { map } = useEquipeMap();
  const { canDelete } = usePermissions();
  const del = useDeleteProcesso();
  const navigate = useNavigate();

  if (!processo) return <ProcessoNaoEncontrado />;
  const advogado = processo.advogado_responsavel ? map.get(processo.advogado_responsavel) : undefined;

  return (
    <PageContainer>
      <Link to="/processos" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Processos
      </Link>

      <div className="mb-8 flex flex-col gap-5 rounded-lg border bg-gradient-ink p-6 text-ink-foreground shadow-lift md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brass">
              {processo.numero_cnj ? <span className="font-mono">Nº {processo.numero_cnj}</span> : "Processo sem número CNJ"}
            </span>
            <FaseBadge fase={processo.fase_atual} className="border-ink-foreground/30 text-ink-foreground" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{processoLabel(processo)}</h1>
          <p className="text-sm text-ink-foreground/75">
            {processo.cliente?.nome ?? "Cliente não informado"}
            {processo.tribunal ? ` · ${processo.tribunal}` : ""}
            {processo.comarca ? ` · ${processo.comarca}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <ProcessoFormDialog
            processo={processo}
            trigger={
              <Button variant="brass">
                <Pencil /> Editar
              </Button>
            }
          />
          {canDelete && (
            <ConfirmDelete
              title="Excluir processo?"
              description="O processo, suas tarefas e os registros da pasta digital serão removidos."
              onConfirm={() =>
                del.mutateAsync(processo.id).then(
                  () => {
                    toast.success("Processo excluído.");
                    navigate({ to: "/processos" });
                  },
                  (e) => toast.error(friendlyError(e)),
                )
              }
              trigger={
                <Button variant="outline" className="border-ink-foreground/20 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                  <Trash2 /> Excluir
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Tabs defaultValue="detalhes">
        <TabsList className="mb-6 h-auto flex-wrap justify-start">
          <TabsTrigger value="detalhes">
            <Briefcase className="size-4" /> Detalhes
          </TabsTrigger>
          <TabsTrigger value="andamentos">
            <History className="size-4" /> Andamentos
          </TabsTrigger>
          <TabsTrigger value="pasta">
            <FolderOpen className="size-4" /> Pasta digital
          </TabsTrigger>
          <TabsTrigger value="prazos">
            <ListChecks className="size-4" /> Prazos
          </TabsTrigger>
          <TabsTrigger value="financeiro">
            <Wallet className="size-4" /> Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes">
          <div className="grid gap-6 lg:grid-cols-3">
            <dl className="grid gap-x-6 gap-y-5 rounded-lg border bg-card p-6 shadow-card sm:grid-cols-2 lg:col-span-2">
              <Info label="Número CNJ" value={processo.numero_cnj} />
              <Info label="Tribunal" value={processo.tribunal} />
              <Info label="Comarca" value={processo.comarca} />
              <Info label="Vara" value={processo.vara} />
              <Info label="Sistema" value={processo.sistema} />
              <Info label="Fase atual" value={processo.fase_atual} />
              <Info label="Valor da causa" value={formatCurrency(processo.valor_causa)} />
              <Info label="Advogado responsável" value={advogado?.nome} />
              <Info label="Cadastrado em" value={formatDate(processo.created_at)} />
              <TextoLongo label="Descrição da ação" value={processo.descricao_acao} />
              <UltimaMovimentacao processoId={processo.id} />
            </dl>
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <p className="eyebrow mb-3">Cliente</p>
              {processo.cliente ? (
                <div className="space-y-1">
                  <p className="font-display text-xl font-semibold">{processo.cliente.nome}</p>
                  <p className="font-mono text-xs text-muted-foreground">{formatDocumento(processo.cliente.documento)}</p>
                  <p className="text-sm text-muted-foreground">{processo.cliente.tipo}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não informado</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="andamentos">
          <HistoricoMovimentacoes processoId={processo.id} />
        </TabsContent>

        <TabsContent value="pasta">
          <PastaDigital processoId={processo.id} />
        </TabsContent>

        <TabsContent value="prazos">
          <PrazosDoProcesso processoId={processo.id} />
        </TabsContent>

        <TabsContent value="financeiro">
          <FinanceiroDoProcesso processoId={processo.id} clienteId={processo.cliente_id} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function TextoLongo({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="sm:col-span-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed">{value?.trim() || "—"}</dd>
    </div>
  );
}

function PrazosDoProcesso({ processoId }: { processoId: string }) {
  const { data, isLoading } = useQuery(tarefasQueryOptions(processoId));
  const { map } = useEquipeMap();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TarefaFormDialog
          processoId={processoId}
          trigger={
            <Button size="sm">
              <CalendarPlus /> Novo prazo
            </Button>
          }
        />
      </div>
      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : !data?.length ? (
        <EmptyState icon={ListChecks} title="Sem prazos" description="Nenhuma tarefa ou prazo vinculado a este processo." />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {data.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(t.data_fatal)} · {(t.responsavel_id && map.get(t.responsavel_id)?.nome) || "Sem responsável"}
                </p>
              </div>
              <StatusTarefaBadge status={t.status} />
              <PrazoBadge dataFatal={t.data_fatal} status={t.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
