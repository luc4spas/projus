import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserQueryOptions } from "@/features/auth/api";

/** Área financeira do escritório: somente administradores. */
export const Route = createFileRoute("/_authenticated/financeiro")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(currentUserQueryOptions(context.userId));
    if (me.papel !== "admin") throw redirect({ to: "/dashboard" });
  },
  component: Outlet,
});
