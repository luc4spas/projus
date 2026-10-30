import { createFileRoute, Link } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Briefcase, CalendarCheck2, ListTodo, Plus, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState, PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { PrazoBadge, StatusTarefaBadge } from "@/components/common/status-badges";
import { dashboardQueryOptions } from "@/features/dashboard/api";
import { equipeQueryOptions, useEquipeMap } from "@/features/equipe/api";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { TarefaFormDialog } from "@/features/tarefas/tarefa-form-dialog";
import { formatDiaMes, formatDateTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { processoLabel } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Painel", match.context.marca) },
      { name: "description", content: "Indicadores do escritório e prazos iminentes da equipe." },
      { property: "og:title", content: tituloPagina("Painel", match.context.marca) },
      { property: "og:description", content: "Indicadores do escritório e prazos iminentes da equipe." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(dashboardQueryOptions()),
      context.queryClient.ensureQueryData(equipeQueryOptions()),
    ]),
  pendingComponent: () => <PageSkeleton variant="dashboard" />,
  component: DashboardPage,
});

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function DashboardPage() {
  const user = useCurrentUser();
  const { data } = useSuspenseQuery(dashboardQueryOptions());
  const { map } = useEquipeMap();
  const maxFase = Math.max(1, ...data.porFase.map((f) => f.total));

  return (
    <PageContainer>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        title={`${saudacao()}, ${user.nome.split(" ")[0]}`}
        description="Visão geral dos processos, da carteira de clientes e dos prazos que exigem atenção."
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Briefcase} label="Processos ativos" value={data.processosAtivos} to="/processos" />
        <Kpi icon={ListTodo} label="Tarefas pendentes da equipe" value={data.tarefasPendentes} to="/tarefas" />
        <Kpi icon={Users} label="Total de clientes" value={data.totalClientes} to="/clientes" />
        <Kpi icon={AlertTriangle} label="Prazos vencidos" value={data.prazosVencidos} to="/tarefas" tone={data.prazosVencidos > 0 ? "alert" : "default"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border bg-card shadow-card lg:col-span-2">
          <header className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold">Prazos iminentes</h2>
              <p className="text-xs text-muted-foreground">Ordenados pela data fatal</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tarefas">
                Ver todos <ArrowRight />
              </Link>
            </Button>
          </header>
          {data.prazosIminentes.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarCheck2} title="Nenhum prazo em aberto" description="Todos os prazos da sua visão estão cumpridos." />
            </div>
          ) : (
            <ul className="divide-y">
              {data.prazosIminentes.map((t) => {
                const resp = t.responsavel_id ? map.get(t.responsavel_id) : undefined;
                return (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-md border bg-background py-1.5">
                      <span className="font-display text-lg font-semibold leading-none">{formatDiaMes(t.data_fatal).split(" ")[0]}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{formatDiaMes(t.data_fatal).split(" ")[1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.titulo}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.processo ? <span>{processoLabel(t.processo)}</span> : "Tarefa interna"} · {formatDateTime(t.data_fatal)}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <StatusTarefaBadge status={t.status} />
                    </div>
                    <PrazoBadge dataFatal={t.data_fatal} status={t.status} />
                    <Avatar className="size-7" title={resp?.nome}>
                      <AvatarFallback className="bg-secondary text-[10px] font-semibold">{initials(resp?.nome)}</AvatarFallback>
                    </Avatar>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-card">
          <h2 className="text-xl font-semibold">Processos por fase</h2>
          <p className="text-xs text-muted-foreground">Distribuição da carteira</p>
          {data.porFase.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Nenhum processo cadastrado.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {data.porFase.map((f) => (
                <li key={f.fase}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span>{f.fase}</span>
                    <span className="font-medium tabular-nums">{f.total}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", f.fase === "Arquivado" ? "bg-muted-foreground/40" : "bg-primary")}
                      style={{ width: `${(f.total / maxFase) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  to,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  to: "/processos" | "/tarefas" | "/clientes";
  tone?: "default" | "alert";
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-lg border bg-card p-5 shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            tone === "alert" ? "bg-status-vencido-soft text-status-vencido" : "bg-brass-soft text-brass-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p className={cn("mt-4 font-display text-4xl font-semibold tabular-nums", tone === "alert" && "text-status-vencido")}>{value}</p>
      <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-brass transition-transform group-hover:scale-x-100" />
    </Link>
  );
}
