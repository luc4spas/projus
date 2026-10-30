import { queryOptions, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { Papel } from "@/lib/domain";
import type { EditarUsuario, NovoUsuario } from "@/lib/usuarios";
import { atualizarUsuario, criarUsuario, excluirUsuario } from "./usuarios.functions";

export type MembroEquipe = { id: string; nome: string; email: string | null; papel: Papel };

export const equipeQueryOptions = () =>
  queryOptions({
    queryKey: ["equipe"],
    staleTime: 60_000,
    queryFn: async (): Promise<MembroEquipe[]> => {
      const [{ data: perfis, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("perfis").select("id, nome, email").order("nome"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
      return (perfis ?? []).map((p) => ({ ...p, papel: roleMap.get(p.id) ?? "cliente" }));
    },
  });

/** Mapa id → membro, útil para exibir nomes de responsáveis. */
export function useEquipeMap() {
  const { data } = useQuery(equipeQueryOptions());
  const members = data ?? [];
  const map = new Map(members.map((m) => [m.id, m]));
  const staff = members.filter((m) => m.papel !== "cliente");
  return { members, staff, map };
}

/** Mensagem de erro das funções de usuários (já vem em português do servidor). */
export function erroUsuario(e: unknown, fallback = "Não foi possível concluir a operação."): string {
  const msg = e instanceof Error ? e.message : "";
  if (!msg) return fallback;
  if (/Unauthorized/i.test(msg)) return "Sua sessão expirou. Entre novamente.";
  if (/^\s*\[/.test(msg)) return "Verifique os dados informados."; // erro de validação
  return msg;
}

function useInvalidateEquipe() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["equipe"] });
    qc.invalidateQueries({ queryKey: ["current-user"] });
  };
}

export function useUpdatePapel() {
  const invalidate = useInvalidateEquipe();
  return useMutation({
    mutationFn: async ({ userId, papel }: { userId: string; papel: Papel }) => {
      const { error } = await supabase.from("user_roles").update({ role: papel }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCriarUsuario() {
  const fn = useServerFn(criarUsuario);
  const invalidate = useInvalidateEquipe();
  return useMutation({ mutationFn: (data: NovoUsuario) => fn({ data }), onSuccess: invalidate });
}

export function useAtualizarUsuario() {
  const fn = useServerFn(atualizarUsuario);
  const invalidate = useInvalidateEquipe();
  return useMutation({ mutationFn: (data: EditarUsuario) => fn({ data }), onSuccess: invalidate });
}

export function useExcluirUsuario() {
  const fn = useServerFn(excluirUsuario);
  const invalidate = useInvalidateEquipe();
  return useMutation({ mutationFn: (id: string) => fn({ data: { id } }), onSuccess: invalidate });
}
