import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Props = { greeting?: boolean; title?: string; subtitle?: string };

export function AppHeader({ greeting = false, title, subtitle }: Props) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.photo_url;
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-xl md:px-8 md:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="hidden shrink-0 md:flex" />
          <Separator orientation="vertical" className="hidden h-8 md:block" />
          {greeting && (
            <Link to="/perfil" aria-label="Abrir meu perfil" className="shrink-0 rounded-full outline-none transition-shadow hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary">
              <Avatar className="h-11 w-11 border border-primary/25 shadow-[0_0_18px_-7px_var(--primary)]">
                <AvatarImage src={avatarUrl} alt={`Foto de ${name}`} />
                <AvatarFallback className="bg-primary/15 font-semibold text-primary">{initial}</AvatarFallback>
              </Avatar>
            </Link>
          )}
          <div className="min-w-0">
            {greeting ? <>
              <p className="text-xs font-medium text-muted-foreground">Bem-vindo de volta</p>
              <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{name}</h1>
            </> : <>
              <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" aria-label="Notificações"><Bell className="h-5 w-5" /></Button>
          {!greeting && (
            <Link to="/perfil" aria-label="Abrir meu perfil" className="rounded-full outline-none transition-shadow hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={avatarUrl} alt={`Foto de ${name}`} />
                <AvatarFallback className="bg-[#e8eefb] font-semibold text-[#14243a]">{initial}</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
