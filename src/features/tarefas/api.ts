import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { StatusTarefa } from "@/lib/domain";

export type Tarefa = Tables<"prazos_e_tarefas">;
export type TarefaComProcesso = Tarefa & { processo: { id: string; numero_cnj: string | null; titulo: string | null } | null };

export type TarefaInput = {
  titulo: string;
  descricao?: string | null;
  processo_id: string | null;
  responsavel_id: string | null;
  data_fatal: string;
  status: StatusTarefa;
};

const SELECT = "*, processo:processos(id, numero_cnj, titulo)";

export const tarefasQueryOptions = (processoId?: string) =>
  queryOptions({
    queryKey: processoId ? ["tarefas", "processo", processoId] : ["tarefas"],
    queryFn: async () => {
      let q = supabase.from("prazos_e_tarefas").select(SELECT).order("data_fatal", { ascending: true });
      if (processoId) q = q.eq("processo_id", processoId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TarefaComProcesso[];
    },
  });

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["tarefas"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useSaveTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | undefined; input: TarefaInput }) => {
      const payload = { ...input, titulo: input.titulo.trim(), descricao: input.descricao?.trim() || null };
      if (id) {
        const { data, error } = await supabase.from("prazos_e_tarefas").update(payload).eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw { code: "42501" };
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("prazos_e_tarefas").insert({ ...payload, criado_por: auth.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

/** Move um card entre colunas com atualização otimista. */
export function useMoveTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusTarefa }) => {
      const { data, error } = await supabase.from("prazos_e_tarefas").update({ status }).eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw { code: "42501" };
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["tarefas"] });
      const snapshots = qc.getQueriesData<TarefaComProcesso[]>({ queryKey: ["tarefas"] });
      for (const [key, list] of snapshots) {
        if (list) qc.setQueryData(key, list.map((t) => (t.id === id ? { ...t, status } : t)));
      }
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => invalidateAll(qc),
  });
}

export function useDeleteTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase.from("prazos_e_tarefas").delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (count === 0) throw { code: "42501" };
    },
    onSuccess: () => invalidateAll(qc),
  });
}
