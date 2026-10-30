import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FASES_INATIVAS } from "@/lib/domain";
import type { TarefaComProcesso } from "@/features/tarefas/api";

export type DashboardData = {
  processosAtivos: number;
  tarefasPendentes: number;
  totalClientes: number;
  prazosVencidos: number;
  prazosIminentes: TarefaComProcesso[];
  porFase: { fase: string; total: number }[];
};

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const nowIso = new Date().toISOString();
      const inativas = `(${FASES_INATIVAS.map((f) => `"${f}"`).join(",")})`;
      const [ativos, pendentes, clientes, vencidos, iminentes, fases] = await Promise.all([
        supabase.from("processos").select("id", { count: "exact", head: true }).not("fase_atual", "in", inativas),
        supabase.from("prazos_e_tarefas").select("id", { count: "exact", head: true }).neq("status", "Cumprido"),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase
          .from("prazos_e_tarefas")
          .select("id", { count: "exact", head: true })
          .neq("status", "Cumprido")
          .lt("data_fatal", nowIso),
        supabase
          .from("prazos_e_tarefas")
          .select("*, processo:processos(id, numero_cnj, titulo)")
          .neq("status", "Cumprido")
          .order("data_fatal", { ascending: true })
          .limit(8),
        supabase.from("processos").select("fase_atual"),
      ]);
      for (const r of [ativos, pendentes, clientes, vencidos, iminentes, fases]) if (r.error) throw r.error;

      const counts = new Map<string, number>();
      for (const p of fases.data ?? []) counts.set(p.fase_atual, (counts.get(p.fase_atual) ?? 0) + 1);

      return {
        processosAtivos: ativos.count ?? 0,
        tarefasPendentes: pendentes.count ?? 0,
        totalClientes: clientes.count ?? 0,
        prazosVencidos: vencidos.count ?? 0,
        prazosIminentes: (iminentes.data ?? []) as TarefaComProcesso[],
        porFase: [...counts.entries()].map(([fase, total]) => ({ fase, total })).sort((a, b) => b.total - a.total),
      };
    },
  });
