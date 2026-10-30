import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Papel } from "@/lib/domain";

export type CurrentUser = {
  id: string;
  email: string | null;
  nome: string;
  papel: Papel;
};

/** Perfil + papel do usuário logado. Fica no cache global do TanStack Query. */
export const currentUserQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["current-user", userId],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<CurrentUser> => {
      const [{ data: perfil, error: perfilError }, { data: role, error: roleError }, { data: auth }] =
        await Promise.all([
          supabase.from("perfis").select("id, nome, email").eq("id", userId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
          supabase.auth.getUser(),
        ]);
      if (perfilError) throw perfilError;
      if (roleError) throw roleError;
      return {
        id: userId,
        email: perfil?.email ?? auth.user?.email ?? null,
        nome: perfil?.nome || auth.user?.email?.split("@")[0] || "Usuário",
        // Sem papel definido, o acesso é o mais restrito possível.
        papel: role?.role ?? "cliente",
      };
    },
  });
