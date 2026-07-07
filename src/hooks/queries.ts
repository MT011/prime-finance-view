import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getStoredSession } from "@/lib/auth-storage";
import { getDemoDataStore, saveDemoDataStore } from "@/lib/demo-data-storage";

export interface Movement {
  id: string;
  user_id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  type: "receita" | "despesa";
  amount: number;
  nature?: "credito" | "debito" | "pix" | null;
  expense_type?: "fixo" | "variavel" | null;
  card_id?: string | null;
  invoice_month?: string | null;
  created_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  limit: number;
  closing_day: number;
  due_day: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  current: number;
  target: number;
  period: string;
  description?: string | null;
  reset_monthly?: boolean;
  last_reset_month?: string | null;
  card_id?: string | null;
  created_at: string;
}

export interface GoalHistory {
  id: string;
  goal_id: string;
  goal_title: string;
  month: string;
  current: number;
  target: number;
  achieved: boolean;
  created_at: string;
}

export interface EmergencySaving {
  id: string;
  user_id: string;
  month: string;
  value: number;
  created_at: string;
}

// 1. Hook para buscar movimentações
export function useMovements() {
  return useQuery<Movement[]>({
    queryKey: ["movements"],
    queryFn: async () => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        return getDemoDataStore().movements || [];
      }

      const { data, error } = await supabase
        .from("movements")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

// 2. Hook para adicionar nova movimentação
export function useAddMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movement: Omit<Movement, "id" | "user_id" | "created_at">) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const newMovement = {
          id: crypto.randomUUID(),
          user_id: "demo-user",
          created_at: new Date().toISOString(),
          ...movement,
        } as Movement;
        const updatedMovements = [newMovement, ...store.movements];
        saveDemoDataStore({ ...store, movements: updatedMovements });
        return newMovement;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const basePayload = {
        ...movement,
        user_id: user.id,
        ...(movement.type === "despesa" && movement.nature ? { nature: movement.nature } : {}),
        ...(movement.type === "despesa" && movement.expense_type ? { expense_type: movement.expense_type } : {}),
        ...(movement.card_id ? { card_id: movement.card_id } : {}),
        ...(movement.invoice_month ? { invoice_month: movement.invoice_month } : {}),
      };

      let { data, error } = await supabase
        .from("movements")
        .insert([basePayload])
        .select()
        .single();

      if (error && movement.type === "despesa" && (movement.nature || movement.expense_type)) {
        const fallbackPayload = { ...basePayload };
        delete fallbackPayload.nature;
        delete fallbackPayload.expense_type;

        ({ data, error } = await supabase
          .from("movements")
          .insert([fallbackPayload])
          .select()
          .single());
      }

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

// 3. Hook para excluir movimentação
export function useDeleteMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const updatedMovements = store.movements.filter((movement) => movement.id !== id);
        saveDemoDataStore({ ...store, movements: updatedMovements });
        return;
      }

      const { error } = await supabase
        .from("movements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

// 3.5 Hook para atualizar movimentação
export function useUpdateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Movement> & { id: string }) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const updatedMovements = store.movements.map((movement: any) =>
          movement.id === id ? { ...movement, ...data } : movement,
        );
        saveDemoDataStore({ ...store, movements: updatedMovements });
        return;
      }

      const { error } = await supabase
        .from("movements")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

// 4. Hook para buscar cartões de crédito
export function useCreditCards() {
  return useQuery<CreditCard[]>({
    queryKey: ["credit_cards"],
    queryFn: async () => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        return getDemoDataStore().creditCards || [];
      }

      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

// 5. Hook para criar cartão de crédito
export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, limit, closing_day, due_day }: { name: string; limit: number; closing_day: number; due_day: number }) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const newCard = {
          id: crypto.randomUUID(),
          user_id: "demo-user",
          name,
          limit,
          closing_day,
          due_day,
          created_at: new Date().toISOString(),
        } as CreditCard;
        saveDemoDataStore({ ...store, creditCards: [newCard, ...store.creditCards] });
        return newCard;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("credit_cards")
        .insert([{ user_id: user.id, name, limit, closing_day, due_day }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
    },
  });
}

// 6. Hook para excluir cartão de crédito
export function useDeleteCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        saveDemoDataStore({ ...store, creditCards: store.creditCards.filter((card) => card.id !== id) });
        return;
      }

      const { error } = await supabase.from("credit_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
    },
  });
}

// 7. Hook para buscar metas
function getCalendarMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCardCycleKey(card: { closing_day: number }): string {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const cd = card.closing_day;

  if (day > cd) {
    const nextMonth = month + 1;
    const cy = nextMonth > 11 ? year + 1 : year;
    const cm = nextMonth > 11 ? 0 : nextMonth;
    return `${cy}-${String(cm + 1).padStart(2, "0")}-${String(cd).padStart(2, "0")}`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(cd).padStart(2, "0")}`;
}

function getCycleKey(goal: Goal, cards: any[]): string {
  if (goal.card_id) {
    const card = cards.find((c: any) => c.id === goal.card_id);
    if (card && card.closing_day) return getCardCycleKey(card);
  }
  return getCalendarMonthKey();
}

function saveGoalHistory(goal: Goal, period: string) {
  const historyEntry = {
    id: crypto.randomUUID(),
    goal_id: goal.id,
    goal_title: goal.title,
    month: period,
    current: goal.current,
    target: goal.target,
    achieved: goal.current >= goal.target,
    created_at: new Date().toISOString(),
  };
  const store = getDemoDataStore();
  saveDemoDataStore({
    ...store,
    goalHistory: [...store.goalHistory, historyEntry],
    goals: store.goals.map((g: any) =>
      g.id === goal.id ? { ...g, current: 0, last_reset_month: period } : g,
    ),
  });
}

function applyMonthlyResets(goals: Goal[], cards: any[]): Goal[] {
  const updated = goals.map((goal) => {
    if (!goal.reset_monthly) return goal;
    const currentKey = getCycleKey(goal, cards);
    if (goal.last_reset_month !== currentKey) {
      saveGoalHistory(goal, goal.last_reset_month || currentKey);
      return { ...goal, current: 0, last_reset_month: currentKey };
    }
    return goal;
  });
  return updated;
}

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const goals = store.goals || [];
        const cards = store.creditCards || [];
        return applyMonthlyResets(goals, cards);
      }

      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: true });

      if (goalsError) throw goalsError;
      const goals = goalsData || [];

      const { data: cardsData } = await supabase
        .from("credit_cards")
        .select("id, closing_day");

      const cards = cardsData || [];

      const toUpdate = goals.filter((g) => {
        if (!g.reset_monthly) return false;
        const currentKey = getCycleKey(g, cards);
        return g.last_reset_month !== currentKey;
      });

      if (toUpdate.length > 0) {
        for (const goal of toUpdate) {
          const currentKey = getCycleKey(goal, cards);
          const { error: histError } = await supabase
            .from("goal_history")
            .insert([{
              goal_id: goal.id,
              goal_title: goal.title,
              month: goal.last_reset_month || currentKey,
              current: goal.current,
              target: goal.target,
              achieved: goal.current >= goal.target,
            }]);
          if (histError) console.error("Erro ao salvar histórico:", histError);
        }

        for (const goal of toUpdate) {
          const currentKey = getCycleKey(goal, cards);
          const { error: updateError } = await supabase
            .from("goals")
            .update({ current: 0, last_reset_month: currentKey })
            .eq("id", goal.id);
          if (updateError) console.error("Erro ao resetar meta:", updateError);
        }
      }

      return goals.map((g) => {
        if (!g.reset_monthly) return g;
        const currentKey = getCycleKey(g, cards);
        if (toUpdate.some((t) => t.id === g.id)) {
          return { ...g, current: 0, last_reset_month: currentKey };
        }
        return g;
      });
    },
  });
}

// 5. Hook para atualizar meta
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, current, target, description, reset_monthly, last_reset_month, card_id }: { id: string; title?: string; current?: number; target?: number; description?: string | null; reset_monthly?: boolean; last_reset_month?: string | null; card_id?: string | null }) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const updatedGoals = store.goals.map((goal) =>
          goal.id === id
            ? { ...goal, ...(title !== undefined ? { title } : {}), ...(current !== undefined ? { current } : {}), ...(target !== undefined ? { target } : {}), ...(description !== undefined ? { description } : {}), ...(reset_monthly !== undefined ? { reset_monthly } : {}), ...(last_reset_month !== undefined ? { last_reset_month } : {}), ...(card_id !== undefined ? { card_id } : {}) }
            : goal,
        );
        saveDemoDataStore({ ...store, goals: updatedGoals });
        return updatedGoals.find((goal) => goal.id === id);
      }

      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (current !== undefined) updateData.current = current;
      if (target !== undefined) updateData.target = target;
      if (description !== undefined) updateData.description = description;
      if (reset_monthly !== undefined) updateData.reset_monthly = reset_monthly;
      if (last_reset_month !== undefined) updateData.last_reset_month = last_reset_month;
      if (card_id !== undefined) updateData.card_id = card_id;

      const { data, error } = await supabase
        .from("goals")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

// 6. Hook para criar nova meta
export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, current, target, period, description, reset_monthly, card_id }: { title: string; current: number; target: number; period: string; description?: string | null; reset_monthly?: boolean; card_id?: string | null }) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const newGoal = {
          id: crypto.randomUUID(),
          user_id: "demo-user",
          title,
          current,
          target,
          period,
          description,
          reset_monthly: reset_monthly ?? false,
          last_reset_month: null,
          card_id: card_id || null,
          created_at: new Date().toISOString(),
        } as Goal;
        saveDemoDataStore({ ...store, goals: [newGoal, ...store.goals] });
        return newGoal;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("goals")
        .insert([{ user_id: user.id, title, current, target, period, description, reset_monthly, card_id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

// 7. Hook para excluir meta
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        saveDemoDataStore({ ...store, goals: store.goals.filter((goal) => goal.id !== id) });
        return;
      }

      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

// 8. Hook para buscar histórico da reserva de emergência
export function useEmergencySavings() {
  return useQuery<EmergencySaving[]>({
    queryKey: ["emergency_savings"],
    queryFn: async () => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        return getDemoDataStore().emergencySavings || [];
      }

      const { data, error } = await supabase
        .from("emergency_savings")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

// 7. Hook para salvar (inserir ou atualizar) reserva de emergência para um mês específico
export function useSaveEmergencySavings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, value }: { month: string; value: number }) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const existing = store.emergencySavings.find((entry) => entry.month === month);
        const updatedEntries = existing
          ? store.emergencySavings.map((entry) => (entry.month === month ? { ...entry, value } : entry))
          : [
              ...store.emergencySavings,
              {
                id: crypto.randomUUID(),
                user_id: "demo-user",
                month,
                value,
                created_at: new Date().toISOString(),
              },
            ];
        saveDemoDataStore({ ...store, emergencySavings: updatedEntries });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se já existe registro para o mês
      const { data: existing } = await supabase
        .from("emergency_savings")
        .select("id")
        .eq("month", month)
        .maybeSingle();

      let error;
      if (existing?.id) {
        // Atualizar
        ({ error } = await supabase
          .from("emergency_savings")
          .update({ value })
          .eq("id", existing.id));
      } else {
        // Inserir
        ({ error } = await supabase
          .from("emergency_savings")
          .insert([{ user_id: user.id, month, value }]));
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency_savings"] });
    },
  });
}

// 9. Hook para buscar histórico de metas
export function useGoalHistory() {
  return useQuery<GoalHistory[]>({
    queryKey: ["goal_history"],
    queryFn: async () => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        return getDemoDataStore().goalHistory || [];
      }

      const { data, error } = await supabase
        .from("goal_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
