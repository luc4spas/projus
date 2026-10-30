import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { MesFluxo } from "@/lib/financeiro";

const config = {
  receitas: { label: "Receitas", color: "var(--status-cumprido)" },
  despesas: { label: "Despesas", color: "var(--status-vencido)" },
  acumulado: { label: "Saldo acumulado", color: "var(--brass)" },
} satisfies ChartConfig;

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function FluxoCaixaChart({ dados }: { dados: MesFluxo[] }) {
  return (
    <ChartContainer config={config} className="h-80 w-full">
      <ComposedChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => compacto.format(v)} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<TooltipFluxo />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="receitas" fill="var(--color-receitas)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="despesas" fill="var(--color-despesas)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line dataKey="acumulado" type="monotone" stroke="var(--color-acumulado)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ChartContainer>
  );
}

function TooltipFluxo({ active, payload }: { active?: boolean; payload?: { payload: MesFluxo }[] }) {
  const m = payload?.[0]?.payload;
  if (!active || !m) return null;
  return (
    <div className="min-w-44 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lift">
      <p className="mb-1.5 font-semibold capitalize">{m.mes}</p>
      <Linha cor="var(--status-cumprido)" label="Receitas" valor={m.receitas} />
      <Linha cor="var(--status-vencido)" label="Despesas" valor={m.despesas} />
      <div className="my-1.5 border-t" />
      <Linha label="Saldo do mês" valor={m.saldo} />
      <Linha cor="var(--brass)" label="Acumulado" valor={m.acumulado} />
    </div>
  );
}

function Linha({ cor, label, valor }: { cor?: string; label: string; valor: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {cor && <span className="size-2 rounded-sm" style={{ background: cor }} />}
        {label}
      </span>
      <span className="font-medium tabular-nums">{formatCurrency(valor)}</span>
    </div>
  );
}
