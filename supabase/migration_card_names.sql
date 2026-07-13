-- MIGRATION: Tabela de Nomes de Cartões Personalizados
-- Permite que os usuários cadastrem nomes de cartões/bancos
-- além dos pré-cadastrados no sistema.

create table if not exists public.card_names (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Índices para performance
create index if not exists idx_card_names_user on public.card_names(user_id);

-- RLS
alter table public.card_names enable row level security;

drop policy if exists "Usuários podem gerenciar seus próprios nomes de cartão" on public.card_names;
create policy "Usuários podem gerenciar seus próprios nomes de cartão" on public.card_names
  for all using (auth.uid() = user_id);
