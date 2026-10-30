import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MARCA_PADRAO, type Marca } from "@/lib/marca";

/** Nome e subtítulo do sistema. Leitura pública (aparece na tela de login). */
export const marcaQueryOptions = () =>
  queryOptions({
    queryKey: ["marca"],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<Marca> => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("nome_sistema, subtitulo")
        .eq("id", true)
        .maybeSingle();
      if (error || !data) return MARCA_PADRAO;
      return { nome: data.nome_sistema, subtitulo: data.subtitulo };
    },
  });

/** Marca atual; a rota deve garantir os dados antes (ensureQueryData). */
export function useMarca() {
  return useSuspenseQuery(marcaQueryOptions()).data;
}

export function useUpdateMarca() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (marca: Marca) => {
      const { data, error } = await supabase
        .from("configuracoes")
        .update({
          nome_sistema: marca.nome.trim(),
          subtitulo: marca.subtitulo.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", true)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Somente administradores podem alterar o nome do sistema.");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["marca"] });
      // Recalcula os títulos das abas com o novo nome.
      await router.invalidate();
    },
  });
}
