import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Props = {
  greeting?: boolean;
  title?: string;
  subtitle?: string;
};

const weekday = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function AppHeader({ greeting = false, title, subtitle }: Props) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initial = name.charAt(0).toUpperCase();

  const today = new Date();
  const day = today.getDate().toString().padStart(2, "0");
  const monthName = today.toLocaleDateString("pt-BR", { month: "long" });
  const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const dateStr = `Hoje é ${weekday[today.getDay()]}, ${day} de ${capMonth} de ${today.getFullYear()}.`;

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-4 border-b border-border/60 bg-background/70 px-4 py-4 backdrop-blur-xl md:px-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="shrink-0" />
          <Separator orientation="vertical" className="hidden h-8 md:block" />
          <div className="min-w-0">
            {greeting ? (
              <>
                <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
                  Olá, {name} <span className="inline-block">👋</span>
                </h1>
                <p className="truncate text-xs text-muted-foreground md:text-sm">
                  Bem-vindo de volta. {dateStr}
                </p>
              </>
            ) : (
              <>
                <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground md:text-sm">{subtitle}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              className="w-56 rounded-full border-border/60 bg-card/60 pl-9 backdrop-blur-lg lg:w-72"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-accent/60"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-md shadow-primary/50" />
          </Button>
          <Avatar className="h-9 w-9 ring-2 ring-primary/30">
            <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/10 font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
