import { Moon, Sun, CalendarDays, Bell, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-provider";
import { useEffect, useMemo, useState } from "react";
import { useCategoryBudgets, useCreditCards, useGoals, useMovements } from "@/hooks/queries";
import { buildFinanceNotifications, getNotificationPreferences } from "@/lib/finance-notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type Props = { greeting?: boolean; title?: string; subtitle?: string };

export function AppHeader({ greeting = false, title, subtitle }: Props) {
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [savingNotification, setSavingNotification] = useState(false);
  const { data: movements = [] } = useMovements();
  const { data: budgets = [] } = useCategoryBudgets();
  const { data: cards = [] } = useCreditCards();
  const { data: goals = [] } = useGoals();
  const preferences = getNotificationPreferences(user?.user_metadata);
  const notifications = useMemo(
    () => buildFinanceNotifications(movements, budgets, cards, goals, preferences),
    [movements, budgets, cards, goals, preferences.budgets, preferences.cards, preferences.goals, preferences.summary],
  );
  const readNotifications: string[] = user?.user_metadata?.prime_notification_read || [];
  const unreadCount = notifications.filter((n) => !readNotifications.includes(n.id)).length;
  const markAsRead = async (ids: string[]) => {
    if (!user || savingNotification) return;
    setSavingNotification(true);
    try {
      const { data: { user: latestUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !latestUser) throw userError || new Error("Sessão expirada");
      const current: string[] = latestUser.user_metadata?.prime_notification_read || [];
      const read = Array.from(new Set([...current, ...ids])).slice(-100);
      const { data, error } = await supabase.auth.updateUser({
        data: { ...latestUser.user_metadata, prime_notification_read: read },
      });
      if (error) throw error;
      setUser(data.user);
    } catch {
      toast.error("Não foi possível marcar a notificação como lida.");
    } finally {
      setSavingNotification(false);
    }
  };
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.photo_url;
  const date = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(new Date());

  return (
    <header className="app-header sticky top-0 z-30 border-b border-border/70 px-4 py-3 sm:px-6 md:px-10 md:py-4">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="hidden shrink-0 md:flex" />
          {greeting && (
            <Link to="/perfil" aria-label="Abrir meu perfil" className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Avatar className="h-10 w-10 border-2 border-card shadow-sm sm:h-11 sm:w-11">
                <AvatarImage src={avatarUrl} alt={`Foto de ${name}`} />
                <AvatarFallback className="bg-secondary font-bold text-foreground">{initial}</AvatarFallback>
              </Avatar>
            </Link>
          )}
          <div className="min-w-0">
            {greeting ? (
              <>
                <p className="text-[11px] font-medium text-muted-foreground">Bem-vindo de volta</p>
                <h1 className="display-font truncate text-lg font-extrabold leading-tight tracking-tight md:text-xl">{name}</h1>
              </>
            ) : (
              <>
                <h1 className="display-font truncate text-lg font-extrabold leading-tight md:text-xl">{title}</h1>
                {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-full border-border bg-card" aria-label={`Notificações financeiras, ${unreadCount} não lidas`} title="Notificações financeiras">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{Math.min(unreadCount, 9)}{unreadCount > 9 ? "+" : ""}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-[min(350px,calc(100vw-24px))] rounded-2xl border-border bg-card p-0 shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div><p className="font-bold">Notificações</p><p className="text-xs text-muted-foreground">Alertas baseados nos seus lançamentos</p></div>
                {unreadCount > 0 && <Button variant="ghost" size="sm" className="h-auto px-2 text-xs" disabled={savingNotification} onClick={() => markAsRead(notifications.map((n) => n.id))}>{savingNotification ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}Marcar todas como lidas</Button>}
              </div>
              <div className="max-h-[365px] overflow-y-auto">
                {notifications.length ? notifications.map((notification) => {
                  const unread = !readNotifications.includes(notification.id);
                  const Icon = notification.level === "warning" ? AlertTriangle : notification.level === "success" ? CheckCircle2 : Info;
                  return (
                    <div key={notification.id} className={`border-b border-border/50 p-3 last:border-0 ${unread ? "bg-primary/5" : ""}`}>
                      <div className="flex gap-2">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${notification.level === "warning" ? "text-warning" : notification.level === "success" ? "text-success" : "text-muted-foreground"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2"><p className="text-sm font-semibold">{notification.title}</p>{unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}</div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <Link to={notification.href} className="text-xs font-semibold text-primary hover:underline" onClick={() => { if (unread) void markAsRead([notification.id]); }}>Ver detalhes</Link>
                            {unread && <button type="button" disabled={savingNotification} className="text-xs text-muted-foreground hover:text-foreground" onClick={() => markAsRead([notification.id])}>Marcar como lida</button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : <div className="p-6 text-center text-sm text-muted-foreground">Nenhum alerta no momento. Continue registrando seus lançamentos para acompanhar suas finanças.</div>}
              </div>
              <div className="border-t border-border p-3 text-center"><Link to="/configuracoes" className="text-xs font-semibold text-primary hover:underline">Configurar notificações</Link></div>
            </PopoverContent>
          </Popover>
          <span className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground sm:inline-flex">
            <CalendarDays className="h-3.5 w-3.5" /> {date}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            className="rounded-full border-border bg-card"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {!greeting && (
            <Link to="/perfil" aria-label="Abrir meu perfil" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={avatarUrl} alt={`Foto de ${name}`} />
                <AvatarFallback className="bg-secondary font-bold">{initial}</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
