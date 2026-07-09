import { supabase } from "@/lib/supabase";

export type CategoryType = "receita" | "despesa";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  created_at: string;
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  return user.id;
}

export async function getStoredCategories(): Promise<{ receitas: string[]; despesas: string[] }> {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("categories")
      .select("name, type")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const receitas: string[] = [];
    const despesas: string[] = [];

    (data || []).forEach((cat) => {
      if (cat.type === "receita") receitas.push(cat.name);
      else despesas.push(cat.name);
    });

    return { receitas, despesas };
  } catch {
    return { receitas: [], despesas: [] };
  }
}

export async function saveStoredCategories(categories: { receitas: string[]; despesas: string[] }): Promise<void> {
  try {
    const userId = await getUserId();
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    const inserts: { user_id: string; name: string; type: CategoryType }[] = [];
    categories.receitas.forEach((name) => inserts.push({ user_id: userId, name, type: "receita" }));
    categories.despesas.forEach((name) => inserts.push({ user_id: userId, name, type: "despesa" }));

    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from("categories").insert(inserts);
      if (insertError) throw insertError;
    }
  } catch (e) {
    console.error("Erro ao salvar categorias:", e);
  }
}

export async function addCategory(type: CategoryType, name: string): Promise<{ receitas: string[]; despesas: string[] }> {
  try {
    const userId = await getUserId();
    const normalized = name.trim();
    if (!normalized) return getStoredCategories();

    const { error } = await supabase
      .from("categories")
      .insert([{ user_id: userId, name: normalized, type }]);

    if (error) {
      if (error.code === "23505") {
        return getStoredCategories();
      }
      throw error;
    }

    return getStoredCategories();
  } catch {
    return getStoredCategories();
  }
}

export async function removeCategory(type: CategoryType, name: string): Promise<{ receitas: string[]; despesas: string[] }> {
  try {
    const userId = await getUserId();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("user_id", userId)
      .eq("name", name)
      .eq("type", type);

    if (error) throw error;
    return getStoredCategories();
  } catch {
    return getStoredCategories();
  }
}
