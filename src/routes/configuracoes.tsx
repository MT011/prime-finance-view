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
import { Download, Upload, KeyRound, Bell, Globe, Palette, Coins, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_NOTIFICATION_PREFERENCES, getNotificationPreferences, type NotificationPreferences } from "@/lib/finance-notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Prime Finance" },
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
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [savingPreference, setSavingPreference] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setPreferences(getNotificationPreferences(user.user_metadata));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setPreferences(getNotificationPreferences(session.user.user_metadata));
    });
    return () => subscription.unsubscribe();
  }, []);

  const savePreference = async (key: keyof NotificationPreferences, enabled: boolean) => {
    if (savingPreference) return;
    const previous = preferences;
    const next = { ...preferences, [key]: enabled };
    setPreferences(next);
    setSavingPreference(true);
    try {
      const { data: { user }, error: getError } = await supabase.auth.getUser();
      if (getError || !user) throw getError || new Error("Sessão expirada.");
      const { error } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, prime_notification_prefs: next },
      });
      if (error) throw error;
      toast.success("Preferências de notificações atualizadas.");
    } catch (error) {
      setPreferences(previous);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar as preferências.");
    } finally {
      setSavingPreference(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos da senha.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação da senha não confere.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("Escolha uma senha diferente da atual.");
      return;
    }
    setSavingPassword(true);
    try {
      const { data: { user }, error: getError } = await supabase.auth.getUser();
      if (getError || !user?.email) throw getError || new Error("Não foi possível confirmar o usuário.");
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email, password: currentPassword,
      });
      if (authError) throw new Error("Senha atual incorreta ou não foi possível validá-la.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Sua senha foi alterada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Configurações" subtitle="Personalize sua experiência" />
      <main className="app-page flex-1 space-y-6">
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
            desc="Escolha quais informações aparecem no sino do aplicativo"
          >
            {([
              ["budgets", "Avisos dos limites por categoria", "Alerta quando o orçamento atingir 80% ou 100%"],
              ["cards", "Atenção aos cartões", "Alertas ao se aproximar do limite cadastrado"],
              ["goals", "Conquistas de metas", "Avisos quando uma meta for alcançada"],
              ["summary", "Resumo financeiro do mês", "Entradas e despesas registradas no período"],
            ] as const).map(([key, label, description]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="space-y-1"><Label htmlFor={`notice-${key}`}>{label}</Label><p className="text-xs text-muted-foreground">{description}</p></div>
                <Switch id={`notice-${key}`} checked={preferences[key]} disabled={savingPreference} onCheckedChange={(checked) => savePreference(key, checked)} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Avisos dentro do app, sem envio de e-mail ou WhatsApp nesta etapa. As preferências ficam salvas na sua conta.</p>
          </Section>

          <Section
            icon={<Download className="h-4 w-4" />}
            title="Dados"
            desc="Importe ou exporte suas informações"
          >
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" disabled title="Em breve">
                <Download className="h-4 w-4" /> Exportar dados (em breve)
              </Button>
              <Button variant="outline" className="gap-2" disabled title="Em breve">
                <Upload className="h-4 w-4" /> Importar dados (em breve)
              </Button>
            </div>
          </Section>

          <Section
            icon={<KeyRound className="h-4 w-4" />}
            title="Segurança"
            desc="Altere sua senha"
          >
            <div className="grid gap-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Sua senha atual" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
            </div>
            <Button className="w-full sm:w-auto" disabled={savingPassword} onClick={changePassword}>{savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{savingPassword ? "Alterando..." : "Alterar senha"}</Button>
          </Section>
        </div>
      </main>
    </div>
  );
}
