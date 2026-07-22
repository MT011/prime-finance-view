-- ============================================================
-- Atribui recurring_group_id a despesas fixas já existentes
-- Rode como UM ÚNICO bloco no SQL Editor do Supabase
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  new_id uuid;
BEGIN
  FOR rec IN
    SELECT DISTINCT description, category, account, amount, nature, card_id::text AS card_id
    FROM public.movements
    WHERE expense_type = 'fixo'
      AND type = 'despesa'
      AND recurring_group_id IS NULL
  LOOP
    new_id := gen_random_uuid();

    UPDATE public.movements
    SET recurring_group_id = new_id
    WHERE expense_type = 'fixo'
      AND type = 'despesa'
      AND recurring_group_id IS NULL
      AND COALESCE(description, '') = COALESCE(rec.description, '')
      AND COALESCE(category, '') = COALESCE(rec.category, '')
      AND COALESCE(account, '') = COALESCE(rec.account, '')
      AND amount = rec.amount
      AND COALESCE(nature, '') = COALESCE(rec.nature, '')
      AND COALESCE(card_id::text, '') = COALESCE(rec.card_id, '');
  END LOOP;
END $$;

-- Verificação
SELECT
  recurring_group_id,
  COUNT(*) AS qtd,
  MIN(date) AS primeiro_mes,
  MAX(date) AS ultimo_mes
FROM public.movements
WHERE expense_type = 'fixo'
  AND type = 'despesa'
  AND recurring_group_id IS NOT NULL
GROUP BY recurring_group_id
ORDER BY qtd DESC;
