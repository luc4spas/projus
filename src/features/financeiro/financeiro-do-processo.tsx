import { useQuery } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/page";
import { usePermissions } from "@/features/auth/use-current-user";
import { formatCurrency } from "@/lib/format";
import { resumoFinanceiro } from "@/lib/financeiro";
import { transacoesDoProcessoQueryOptions } from "./api";
import { MiniResumo } from "./componentes";
import { TabelaTransacoes } from "./tabela-transacoes";
import { TransacaoFormDialog } from "./transacao-form-dialog";

/** Aba "Financeiro" do processo: só os lançamentos vinculados a ele. */
export function FinanceiroDoProcesso({ processoId, clienteId }: { processoId: string; clienteId: string | null }) {
  const { data, isLoading } = useQuery(transacoesDoProcessoQueryOptions(processoId));
  const { isAdmin } = usePermissions();
  const r = resumoFinanceiro(data ?? []);

  const novo = isAdmin ? (
    <TransacaoFormDialog
      processoId={processoId}
      clienteId={clienteId}
      trigger={
        <Button size="sm">
          <Plus /> Novo lançamento
        </Button>
      }
    />
  ) : null;

  if (isLoading) return <Skeleton className="h-48 rounded-lg" />;

  if (!data?.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sem lançamentos"
        description={
          isAdmin
            ? "Registre custas processuais, honorários e outros valores deste processo."
            : "Nenhum valor financeiro foi lançado para este processo."
        }
        action={novo}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniResumo label="Receitas" value={formatCurrency(r.receitaTotal)} hint={`${formatCurrency(r.receitaRecebida)} recebidos`} tone="positivo" />
        <MiniResumo label="Despesas" value={formatCurrency(r.despesaTotal)} hint={`${formatCurrency(r.despesaPaga)} pagas`} tone="negativo" />
        <MiniResumo label="Saldo previsto" value={formatCurrency(r.saldoPrevisto)} hint={`Realizado: ${formatCurrency(r.saldoRealizado)}`} />
        <MiniResumo
          label="Em atraso"
          value={formatCurrency(r.valorAtrasado)}
          hint={r.qtdAtrasadas ? `${r.qtdAtrasadas} lançamento(s)` : "Nada em atraso"}
          tone={r.qtdAtrasadas ? "negativo" : "default"}
        />
      </div>
      {novo && <div className="flex justify-end">{novo}</div>}
      <TabelaTransacoes transacoes={data} podeEditar={isAdmin} mostrarProcesso={false} />
    </div>
  );
}
