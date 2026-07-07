import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useValueVisibility } from "@/lib/value-visibility";
import { useMovements } from "@/hooks/queries";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
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
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Finance Dashboard" },
      { name: "description", content: "Relatórios visuais das suas finanças." },
    ],
  }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { format } = useValueVisibility();
  const { data: movements = [], isLoading } = useMovements();

  // 1. Calcular Evolução Mensal
  const monthlyEvolution = useMemo(() => {
    const monthsMap: Record<string, { receitas: number; despesas: number; despesas_imediatas: number }> = {};
    const monthsShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 12; i++) {
      monthsMap[monthsShort[i]] = { receitas: 0, despesas: 0, despesas_imediatas: 0 };
    }

    const sortedMovements = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
      runningBalance += (data.receitas - data.despesas_imediatas);
      return {
        month,
        receitas: data.receitas,
        despesas: data.despesas,
        saldo: runningBalance,
      };
    });
  }, [movements]);

  // 2. Calcular Gastos por Categoria
  const categoriesData = useMemo(() => {
    const catMap: Record<string, number> = {};

    movements.forEach((m) => {
      if (m.type === "despesa") {
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

  // 3. Maior Receita Individual
  const maiorReceita = useMemo(() => {
    const receitas = movements.filter((m) => m.type === "receita");
    if (receitas.length === 0) return { description: "Nenhuma cadastrada", amount: 0 };
    return [...receitas].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  }, [movements]);

  // 4. Maior Categoria de Gasto
  const maiorGasto = useMemo(() => {
    if (categoriesData.length === 0) return { name: "Nenhuma cadastrada", value: 0 };
    return [...categoriesData].sort((a, b) => b.value - a.value)[0];
  }, [categoriesData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader title="Relatórios" subtitle="Análise visual das suas finanças" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando relatórios...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Relatórios" subtitle="Análise visual das suas finanças" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="glass-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Maior Receita</CardTitle>
              <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                <TrendingUp className="h-3 w-3" /> Entrada
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold truncate">{maiorReceita.description}</p>
              <p className="mt-1 text-3xl font-bold text-primary">{format(Number(maiorReceita.amount))}</p>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Maior Gasto (Categoria)</CardTitle>
              <Badge className="gap-1 bg-destructive/15 text-destructive hover:bg-destructive/15">
                <TrendingDown className="h-3 w-3" /> Saída
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold truncate">{maiorGasto.name}</p>
              <p className="mt-1 text-3xl font-bold text-destructive">{format(maiorGasto.value)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Receitas x Despesas por mês</CardTitle>
            <p className="text-xs text-muted-foreground">Comparativo anual</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEvolution} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.3 0.012 260 / 40%)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  cursor={{ fill: "oklch(0.3 0.012 260 / 20%)" }}
                  contentStyle={{
                    background: "oklch(0.205 0.012 260)",
                    border: "1px solid oklch(0.28 0.012 260)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => format(v)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receitas" name="Receitas" fill="oklch(0.78 0.17 150)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="oklch(0.65 0.22 25)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {categoriesData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Nenhuma despesa cadastrada para gerar distribuição.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.205 0.012 260)",
                        border: "1px solid oklch(0.28 0.012 260)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => format(v)}
                    />
                    <Pie
                      data={categoriesData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoriesData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Top Categorias</CardTitle>
              <p className="text-xs text-muted-foreground">Ranking geral</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoriesData.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                  Nenhum dado de despesa.
                </div>
              ) : (
                [...categoriesData]
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 6)
                  .map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="w-6 text-xs font-semibold text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
                      <span className="text-sm font-semibold">{format(c.value)}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
