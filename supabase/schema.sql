-- SUPABASE DATABASE SCHEMA
-- Cole este script no "SQL Editor" do console do Supabase (https://supabase.com/dashboard/project/uemrkhjnfhdswcyclinf)

-- 1. Tabela de Perfis (perfis de usuário vinculados ao auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text
);

-- Habilitar Row Level Security (RLS) para perfis
alter table public.profiles enable row level security;

create policy "Usuários podem ver seu próprio perfil" on public.profiles
  for select using (auth.uid() = id);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Tabela de Movimentações (Transações de Entrada e Saída)
create table public.movements (
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Movimentações
alter table public.movements enable row level security;

create policy "Usuários podem gerenciar suas próprias movimentações" on public.movements
  for all using (auth.uid() = user_id);


-- 3. Tabela de Metas Financeiras
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  title text not null,
  current numeric not null default 0,
  target numeric not null,
  period text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Metas
alter table public.goals enable row level security;

create policy "Usuários podem gerenciar suas próprias metas" on public.goals
  for all using (auth.uid() = user_id);


-- 4. Tabela de Reserva de Emergência (Histórico Mensal)
create table public.emergency_savings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  month text not null,
  value numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Reserva de Emergência
alter table public.emergency_savings enable row level security;

create policy "Usuários podem gerenciar sua própria reserva de emergência" on public.emergency_savings
  for all using (auth.uid() = user_id);


-- 5. Inserir metas padrão automáticas para novos usuários (opcional, pode ser feito via trigger ou app)
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

  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_seed_defaults
  after insert on public.profiles
  for each row execute procedure public.seed_user_defaults();
