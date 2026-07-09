-- SUPABASE DATABASE SCHEMA
-- Execute no "SQL Editor" do console do Supabase (https://supabase.com/dashboard/project/uemrkhjnfhdswcyclinf)
-- Pode ser executado múltiplas vezes sem erros (tudo usa IF NOT EXISTS / DROP IF EXISTS)

-- 1. Tabela de Perfis (perfis de usuário vinculados ao auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text
);

-- Habilitar Row Level Security (RLS) para perfis
alter table public.profiles enable row level security;

drop policy if exists "Usuários podem ver seu próprio perfil" on public.profiles;
create policy "Usuários podem ver seu próprio perfil" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
create policy "Usuários podem atualizar seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Trigger para criar perfil automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Tabela de Cartões de Crédito
create table if not exists public.credit_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  "limit" numeric not null,
  closing_day int not null,
  due_day int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.credit_cards enable row level security;

drop policy if exists "Usuários podem gerenciar seus próprios cartões" on public.credit_cards;
create policy "Usuários podem gerenciar seus próprios cartões" on public.credit_cards
  for all using (auth.uid() = user_id);

-- 3. Tabela de Movimentações (Transações de Entrada e Saída)
create table if not exists public.movements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  date date not null,
  description text not null,
  category text not null,
  account text not null,
  type text not null check (type in ('receita', 'despesa')),
  amount numeric not null,
  nature text check (nature in ('credito', 'debito', 'pix')),
  expense_type text check (expense_type in ('fixo', 'variavel')),
  card_id uuid references public.credit_cards on delete set null,
  invoice_month text,
  installment_group_id uuid,
  installment_number int,
  total_installments int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para performance
create index if not exists idx_movements_user on public.movements(user_id);
create index if not exists idx_movements_installment_group on public.movements(installment_group_id);
create index if not exists idx_movements_invoice_month on public.movements(invoice_month);

-- RLS para Movimentações
alter table public.movements enable row level security;

drop policy if exists "Usuários podem gerenciar suas próprias movimentações" on public.movements;
create policy "Usuários podem gerenciar suas próprias movimentações" on public.movements
  for all using (auth.uid() = user_id);


-- 4. Tabela de Metas Financeiras
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  title text not null,
  current numeric not null default 0,
  target numeric not null,
  period text not null,
  description text,
  reset_monthly boolean default false,
  last_reset_month text,
  card_id uuid references public.credit_cards on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Metas
alter table public.goals enable row level security;

drop policy if exists "Usuários podem gerenciar suas próprias metas" on public.goals;
create policy "Usuários podem gerenciar suas próprias metas" on public.goals
  for all using (auth.uid() = user_id);


-- 5. Tabela de Histórico de Metas
create table if not exists public.goal_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  goal_id uuid references public.goals on delete cascade not null,
  goal_title text not null,
  month text not null,
  current numeric not null,
  target numeric not null,
  achieved boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goal_history enable row level security;

drop policy if exists "Usuários podem gerenciar seu histórico de metas" on public.goal_history;
create policy "Usuários podem gerenciar seu histórico de metas" on public.goal_history
  for all using (auth.uid() = user_id);

-- 6. Tabela de Reserva de Emergência (Histórico Mensal)
create table if not exists public.emergency_savings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  month text not null,
  value numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Reserva de Emergência
alter table public.emergency_savings enable row level security;

drop policy if exists "Usuários podem gerenciar sua própria reserva de emergência" on public.emergency_savings;
create policy "Usuários podem gerenciar sua própria reserva de emergência" on public.emergency_savings
  for all using (auth.uid() = user_id);


-- 7. Tabela de Categorias do Usuário
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  type text not null check (type in ('receita', 'despesa')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name, type)
);

alter table public.categories enable row level security;

drop policy if exists "Usuários podem gerenciar suas próprias categorias" on public.categories;
create policy "Usuários podem gerenciar suas próprias categorias" on public.categories
  for all using (auth.uid() = user_id);

-- 8. Inserir metas padrão e categorias automáticas para novos usuários
create or replace function public.seed_user_defaults()
returns trigger as $$
begin
  -- Metas iniciais padrão
  insert into public.goals (user_id, title, current, target, period)
  values
    (new.id, 'Meta de Economia Mensal', 0, 2000, 'Mensal'),
    (new.id, 'Reserva de Emergência', 0, 30000, 'Longo Prazo'),
    (new.id, 'Investimentos Anuais', 0, 50000, 'Anual');

  -- Histórico inicial de reserva de emergência (opcional, começa zerado)
  insert into public.emergency_savings (user_id, month, value)
  values
    (new.id, 'Jul', 0),
    (new.id, 'Ago', 0);

  -- Categorias padrão de receitas
  insert into public.categories (user_id, name, type) values
    (new.id, 'Salário', 'receita'),
    (new.id, 'Renda Extra', 'receita'),
    (new.id, 'Investimentos', 'receita'),
    (new.id, 'Vendas', 'receita'),
    (new.id, 'Presentes', 'receita');

  -- Categorias padrão de despesas
  insert into public.categories (user_id, name, type) values
    (new.id, 'Alimentação', 'despesa'),
    (new.id, 'Moradia', 'despesa'),
    (new.id, 'Transporte', 'despesa'),
    (new.id, 'Saúde', 'despesa'),
    (new.id, 'Academia', 'despesa'),
    (new.id, 'Lazer', 'despesa'),
    (new.id, 'Internet', 'despesa'),
    (new.id, 'Assinaturas', 'despesa'),
    (new.id, 'Investimentos', 'despesa'),
    (new.id, 'Outros', 'despesa');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_seed_defaults on public.profiles;
create trigger on_profile_created_seed_defaults
  after insert on public.profiles
  for each row execute function public.seed_user_defaults();
