import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Documento = Tables<"pastas_digitais">;

export const BUCKET_PASTAS = "pastas-digitais";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const documentosQueryOptions = (processoId: string) =>
  queryOptions({
    queryKey: ["documentos", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pastas_digitais")
        .select("*")
        .eq("processo_id", processoId)
        .order("data_upload", { ascending: false });
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

export function useUploadDocumento(processoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_UPLOAD_BYTES) throw new Error("Arquivo maior que 50 MB.");
      const { data: auth } = await supabase.auth.getUser();
      const path = `${processoId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from(BUCKET_PASTAS).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error } = await supabase.from("pastas_digitais").insert({
        processo_id: processoId,
        nome_documento: file.name,
        arquivo_url: path,
        tamanho_bytes: file.size,
        uploader_id: auth.user?.id ?? null,
      });
      if (error) {
        await supabase.storage.from(BUCKET_PASTAS).remove([path]);
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documentos", processoId] }),
  });
}

export function useDeleteDocumento(processoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Documento) => {
      const { error, count } = await supabase.from("pastas_digitais").delete({ count: "exact" }).eq("id", doc.id);
      if (error) throw error;
      if (count === 0) throw { code: "42501" };
      await supabase.storage.from(BUCKET_PASTAS).remove([doc.arquivo_url]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documentos", processoId] }),
  });
}

export function useRenameDocumento(processoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { data, error } = await supabase
        .from("pastas_digitais")
        .update({ nome_documento: nome.slice(0, 255) })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw { code: "42501" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documentos", processoId] }),
  });
}

/**
 * Gera um link temporário (5 min) para o documento.
 * Com `downloadName`, o navegador baixa o arquivo com esse nome em vez de abri-lo.
 */
export async function getDocumentoUrl(path: string, downloadName?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_PASTAS)
    .createSignedUrl(path, 300, downloadName ? { download: downloadName } : undefined);
  if (error) throw error;
  return data.signedUrl;
}
