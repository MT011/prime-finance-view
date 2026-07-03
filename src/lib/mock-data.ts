export type Movement = {
  id: string;
  date: string; // ISO
  description: string;
  category: string;
  account: string;
  type: "receita" | "despesa";
  amount: number;
};

export const movements: Movement[] = [
  { id: "1", date: "2025-08-04", description: "Salário Empresa X", category: "Salário", account: "Nubank", type: "receita", amount: 7800 },
  { id: "2", date: "2025-08-03", description: "Aluguel Apartamento", category: "Moradia", account: "Itaú", type: "despesa", amount: 2200 },
  { id: "3", date: "2025-08-03", description: "Supermercado Pão de Açúcar", category: "Alimentação", account: "Nubank", type: "despesa", amount: 685.4 },
  { id: "4", date: "2025-08-02", description: "Uber", category: "Transporte", account: "Inter", type: "despesa", amount: 42.9 },
  { id: "5", date: "2025-08-02", description: "Freelance Design", category: "Renda Extra", account: "Nubank", type: "receita", amount: 700 },
  { id: "6", date: "2025-08-01", description: "Academia Smart Fit", category: "Academia", account: "Itaú", type: "despesa", amount: 129.9 },
  { id: "7", date: "2025-07-31", description: "Netflix", category: "Assinaturas", account: "Nubank", type: "despesa", amount: 55.9 },
  { id: "8", date: "2025-07-31", description: "Spotify Family", category: "Assinaturas", account: "Nubank", type: "despesa", amount: 34.9 },
  { id: "9", date: "2025-07-30", description: "Plano de Saúde", category: "Saúde", account: "Itaú", type: "despesa", amount: 480 },
  { id: "10", date: "2025-07-29", description: "Restaurante Fasano", category: "Lazer", account: "Nubank", type: "despesa", amount: 320 },
  { id: "11", date: "2025-07-28", description: "Internet Vivo Fibra", category: "Internet", account: "Itaú", type: "despesa", amount: 129.9 },
  { id: "12", date: "2025-07-27", description: "Aporte Tesouro Direto", category: "Investimentos", account: "Inter", type: "despesa", amount: 1500 },
  { id: "13", date: "2025-07-26", description: "Farmácia", category: "Saúde", account: "Nubank", type: "despesa", amount: 89.4 },
  { id: "14", date: "2025-07-25", description: "Combustível", category: "Transporte", account: "Itaú", type: "despesa", amount: 250 },
  { id: "15", date: "2025-07-24", description: "Dividendos ITSA4", category: "Investimentos", account: "Inter", type: "receita", amount: 320 },
];

export const monthlyEvolution = [
  { month: "Jan", receitas: 7200, despesas: 5100, saldo: 2100 },
  { month: "Fev", receitas: 7400, despesas: 4800, saldo: 2600 },
  { month: "Mar", receitas: 7100, despesas: 5300, saldo: 1800 },
  { month: "Abr", receitas: 7800, despesas: 5000, saldo: 2800 },
  { month: "Mai", receitas: 8000, despesas: 5600, saldo: 2400 },
  { month: "Jun", receitas: 8200, despesas: 5400, saldo: 2800 },
  { month: "Jul", receitas: 7900, despesas: 5650, saldo: 2250 },
  { month: "Ago", receitas: 8500, despesas: 5200, saldo: 3300 },
  { month: "Set", receitas: 8300, despesas: 5100, saldo: 3200 },
  { month: "Out", receitas: 8600, despesas: 5300, saldo: 3300 },
  { month: "Nov", receitas: 8800, despesas: 5500, saldo: 3300 },
  { month: "Dez", receitas: 9200, despesas: 5800, saldo: 3400 },
];

export const categoriesData = [
  { name: "Alimentação", value: 850, color: "oklch(0.78 0.17 150)" },
  { name: "Moradia", value: 2200, color: "oklch(0.72 0.13 240)" },
  { name: "Transporte", value: 420, color: "oklch(0.82 0.16 80)" },
  { name: "Saúde", value: 570, color: "oklch(0.65 0.22 25)" },
  { name: "Academia", value: 130, color: "oklch(0.7 0.18 300)" },
  { name: "Lazer", value: 480, color: "oklch(0.85 0.14 40)" },
  { name: "Internet", value: 130, color: "oklch(0.6 0.15 200)" },
  { name: "Assinaturas", value: 210, color: "oklch(0.75 0.14 120)" },
  { name: "Investimentos", value: 1500, color: "oklch(0.68 0.16 170)" },
  { name: "Outros", value: 210, color: "oklch(0.5 0.02 260)" },
];

export const goals = [
  { id: "1", title: "Meta Mensal", current: 1640, target: 2000, period: "Agosto 2025" },
  { id: "2", title: "Meta Anual", current: 18500, target: 30000, period: "2025" },
  { id: "3", title: "Meta de Patrimônio", current: 145000, target: 250000, period: "Longo prazo" },
  { id: "4", title: "Meta de Investimento", current: 32000, target: 50000, period: "2025" },
];

export const emergencyEvolution = [
  { month: "Jan", value: 6500 },
  { month: "Fev", value: 7200 },
  { month: "Mar", value: 8000 },
  { month: "Abr", value: 9100 },
  { month: "Mai", value: 10000 },
  { month: "Jun", value: 10800 },
  { month: "Jul", value: 11600 },
  { month: "Ago", value: 12450 },
];

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
