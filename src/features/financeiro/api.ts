import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { hojeDia } from "@/lib/financeiro";

export type Categoria = Tables<"categorias_financeiras">;
export type Transacao = Tables<"transacoes"> & {
  categoria: { id: string; nome: string; tipo: string } | null;
  cliente: { id: string; nome: string } | null;
  processo: { id: string; titulo: string | null; numero_cnj: string | null } | null;
};

export type TransacaoInput = {
  tipo: string;
  descricao: string;
  categoria_id: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  cliente_id: string | null;
  processo_id: string | null;
};

export const BUCKET_COMPROVANTES = "comprovantes-financeiros";
export const MAX_COMPROVANTE_BYTES = 20 * 1024 * 1024;

const SELECT =
  "*, categoria:categorias_financeiras(id, nome, tipo), cliente:clientes(id, nome), processo:processos(id, titulo, numero_cnj)";

export const transacoesQueryOptions = () =>
  queryOptions({
    queryKey: ["transacoes", "todas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes")
        .select(SELECT)
        .order("data_vencimento", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transacao[];
    },
  });

export const transacoesDoProcessoQueryOptions = (processoId: string) =>
  queryOptions({
    queryKey: ["transacoes", "processo", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes")
        .select(SELECT)
        .eq("processo_id", processoId)
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transacao[];
    },
  });

export const categoriasQueryOptions = () =>
  queryOptions({
    queryKey: ["categorias-financeiras"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias_financeiras").select("*").order("tipo").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

const sanitizeFileName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(-120);

async function enviarComprovante(file: File): Promise<string> {
  if (file.size > MAX_COMPROVANTE_BYTES) throw new Error("Comprovante maior que 20 MB.");
  const path = `${crypto.randomUUID()}/${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET_COMPROVANTES).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

const removerArquivo = (path: string | null | undefined) =>
  path ? supabase.storage.from(BUCKET_COMPROVANTES).remove([path]).then(() => undefined) : Promise.resolve();

export function useSaveTransacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
      arquivo,
      removerComprovante,
      comprovanteAtual,
    }: {
      id?: string | undefined;
      input: TransacaoInput;
      arquivo?: File | null;
      removerComprovante?: boolean;
      comprovanteAtual?: string | null;
    }) => {
      const novoPath = arquivo ? await enviarComprovante(arquivo) : null;
      const comprovante_url = novoPath ?? (removerComprovante ? null : (comprovanteAtual ?? null));
      const payload = {
        ...input,
        descricao: input.descricao.trim(),
        data_pagamento: input.status === "Pago" ? input.data_pagamento : null,
        comprovante_url,
      };
      try {
        if (id) {
          const { data, error } = await supabase.from("transacoes").update(payload).eq("id", id).select("id");
          if (error) throw error;
          if (!data?.length) throw { code: "42501" };
        } else {
          const { error } = await supabase.from("transacoes").insert(payload);
          if (error) throw error;
        }
      } catch (e) {
        await removerArquivo(novoPath);
        throw e;
      }
      if (comprovanteAtual && comprovanteAtual !== comprovante_url) await removerArquivo(comprovanteAtual);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transacoes"] }),
  });
}

export function useMarcarComoPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("transacoes")
        .update({ status: "Pago", data_pagamento: hojeDia() })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw { code: "42501" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transacoes"] }),
  });
}

export function useDeleteTransacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Pick<Transacao, "id" | "comprovante_url">) => {
      const { error, count } = await supabase.from("transacoes").delete({ count: "exact" }).eq("id", t.id);
      if (error) throw error;
      if (count === 0) throw { code: "42501" };
      await removerArquivo(t.comprovante_url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transacoes"] }),
  });
}

/** Link temporário (5 min) do comprovante; com `downloadName` o navegador baixa o arquivo. */
export async function getComprovanteUrl(path: string, downloadName?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_COMPROVANTES)
    .createSignedUrl(path, 300, downloadName ? { download: downloadName } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

export function useSaveCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome, tipo }: { id?: string; nome: string; tipo: string }) => {
      if (id) {
        const { data, error } = await supabase.from("categorias_financeiras").update({ nome: nome.trim() }).eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw { code: "42501" };
        return;
      }
      const { error } = await supabase.from("categorias_financeiras").insert({ nome: nome.trim(), tipo });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias-financeiras"] });
      qc.invalidateQueries({ queryKey: ["transacoes"] });
    },
  });
}

export function useDeleteCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase.from("categorias_financeiras").delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (count === 0) throw { code: "42501" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias-financeiras"] }),
  });
}
