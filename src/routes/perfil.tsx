import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, LogOut, Pencil, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
                    M
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
                <h2 className="text-2xl font-bold tracking-tight">Marco</h2>
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> marco@email.com
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
                { label: "Movimentações", value: "247" },
                { label: "Metas ativas", value: "4" },
                { label: "Contas", value: "5" },
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
