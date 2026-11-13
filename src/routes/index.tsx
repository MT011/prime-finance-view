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
import { Eye, EyeOff, ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, Target, ChevronRight, Plus, CalendarDays, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

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

  if (loadingMovements || loadingGoals) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando suas finanças...</div>;
  }

  return (
    <div className="min-h-screen">
      <AppHeader greeting />
      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 pb-28 pt-5 md:space-y-7 md:px-8 md:pb-10 md:pt-8">
        <section className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Visão geral</p>
            <h2 className="mt-1 text-lg font-semibold capitalize text-foreground">{monthLabel}</h2>
          </div>
          <Button onClick={() => navigate({ to: "/movimentacoes" })} variant="outline" size="sm" className="rounded-full border-border bg-card">
            <CalendarDays className="mr-2 h-4 w-4" /> Ver mês
          </Button>
        </section>

        <section className="blue-glow-hero rounded-[28px] px-5 py-7 text-white sm:px-8 sm:py-9">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-100/60">Prime Finance</span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-100/75">Visão financeira</span>
          </div>
          <div className="flex flex-col items-center pb-7 pt-9 text-center sm:pb-9 sm:pt-11">
            <p className="text-sm font-medium text-emerald-50/65">Saldo disponível</p>
            <div className="mt-3 flex max-w-full items-center justify-center gap-2">
              <h2 className="min-w-0 break-all text-[clamp(2rem,7vw,3.75rem)] font-semibold tracking-[-.055em] leading-tight tabular-nums text-white">{format(summary.balance)}</h2>
              <button onClick={toggle} aria-label={hidden ? "Mostrar valores" : "Ocultar valores"} className="shrink-0 rounded-full p-2 text-emerald-50/60 transition-colors hover:bg-white/10 hover:text-white">
                {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-emerald-50/50">Seu dinheiro em perspectiva</p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:gap-6">
            <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.045] p-3 sm:p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><ArrowDownLeft className="h-4 w-4" /></span>
              <div className="min-w-0"><p className="text-xs text-emerald-50/55">Entradas do mês</p><p className="truncate text-sm font-semibold tabular-nums sm:text-base">{format(summary.income)}</p></div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.045] p-3 sm:p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-300/10 text-rose-200"><ArrowUpRight className="h-4 w-4" /></span>
              <div className="min-w-0"><p className="text-xs text-emerald-50/55">Saídas do mês</p><p className="truncate text-sm font-semibold tabular-nums sm:text-base">{format(summary.expenses)}</p></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Card className="border-border/80 shadow-none"><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Resultado do mês</p>
            <p className={`mt-2 text-xl font-bold tracking-tight ${summary.savings >= 0 ? "text-[#0D9B72]" : "text-[#E15B64]"}`}>{format(summary.savings)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Entradas menos saídas</p>
          </CardContent></Card>
          <Card className="border-border/80 shadow-none"><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Lançamentos</p>
            <p className="mt-2 text-xl font-bold tracking-tight">{movements.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Registros no total</p>
          </CardContent></Card>
          <Card className="col-span-2 overflow-hidden border-border/80 shadow-none md:col-span-1">
            {(() => {
              const hasData = summary.income > 0 || summary.expenses > 0;
              const ratio = summary.income > 0 ? (summary.expenses / summary.income) * 100 : summary.expenses > 0 ? 101 : 0;
              const status = !hasData ? "empty" : ratio <= 60 ? "good" : ratio <= 100 ? "medium" : "bad";
              const styles = {
                good: { shell: "border-emerald-500/30 bg-emerald-500/[0.07]", icon: "bg-emerald-500/15 text-emerald-500", title: "text-emerald-500", bar: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-500", label: "Boa", description: "Seus gastos estão dentro de uma faixa confortável." },
                medium: { shell: "border-amber-500/30 bg-amber-500/[0.07]", icon: "bg-amber-500/15 text-amber-500", title: "text-amber-500", bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-500", label: "Atenção", description: "Uma boa parte da sua renda já está comprometida." },
                bad: { shell: "border-rose-500/35 bg-rose-500/[0.08]", icon: "bg-rose-500/15 text-rose-500", title: "text-rose-500", bar: "bg-rose-500", badge: "bg-rose-500/15 text-rose-500", label: "Crítica", description: "Suas despesas superaram suas receitas." },
                empty: { shell: "border-border bg-muted/30", icon: "bg-muted text-muted-foreground", title: "text-foreground", bar: "bg-muted-foreground", badge: "bg-muted text-muted-foreground", label: "Sem dados", description: "Cadastre receitas e despesas para acompanhar sua saúde financeira." },
              }[status];
              const StatusIcon = status === "good" ? CheckCircle2 : status === "medium" ? Activity : status === "bad" ? AlertTriangle : Activity;
              return <CardContent className={`space-y-3 border p-4 ${styles.shell}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">Saúde financeira</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>{styles.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${styles.icon}`}><StatusIcon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className={`text-base font-bold tracking-tight ${styles.title}`}>{status === "good" ? "No caminho certo" : status === "medium" ? "Atenção aos gastos" : status === "bad" ? "Gastos acima da renda" : "Vamos começar?"}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{styles.description}</p>
                  </div>
                </div>
                {hasData && <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Renda comprometida</span>
                    <span className={`font-bold tabular-nums ${styles.title}`}>{Math.round(ratio)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} style={{ width: `${Math.min(ratio, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{status === "bad" ? `Você gastou ${(ratio - 100).toFixed(1).replace(".", ",")}% a mais do que recebeu.` : status === "medium" ? "Tente reduzir despesas para liberar mais da sua renda." : "Até 60% da renda comprometida: boa margem para seus objetivos."}</p>
                </div>}
              </CardContent>;
            })()}
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <Card className="border-border/80 shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div><h3 className="font-semibold">Onde você gastou</h3><p className="text-xs text-muted-foreground">Maiores despesas deste mês</p></div>
                <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate({ to: "/relatorios" })}>Detalhes <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
              {summary.categories.length ? <div className="space-y-4">
                {summary.categories.map(([category, amount]) => {
                  const pct = summary.expenses > 0 ? Math.round(amount / summary.expenses * 100) : 0;
                  return <div key={category} className="space-y-1.5">
                    <div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{category}</span><span className="shrink-0 text-muted-foreground">{format(amount)} <span className="text-xs">({pct}%)</span></span></div>
                    <Progress value={pct} className="h-2 bg-secondary [&>div]:bg-[#356AE6]" />
                  </div>;
                })}
              </div> : <p className="py-8 text-center text-sm text-muted-foreground">Suas despesas por categoria aparecerão aqui.</p>}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">Metas</h3><p className="text-xs text-muted-foreground">Acompanhe seus objetivos</p></div><Button variant="ghost" size="icon" onClick={() => navigate({ to: "/metas" })}><ChevronRight className="h-4 w-4" /></Button></div>
              {goalPreview.length ? <div className="space-y-4">{goalPreview.map(goal => {
                const current = Number(goal.current || 0), target = Number(goal.target || 0);
                const pct = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;
                return <div key={goal.id} className="space-y-2">
                  <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{goal.title}</span><span className="text-xs font-semibold text-primary">{pct}%</span></div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{format(current)} de {format(target)}</p>
                </div>;
              })}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Cadastre uma meta para acompanhar seu progresso.</p>}
            </CardContent>
          </Card>
        </section>

        {cardPreview.length > 0 && <section>
          <div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold">Seus cartões</h3><p className="text-xs text-muted-foreground">Resumo das faturas atuais</p></div><Button variant="ghost" size="sm" onClick={() => navigate({ to: "/cartoes" })}>Ver todos <ChevronRight className="ml-1 h-4 w-4" /></Button></div>
          <div className="grid gap-3 sm:grid-cols-2">{cardPreview.map(card => <button key={card.id} onClick={() => navigate({ to: "/cartoes" })} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#356AE6]/10 text-[#356AE6]"><CreditCard className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{card.name}</span><span className="block text-xs text-muted-foreground">Vencimento dia {card.due_day}</span></span>
            <span className="text-right"><span className="block text-xs text-muted-foreground">Fatura atual</span><span className="font-semibold">{format(card.total)}</span></span>
          </button>)}</div>
        </section>}

        <section>
          <div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold">Últimas movimentações</h3><p className="text-xs text-muted-foreground">Atividade recente da sua conta</p></div><Button variant="ghost" size="sm" onClick={() => navigate({ to: "/movimentacoes" })}>Ver todas <ChevronRight className="ml-1 h-4 w-4" /></Button></div>
          <Card className="border-border/80 shadow-none"><CardContent className="divide-y divide-border p-0">
            {summary.recent.length ? summary.recent.map(item => <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${item.type === "receita" ? "bg-[#0D9B72]/10 text-[#0D9B72]" : "bg-[#E15B64]/10 text-[#E15B64]"}`}>{item.type === "receita" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.description}</span><span className="block truncate text-xs text-muted-foreground">{item.category} · {parseLocalDate(item.date).toLocaleDateString("pt-BR")}</span></span>
              <span className={`shrink-0 text-sm font-semibold ${item.type === "receita" ? "text-[#0D9B72]" : "text-foreground"}`}>{item.type === "receita" ? "+" : "−"}{format(Number(item.amount))}</span>
            </div>) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma movimentação cadastrada ainda.</p>}
          </CardContent></Card>
        </section>

        <Button onClick={() => navigate({ to: "/movimentacoes" })} className="hidden rounded-full md:inline-flex"><Plus className="mr-2 h-4 w-4" /> Nova movimentação</Button>
      </main>
      <NewMovementFab />
    </div>
  );
}
