const STORAGE_KEY = "finance-dashboard-categories";

export type CategoryType = "receita" | "despesa";

const defaultCategories = {
  receitas: ["Salário", "Renda Extra", "Investimentos", "Vendas", "Presentes"],
  despesas: [
    "Alimentação",
    "Moradia",
    "Transporte",
    "Saúde",
    "Academia",
    "Lazer",
    "Internet",
    "Assinaturas",
    "Investimentos",
    "Outros",
  ],
};

export function getStoredCategories() {
  if (typeof window === "undefined") {
    return defaultCategories;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultCategories;
    }

    const parsed = JSON.parse(raw);
    return {
      receitas: Array.isArray(parsed?.receitas) ? parsed.receitas : defaultCategories.receitas,
      despesas: Array.isArray(parsed?.despesas) ? parsed.despesas : defaultCategories.despesas,
    };
  } catch {
    return defaultCategories;
  }
}

export function saveStoredCategories(categories: typeof defaultCategories) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function addCategory(type: CategoryType, name: string) {
  const current = getStoredCategories();
  const list = type === "receita" ? current.receitas : current.despesas;
  const normalized = name.trim();

  if (!normalized || list.includes(normalized)) {
    return current;
  }

  const next = {
    ...current,
    [type === "receita" ? "receitas" : "despesas"]: [...list, normalized],
  };
  saveStoredCategories(next);
  return next;
}

export function removeCategory(type: CategoryType, name: string) {
  const current = getStoredCategories();
  const list = type === "receita" ? current.receitas : current.despesas;
  const nextList = list.filter((item) => item !== name);
  const next = {
    ...current,
    [type === "receita" ? "receitas" : "despesas"]: nextList,
  };
  saveStoredCategories(next);
  return next;
}
