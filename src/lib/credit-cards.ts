import type { CreditCard } from "@/hooks/queries";

export interface CreditCardInvoiceInfo {
  monthKey: string;
  label: string;
  dueDate: string;
  dueMonthKey: string;
  isCurrent: boolean;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function getCreditCardInvoiceInfo(
  dateInput: string | Date,
  card?: Pick<CreditCard, "closing_day" | "due_day"> | null,
): CreditCardInvoiceInfo | null {
  if (!card) return null;

  const date = new Date(dateInput);
  const closingDay = Number(card.closing_day || 1);
  const dueDay = Number(card.due_day || 10);

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const isBeforeOrOnClosing = date.getDate() <= closingDay;

  const invoiceDate = isBeforeOrOnClosing
    ? new Date(currentYear, currentMonth, 1)
    : new Date(currentYear, currentMonth + 1, 1);

  const dueDate = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), dueDay);

  return {
    monthKey: `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}`,
    label: `${monthNames[invoiceDate.getMonth()]} ${invoiceDate.getFullYear()}`,
    dueDate: dueDate.toLocaleDateString("pt-BR"),
    dueMonthKey: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`,
    isCurrent: invoiceDate.getMonth() === new Date().getMonth() && invoiceDate.getFullYear() === new Date().getFullYear(),
  };
}

export function getInvoiceLabelForCard(dateInput: string | Date, card?: Pick<CreditCard, "closing_day" | "due_day"> | null) {
  const info = getCreditCardInvoiceInfo(dateInput, card);
  if (!info) return null;
  return `${info.label} · vence ${info.dueDate}`;
}
