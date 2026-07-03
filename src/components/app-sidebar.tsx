import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Target,
  ShieldCheck,
  BarChart3,
  Settings,
  User,
  Wallet,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Movimentações", url: "/movimentacoes", icon: ArrowLeftRight },
  { title: "Categorias", url: "/categorias", icon: Tags },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Reserva de Emergência", url: "/reserva", icon: ShieldCheck },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              Finance
            </span>
            <span className="truncate text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-transparent data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary rounded-lg transition-all"
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/30">
            <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/10 text-primary-foreground font-semibold">
              M
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">Marco</span>
            <span className="truncate text-xs text-muted-foreground">Administrador</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
