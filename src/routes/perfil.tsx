import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, LogOut, Pencil, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Finance Dashboard" },
      { name: "description", content: "Dados do seu perfil e conta." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserId(user?.id || "");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setUserId(session?.user?.id || "");
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: movCount } = useQuery({
    queryKey: ["profile_mov_count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count } = await supabase.from("movements").select("*", { count: "exact", head: true }).eq("user_id", userId);
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: goalCount } = useQuery({
    queryKey: ["profile_goal_count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count } = await supabase.from("goals").select("*", { count: "exact", head: true }).eq("user_id", userId);
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: accountCount } = useQuery({
    queryKey: ["profile_account_count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data } = await supabase.from("movements").select("account").eq("user_id", userId);
      if (!data) return 0;
      return new Set(data.map((m: any) => m.account)).size;
    },
    enabled: !!userId,
  });

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Perfil" subtitle="Suas informações pessoais" />
      <main className="flex-1 p-4 md:p-8">
        <Card className="glass-card mx-auto max-w-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-primary/40 via-info/30 to-primary/10" />
          <CardContent className="pt-0">
            <div className="-mt-14 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Avatar className="h-28 w-28 ring-4 ring-background">
                  <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary/20 text-3xl font-bold text-primary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </p>
                <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                  <ShieldCheck className="h-3 w-3" /> Administrador
                </Badge>
              </div>

              <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                <Button className="gap-2">
                  <Pencil className="h-4 w-4" /> Editar Perfil
                </Button>
                <Button variant="outline" className="gap-2">
                  <Camera className="h-4 w-4" /> Alterar Foto
                </Button>
                <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Movimentações", value: movCount ?? "-" },
                { label: "Metas ativas", value: goalCount ?? "-" },
                { label: "Contas", value: accountCount ?? "-" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border/60 bg-background/40 p-4 text-center"
                >
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
