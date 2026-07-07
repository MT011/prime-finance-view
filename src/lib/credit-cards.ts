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

export function getCurrentInvoiceMonthKey(card: Pick<CreditCard, "closing_day">): string {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const cd = Number(card.closing_day);
  if (day > cd) {
    const nextM = month + 1;
    return `${nextM > 11 ? year + 1 : year}-${String((nextM > 11 ? 0 : nextM) + 1).padStart(2, "0")}`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getNextInvoiceMonthKey(card: Pick<CreditCard, "closing_day">): string {
  const [yStr, mStr] = getCurrentInvoiceMonthKey(card).split("-");
  let y = parseInt(yStr);
  let m = parseInt(mStr);
  m += 1;
  if (m > 12) { m = 1; y += 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function getInvoiceMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = parseInt(yStr);
  const m = parseInt(mStr);
  return `${monthNames[m - 1]} ${y}`;
}

export function getInstallmentInvoiceInfos(
  dateInput: string | Date,
  card: Pick<CreditCard, "closing_day" | "due_day">,
  totalInstallments: number,
): CreditCardInvoiceInfo[] {
  const baseInfo = getCreditCardInvoiceInfo(dateInput, card);
  if (!baseInfo) return [];

  const [yearStr, monthStr] = baseInfo.monthKey.split("-");
  let baseYear = parseInt(yearStr);
  let baseMonth = parseInt(monthStr) - 1;

  const result: CreditCardInvoiceInfo[] = [];

  for (let i = 0; i < totalInstallments; i++) {
    const totalM = baseMonth + i;
    const targetYear = baseYear + Math.floor(totalM / 12);
    const targetMonth = (totalM % 12) + 1;

    const monthKey = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

    const dueDay = Number(card.due_day || 10);
    const dueDate = new Date(targetYear, targetMonth - 1, dueDay);

    result.push({
      monthKey,
      label: `${monthNames[targetMonth - 1]} ${targetYear}`,
      dueDate: dueDate.toLocaleDateString("pt-BR"),
      dueMonthKey: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`,
      isCurrent:
        targetMonth - 1 === new Date().getMonth() &&
        targetYear === new Date().getFullYear(),
    });
  }

  return result;
}
