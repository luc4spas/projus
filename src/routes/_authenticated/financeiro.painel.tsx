import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Plus, Scale, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { transacoesQueryOptions } from "@/features/financeiro/api";
import { FluxoCaixaChart } from "@/features/financeiro/fluxo-caixa-chart";
import { ValorTransacao } from "@/features/financeiro/componentes";
import { TransacaoFormDialog } from "@/features/financeiro/transacao-form-dialog";
import { formatCurrency } from "@/lib/format";
import { anosDisponiveis, doAno, fluxoMensal, formatDia, hojeDia, resumoFinanceiro, statusEfetivo } from "@/lib/financeiro";
import { tituloPagina } from "@/lib/marca";
import { cn } from "@/lib/utils";

const DESCRICAO = "Fluxo de caixa mensal, receitas, despesas, saldo previsto e inadimplência do escritório.";

export const Route = createFileRoute("/_authenticated/financeiro/painel")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Painel financeiro", match.context.marca) },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: tituloPagina("Painel financeiro", match.context.marca) },
      { property: "og:description", content: DESCRICAO },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(transacoesQueryOptions()),
  pendingComponent: () => <PageSkeleton variant="dashboard" />,
  component: PainelFinanceiroPage,
});

const percentual = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

function PainelFinanceiroPage() {
  const { data: transacoes } = useSuspenseQuery(transacoesQueryOptions());
  const hoje = hojeDia();
  const anos = useMemo(() => anosDisponiveis(transacoes, hoje), [transacoes, hoje]);
  const [ano, setAno] = useState(Number(hoje.slice(0, 4)));

  const doPeriodo = useMemo(() => doAno(transacoes, ano), [transacoes, ano]);
  const r = useMemo(() => resumoFinanceiro(doPeriodo, hoje), [doPeriodo, hoje]);
  const fluxo = useMemo(() => fluxoMensal(transacoes, ano), [transacoes, ano]);
  const atrasadas = useMemo(
    () =>
      transacoes
        .filter((t) => t.tipo === "Receita" && statusEfetivo(t, hoje) === "Atrasado")
        .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
        .slice(0, 6),
    [transacoes, hoje],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Financeiro"
        title="Painel financeiro"
        description="Valores por data de pagamento; o que ainda não foi pago entra pela data de vencimento."
        actions={
          <>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger className="w-28" aria-label="Ano">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TransacaoFormDialog
              trigger={
                <Button variant="brass">
                  <Plus /> Novo lançamento
                </Button>
              }
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={ArrowUpRight} label="Receita total" value={formatCurrency(r.receitaTotal)} hint={`${formatCurrency(r.receitaRecebida)} recebidos`} tone="positivo" />
        <Kpi icon={ArrowDownRight} label="Despesas" value={formatCurrency(r.despesaTotal)} hint={`${formatCurrency(r.despesaPaga)} pagas`} tone="negativo" />
        <Kpi
          icon={Scale}
          label="Saldo previsto"
          value={formatCurrency(r.saldoPrevisto)}
          hint={`Realizado até agora: ${formatCurrency(r.saldoRealizado)}`}
          tone={r.saldoPrevisto < 0 ? "negativo" : "default"}
        />
        <Kpi
          icon={AlertTriangle}
          label="Inadimplência"
          value={r.inadimplencia == null ? "—" : percentual.format(r.inadimplencia)}
          hint={r.qtdAtrasadas ? `${formatCurrency(r.valorAtrasado)} em atraso · ${r.qtdAtrasadas} lançamento(s)` : "Nenhuma receita em atraso"}
          tone={r.qtdAtrasadas ? "negativo" : "default"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-xl font-semibold">Fluxo de caixa mensal</h2>
          <p className="mb-4 text-xs text-muted-foreground">Receitas e despesas de {ano}, com o saldo acumulado no ano</p>
          <FluxoCaixaChart dados={fluxo} />
        </section>

        <section className="rounded-lg border bg-card shadow-card">
          <header className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold">Receitas em atraso</h2>
              <p className="text-xs text-muted-foreground">Mais antigas primeiro</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/financeiro" search={{ status: "Atrasado" }}>
                Ver todas <ArrowRight />
              </Link>
            </Button>
          </header>
          {atrasadas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <CheckCircle2 className="size-8 text-status-cumprido" />
              <p className="text-sm text-muted-foreground">Nenhum cliente com pagamento atrasado.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {atrasadas.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.descricao}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.cliente?.nome ?? "Sem cliente"} · venceu em {formatDia(t.data_vencimento)}
                    </p>
                  </div>
                  <ValorTransacao tipo={t.tipo} valor={Number(t.valor)} className="text-sm" />
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
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "positivo" | "negativo";
}) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            tone === "positivo" && "bg-status-cumprido-soft text-status-cumprido",
            tone === "negativo" && "bg-status-vencido-soft text-status-vencido",
            tone === "default" && "bg-brass-soft text-brass-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p
        className={cn(
          "mt-4 font-display text-3xl font-semibold tabular-nums",
          tone === "positivo" && "text-status-cumprido",
          tone === "negativo" && "text-status-vencido",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
