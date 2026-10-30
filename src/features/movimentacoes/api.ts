import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { MAX_DESCRICAO_MOVIMENTACAO, ordenarMovimentacoes } from "@/lib/movimentacoes";

export type Movimentacao = Tables<"processo_movimentacoes">;

export const movimentacoesQueryOptions = (processoId: string) =>
  queryOptions({
    queryKey: ["movimentacoes", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processo_movimentacoes")
        .select("*")
        .eq("processo_id", processoId)
        .order("data_movimentacao", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ordenarMovimentacoes(data ?? []);
    },
  });

export function useSaveMovimentacao(processoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, descricao }: { id?: string | undefined; data: string; descricao: string }) => {
      const payload = { data_movimentacao: data, descricao: descricao.trim().slice(0, MAX_DESCRICAO_MOVIMENTACAO) };
      if (id) {
        const { data: rows, error } = await supabase.from("processo_movimentacoes").update(payload).eq("id", id).select("id");
        if (error) throw error;
        if (!rows?.length) throw { code: "42501" };
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("processo_movimentacoes")
        .insert({ ...payload, processo_id: processoId, autor_id: auth.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movimentacoes", processoId] }),
  });
}

export function useDeleteMovimentacao(processoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase.from("processo_movimentacoes").delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (count === 0) throw { code: "42501" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movimentacoes", processoId] }),
  });
}
