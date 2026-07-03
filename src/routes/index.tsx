import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { NewMovementFab } from "@/components/new-movement-fab";
import { useValueVisibility } from "@/lib/value-visibility";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  PiggyBank,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoriesData, monthlyEvolution, movements } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Finance Dashboard" },
      {
        name: "description",
        content: "Visão geral das suas finanças pessoais: saldo, receitas, despesas e metas.",
      },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  icon,
  accent,
  action,
  progress,
  progressLabel,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: React.ReactNode;
  accent: "success" | "danger" | "info" | "neutral";
  action?: React.ReactNode;
  progress?: number;
  progressLabel?: string;
}) {
  const accentClass = {
    success: "gradient-success border-primary/30",
    danger: "gradient-danger border-destructive/30",
    info: "gradient-info border-info/30",
    neutral: "border-border/60",
  }[accent];
  const iconClass = {
    success: "bg-primary/20 text-primary",
    danger: "bg-destructive/20 text-destructive",
    info: "bg-info/20 text-info",
    neutral: "bg-muted text-muted-foreground",
  }[accent];

  return (
    <Card className={`glass-card card-hover overflow-hidden ${accentClass}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}>{icon}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight md:text-3xl">{value}</span>
          {action}
        </div>
        {delta && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                deltaPositive
                  ? "bg-primary/15 text-primary"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {deltaPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {delta}
            </span>
            <span className="text-muted-foreground">vs mês anterior</span>
          </div>
        )}
        {progress !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progressLabel}</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color || p.payload?.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              p.value,
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const { hidden, toggle, format } = useValueVisibility();

  const patrimonio = 145820;
  const receitasMes = 8500;
  const despesasMes = 5200;
  const economia = 3300;
  const metaEconomia = 4000;
  const reservaAtual = 12450;
  const reservaMeta = 30000;
  const metaGuardar = 2000;
  const guardadoMes = 1640;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader greeting />

      <main className="flex-1 space-y-6 p-4 md:p-8">
        {/* Row 1: Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Saldo Atual"
            value={format(15820)}
            icon={<Wallet className="h-5 w-5" />}
            accent="info"
            action={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={toggle}
                aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            }
          />
          <StatCard
            label="Receitas do mês"
            value={format(receitasMes)}
            delta="+12%"
            deltaPositive
            icon={<TrendingUp className="h-5 w-5" />}
            accent="success"
          />
          <StatCard
            label="Despesas do mês"
            value={format(despesasMes)}
            delta="-8%"
            deltaPositive
            icon={<TrendingDown className="h-5 w-5" />}
            accent="danger"
          />
          <StatCard
            label="Economia do mês"
            value={format(economia)}
            icon={<PiggyBank className="h-5 w-5" />}
            accent="success"
            progress={Math.round((economia / metaEconomia) * 100)}
            progressLabel="Meta atingida"
          />
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Evolução Financeira</CardTitle>
                <p className="text-xs text-muted-foreground">Receitas, despesas e saldo</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                2025
              </Badge>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyEvolution} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.17 150)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.78 0.17 150)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.13 240)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.13 240)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.3 0.012 260 / 40%)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" name="Receitas" dataKey="receitas" stroke="oklch(0.78 0.17 150)" strokeWidth={2} fill="url(#gRec)" />
                  <Area type="monotone" name="Despesas" dataKey="despesas" stroke="oklch(0.65 0.22 25)" strokeWidth={2} fill="url(#gDes)" />
                  <Area type="monotone" name="Saldo" dataKey="saldo" stroke="oklch(0.72 0.13 240)" strokeWidth={2} fill="url(#gSal)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Gastos por Categoria</CardTitle>
              <p className="text-xs text-muted-foreground">Distribuição do mês</p>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltip />} />
                    <Pie
                      data={categoriesData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoriesData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                {categoriesData.slice(0, 8).map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Goals */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="glass-card card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Meta de Economia</CardTitle>
                <Badge variant="secondary" className="bg-primary/15 text-primary">
                  {Math.round((guardadoMes / metaGuardar) * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Atual</p>
                  <p className="text-2xl font-bold">{format(guardadoMes)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="text-sm font-medium">{format(metaGuardar)}</p>
                </div>
              </div>
              <Progress value={(guardadoMes / metaGuardar) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Faltam {format(metaGuardar - guardadoMes)} para atingir sua meta mensal.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Reserva de Emergência</CardTitle>
                <Badge variant="secondary" className="bg-info/15 text-info">
                  {Math.round((reservaAtual / reservaMeta) * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Atual</p>
                  <p className="text-2xl font-bold">{format(reservaAtual)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="text-sm font-medium">{format(reservaMeta)}</p>
                </div>
              </div>
              <Progress value={(reservaAtual / reservaMeta) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Continue guardando ~R$ 1.500/mês para atingir em ~12 meses.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Patrimônio</CardTitle>
                <Badge className="gap-1 bg-primary/20 text-primary hover:bg-primary/20">
                  <TrendingUp className="h-3 w-3" /> +18%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold tracking-tight">{format(patrimonio)}</p>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyEvolution}>
                    <defs>
                      <linearGradient id="gPat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.78 0.17 150)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="oklch(0.78 0.17 150)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke="oklch(0.78 0.17 150)"
                      strokeWidth={2}
                      fill="url(#gPat)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground">
                Evolução consistente nos últimos 6 meses.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comparativo */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Comparativo Mensal</CardTitle>
            <p className="text-xs text-muted-foreground">Este mês vs. mês anterior</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Receita", now: 8500, prev: 7600, positive: true },
              { label: "Despesa", now: 5200, prev: 5650, positive: true },
              { label: "Economia", now: 3300, prev: 1950, positive: true },
            ].map((r) => {
              const diff = ((r.now - r.prev) / r.prev) * 100;
              const up = r.label === "Despesa" ? diff < 0 : diff > 0;
              return (
                <div
                  key={r.label}
                  className="rounded-xl border border-border/60 bg-background/40 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {r.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{format(r.now)}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                        up
                          ? "bg-primary/15 text-primary"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {up ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(diff).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">era {format(r.prev)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Fluxo Financeiro */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Fluxo Financeiro</CardTitle>
              <p className="text-xs text-muted-foreground">Últimas movimentações</p>
            </div>
            <Badge variant="outline">Recentes</Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 8).map((m) => (
                  <TableRow key={m.id} className="hover:bg-accent/30">
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(m.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">{m.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {m.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.account}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.type === "receita"
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {m.type === "receita" ? "Entrada" : "Saída"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        m.type === "receita" ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {m.type === "receita" ? "+" : "-"} {format(m.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <NewMovementFab />
    </div>
  );
}
