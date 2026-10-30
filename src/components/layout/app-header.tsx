import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PapelBadge } from "@/components/common/status-badges";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { signOut } from "@/features/auth/sign-out";
import { initials } from "@/lib/format";

const TITLES: [string, string][] = [
  ["/dashboard", "Painel"],
  ["/clientes", "Clientes"],
  ["/processos", "Processos"],
  ["/tarefas", "Prazos e Tarefas"],
  ["/equipe", "Equipe e acessos"],
  ["/configuracoes", "Configurações"],
];

export function AppHeader() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const section = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "";

  const handleSignOut = async () => {
    await signOut(queryClient);
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium text-muted-foreground">{section}</span>
      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{user.nome}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials(user.nome)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="space-y-1.5">
              <div className="font-medium">{user.nome}</div>
              <PapelBadge papel={user.papel} />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
