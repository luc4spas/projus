import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, CalendarDays, KanbanSquare, LayoutDashboard, LineChart, Scale, Settings, ShieldCheck, Users, Wallet } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/features/auth/use-current-user";
import { useMarca } from "@/features/configuracoes/api";

const NAV = [
  { title: "Painel", to: "/dashboard", icon: LayoutDashboard },
  { title: "Clientes", to: "/clientes", icon: Users },
  { title: "Processos", to: "/processos", icon: Briefcase },
  { title: "Prazos e Tarefas", to: "/tarefas", icon: KanbanSquare },
  { title: "Agenda", to: "/agenda", icon: CalendarDays },
] as const;

export function AppSidebar() {
  const { isAdmin } = usePermissions();
  const marca = useMarca();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
  const isFinanceiroActive = pathname === "/financeiro" || pathname === "/financeiro/";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-border/80 shadow-xs bg-white">
            <img src="/logo.jpg" alt={marca.nome} className="size-full object-contain p-0.5" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-display text-base font-semibold text-sidebar-accent-foreground">{marca.nome}</span>
            {marca.subtitulo && (
              <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{marca.subtitulo}</span>
            )}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Escritório</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.title}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Financeiro</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/financeiro/painel")} tooltip="Painel financeiro">
                    <Link to="/financeiro/painel">
                      <LineChart />
                      <span>Painel financeiro</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isFinanceiroActive} tooltip="Financeiro">
                    <Link to="/financeiro">
                      <Wallet />
                      <span>Financeiro</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/equipe")} tooltip="Equipe e acessos">
                    <Link to="/equipe">
                      <ShieldCheck />
                      <span>Equipe e acessos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/configuracoes")} tooltip="Configurações">
                    <Link to="/configuracoes">
                      <Settings />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="rounded-md border border-sidebar-border p-3 text-[11px] leading-relaxed text-sidebar-foreground/60">
          Dados protegidos por permissões de acesso por papel.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
