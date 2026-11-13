import type { CreditCard, Movement, CategoryBudget, Goal } from "@/hooks/queries";
import { getCurrentInvoiceMonthKey, parseLocalDate } from "@/lib/credit-cards";

export type FinanceNotification = {
  id: string;
  title: string;
  description: string;
  href: "/categorias" | "/movimentacoes" | "/cartoes" | "/metas";
  level: "warning" | "info" | "success";
};

export type NotificationPreferences = {
  budgets: boolean;
  cards: boolean;
  goals: boolean;
  summary: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  budgets: true, cards: true, goals: true, summary: true,
};

export function getNotificationPreferences(metadata: Record<string, any> | undefined): NotificationPreferences {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(metadata?.prime_notification_prefs || {}) };
}

export function buildFinanceNotifications(
  movements: Movement[],
  budgets: CategoryBudget[],
  cards: CreditCard[],
  goals: Goal[],
  preferences: NotificationPreferences,
  now = new Date(),
): FinanceNotification[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const current = movements.filter((m) => {
    const d = parseLocalDate(m.date);
    return m.type === "despesa" && d.getMonth() === month && d.getFullYear() === year;
  });
  const format = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const notifications: FinanceNotification[] = [];

  if (preferences.budgets) {
    budgets.filter((b) => Number(b.monthly_limit) > 0).forEach((budget) => {
      const limit = Number(budget.monthly_limit);
      const spent = current.filter((m) => m.category === budget.category)
        .reduce((total, m) => total + (Number(m.amount) || 0), 0);
      const ratio = spent / limit;
      if (ratio >= 1) {
        notifications.push({
          id: `budget-over-${monthKey}-${budget.category}`,
          title: `Limite atingido: ${budget.category}`,
          description: `Você gastou ${format(spent)} de ${format(limit)} planejados para este mês.`,
          href: "/categorias", level: "warning",
        });
      } else if (ratio >= 0.8) {
        notifications.push({
          id: `budget-near-${monthKey}-${budget.category}`,
          title: `Atenção: ${budget.category}`,
          description: `Você utilizou ${Math.round(ratio * 100)}% do limite. Restam ${format(limit - spent)}.`,
          href: "/categorias", level: "warning",
        });
      }
    });
  }
  if (preferences.cards) {
    cards.forEach((card) => {
      const invoice = getCurrentInvoiceMonthKey(card);
      const total = movements
        .filter((m) => m.card_id === card.id && m.invoice_month === invoice)
        .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      if (total > 0 && Number(card.limit) > 0 && total >= Number(card.limit) * 0.8) {
        notifications.push({
          id: `card-limit-${card.id}-${invoice}`,
          title: `Acompanhe seu cartão ${card.name}`,
          description: `Os lançamentos da fatura atual somam ${format(total)}, ao menos 80% do limite cadastrado.`,
          href: "/cartoes", level: "warning",
        });
      }
    });
  }
  if (preferences.goals) {
    goals.filter((g) => Number(g.target) > 0 && Number(g.current) >= Number(g.target)).slice(0, 2).forEach((goal) => {
      notifications.push({
        id: `goal-${goal.id}-${goal.target}`,
        title: "Meta alcançada!",
        description: `Parabéns! Sua meta "${goal.title}" chegou ao valor planejado.`,
        href: "/metas", level: "success",
      });
    });
  }
  if (preferences.summary) {
    const income = movements.filter((m) => {
      const d = parseLocalDate(m.date);
      return m.type === "receita" && d.getMonth() === month && d.getFullYear() === year;
    }).reduce((total, m) => total + (Number(m.amount) || 0), 0);
    const expenses = current.reduce((total, m) => total + (Number(m.amount) || 0), 0);
    if (income > 0 || expenses > 0) {
      notifications.push({
        id: `summary-${monthKey}`,
        title: "Resumo do mês",
        description: `Entradas: ${format(income)}. Despesas registradas: ${format(expenses)}. Confira seus lançamentos.`,
        href: "/movimentacoes", level: "info",
      });
    }
  }
  return notifications.slice(0, 15);
}
