import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { currentUserQueryOptions } from "./api";

/** Usuário atual (perfil + papel). Disponível em qualquer rota sob /_authenticated. */
export function useCurrentUser() {
  const { userId } = useRouteContext({ from: "/_authenticated" });
  return useSuspenseQuery(currentUserQueryOptions(userId)).data;
}

/** Permissões derivadas do papel, para renderização condicional da interface. */
export function usePermissions() {
  const user = useCurrentUser();
  const isAdmin = user.papel === "admin";
  const isStaff = isAdmin || user.papel === "advogado";
  return {
    user,
    isAdmin,
    isStaff,
    canDelete: isAdmin,
    canManageTeam: isAdmin,
    canAssignAnyLawyer: isAdmin,
  };
}
