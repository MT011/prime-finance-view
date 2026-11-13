import { Moon, Sun, CalendarDays } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-provider";
import { useEffect, useState } from "react";

type Props = { greeting?: boolean; title?: string; subtitle?: string };

export function AppHeader({ greeting = false, title, subtitle }: Props) {
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
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
