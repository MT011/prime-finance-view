-- Migration: Adiciona suporte a parcelamento de compras no cartão de crédito
-- Execute no SQL Editor do Supabase

ALTER TABLE public.movements
ADD COLUMN IF NOT EXISTS installment_group_id uuid,
ADD COLUMN IF NOT EXISTS installment_number int,
ADD COLUMN IF NOT EXISTS total_installments int;

-- Índice para buscar rapidamente todas as parcelas de um grupo
CREATE INDEX IF NOT EXISTS idx_movements_installment_group ON public.movements(installment_group_id);
