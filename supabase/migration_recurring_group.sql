-- Adiciona coluna recurring_group_id para vincular despesas fixas entre meses
ALTER TABLE public.movements
ADD COLUMN IF NOT EXISTS recurring_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_movements_recurring_group_id
ON public.movements (recurring_group_id)
WHERE recurring_group_id IS NOT NULL;
