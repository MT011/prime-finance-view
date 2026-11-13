/** Máscara de centavos para lançamentos em reais.
 * Ex.: 1 -> 0,01; 100 -> 1,00; 100000 -> 1.000,00.
 * Valores financeiros enviados ao banco continuam sendo números.
 */
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Limite para permanecer dentro da faixa de inteiros exatos ao manipular centavos.
const MAX_CENTS_DIGITS = 14;

export function formatCurrencyInput(raw: string): string {
  const cents = raw.replace(/\D/g, "").slice(0, MAX_CENTS_DIGITS);
  if (!cents) return "";
  return currencyFormatter.format(Number(cents) / 100);
}

export function parseCurrencyInput(formatted: string): number {
  const cents = formatted.replace(/\D/g, "");
  return cents ? Number(cents) / 100 : NaN;
}

export function formatCurrencyValue(value: number | string): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0
    ? currencyFormatter.format(numeric)
    : "";
}
