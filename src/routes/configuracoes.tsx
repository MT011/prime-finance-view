import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/lib/theme-provider";
import { Download, Upload, KeyRound, Bell, Globe, Palette, Coins } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Finance Dashboard" },
      { name: "description", content: "Preferências, notificações e dados da conta." },
    ],
  }),
  component: ConfiguracoesPage,
});

function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
            {icon}
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Configurações" subtitle="Personalize sua experiência" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section
            icon={<Palette className="h-4 w-4" />}
            title="Aparência"
            desc="Tema visual da aplicação"
          >
            <div className="flex items-center justify-between">
              <Label>Tema</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section
            icon={<Globe className="h-4 w-4" />}
            title="Idioma & Região"
            desc="Idioma e moeda padrão"
          >
            <div className="flex items-center justify-between">
              <Label>Idioma</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (BR)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Coins className="h-4 w-4" /> Moeda
              </Label>
              <Select defaultValue="BRL">
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section
            icon={<Bell className="h-4 w-4" />}
            title="Notificações"
            desc="Como você quer ser avisado"
          >
            <div className="flex items-center justify-between">
              <Label>Alertas de gastos</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Resumo mensal por e-mail</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Lembretes de metas</Label>
              <Switch />
            </div>
          </Section>

          <Section
            icon={<Download className="h-4 w-4" />}
            title="Dados"
            desc="Importe ou exporte suas informações"
          >
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Exportar dados
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Importar dados
              </Button>
            </div>
          </Section>

          <Section
            icon={<KeyRound className="h-4 w-4" />}
            title="Segurança"
            desc="Altere sua senha"
          >
            <div className="grid gap-2">
              <Label>Senha atual</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="grid gap-2">
              <Label>Nova senha</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full sm:w-auto">Salvar alterações</Button>
          </Section>
        </div>
      </main>
    </div>
  );
}
