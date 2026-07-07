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
  nature?: "credito" | "debito" | "dinheiro" | null;
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
export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        return getDemoDataStore().goals || [];
      }

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

// 5. Hook para atualizar meta
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, current, target, description }: { id: string; title?: string; current?: number; target?: number; description?: string | null }) => {
      const storedSession = getStoredSession();
      if (storedSession?.demo) {
        const store = getDemoDataStore();
        const updatedGoals = store.goals.map((goal) =>
          goal.id === id
            ? { ...goal, ...(title !== undefined ? { title } : {}), ...(current !== undefined ? { current } : {}), ...(target !== undefined ? { target } : {}), ...(description !== undefined ? { description } : {}) }
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
    mutationFn: async ({ title, current, target, period, description }: { title: string; current: number; target: number; period: string; description?: string | null }) => {
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
          created_at: new Date().toISOString(),
        } as Goal;
        saveDemoDataStore({ ...store, goals: [newGoal, ...store.goals] });
        return newGoal;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("goals")
        .insert([{ user_id: user.id, title, current, target, period, description }])
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
