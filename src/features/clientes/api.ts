import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { onlyDigits } from "@/lib/documento";
import { normalizeTelefones, type Telefone } from "@/lib/telefone";
import { formatCEP, type Endereco } from "@/lib/endereco";

export type Cliente = Tables<"clientes">;
export type ClienteComContagem = Cliente & { processos: { count: number }[] };

export type ClienteInput = {
  nome: string;
  documento: string;
  tipo: string;
  email?: string | null;
  telefones: Telefone[];
  endereco: { [K in keyof Endereco]?: string | null };
};

const limpar = (v: string | null | undefined) => v?.trim() || null;

export const clientesQueryOptions = () =>
  queryOptions({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*, processos(count)")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as ClienteComContagem[];
    },
  });

export function useSaveCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | undefined; input: ClienteInput }) => {
      const payload = {
        nome: input.nome.trim(),
        documento: onlyDigits(input.documento),
        tipo: input.tipo,
        email: input.email?.trim() || null,
        telefones: normalizeTelefones(input.telefones),
        cep: input.endereco.cep ? formatCEP(input.endereco.cep) || null : null,
        logradouro: limpar(input.endereco.logradouro),
        numero: limpar(input.endereco.numero),
        complemento: limpar(input.endereco.complemento),
        bairro: limpar(input.endereco.bairro),
        cidade: limpar(input.endereco.cidade),
        uf: limpar(input.endereco.uf)?.toUpperCase() ?? null,
      };
      if (id) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("clientes")
        .insert({ ...payload, criado_por: auth.user?.id ?? null })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase.from("clientes").delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (count === 0) throw { code: "42501" };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
