import type { CreditCard } from "@/hooks/queries";

export interface CreditCardInvoiceInfo {
  monthKey: string;
  label: string;
  dueDate: string;
  dueMonthKey: string;
  isCurrent: boolean;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type CardBillingDays = Pick<CreditCard, "closing_day" | "due_day">;

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getSafeDay(year: number, monthIndex: number, requestedDay: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(1, requestedDay), lastDay);
}

function getDueDateForInvoice(invoiceDate: Date, card: CardBillingDays): Date {
  const closingDay = Number(card.closing_day || 1);
  const dueDay = Number(card.due_day || 10);
  // When the due day falls on/before the closing day, payment is in the following month.
  const dueMonth = dueDay <= closingDay ? addMonths(invoiceDate, 1) : invoiceDate;
  return new Date(
    dueMonth.getFullYear(),
    dueMonth.getMonth(),
    getSafeDay(dueMonth.getFullYear(), dueMonth.getMonth(), dueDay),
  );
}

export function parseLocalDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Returns the statement cycle month for a purchase, not simply its calendar month. */
export function getCreditCardInvoiceInfo(
  dateInput: string | Date,
  card?: CardBillingDays | null,
): CreditCardInvoiceInfo | null {
  if (!card) return null;

  const purchaseDate = parseLocalDate(dateInput);
  const closingDay = Number(card.closing_day || 1);
  const purchaseMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
  const invoiceDate = purchaseDate.getDate() > closingDay ? addMonths(purchaseMonth, 1) : purchaseMonth;
  const dueDate = getDueDateForInvoice(invoiceDate, card);
  const currentInvoiceMonth = getCurrentInvoiceMonthKey(card);

  return {
    monthKey: monthKeyFromDate(invoiceDate),
    label: `${monthNames[invoiceDate.getMonth()]} ${invoiceDate.getFullYear()}`,
    dueDate: dueDate.toLocaleDateString("pt-BR"),
    dueMonthKey: monthKeyFromDate(dueDate),
    isCurrent: monthKeyFromDate(invoiceDate) === currentInvoiceMonth,
  };
}

export function getInvoiceLabelForCard(dateInput: string | Date, card?: CardBillingDays | null) {
  const info = getCreditCardInvoiceInfo(dateInput, card);
  if (!info) return null;
  return `${info.label} · vence ${info.dueDate}`;
}

export function getCurrentInvoiceMonthKey(card: Pick<CreditCard, "closing_day">): string {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const invoiceDate = now.getDate() > Number(card.closing_day || 1) ? addMonths(currentMonth, 1) : currentMonth;
  return monthKeyFromDate(invoiceDate);
}

export function getNextInvoiceMonthKey(card: Pick<CreditCard, "closing_day">): string {
  const [year, month] = getCurrentInvoiceMonthKey(card).split("-").map(Number);
  return monthKeyFromDate(new Date(year, month, 1));
}

export function getInvoiceMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${monthNames[month - 1]} ${year}`;
}

export function getInstallmentInvoiceInfos(
  dateInput: string | Date,
  card: CardBillingDays,
  totalInstallments: number,
): CreditCardInvoiceInfo[] {
  const baseInfo = getCreditCardInvoiceInfo(dateInput, card);
  if (!baseInfo || !Number.isInteger(totalInstallments) || totalInstallments < 1) return [];

  const [year, month] = baseInfo.monthKey.split("-").map(Number);
  return Array.from({ length: totalInstallments }, (_, index) => {
    const invoiceDate = new Date(year, month - 1 + index, 1);
    const dueDate = getDueDateForInvoice(invoiceDate, card);
    return {
      monthKey: monthKeyFromDate(invoiceDate),
      label: `${monthNames[invoiceDate.getMonth()]} ${invoiceDate.getFullYear()}`,
      dueDate: dueDate.toLocaleDateString("pt-BR"),
      dueMonthKey: monthKeyFromDate(dueDate),
      isCurrent: monthKeyFromDate(invoiceDate) === getCurrentInvoiceMonthKey(card),
    };
  });
}
