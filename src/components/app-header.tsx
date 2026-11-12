import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const firstName = name.split(" ")[0];
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-xl md:px-8 md:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="hidden shrink-0 md:flex" />
          <Separator orientation="vertical" className="hidden h-8 md:block" />
          <div className="min-w-0">
            {greeting ? <>
              <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">Olá, {firstName} <span>👋</span></h1>
              <p className="hidden truncate text-xs capitalize text-muted-foreground sm:block">{date}</p>
            </> : <>
              <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" aria-label="Notificações"><Bell className="h-5 w-5" /></Button>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-[#e8eefb] font-semibold text-[#14243a]">{initial}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
