import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, LogOut, Pencil, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Prime Finance" },
      { name: "description", content: "Dados do seu perfil e conta." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const updateProfile = async (data: Record<string, unknown>) => {
    const { data: { user: freshUser }, error: getError } = await supabase.auth.getUser();
    if (getError || !freshUser) throw getError || new Error("Entre na sua conta novamente.");
    const { data: result, error } = await supabase.auth.updateUser({
      data: { ...freshUser.user_metadata, ...data },
    });
    if (error) throw error;
    setUser(result.user);
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      toast.error("Informe um nome entre 2 e 80 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ full_name: trimmed });
      setEditing(false);
      toast.success("Nome atualizado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar seu nome.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Escolha uma imagem JPG, PNG ou WebP de até 5 MB.");
      return;
    }
    setSavingPhoto(true);
    const url = URL.createObjectURL(file);
    try {
      // Miniatura comprimida salva nos metadados da conta; não depende de bucket público.
      // Para uso em escala, migrar as fotos para Storage privado com política de acesso.
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Seu navegador não suporta esse formato de imagem.");
      const square = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, (img.naturalWidth - square) / 2, (img.naturalHeight - square) / 2, square, square, 0, 0, 128, 128);
      const picture = canvas.toDataURL("image/jpeg", 0.72);
      if (picture.length > 35000) throw new Error("A foto ficou grande demais. Tente outra imagem.");
      await updateProfile({ avatar_url: picture });
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a foto.");
    } finally {
      URL.revokeObjectURL(url);
      setSavingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Garante que a navegação reinicie na tela de login após sair da conta.
      window.location.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sair. Tente novamente.");
      setSigningOut(false);
    }
  };

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
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.photo_url;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Perfil" subtitle="Suas informações pessoais" />
      <main className="app-page flex-1">
        <Card className="glass-card mx-auto max-w-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-primary/40 via-info/30 to-primary/10" />
          <CardContent className="pt-0">
            <div className="-mt-14 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Avatar className="h-28 w-28 ring-4 ring-background">
                  <AvatarImage src={avatarUrl} alt={`Foto de ${name}`} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary/20 text-3xl font-bold text-primary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Selecionar nova foto de perfil" onChange={handlePhoto} />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => photoInput.current?.click()}
                  disabled={savingPhoto}
                  aria-label="Alterar foto de perfil"
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  {savingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </p>
                <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                  <ShieldCheck className="h-3 w-3" /> Conta pessoal
                </Badge>
              </div>

              {editing && (
                <div className="w-full max-w-sm space-y-2 text-left">
                  <Label htmlFor="profile-name">Nome de exibição</Label>
                  <Input id="profile-name" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={80} autoComplete="name" />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={saving} onClick={handleSaveName}>{saving ? "Salvando..." : "Salvar nome"}</Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => setEditing(false)}>Cancelar</Button>
                  </div>
                </div>
              )}
              <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                <Button className="gap-2" onClick={() => { setEditName(name); setEditing(true); }}>
                  <Pencil className="h-4 w-4" /> Editar Perfil
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => photoInput.current?.click()} disabled={savingPhoto}>
                  <Camera className="h-4 w-4" /> {savingPhoto ? "Enviando..." : "Alterar Foto"}
                </Button>
                <Button type="button" variant="ghost" onClick={handleSignOut} disabled={signingOut} className="gap-2 text-destructive hover:text-destructive" aria-label="Sair da conta">
                  {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  {signingOut ? "Saindo..." : "Sair"}
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
