export type Movement = {
  id: string;
  date: string; // ISO
  description: string;
  category: string;
  account: string;
  type: "receita" | "despesa";
  amount: number;
};

export const movements: Movement[] = [];

export const monthlyEvolution: any[] = [];

export const categoriesData: any[] = [];

export const goals: any[] = [];

export const emergencyEvolution: any[] = [];

export const categoriesList = {
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

export const accounts = ["Nubank", "Itaú", "Inter", "C6 Bank", "Carteira"];
