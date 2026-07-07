import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreditCards } from "@/hooks/queries";
import { getCreditCardInvoiceInfo } from "@/lib/credit-cards";

type MovementNature = "credito" | "debito" | "dinheiro";
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
import { accounts } from "@/lib/mock-data";
import { getStoredCategories } from "@/lib/categories-storage";
import { toast } from "sonner";
import { useAddMovement } from "@/hooks/queries";

export function NewMovementFab() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [nature, setNature] = useState<MovementNature | "">("");
  const [expenseType, setExpenseType] = useState<ExpenseType | "">("");
  const [cardId, setCardId] = useState("");
  const [saving, setSaving] = useState(false);

  const addMovementMutation = useAddMovement();
  const { data: creditCards = [] } = useCreditCards();
  const storedCategories = getStoredCategories();
  const availableCategories = type === "receita" ? storedCategories.receitas : storedCategories.despesas;

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(",", "."));
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
      const invoiceInfo = selectedCard ? getCreditCardInvoiceInfo(date, selectedCard) : null;

      await addMovementMutation.mutateAsync({
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
      });

      toast.success("Movimentação salva com sucesso!");
      // Reset form
      setAmount("");
      setCategory("");
      setAccount("");
      setDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setNature("");
      setExpenseType("");
      setCardId("");
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
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/40 transition-all hover:scale-105 hover:shadow-primary/60"
          aria-label="Nova movimentação"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Nova Movimentação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Tabs value={type} onValueChange={(v) => {
            setType(v as "receita" | "despesa");
            setCategory("");
            setNature("");
            setExpenseType("");
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
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
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

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
