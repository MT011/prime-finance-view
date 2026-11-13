import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ArrowLeftRight, Tags, Target, CreditCard, BarChart3,
  Settings, User, LogOut, Menu, ArrowUpRight, CircleDot,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const items = [
  { title: "Visão geral", url: "/", icon: LayoutDashboard },
  { title: "Movimentações", url: "/movimentacoes", icon: ArrowLeftRight },
  { title: "Categorias", url: "/categorias", icon: Tags },
  { title: "Cartões", url: "/cartoes", icon: CreditCard },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];
const preferences = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Perfil", url: "/perfil", icon: User },
];
const mobileItems = [
  { title: "Início", url: "/", icon: LayoutDashboard },
  { title: "Lançamentos", url: "/movimentacoes", icon: ArrowLeftRight },
  { title: "Cartões", url: "/cartoes", icon: CreditCard },
  { title: "Categorias", url: "/categorias", icon: Tags },
];
const moreItems = [
  { title: "Metas", subtitle: "Planeje seus objetivos", url: "/metas", icon: Target },
  { title: "Relatórios", subtitle: "Entenda seus números", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", subtitle: "Personalize o app", url: "/configuracoes", icon: Settings },
  { title: "Perfil", subtitle: "Sua conta", url: "/perfil", icon: User },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [user, setUser] = useState<any>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initial = name.charAt(0).toUpperCase();

  const renderMenu = (menu: typeof items) => menu.map((item) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.title}
          className={`h-11 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? "nav-active" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
        >
          <Link to={item.url} aria-current={active ? "page" : undefined}>
            <item.icon className="mr-1 h-4.5 w-4.5" strokeWidth={active ? 2.4 : 1.8} />
            <span>{item.title}</span>
            {active && <CircleDot className="ml-auto h-3 w-3 opacity-50 group-data-[collapsible=icon]:hidden" />}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });

  return (
    <>
      <Sidebar collapsible="icon" className="hidden border-r border-sidebar-border bg-sidebar md:flex">
        <SidebarHeader className="border-b border-sidebar-border px-3 py-5">
          <div className="flex items-center gap-3 px-1.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#ece5d9] text-[#27221e]">
              <span className="display-font text-[26px] font-black leading-none">f<span className="text-[#c95338]">.</span></span>
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="display-font block truncate text-[19px] font-extrabold leading-none tracking-tight">prime<span className="font-medium opacity-65">finance</span></span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground">Sua vida financeira</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 pt-5">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-muted-foreground">Seu espaço</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu className="gap-1">{renderMenu(items)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-muted-foreground">Conta</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu className="gap-1">{renderMenu(preferences)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl p-2">
            <Avatar className="h-10 w-10 shrink-0 border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-sm font-bold text-sidebar-foreground">{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-bold">{name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{user?.email || ""}</span>
            </div>
            <button type="button" onClick={handleLogout} aria-label="Sair da conta" title="Sair" className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:hidden">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_22px_rgba(0,0,0,.08)] backdrop-blur-xl md:hidden">
        {mobileItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link key={item.url} to={item.url} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl pb-1 text-[10px] font-semibold ${active ? "mobile-active" : "text-muted-foreground"}`}>
              <span className="mobile-icon"><item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} /></span>
              <span className="max-w-full truncate">{item.title}</span>
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label="Abrir mais opções" aria-expanded={moreOpen} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl pb-1 text-[10px] font-semibold ${moreOpen || moreItems.some((item) => isActive(item.url)) ? "mobile-active" : "text-muted-foreground"}`}>
              <span className="mobile-icon"><Menu className="h-[18px] w-[18px]" /></span>
              <span>Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[28px] border-border bg-card px-5 pb-[max(env(safe-area-inset-bottom),28px)] pt-6">
            <SheetHeader className="mb-6 text-left">
              <p className="section-eyebrow">Navegação</p>
              <SheetTitle className="display-font text-2xl font-extrabold tracking-tight">Tudo em um só lugar.</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map((item) => (
                <Link key={item.url} to={item.url} onClick={() => setMoreOpen(false)} className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-border bg-background p-4 transition hover:border-primary/60">
                  <span className="flex items-center justify-between"><item.icon className="h-5 w-5 text-primary" /><ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" /></span>
                  <span><span className="block text-sm font-bold">{item.title}</span><span className="block text-[11px] text-muted-foreground">{item.subtitle}</span></span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
