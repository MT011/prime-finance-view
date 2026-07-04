import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useValueVisibility } from "@/lib/value-visibility";
import { useEmergencySavings, useGoals, useSaveEmergencySavings } from "@/hooks/queries";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/reserva")({
  head: () => ({
    meta: [
      { title: "Reserva de Emergência — Finance Dashboard" },
      { name: "description", content: "Acompanhe a evolução da sua reserva de emergência." },
    ],
  }),
  component: ReservaPage,
});

function ReservaPage() {
  const { format } = useValueVisibility();

  const { data: emergencySavings = [], isLoading: isLoadingSavings } = useEmergencySavings();
  const { data: goals = [], isLoading: isLoadingGoals } = useGoals();
  const saveEmergencySavingsMutation = useSaveEmergencySavings();

  const [valInput, setValInput] = useState("");
  const [saving, setSaving] = useState(false);

  const monthInput = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  }, []);

  const { atual, meta, falta, meses, pct } = useMemo(() => {
    const emergencyGoal = goals.find(
      (g) => g.title.toLowerCase().includes("reserva") || g.title.toLowerCase().includes("emergência")
    ) || { current: 0, target: 30000 };

    const lastSavingsValue =
      emergencySavings.length > 0
        ? Number(emergencySavings[emergencySavings.length - 1].value)
        : Number(emergencyGoal.current);

    const target = Number(emergencyGoal.target) || 30000;
    const current = lastSavingsValue;
    const diff = Math.max(0, target - current);
    const ritmo = 1500; // ritmo estimado de R$ 1.500/mês
    const monthsNeeded = ritmo > 0 ? Math.ceil(diff / ritmo) : 0;
    const percentage = Math.min(100, Math.round((current / target) * 100));

    return {
      atual: current,
      meta: target,
      falta: diff,
      meses: monthsNeeded,
      pct: percentage,
    };
  }, [goals, emergencySavings]);

  const handleSaveSavings = async () => {
    const value = parseFloat(valInput);
    if (isNaN(value) || value < 0) {
      toast.error("Por favor, digite um valor válido.");
      return;
    }
    setSaving(true);
    try {
      await saveEmergencySavingsMutation.mutateAsync({ month: monthInput, value });
      toast.success(`Reserva de ${monthInput} atualizada para ${format(value)}`);
      setValInput("");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingSavings || isLoadingGoals) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader title="Reserva de Emergência" subtitle="Seu colchão de segurança" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando reserva...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Reserva de Emergência" subtitle="Seu colchão de segurança" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card className="glass-card card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">Valor Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{format(atual)}</p>
              <Progress value={pct} className="h-2" />
              <p className="text-xs text-muted-foreground">{pct}% da meta atingido</p>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{format(meta)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Objetivo total</p>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">Falta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{format(falta)}</p>
              <p className="mt-2 text-xs text-muted-foreground">~{meses} meses no ritmo atual</p>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">Atualizar ({monthInput})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={valInput}
                  onChange={(e) => setValInput(e.target.value)}
                  disabled={saving}
                  className="bg-background/40 h-9"
                />
                <Button onClick={handleSaveSavings} disabled={saving} size="sm" className="h-9">
                  {saving ? "..." : "Salvar"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Atualize a reserva mensal</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Evolução da reserva</CardTitle>
            <p className="text-xs text-muted-foreground">Histórico mensal</p>
          </CardHeader>
          <CardContent className="h-72">
            {emergencySavings.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Nenhum histórico de evolução disponível. Adicione um valor acima para começar!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={emergencySavings} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.17 150)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.78 0.17 150)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.3 0.012 260 / 40%)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.205 0.012 260)",
                      border: "1px solid oklch(0.28 0.012 260)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => format(v)}
                  />
                  <Area type="monotone" dataKey="value" name="Reserva" stroke="oklch(0.78 0.17 150)" strokeWidth={2} fill="url(#gRes)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
