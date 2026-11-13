import { useState } from "react";
import { Plus, Loader2, ArrowDownRight, ArrowUpRight, CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreditCards, useAddMovement } from "@/hooks/queries";
import { getCreditCardInvoiceInfo, getInstallmentInvoiceInfos, parseLocalDate } from "@/lib/credit-cards";

type MovementNature = "credito" | "debito" | "pix";
type ExpenseType = "fixo" | "variavel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/queries";
import { toast } from "sonner";

export function NewMovementFab() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const now = new Date();
  const [date, setDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [description, setDescription] = useState("");
  const [nature, setNature] = useState<MovementNature | "">("");
  const [expenseType, setExpenseType] = useState<ExpenseType | "">("");
  const [cardId, setCardId] = useState("");
  const [installments, setInstallments] = useState("1");
  const [saving, setSaving] = useState(false);

  const addMovementMutation = useAddMovement();
  const { data: creditCards = [] } = useCreditCards();
  const accounts = creditCards.map((c) => c.name);
  const { data: categoriesData } = useCategories();
  const availableCategories = (categoriesData || [])
    .filter((c) => c.type === type)
    .map((c) => c.name);

  const selectedCardPreview = creditCards.find((card) => card.id === cardId);
  const invoicePreview = type === "despesa" && nature === "credito" && selectedCardPreview && date
    ? getCreditCardInvoiceInfo(date, selectedCardPreview)
    : null;
  const amountPreview = Number(amount.replace(/\./g, "").replace(",", "."));
  const installmentCount = Number(installments) || 1;

  const handleSave = async () => {
    const numAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor, digite um valor válido maior que zero.");
      return;
    }
    if (!category) {
      toast.error("Por favor, selecione uma categoria.");
      return;
    }
    if (!account) {
      toast.error("Por favor, selecione uma conta.");
      return;
    }
    if (!date) {
      toast.error("Por favor, selecione uma data.");
      return;
    }
    if (type === "despesa" && !nature) {
      toast.error("Por favor, selecione a natureza da despesa.");
      return;
    }
    if (type === "despesa" && !expenseType) {
      toast.error("Por favor, selecione se a despesa é fixa ou variável.");
      return;
    }
    setSaving(true);
    try {
      const selectedCard = creditCards.find((card) => card.id === cardId);
      const numInstallments = parseInt(installments) || 1;
      const installmentGroupId = crypto.randomUUID();

      // Despesa fixa tem prioridade máxima — gera 12 meses
      if (type === "despesa" && expenseType === "fixo") {
        const startDate = parseLocalDate(date);
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const recurringGroupId = crypto.randomUUID();

        const allMovements: any[] = [];

        if (selectedCard) {
          const originalDay = startDate.getDate();

          for (let offset = 0; offset < 12; offset++) {
            const totalM = startMonth + offset;
            const y = startYear + Math.floor(totalM / 12);
            const m = (totalM % 12) + 1;

            const invoiceMonthKey = `${y}-${String(m).padStart(2, "0")}`;
            const maxDay = new Date(y, m, 0).getDate();
            const day = Math.min(originalDay, maxDay);
            const movDate = `${invoiceMonthKey}-${String(day).padStart(2, "0")}`;

            allMovements.push({
              date: movDate,
              description: description.trim(),
              category,
              account,
              type: "despesa" as const,
              amount: numAmount,
              nature: nature as MovementNature,
              expense_type: "fixo" as ExpenseType,
              card_id: selectedCard.id,
              invoice_month: invoiceMonthKey,
              recurring_group_id: recurringGroupId,
            });
          }
        } else {
          for (let offset = 0; offset < 12; offset++) {
            const totalM = startMonth + offset;
            const y = startYear + Math.floor(totalM / 12);
            const m = (totalM % 12) + 1;

            const monthKey = `${y}-${String(m).padStart(2, "0")}`;
            const day = Math.min(startDate.getDate(), new Date(y, m, 0).getDate());
            const dStr = `${monthKey}-${String(day).padStart(2, "0")}`;

            allMovements.push({
              date: dStr,
              description: description.trim(),
              category,
              account,
              type: "despesa" as const,
              amount: numAmount,
              nature: nature as MovementNature,
              expense_type: "fixo" as ExpenseType,
              card_id: null,
              invoice_month: null,
              recurring_group_id: recurringGroupId,
            });
          }
        }

        await addMovementMutation.mutateAsync(allMovements);
        toast.success("Despesa fixa salva para os próximos 12 meses!");
      } else if (type === "despesa" && nature === "credito" && selectedCard && numInstallments > 1) {
        const installmentInfos = getInstallmentInvoiceInfos(date, selectedCard, numInstallments);
        const installmentAmount = numAmount / numInstallments;
        const desc = description.trim();

        const originalDay = parseLocalDate(date).getDate();
        const movements = installmentInfos.map((info, i) => {
          const [yStr, mStr] = info.monthKey.split("-");
          const y = parseInt(yStr);
          const m = parseInt(mStr);
          const maxDay = new Date(y, m, 0).getDate();
          const day = Math.min(originalDay, maxDay);
          const dateStr = `${info.monthKey}-${String(day).padStart(2, "0")}`;
          return {
            date: dateStr,
            description: `${desc} (${i + 1}/${numInstallments})`,
            category,
            account,
            type: "despesa" as const,
            amount: installmentAmount,
            nature: "credito" as MovementNature,
            expense_type: expenseType as ExpenseType,
            card_id: selectedCard.id,
            invoice_month: info.monthKey,
            installment_group_id: installmentGroupId,
            installment_number: i + 1,
            total_installments: numInstallments,
          };
        });

        await addMovementMutation.mutateAsync(movements as any);
        toast.success(`Compra parcelada em ${numInstallments}x salva com sucesso!`);
      } else {
        const invoiceInfo = selectedCard ? getCreditCardInvoiceInfo(date, selectedCard) : null;

        const baseMovement: any = {
          date,
          description: description.trim(),
          category,
          account,
          type,
          amount: numAmount,
          ...(type === "despesa"
            ? {
                nature: nature as MovementNature,
                expense_type: expenseType as ExpenseType,
                card_id: selectedCard?.id || null,
                invoice_month: invoiceInfo?.monthKey || null,
              }
            : {}),
        };

        await addMovementMutation.mutateAsync(baseMovement);
        toast.success("Movimentação salva com sucesso!");
      }

      // Reset form
      setAmount("");
      setCategory("");
      setAccount("");
      {
        const n = new Date();
        setDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`);
      }
      setDescription("");
      setNature("");
      setExpenseType("");
      setCardId("");
      setInstallments("1");
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar movimentação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-5 z-50 h-13 w-13 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 md:bottom-6 md:right-6 md:h-14 md:w-14"
          aria-label="Nova movimentação"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card max-h-[90dvh] overflow-y-auto rounded-3xl border-border/70 p-0 sm:max-w-lg">\n        <div className="p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Novo lançamento</DialogTitle>\n          <p className="text-sm text-muted-foreground">Registre suas finanças de forma simples e organizada.</p>
        </DialogHeader>

        <div className="space-y-5 py-5">
          <Tabs value={type} onValueChange={(v) => {
            setType(v as "receita" | "despesa");
            setCategory("");
            setNature("");
            setExpenseType("");
            setInstallments("1");
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="receita"
                className="data-[state=active]:bg-primary/25 data-[state=active]:text-primary"
              >
                Receita
              </TabsTrigger>
              <TabsTrigger
                value="despesa"
                className="data-[state=active]:bg-destructive/25 data-[state=active]:text-destructive"
              >
                Despesa
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label>Valor</Label>
            <Input 
              placeholder="R$ 0,00" 
              inputMode="decimal" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={account} onValueChange={setAccount} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "despesa" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Natureza da despesa</Label>
                <Select value={nature} onValueChange={(v) => setNature(v as MovementNature)} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo da despesa</Label>
                <Select value={expenseType} onValueChange={(v) => setExpenseType(v as ExpenseType)} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixo">Fixo</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === "despesa" && (
            <div className="space-y-2">
              <Label>Cartão utilizado</Label>
              <Select value={cardId} onValueChange={setCardId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} · Fechamento {card.closing_day} · Vencimento {card.due_day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cardId && (
                <p className="text-xs text-muted-foreground">
                  {getCreditCardInvoiceInfo(date, creditCards.find((card) => card.id === cardId))?.label} · vence {getCreditCardInvoiceInfo(date, creditCards.find((card) => card.id === cardId))?.dueDate}
                </p>
              )}
              {cardId && nature === "credito" && (
                <div className="space-y-2 pt-2">
                  <Label>Parcelas</Label>
                  <Select value={installments} onValueChange={setInstallments} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue placeholder="1x" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x {n > 1 ? `- ${(amountPreview / n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Data</Label>
            <Input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              rows={3} 
              placeholder="Descreva a movimentação" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/70 pt-4 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-32 rounded-xl">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando
              </>
            ) : (
              "Salvar lançamento"
            )}
          </Button>
        </DialogFooter>
        </div>\n      </DialogContent>
    </Dialog>
  );
}
