import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Target,
  CreditCard,
  BarChart3,
  Settings,
  User,
  Wallet,
  LogOut,
  Menu,

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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Movimentações", url: "/movimentacoes", icon: ArrowLeftRight },
  { title: "Categorias", url: "/categorias", icon: Tags },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Cartões", url: "/cartoes", icon: CreditCard },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [user, setUser] = useState<any>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
    <Sidebar collapsible="icon" className="hidden border-r border-sidebar-border md:flex">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              Finance
            </span>
            <span className="truncate text-xs text-muted-foreground">Finanças pessoais</span>
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
        <div className="flex items-center justify-between gap-2 px-2 py-2 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/10 text-primary-foreground font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10 group-data-[collapsible=icon]:hidden"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border/80 bg-background/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl md:hidden">
      {[
        { title: "Início", url: "/", icon: LayoutDashboard },
        { title: "Lançamentos", url: "/movimentacoes", icon: ArrowLeftRight },
        { title: "Cartões", url: "/cartoes", icon: CreditCard },
        { title: "Categorias", url: "/categorias", icon: Tags },
      ].map((item) => {
        const active = item.url === "/" ? pathname === "/" : pathname === item.url || pathname.startsWith(item.url + "/");
        return (
          <Link key={item.title} to={item.url} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
            <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
            <span>{item.title}</span>
          </Link>
        );
      })}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button type="button" aria-label="Abrir mais opções" aria-expanded={moreOpen} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${moreOpen || ["/metas", "/relatorios", "/configuracoes", "/perfil"].includes(pathname) ? "text-primary" : "text-muted-foreground"}`}>
            <Menu className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-background px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-5">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="text-xl font-bold">Mais opções</SheetTitle>
            <p className="text-sm text-muted-foreground">Organize e personalize suas finanças.</p>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Metas", subtitle: "Seus objetivos", url: "/metas", icon: Target },
              { title: "Relatórios", subtitle: "Analisar gastos", url: "/relatorios", icon: BarChart3 },
              { title: "Configurações", subtitle: "Preferências", url: "/configuracoes", icon: Settings },
              { title: "Perfil", subtitle: "Minha conta", url: "/perfil", icon: User },
            ].map((item) => (
              <Link key={item.url} to={item.url} onClick={() => setMoreOpen(false)} className="flex min-h-24 flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
                <item.icon className="h-5 w-5 text-primary" />
                <div><span className="block text-sm font-semibold">{item.title}</span><span className="text-xs text-muted-foreground">{item.subtitle}</span></div>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
    </>
  );
}
