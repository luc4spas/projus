import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Processo = Tables<"processos">;
export type ProcessoComCliente = Processo & {
  cliente: { id: string; nome: string; documento: string; tipo: string } | null;
};

export type ProcessoInput = {
  titulo: string;
  numero_cnj: string | null;
  cliente_id: string;
  tribunal?: string | null;
  comarca?: string | null;
  vara?: string | null;
  fase_atual: string;
  valor_causa?: number | null;
  advogado_responsavel: string | null;
  sistema?: string | null;
  descricao_acao?: string | null;
};

const SELECT = "*, cliente:clientes(id, nome, documento, tipo)";

export const processosQueryOptions = () =>
  queryOptions({
    queryKey: ["processos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("processos").select(SELECT).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProcessoComCliente[];
    },
  });

export const processoQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["processos", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("processos").select(SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProcessoComCliente | null;
    },
  });

export function useSaveProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | undefined; input: ProcessoInput }) => {
      const payload = {
        ...input,
        titulo: input.titulo.trim(),
        numero_cnj: input.numero_cnj?.trim() || null,
        tribunal: input.tribunal?.trim() || null,
        comarca: input.comarca?.trim() || null,
        vara: input.vara?.trim() || null,
        sistema: input.sistema?.trim() || null,
        descricao_acao: input.descricao_acao?.trim() || null,
      };
      if (id) {
        const { data, error } = await supabase.from("processos").update(payload).eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw { code: "42501" };
        return id;
      }
      const { data, error } = await supabase.from("processos").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["processos"] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase.from("processos").delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (count === 0) throw { code: "42501" };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["processos"] });
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
