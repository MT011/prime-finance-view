-- MIGRATION: Orçamento por Categoria
-- Permite definir limites mensais de gasto por categoria de despesa.

create table if not exists public.category_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  category text not null,
  monthly_limit numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category)
);

-- Índices para performance
create index if not exists idx_category_budgets_user on public.category_budgets(user_id);

-- RLS
alter table public.category_budgets enable row level security;

drop policy if exists "Usuários podem gerenciar seus próprios orçamentos" on public.category_budgets;
create policy "Usuários podem gerenciar seus próprios orçamentos" on public.category_budgets
  for all using (auth.uid() = user_id);
