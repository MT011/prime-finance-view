import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { NewMovementFab } from "@/components/new-movement-fab";
import { useValueVisibility } from "@/lib/value-visibility";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
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
import { useMovements, useGoals, useEmergencySavings, useCreditCards } from "@/hooks/queries";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getCurrentInvoiceMonthKey,
  getNextInvoiceMonthKey,
  getInvoiceMonthLabel,
} from "@/lib/credit-cards";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
                deltaPositive ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
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
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const { hidden, toggle, format } = useValueVisibility();
  const navigate = useNavigate();

  const { data: movements = [], isLoading: isLoadingMovements } = useMovements();
  const { data: goals = [], isLoading: isLoadingGoals } = useGoals();
  const { data: emergencySavings = [], isLoading: isLoadingSavings } = useEmergencySavings();
  const { data: creditCards = [] } = useCreditCards();

  const {
    saldoAtual,
    receitasMes,
    despesasMes,
    economia,
    patrimonio,
    reservaAtual,
    reservaMeta,
    metaGuardar,
    guardadoMes,
    receitasPrev,
    despesasPrev,
    economiaPrev,
    dashboardGoals,
  } = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let saldo = 0;
    let recMes = 0;
    let desMes = 0;
    let recPrev = 0;
    let desPrev = 0;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    movements.forEach((m) => {
      const d = new Date(m.date);
      const mDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isPrevMonth = d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;

      const amt = Number(m.amount);
      if (m.type === "receita") {
        saldo += amt;
        if (isCurrentMonth) recMes += amt;
        if (isPrevMonth) recPrev += amt;
      } else {
        if ((m.nature === "debito" || m.nature === "pix") && mDateStr <= todayStr) {
          saldo -= amt;
        }
        if (isCurrentMonth) desMes += amt;
        if (isPrevMonth) desPrev += amt;
      }
    });

    const eco = recMes - desMes;
    const ecoPrev = recPrev - desPrev;

    const lastEmergencyValue =
      emergencySavings.length > 0 ? Number(emergencySavings[emergencySavings.length - 1].value) : 0;

    const sortedGoals = [...goals].sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return aDate - bDate;
    });

    const emergencyGoal = sortedGoals.find((g) => {
      const title = (g.title || "").toLowerCase();
      const period = (g.period || "").toLowerCase();
      return (
        title.includes("reserva") || title.includes("emergência") || period.includes("reserva")
      );
    });
    const monthlyGoal =
      sortedGoals.find((g) => {
        const title = (g.title || "").toLowerCase();
        const period = (g.period || "").toLowerCase();
        return (
          title.includes("economia") ||
          title.includes("mensal") ||
          title.includes("meta") ||
          period.includes("mensal")
        );
      }) || sortedGoals[0];

    const goalsCurrent = goals.reduce((sum, g) => sum + Number(g.current || 0), 0);
    const pat = saldo + goalsCurrent + (lastEmergencyValue || 0);

    return {
      saldoAtual: saldo,
      receitasMes: recMes,
      despesasMes: desMes,
      economia: eco,
      patrimonio: pat,
      reservaAtual: lastEmergencyValue || Number(emergencyGoal?.current || 0),
      reservaMeta: Number(emergencyGoal?.target || 0),
      metaGuardar: monthlyGoal ? Number(monthlyGoal.target) : 0,
      guardadoMes: eco > 0 ? eco : 0,
      receitasPrev: recPrev,
      despesasPrev: desPrev,
      economiaPrev: ecoPrev,
      dashboardGoals: sortedGoals,
    };
  }, [movements, goals, emergencySavings]);

  const cardSummaries = useMemo(() => {
    return creditCards.map((card) => {
      const currentMonthKey = getCurrentInvoiceMonthKey(card);
      const nextMonthKey = getNextInvoiceMonthKey(card);
      const currentTotal = movements
        .filter((m) => m.card_id === card.id && m.invoice_month === currentMonthKey)
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const nextTotal = movements
        .filter((m) => m.card_id === card.id && m.invoice_month === nextMonthKey)
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const limit = Number(card.limit);
      return {
        ...card,
        currentTotal,
        nextTotal,
        usedPercent: limit > 0 ? Math.min(100, (currentTotal / limit) * 100) : 0,
      };
    });
  }, [creditCards, movements]);

  const monthlyEvolution = useMemo(() => {
    const monthsMap: Record<
      string,
      { receitas: number; despesas: number; despesas_imediatas: number }
    > = {};
    const monthsShort = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 12; i++) {
      monthsMap[monthsShort[i]] = { receitas: 0, despesas: 0, despesas_imediatas: 0 };
    }

    const sortedMovements = [...movements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let runningBalance = 0;
    sortedMovements.forEach((m) => {
      const d = new Date(m.date);
      if (d.getFullYear() === currentYear) {
        const monthName = monthsShort[d.getMonth()];
        const amt = Number(m.amount);
        if (m.type === "receita") {
          monthsMap[monthName].receitas += amt;
        } else {
          monthsMap[monthName].despesas += amt;
          if (m.nature === "debito" || m.nature === "pix") {
            monthsMap[monthName].despesas_imediatas += amt;
          }
        }
      }
    });

    return monthsShort.map((month) => {
      const data = monthsMap[month];
      runningBalance += data.receitas - data.despesas_imediatas;
      return {
        month,
        receitas: data.receitas,
        despesas: data.despesas,
        saldo: runningBalance,
      };
    });
  }, [movements]);

  const categoriesData = useMemo(() => {
    const catMap: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    movements.forEach((m) => {
      const d = new Date(m.date);
      if (
        m.type === "despesa" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      ) {
        catMap[m.category] = (catMap[m.category] || 0) + Number(m.amount);
      }
    });

    const colorPalette = [
      "oklch(0.78 0.17 150)",
      "oklch(0.72 0.13 240)",
      "oklch(0.82 0.16 80)",
      "oklch(0.65 0.22 25)",
      "oklch(0.7 0.18 300)",
      "oklch(0.85 0.14 40)",
      "oklch(0.6 0.15 200)",
      "oklch(0.75 0.14 120)",
      "oklch(0.68 0.16 170)",
      "oklch(0.5 0.02 260)",
    ];

    return Object.entries(catMap).map(([name, value], i) => ({
      name,
      value,
      color: colorPalette[i % colorPalette.length],
    }));
  }, [movements]);

  const expenseTypeData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let fixo = 0;
    let variavel = 0;

    movements.forEach((m) => {
      const d = new Date(m.date);
      if (
        m.type === "despesa" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      ) {
        if (m.expense_type === "fixo") {
          fixo += Number(m.amount);
        } else {
          variavel += Number(m.amount);
        }
      }
    });

    const total = fixo + variavel;
    return {
      fixo,
      variavel,
      total,
      fixoPercent: total > 0 ? Math.round((fixo / total) * 100) : 0,
      variavelPercent: total > 0 ? Math.round((variavel / total) * 100) : 0,
    };
  }, [movements]);

  if (isLoadingMovements || isLoadingGoals || isLoadingSavings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando painel financeiro...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader greeting />

      <main className="flex-1 space-y-6 p-4 md:p-8">
        {/* Row 1: Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Saldo Atual"
            value={format(saldoAtual)}
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
            icon={<TrendingUp className="h-5 w-5" />}
            accent="success"
          />
          <StatCard
            label="Despesas do mês"
            value={format(despesasMes)}
            icon={<TrendingDown className="h-5 w-5" />}
            accent="danger"
          />
          <StatCard
            label="Economia do mês"
            value={format(economia)}
            icon={<PiggyBank className="h-5 w-5" />}
            accent="success"
            progress={metaGuardar > 0 ? Math.max(0, Math.round((economia / metaGuardar) * 100)) : 0}
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
                  <CartesianGrid
                    strokeDasharray="3 6"
                    stroke="oklch(0.3 0.012 260 / 40%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="oklch(0.6 0.02 260)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="oklch(0.6 0.02 260)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    name="Receitas"
                    dataKey="receitas"
                    stroke="oklch(0.78 0.17 150)"
                    strokeWidth={2}
                    fill="url(#gRec)"
                  />
                  <Area
                    type="monotone"
                    name="Despesas"
                    dataKey="despesas"
                    stroke="oklch(0.65 0.22 25)"
                    strokeWidth={2}
                    fill="url(#gDes)"
                  />
                  <Area
                    type="monotone"
                    name="Saldo"
                    dataKey="saldo"
                    stroke="oklch(0.72 0.13 240)"
                    strokeWidth={2}
                    fill="url(#gSal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <Carousel opts={{ align: "start", loop: true }}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Gastos por Categoria</CardTitle>
                    <p className="text-xs text-muted-foreground">Distribuição do mês</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CarouselPrevious className="relative static h-7 w-7 translate-y-0" />
                    <CarouselNext className="relative static h-7 w-7 translate-y-0" />
                  </div>
                </div>
                <CarouselContent className="mt-3">
                  {/* Slide 1: Gráfico de pizza por categoria */}
                  <CarouselItem>
                    <div className="h-52">
                      {categoriesData.length > 0 ? (
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
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Sem despesas este mês
                        </div>
                      )}
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
                  </CarouselItem>

                  {/* Slide 2: Fixo vs Variável */}
                  <CarouselItem>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-6 pt-2">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">
                            {expenseTypeData.fixoPercent}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Fixos</p>
                          <p className="text-sm font-medium">{format(expenseTypeData.fixo)}</p>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-3xl font-bold text-destructive">
                            {expenseTypeData.variavelPercent}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Variáveis</p>
                          <p className="text-sm font-medium">{format(expenseTypeData.variavel)}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Fixos</span>
                          <span className="font-medium">{format(expenseTypeData.fixo)}</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${expenseTypeData.fixoPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Variáveis</span>
                          <span className="font-medium">{format(expenseTypeData.variavel)}</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-destructive transition-all"
                            style={{ width: `${expenseTypeData.variavelPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg bg-secondary/50 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Total do mês</p>
                        <p className="text-lg font-bold">{format(expenseTypeData.total)}</p>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Goals */}
        <div
          className={`grid grid-cols-1 gap-4 ${dashboardGoals.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}
        >
          {dashboardGoals.map((goal: any) => {
            const current = Number(goal.current || 0);
            const target = Number(goal.target || 0);
            const pct =
              target > 0 ? Math.max(0, Math.min(100, Math.round((current / target) * 100))) : 0;
            const isEmergency =
              (goal.title || "").toLowerCase().includes("reserva") ||
              (goal.title || "").toLowerCase().includes("emergência") ||
              (goal.period || "").toLowerCase().includes("reserva");

            return (
              <Card key={goal.id || goal.title} className="glass-card card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={
                        isEmergency ? "bg-info/15 text-info" : "bg-primary/15 text-primary"
                      }
                    >
                      {pct}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Atual</p>
                      <p className="text-2xl font-bold">{format(current)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Meta</p>
                      <p className="text-sm font-medium">{format(target)}</p>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Faltam {format(Math.max(0, target - current))} para atingir sua meta.
                  </p>
                </CardContent>
              </Card>
            );
          })}

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
              { label: "Receita", now: receitasMes, prev: receitasPrev },
              { label: "Despesa", now: despesasMes, prev: despesasPrev },
              { label: "Economia", now: economia, prev: economiaPrev },
            ].map((r) => {
              const diff = r.prev === 0 ? (r.now > 0 ? 100 : 0) : ((r.now - r.prev) / r.prev) * 100;
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
                        up ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
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

        {/* Resumo dos Cartões de Crédito */}
        {cardSummaries.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Resumo dos Cartões de Crédito</CardTitle>
                <p className="text-xs text-muted-foreground">Faturas atuais e próximas</p>
              </div>
              <Badge variant="outline">
                {cardSummaries.length} cartão{cardSummaries.length > 1 ? "ões" : ""}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cardSummaries.map((card) => (
                  <button
                    key={card.id}
                    onClick={() =>
                      navigate({ to: "/movimentacoes", search: { card: card.id, tab: "atual" } })
                    }
                    className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background/80 to-accent/20 p-5 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{card.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Vencimento dia {card.due_day}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Fatura Atual</p>
                        <p className="text-lg font-bold">{format(card.currentTotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Próxima Fatura</p>
                        <p className="text-lg font-bold">{format(card.nextTotal)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Limite utilizado</span>
                        <span>{Math.round(card.usedPercent)}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                          style={{ width: `${card.usedPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
