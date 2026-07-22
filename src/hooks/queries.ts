import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
  installment_group_id?: string | null;
  installment_number?: number | null;
  total_installments?: number | null;
  recurring_group_id?: string | null;
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
  user_id: string;
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

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "receita" | "despesa";
  created_at: string;
}

async function getUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  return user.id;
}

export function useMovements() {
  return useQuery<Movement[]>({
    queryKey: ["movements"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("movements")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      movement:
        | Omit<Movement, "id" | "user_id" | "created_at">
        | Omit<Movement, "id" | "user_id" | "created_at">[],
    ) => {
      const items = Array.isArray(movement) ? movement : [movement];
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payloads = items.map((m) => ({
        ...m,
        user_id: user.id,
        ...(m.type === "despesa" && m.nature ? { nature: m.nature } : {}),
        ...(m.type === "despesa" && m.expense_type ? { expense_type: m.expense_type } : {}),
        ...(m.card_id ? { card_id: m.card_id } : {}),
        ...(m.invoice_month ? { invoice_month: m.invoice_month } : {}),
        ...(m.installment_group_id ? { installment_group_id: m.installment_group_id } : {}),
        ...(m.installment_number ? { installment_number: m.installment_number } : {}),
        ...(m.total_installments ? { total_installments: m.total_installments } : {}),
      }));

      let { data, error } = await supabase.from("movements").insert(payloads).select();

      if (error) {
        const fallbackPayloads = payloads.map((p) => {
          const {
            nature,
            expense_type,
            installment_group_id,
            installment_number,
            total_installments,
            ...rest
          } = p as any;
          return rest;
        });
        ({ data, error } = await supabase.from("movements").insert(fallbackPayloads).select());
      }

      if (error) throw error;
      return items.length === 1 && Array.isArray(data) ? data[0] : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useDeleteMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input:
        | string
        | { id: string; installmentGroupId?: string; deleteAll?: boolean }
        | { id: string; recurringGroupId?: string },
    ) => {
      const userId = await getUserId();

      if (typeof input === "string") {
        const { error } = await supabase
          .from("movements")
          .delete()
          .eq("id", input)
          .eq("user_id", userId);
        if (error) throw error;
        return;
      }

      if ("recurringGroupId" in input && input.recurringGroupId) {
        const { error } = await supabase
          .from("movements")
          .delete()
          .eq("recurring_group_id", input.recurringGroupId)
          .eq("user_id", userId);
        if (error) throw error;
        return;
      }

      if ("installmentGroupId" in input && input.deleteAll && input.installmentGroupId) {
        const { error } = await supabase
          .from("movements")
          .delete()
          .eq("installment_group_id", input.installmentGroupId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("movements")
          .delete()
          .eq("id", input.id)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useBulkDeleteMovements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("movements")
        .delete()
        .in("id", ids)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useUpdateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input:
        | (Partial<Movement> & { id: string })
        | (Partial<Movement> & {
            id: string;
            editAllInstallments?: boolean;
            installmentGroupId?: string;
          })
        | (Partial<Movement> & {
            id: string;
            recurringGroupId?: string;
          }),
    ) => {
      const { id, editAllInstallments, installmentGroupId, recurringGroupId, ...data } = input as any;
      const userId = await getUserId();

      if (recurringGroupId) {
        const { error } = await supabase
          .from("movements")
          .update(data)
          .eq("recurring_group_id", recurringGroupId)
          .eq("user_id", userId);
        if (error) throw error;
        return;
      }

      if (editAllInstallments && installmentGroupId) {
        const { error } = await supabase
          .from("movements")
          .update(data)
          .eq("installment_group_id", installmentGroupId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("movements")
          .update(data)
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useCreditCards() {
  return useQuery<CreditCard[]>({
    queryKey: ["credit_cards"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      limit,
      closing_day,
      due_day,
    }: {
      name: string;
      limit: number;
      closing_day: number;
      due_day: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("credit_cards")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
    },
  });
}

export interface CardName {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function useCardNames() {
  return useQuery<CardName[]>({
    queryKey: ["card_names"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("card_names")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCardName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const trimmed = name.trim();
      if (!trimmed) throw new Error("Nome não pode ser vazio");

      const { data: existing } = await supabase
        .from("card_names")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", trimmed)
        .maybeSingle();

      if (existing) return existing;

      const { data, error } = await supabase
        .from("card_names")
        .insert([{ user_id: user.id, name: trimmed }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_names"] });
    },
  });
}

export function useDeleteCardName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("card_names")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_names"] });
    },
  });
}

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

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (goalsError) throw goalsError;
      const goals = goalsData || [];

      const { data: cardsData } = await supabase
        .from("credit_cards")
        .select("id, closing_day")
        .eq("user_id", userId);

      const cards = cardsData || [];

      const toUpdate = goals.filter((g) => {
        if (!g.reset_monthly) return false;
        const currentKey = getCycleKey(g, cards);
        return g.last_reset_month !== currentKey;
      });

      if (toUpdate.length > 0) {
        for (const goal of toUpdate) {
          const currentKey = getCycleKey(goal, cards);
          const { error: histError } = await supabase.from("goal_history").insert([
            {
              user_id: userId,
              goal_id: goal.id,
              goal_title: goal.title,
              month: goal.last_reset_month || currentKey,
              current: goal.current,
              target: goal.target,
              achieved: goal.current >= goal.target,
            },
          ]);
          if (histError) console.error("Erro ao salvar histórico:", histError);
        }

        for (const goal of toUpdate) {
          const currentKey = getCycleKey(goal, cards);
          const { error: updateError } = await supabase
            .from("goals")
            .update({ current: 0, last_reset_month: currentKey })
            .eq("id", goal.id)
            .eq("user_id", userId);
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

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      current,
      target,
      description,
      reset_monthly,
      last_reset_month,
      card_id,
    }: {
      id: string;
      title?: string;
      current?: number;
      target?: number;
      description?: string | null;
      reset_monthly?: boolean;
      last_reset_month?: string | null;
      card_id?: string | null;
    }) => {
      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (current !== undefined) updateData.current = current;
      if (target !== undefined) updateData.target = target;
      if (description !== undefined) updateData.description = description;
      if (reset_monthly !== undefined) updateData.reset_monthly = reset_monthly;
      if (last_reset_month !== undefined) updateData.last_reset_month = last_reset_month;
      if (card_id !== undefined) updateData.card_id = card_id;

      const userId = await getUserId();
      const { data, error } = await supabase
        .from("goals")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
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

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      current,
      target,
      period,
      description,
      reset_monthly,
      card_id,
    }: {
      title: string;
      current: number;
      target: number;
      period: string;
      description?: string | null;
      reset_monthly?: boolean;
      card_id?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("goals")
        .insert([
          { user_id: user.id, title, current, target, period, description, reset_monthly, card_id },
        ])
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

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getUserId();
      const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useEmergencySavings() {
  return useQuery<EmergencySaving[]>({
    queryKey: ["emergency_savings"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("emergency_savings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useSaveEmergencySavings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, value }: { month: string; value: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: existing } = await supabase
        .from("emergency_savings")
        .select("id")
        .eq("user_id", user.id)
        .eq("month", month)
        .maybeSingle();

      let error;
      if (existing?.id) {
        ({ error } = await supabase
          .from("emergency_savings")
          .update({ value })
          .eq("id", existing.id)
          .eq("user_id", user.id));
      } else {
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

export function useGoalHistory() {
  return useQuery<GoalHistory[]>({
    queryKey: ["goal_history"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("goal_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
