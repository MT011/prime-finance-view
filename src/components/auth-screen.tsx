import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowUpRight, Loader2, ShieldCheck, Sparkle } from "lucide-react";

export function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="grid w-full max-w-[1150px] overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_28px_100px_rgba(0,0,0,.12)] lg:min-h-[650px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#ece5d9] p-12 text-[#22201e] lg:flex">
          <div className="relative z-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#252321] text-[#fffaf3]"><span className="display-font text-2xl font-black">f<span className="text-[#ff977b]">.</span></span></span>
            <span className="display-font text-xl font-extrabold tracking-tight">prime<span className="font-medium opacity-60">finance</span></span>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-[.20em] text-[#8b695d]">SUA NOVA PERSPECTIVA</p>
            <h1 className="display-font mt-6 max-w-md text-[clamp(3.25rem,5vw,5.3rem)] font-extrabold leading-[.97] tracking-[-.07em]">
              Mais clareza. <span className="text-[#c34d35]">Menos ruído.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-[#69615a]">Organize seu dinheiro, acompanhe seus planos e viva com mais tranquilidade.</p>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-[#68615a]">
            <ShieldCheck className="h-4 w-4" /> Seu espaço para cuidar das finanças
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -right-44 top-8 h-[440px] w-[440px] rounded-full border border-[#c7baaa] shadow-[0_0_0_78px_rgba(255,255,255,.18),0_0_0_160px_rgba(255,255,255,.1)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-2 h-64 w-64 rounded-full bg-[#d8a998] opacity-45 blur-[50px]" />
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-14">
          <div className="w-full max-w-[380px]">
            <div className="mb-9 flex items-center gap-2.5 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-foreground text-background"><span className="display-font text-2xl font-black">f.</span></span>
              <span className="display-font text-xl font-extrabold tracking-tight">primefinance</span>
            </div>
            <p className="section-eyebrow">ACESSO À SUA CONTA</p>
            <h2 className="display-font mt-3 text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-tight tracking-[-.055em]">Bem-vindo de volta.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Entre para acompanhar tudo o que importa para você.</p>
            <form onSubmit={handleSubmit} className="mt-9 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="h-12 rounded-xl border-border bg-background px-4"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="text-xs font-bold">Senha</Label>
                  <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => toast.info("Entre em contato para recuperar sua senha.")}>Esqueceu a senha?</button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-border bg-background px-4"
                />
              </div>
              <Button type="submit" className="h-12 w-full justify-between rounded-xl px-5 text-sm font-bold" disabled={loading}>
                {loading ? <><span>Entrando...</span><Loader2 className="h-4 w-4 animate-spin" /></> : <><span>Entrar na minha conta</span><ArrowUpRight className="h-4 w-4" /></>}
              </Button>
            </form>
            <div className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
              <Sparkle className="h-4 w-4 text-primary" />
              Um lugar mais simples para suas finanças.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
