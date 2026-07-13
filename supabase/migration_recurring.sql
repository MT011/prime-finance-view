-- MIGRATION: Tabela de Despesas Fixas Recorrentes
-- Cria uma tabela para armazenar o template de despesas fixas
-- que serão replicadas para os meses seguintes automaticamente.

create table if not exists public.recurring_movements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  original_movement_id uuid references public.movements on delete set null,
  description text not null,
  category text not null,
  account text not null,
  amount numeric not null,
  nature text check (nature in ('credito', 'debito', 'pix')),
  expense_type text not null check (expense_type = 'fixo'),
  card_id uuid references public.credit_cards on delete set null,
  invoice_month text,
  start_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para performance
create index if not exists idx_recurring_movements_user on public.recurring_movements(user_id);

-- RLS
alter table public.recurring_movements enable row level security;

drop policy if exists "Usuários podem gerenciar suas próprias despesas recorrentes" on public.recurring_movements;
create policy "Usuários podem gerenciar suas próprias despesas recorrentes" on public.recurring_movements
  for all using (auth.uid() = user_id);
