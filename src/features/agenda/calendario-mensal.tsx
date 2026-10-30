import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { addMonths, format, isSameMonth, isToday, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrazoBadge, StatusTarefaBadge } from "@/components/common/status-badges";
import { agruparPorDia, chaveDia, diasDaGrade } from "@/lib/agenda";
import { urgenciaPrazo, type Urgencia } from "@/lib/prazos";
import { processoLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { useEquipeMap } from "@/features/equipe/api";
import type { TarefaComProcesso } from "@/features/tarefas/api";
import { TarefaFormDialog } from "@/features/tarefas/tarefa-form-dialog";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_POR_DIA = 3;

const CHIP: Record<Urgencia, string> = {
  vencido: "border-status-vencido bg-status-vencido-soft text-status-vencido",
  hoje: "border-status-vencido bg-status-vencido-soft text-status-vencido",
  proximo: "border-status-pendente bg-status-pendente-soft text-status-pendente",
  futuro: "border-status-andamento bg-status-andamento-soft text-status-andamento",
  cumprido: "border-status-cumprido bg-status-cumprido-soft text-status-cumprido line-through opacity-70",
};
const DOT: Record<Urgencia, string> = {
  vencido: "bg-status-vencido",
  hoje: "bg-status-vencido",
  proximo: "bg-status-pendente",
  futuro: "bg-status-andamento",
  cumprido: "bg-status-cumprido",
};

const tituloMes = (d: Date) => {
  const t = format(d, "MMMM 'de' yyyy", { locale: ptBR });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const hora = (iso: string) => format(new Date(iso), "HH:mm");

export function CalendarioMensal({ tarefas }: { tarefas: TarefaComProcesso[] }) {
  const [mes, setMes] = useState(() => new Date());
  const [selecionado, setSelecionado] = useState(() => new Date());
  const [editando, setEditando] = useState<TarefaComProcesso | null>(null);
  const { map } = useEquipeMap();

  const dias = useMemo(() => diasDaGrade(mes), [mes]);
  const porDia = useMemo(() => agruparPorDia(tarefas), [tarefas]);
  const doDia = porDia.get(chaveDia(selecionado)) ?? [];

  const irPara = (d: Date) => {
    setMes(d);
    setSelecionado(d);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="overflow-hidden rounded-lg border bg-card shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="font-display text-xl font-semibold">{tituloMes(mes)}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => irPara(new Date())}>
              Hoje
            </Button>
            <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setMes((m) => subMonths(m, 1))}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setMes((m) => addMonths(m, 1))}>
              <ChevronRight />
            </Button>
          </div>
        </header>
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const k = chaveDia(dia);
            const itens = porDia.get(k) ?? [];
            const foraDoMes = !isSameMonth(dia, mes);
            const ativo = k === chaveDia(selecionado);
            return (
              <div
                key={k}
                role="button"
                tabIndex={0}
                aria-label={`${format(dia, "d 'de' MMMM", { locale: ptBR })}, ${itens.length} prazo(s)`}
                aria-pressed={ativo}
                onClick={() => setSelecionado(dia)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelecionado(dia);
                  }
                }}
                className={cn(
                  "group min-h-16 cursor-pointer border-b border-r p-1.5 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring md:min-h-28",
                  foraDoMes && "bg-muted/20 text-muted-foreground",
                  ativo && "bg-brass-soft/60 hover:bg-brass-soft/70",
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                      isToday(dia) && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(dia, "d")}
                  </span>
                  {itens.length > 0 && <span className="text-[10px] text-muted-foreground md:hidden">{itens.length}</span>}
                </div>
                <div className="flex flex-wrap gap-1 md:hidden">
                  {itens.slice(0, 4).map((t) => (
                    <span key={t.id} className={cn("size-1.5 rounded-full", DOT[urgenciaPrazo(t.data_fatal, t.status)])} />
                  ))}
                </div>
                <ul className="hidden space-y-1 md:block">
                  {itens.slice(0, MAX_POR_DIA).map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditando(t);
                        }}
                        title={`${hora(t.data_fatal)} · ${t.titulo}`}
                        className={cn(
                          "block w-full truncate rounded-sm border-l-2 px-1.5 py-0.5 text-left text-[11px] font-medium",
                          CHIP[urgenciaPrazo(t.data_fatal, t.status)],
                        )}
                      >
                        <span className="tabular-nums opacity-80">{hora(t.data_fatal)}</span> {t.titulo}
                      </button>
                    </li>
                  ))}
                  {itens.length > MAX_POR_DIA && (
                    <li className="px-1.5 text-[11px] font-medium text-muted-foreground">+{itens.length - MAX_POR_DIA} mais</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
        <footer className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-[11px] text-muted-foreground">
          <Legenda cor={DOT.vencido} texto="Vencido ou vence hoje" />
          <Legenda cor={DOT.proximo} texto="Próximos 3 dias" />
          <Legenda cor={DOT.futuro} texto="Futuro" />
          <Legenda cor={DOT.cumprido} texto="Cumprido" />
        </footer>
      </section>

      <aside className="h-fit rounded-lg border bg-card shadow-card xl:sticky xl:top-20">
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="eyebrow">{isToday(selecionado) ? "Hoje" : format(selecionado, "EEEE", { locale: ptBR })}</p>
            <p className="font-display text-lg font-semibold">{format(selecionado, "d 'de' MMMM", { locale: ptBR })}</p>
          </div>
          <TarefaFormDialog
            dataInicial={selecionado}
            trigger={
              <Button size="sm" variant="outline">
                <CalendarPlus /> Novo prazo
              </Button>
            }
          />
        </div>
        {doDia.length ? (
          <ul className="divide-y">
            {doDia.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setEditando(t)} className="block w-full px-4 py-3 text-left hover:bg-muted/40">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">{hora(t.data_fatal)}</span>
                    <span>·</span>
                    <span className="truncate">{(t.responsavel_id && map.get(t.responsavel_id)?.nome) || "Sem responsável"}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{t.titulo}</p>
                  {t.processo && (
                    <Link
                      to="/processos/$processoId"
                      params={{ processoId: t.processo.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 block truncate text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {processoLabel(t.processo)}
                    </Link>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusTarefaBadge status={t.status} />
                    <PrazoBadge dataFatal={t.data_fatal} status={t.status} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum prazo neste dia.</p>
        )}
      </aside>

      <TarefaFormDialog
        tarefa={editando ?? undefined}
        open={!!editando}
        onOpenChange={(o) => {
          if (!o) setEditando(null);
        }}
      />
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", cor)} /> {texto}
    </span>
  );
}
