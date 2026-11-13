import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppHeader } from "@/components/app-header";
import { NewMovementFab } from "@/components/new-movement-fab";
import { useValueVisibility } from "@/lib/value-visibility";
import { useMovements, useGoals, useCreditCards } from "@/hooks/queries";
import { parseLocalDate, getCurrentInvoiceMonthKey } from "@/lib/credit-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, Target, ChevronRight, CalendarDays, AlertTriangle, CheckCircle2, Activity, ArrowRight, ReceiptText, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Início — Prime Finance" },
    { name: "description", content: "Uma visão simples e clara da sua vida financeira." },
  ] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { hidden, toggle, format } = useValueVisibility();
  const navigate = useNavigate();
  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: goals = [], isLoading: loadingGoals } = useGoals();
  const { data: cards = [] } = useCreditCards();

  const summary = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let income = 0;
    let expenses = 0;
    let balance = 0;
    const thisMonth = movements.filter((item) => {
      const date = parseLocalDate(item.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
    movements.forEach((item) => {
      const amount = Number(item.amount) || 0;
      const date = parseLocalDate(item.date);
      const isCurrentOrPast = date <= now;
      if (item.type === "receita") {
        balance += amount;
        if (date.getMonth() === month && date.getFullYear() === year) income += amount;
      } else {
        if (date.getMonth() === month && date.getFullYear() === year) expenses += amount;
        if (isCurrentOrPast && (item.nature === "debito" || item.nature === "pix")) balance -= amount;
      }
    });
    const recent = [...movements].sort((a,b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()).slice(0,5);
    const topExpenses = thisMonth.filter(x => x.type === "despesa").reduce((acc, item) => {
      const key = item.category || "Outros";
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    const categories = Object.entries(topExpenses).sort((a,b) => b[1]-a[1]).slice(0,4);
    return { income, expenses, balance, savings: income-expenses, recent, categories };
  }, [movements]);

  const goalPreview = goals.slice(0,2);
  const cardPreview = cards.slice(0,2).map(card => {
    const invoiceMonth = getCurrentInvoiceMonthKey(card);
    const total = movements.filter(m => m.card_id === card.id && m.invoice_month === invoiceMonth)
      .reduce((sum,m) => sum + Number(m.amount || 0),0);
    return { ...card, total };
  });
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());

  const hasData = summary.income > 0 || summary.expenses > 0;
  const ratio = summary.income > 0 ? (summary.expenses / summary.income) * 100 : null;
  const status = !hasData ? "empty" : ratio === null || ratio > 100 ? "bad" : ratio > 60 ? "medium" : "good";
  const health = {
    good: { label: "Dentro do planejado", title: "Seu mês está equilibrado", description: "Seus gastos estão em uma faixa confortável.", icon: CheckCircle2, color: "text-success", progress: "bg-success" },
    medium: { label: "Merece atenção", title: "Olho nos próximos gastos", description: "Boa parte das entradas já está comprometida.", icon: Activity, color: "text-warning", progress: "bg-warning" },
    bad: { label: "Precisa de atenção", title: ratio === null ? "Sem receitas no mês" : "Gastos acima da renda", description: ratio === null ? "Cadastre suas receitas para acompanhar o comprometimento." : "As despesas deste mês superaram suas entradas.", icon: AlertTriangle, color: "text-destructive", progress: "bg-destructive" },
    empty: { label: "Seu ponto de partida", title: "Tudo começa aqui", description: "Registre receitas e despesas para conhecer sua saúde financeira.", icon: Activity, color: "text-muted-foreground", progress: "bg-muted-foreground" },
  }[status];
  const HealthIcon = health.icon;

  if (loadingMovements || loadingGoals) {
    return (
      <div className="min-h-screen">
        <AppHeader greeting />
        <div className="app-page space-y-5">
          <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-[30px] bg-muted" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-44 animate-pulse rounded-[24px] bg-muted" />
            <div className="h-44 animate-pulse rounded-[24px] bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader greeting />
      <main className="app-page space-y-6 md:space-y-8">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-eyebrow">SEU PAINEL · {monthLabel}</p>
            <h2 className="display-font mt-2 max-w-[700px] text-[clamp(1.85rem,4vw,3rem)] font-extrabold leading-[1.07] tracking-[-.055em]">
              Clareza para decidir <span className="text-primary">melhor.</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Sua vida financeira, sem complicação.</p>
          </div>
        </section>

        <section aria-label="Resumo financeiro" className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="editorial-hero flex min-h-[292px] flex-col justify-between rounded-[30px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="hero-kicker">FINANÇAS / VISÃO GERAL</span>
              <span className="editorial-chip"><Wallet className="h-3.5 w-3.5" /> Sua carteira</span>
            </div>
            <div className="my-7 sm:my-8">
              <p className="text-[13px] font-medium text-[#67635c]">Saldo disponível</p>
              <div className="mt-2 flex items-center gap-3">
                <h2 className="hero-value min-w-0 break-all text-[clamp(2.15rem,5.4vw,4.5rem)]">{format(summary.balance)}</h2>
                <button type="button" onClick={toggle} aria-label={hidden ? "Mostrar valores" : "Ocultar valores"} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#c9c2b6] transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b65a41]">
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-3 text-xs text-[#777167]">Seu dinheiro registrado até agora.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-[#c9c1b5] pt-5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/60"><ArrowDownLeft className="h-4 w-4 text-[#316d4c]" /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#777167]">Entradas no mês</p>
                  <p className="mt-1 truncate text-sm font-extrabold tabular-nums text-[#272421] sm:text-lg">{format(summary.income)}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/60"><ArrowUpRight className="h-4 w-4 text-[#ad4f48]" /></span>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#777167]">Saídas no mês</p>
                  <p className="mt-1 truncate text-sm font-extrabold tabular-nums text-[#272421] sm:text-lg">{format(summary.expenses)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="app-section-card flex flex-col justify-between">
              <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="section-eyebrow">RESULTADO DO MÊS</p>
                  <span className="icon-tile h-9 w-9">{summary.savings >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}</span>
                </div>
                <div className="mt-4">
                  <p className={`display-font break-all text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-none tracking-tight tabular-nums ${summary.savings >= 0 ? "financial-positive" : "financial-negative"}`}>{format(summary.savings)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Entradas menos saídas deste mês</p>
                </div>
              </CardContent>
            </Card>
            <Card className="app-section-card flex flex-col justify-between">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="section-eyebrow">SAÚDE FINANCEIRA</p>
                  <HealthIcon className={`h-5 w-5 ${health.color}`} />
                </div>
                <p className="display-font mt-3 text-lg font-extrabold leading-tight">{health.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{health.description}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-muted-foreground">{health.label}</span>
                    <span className={`font-extrabold tabular-nums ${health.color}`}>{ratio === null ? "—" : `${Math.round(ratio)}%`}</span>
                  </div>
                  {ratio !== null && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-[width] duration-300 ${health.progress}`} style={{ width: `${Math.min(100, ratio)}%` }} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="flex justify-end" aria-label="Acesso ao histórico de movimentações">
          <Button variant="outline" className="w-full rounded-full border-border bg-card px-5 font-semibold sm:w-auto" onClick={() => navigate({ to: "/movimentacoes" })}>
            <CalendarDays className="mr-1 h-4 w-4" /> Ver movimentações <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <section className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="app-section-card">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div><p className="section-eyebrow">DISTRIBUIÇÃO</p><h3 className="section-title mt-2">Onde você gastou</h3><p className="mt-1 text-xs text-muted-foreground">Maiores despesas deste mês</p></div>
                <Button variant="ghost" size="sm" aria-label="Abrir relatórios de despesas" className="shrink-0 rounded-full" onClick={() => navigate({ to: "/relatorios" })}><ArrowRight className="h-4 w-4" /></Button>
              </div>
              {summary.categories.length ? (
                <div className="space-y-5">
                  {summary.categories.map(([category, amount]) => {
                    const pct = summary.expenses > 0 ? Math.round(amount / summary.expenses * 100) : 0;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate font-semibold">{category}</span>
                          <span className="shrink-0 text-xs font-bold tabular-nums">{format(amount)} <span className="font-normal text-muted-foreground">({pct}%)</span></span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[170px] flex-col items-center justify-center text-center">
                  <span className="icon-tile mb-3"><ReceiptText className="h-5 w-5" /></span>
                  <p className="text-sm font-semibold">Seus gastos aparecerão aqui</p>
                  <p className="mt-1 text-xs text-muted-foreground">Registre uma despesa para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="app-section-card">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><p className="section-eyebrow">ATIVIDADE</p><h3 className="section-title mt-2">Últimas movimentações</h3><p className="mt-1 text-xs text-muted-foreground">{movements.length} lançamentos registrados</p></div>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/movimentacoes" })} className="shrink-0 rounded-full" aria-label="Ver todas as movimentações"><ArrowRight className="h-4 w-4" /></Button>
              </div>
              {summary.recent.length ? (
                <div className="divide-y divide-border/65">
                  {summary.recent.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                      <span className="icon-tile h-10 w-10 rounded-xl">
                        {item.type === "receita" ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{item.description || (item.type === "receita" ? "Receita" : "Despesa")}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{item.category} · {parseLocalDate(item.date).toLocaleDateString("pt-BR")}</span>
                      </span>
                      <span className={`shrink-0 text-right text-xs font-bold tabular-nums sm:text-sm ${item.type === "receita" ? "text-success" : "text-foreground"}`}>
                        {item.type === "receita" ? "+" : "−"}{format(Number(item.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[170px] flex-col items-center justify-center text-center">
                  <span className="icon-tile mb-3"><ArrowDownLeft className="h-5 w-5" /></span>
                  <p className="text-sm font-semibold">Nenhuma movimentação ainda</p>
                  <p className="mt-1 text-xs text-muted-foreground">Use o botão + para registrar a primeira.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="app-section-card">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><p className="section-eyebrow">PLANOS</p><h3 className="section-title mt-2">Suas metas</h3><p className="mt-1 text-xs text-muted-foreground">O futuro também faz parte do presente</p></div>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/metas" })} aria-label="Abrir metas" className="rounded-full"><ChevronRight className="h-4 w-4" /></Button>
              </div>
              {goalPreview.length ? (
                <div className="space-y-5">
                  {goalPreview.map((goal) => {
                    const current = Number(goal.current || 0), target = Number(goal.target || 0);
                    const pct = target > 0 ? Math.min(100, Math.max(0, Math.round(current / target * 100))) : 0;
                    return <div key={goal.id} className="space-y-2">
                      <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{goal.title}</span><span className="text-xs font-extrabold tabular-nums">{pct}%</span></div>
                      <Progress value={pct} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                      <p className="text-[11px] text-muted-foreground">{format(current)} de {format(target)}</p>
                    </div>;
                  })}
                </div>
              ) : <p className="py-7 text-center text-sm text-muted-foreground">Suas metas vão aparecer aqui.</p>}
            </CardContent>
          </Card>

          <Card className="app-section-card">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><p className="section-eyebrow">CRÉDITO</p><h3 className="section-title mt-2">Seus cartões</h3><p className="mt-1 text-xs text-muted-foreground">Faturas do período atual</p></div>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/cartoes" })} aria-label="Abrir cartões" className="rounded-full"><ChevronRight className="h-4 w-4" /></Button>
              </div>
              {cardPreview.length ? (
                <div className="space-y-2">
                  {cardPreview.map(card => (
                    <button type="button" key={card.id} onClick={() => navigate({ to: "/cartoes" })} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background/40 p-3.5 text-left transition-colors hover:border-primary/50">
                      <span className="icon-tile"><CreditCard className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{card.name}</span><span className="block text-xs text-muted-foreground">Vence dia {card.due_day}</span></span>
                      <span className="shrink-0 text-right"><span className="block text-[10px] text-muted-foreground">Fatura</span><span className="block text-sm font-extrabold tabular-nums">{format(card.total)}</span></span>
                    </button>
                  ))}
                </div>
              ) : <p className="py-7 text-center text-sm text-muted-foreground">Cadastre cartões para acompanhar as faturas.</p>}
            </CardContent>
          </Card>
        </section>
      </main>
      <NewMovementFab />
    </div>
  );
}
