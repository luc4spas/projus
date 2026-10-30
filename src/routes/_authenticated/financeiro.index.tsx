import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FilterX, Plus, Search, Tags, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { transacoesQueryOptions } from "@/features/financeiro/api";
import { TabelaTransacoes } from "@/features/financeiro/tabela-transacoes";
import { TransacaoFormDialog } from "@/features/financeiro/transacao-form-dialog";
import { CategoriasDialog } from "@/features/financeiro/categorias-dialog";
import { MiniResumo } from "@/features/financeiro/componentes";
import { formatCurrency } from "@/lib/format";
import { hojeDia, resumoFinanceiro, statusEfetivo, STATUS_TRANSACAO, TIPOS_TRANSACAO } from "@/lib/financeiro";
import { tituloPagina } from "@/lib/marca";

const DESCRICAO = "Lançamentos de receitas e despesas do escritório, com filtros e comprovantes.";
const TODOS = "todos";

export const Route = createFileRoute("/_authenticated/financeiro/")({
  validateSearch: (search: Record<string, unknown>): { status?: string } => {
    const s = search["status"];
    return typeof s === "string" && (STATUS_TRANSACAO as readonly string[]).includes(s) ? { status: s } : {};
  },
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Financeiro", match.context.marca) },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: tituloPagina("Financeiro", match.context.marca) },
      { property: "og:description", content: DESCRICAO },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(transacoesQueryOptions()),
  pendingComponent: () => <PageSkeleton />,
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { data: transacoes } = useSuspenseQuery(transacoesQueryOptions());
  const search = Route.useSearch();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>(search.status ?? TODOS);
  const [tipo, setTipo] = useState<string>(TODOS);
  const [cliente, setCliente] = useState<string>(TODOS);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const clientes = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of transacoes) if (t.cliente) m.set(t.cliente.id, t.cliente.nome);
    return [...m].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [transacoes]);

  const filtradas = useMemo(() => {
    const hoje = hojeDia();
    const q = busca.trim().toLowerCase();
    return transacoes.filter(
      (t) =>
        (status === TODOS || statusEfetivo(t, hoje) === status) &&
        (tipo === TODOS || t.tipo === tipo) &&
        (cliente === TODOS || t.cliente_id === cliente) &&
        (!de || t.data_vencimento >= de) &&
        (!ate || t.data_vencimento <= ate) &&
        (!q || t.descricao.toLowerCase().includes(q) || t.categoria?.nome.toLowerCase().includes(q)),
    );
  }, [transacoes, busca, status, tipo, cliente, de, ate]);

  const r = resumoFinanceiro(filtradas);
  const temFiltro = !!busca || status !== TODOS || tipo !== TODOS || cliente !== TODOS || !!de || !!ate;
  const limpar = () => {
    setBusca("");
    setStatus(TODOS);
    setTipo(TODOS);
    setCliente(TODOS);
    setDe("");
    setAte("");
  };

  const novo = (
    <TransacaoFormDialog
      trigger={
        <Button>
          <Plus /> Novo lançamento
        </Button>
      }
    />
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Lançamentos"
        title="Financeiro"
        description="Receitas e despesas do escritório. Pendentes com vencimento passado aparecem como atrasados."
        actions={
          <>
            <CategoriasDialog
              trigger={
                <Button variant="outline">
                  <Tags /> Categorias
                </Button>
              }
            />
            {novo}
          </>
        }
      />

      {transacoes.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhum lançamento" description="Registre honorários, custas e despesas para acompanhar o caixa." action={novo} />
      ) : (
        <>
          <div className="mb-4 grid gap-3 rounded-lg border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative sm:col-span-2">
              <Label htmlFor="busca-fin" className="mb-1.5 block text-xs text-muted-foreground">Busca</Label>
              <Search className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-muted-foreground" />
              <Input id="busca-fin" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Descrição ou categoria" className="pl-9" />
            </div>
            <Filtro label="Status" value={status} onChange={setStatus} opcoes={STATUS_TRANSACAO.map((s) => [s, s])} todos="Todos" />
            <Filtro label="Tipo" value={tipo} onChange={setTipo} opcoes={TIPOS_TRANSACAO.map((s) => [s, s])} todos="Todos" />
            <Filtro label="Cliente" value={cliente} onChange={setCliente} opcoes={clientes} todos="Todos os clientes" className="sm:col-span-2" />
            <div>
              <Label htmlFor="fin-de" className="mb-1.5 block text-xs text-muted-foreground">Vencimento de</Label>
              <Input id="fin-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="fin-ate" className="mb-1.5 block text-xs text-muted-foreground">até</Label>
              <Input id="fin-ate" type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} />
            </div>
            <div className="flex items-end lg:col-span-4 lg:justify-end">
              <Button variant="ghost" size="sm" onClick={limpar} disabled={!temFiltro}>
                <FilterX /> Limpar filtros
              </Button>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <MiniResumo label="Receitas no filtro" value={formatCurrency(r.receitaTotal)} tone="positivo" />
            <MiniResumo label="Despesas no filtro" value={formatCurrency(r.despesaTotal)} tone="negativo" />
            <MiniResumo label="Saldo" value={formatCurrency(r.saldoPrevisto)} tone={r.saldoPrevisto < 0 ? "negativo" : "default"} />
          </div>

          <TabelaTransacoes transacoes={filtradas} podeEditar vazio="Nenhum lançamento para os filtros aplicados." />
          <p className="mt-3 text-xs text-muted-foreground">
            {filtradas.length} de {transacoes.length} lançamentos
          </p>
        </>
      )}
    </PageContainer>
  );
}

function Filtro({
  label,
  value,
  onChange,
  opcoes,
  todos,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opcoes: readonly (readonly [string, string])[];
  todos: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{todos}</SelectItem>
          {opcoes.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
