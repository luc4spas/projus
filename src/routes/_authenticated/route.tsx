import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { currentUserQueryOptions } from "@/features/auth/api";
import { marcaQueryOptions } from "@/features/configuracoes/api";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { signOut } from "@/features/auth/sign-out";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/common/page";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    const [, marca] = await Promise.all([
      context.queryClient.ensureQueryData(currentUserQueryOptions(data.user.id)),
      context.queryClient.ensureQueryData(marcaQueryOptions()),
    ]);
    return { userId: data.user.id, marca };
  },
  pendingComponent: () => <FullScreenLoader label="Verificando acesso…" />,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const user = useCurrentUser();
  if (user.papel === "cliente") return <AcessoRestrito />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <AppHeader />
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AcessoRestrito() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-brass-soft text-brass-foreground">
          <Lock className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold">Acesso aguardando liberação</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Olá, {user.nome}. Sua conta foi criada, mas ainda não tem acesso à área do escritório. Peça a um
          administrador para definir seu papel na equipe.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={async () => {
            await signOut(qc);
            navigate({ to: "/auth", replace: true });
          }}
        >
          Sair
        </Button>
      </div>
    </div>
  );
}
