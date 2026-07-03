import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { emergencyEvolution } from "@/lib/mock-data";
import { useValueVisibility } from "@/lib/value-visibility";
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
  const atual = 12450;
  const meta = 30000;
  const falta = meta - atual;
  const ritmo = 850; // média mensal
  const meses = Math.ceil(falta / ritmo);
  const pct = Math.round((atual / meta) * 100);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Reserva de Emergência" subtitle="Seu colchão de segurança" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="glass-card card-hover md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Valor Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-4xl font-bold">{format(atual)}</p>
              <Progress value={pct} className="h-2" />
              <p className="text-xs text-muted-foreground">{pct}% da meta atingido</p>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{format(meta)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Objetivo total</p>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Falta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{format(falta)}</p>
              <p className="mt-2 text-xs text-muted-foreground">~{meses} meses no ritmo atual</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Evolução da reserva</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 8 meses</p>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emergencyEvolution} margin={{ left: -10, right: 8, top: 8 }}>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
