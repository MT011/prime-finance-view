import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { NewMovementFab } from "@/components/new-movement-fab";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { accounts, categoriesList } from "@/lib/mock-data";
import { getStoredCategories } from "@/lib/categories-storage";
import { useValueVisibility } from "@/lib/value-visibility";
import { Search, ChevronLeft, ChevronRight, Loader2, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { useMovements, useDeleteMovement, useUpdateMovement, useCreditCards } from "@/hooks/queries";
import { toast } from "sonner";
import { getCreditCardInvoiceInfo } from "@/lib/credit-cards";

export const Route = createFileRoute("/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações — Finance Dashboard" },
      { name: "description", content: "Todas as suas movimentações financeiras filtráveis." },
    ],
  }),
  component: MovimentacoesPage,
});

const PAGE_SIZE = 8;

function MovimentacoesPage() {
  const { format } = useValueVisibility();
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [cat, setCat] = useState("all");
  const [acc, setAcc] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const { data: movements = [], isLoading } = useMovements();
  const { data: creditCards = [] } = useCreditCards();
  const deleteMovementMutation = useDeleteMovement();

  const [movementToDelete, setMovementToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [movementToEdit, setMovementToEdit] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editType, setEditType] = useState<"receita" | "despesa">("despesa");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAccount, setEditAccount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNature, setEditNature] = useState("");
  const [editExpenseType, setEditExpenseType] = useState("");
  const [editCardId, setEditCardId] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const updateMovementMutation = useUpdateMovement();
  const storedCategories = getStoredCategories();

  const handleEditRequest = (movement: any) => {
    setMovementToEdit(movement);
    setEditType(movement.type);
    setEditAmount(String(movement.amount));
    setEditCategory(movement.category);
    setEditAccount(movement.account);
    setEditDate(movement.date.split("T")[0]);
    setEditDescription(movement.description);
    setEditNature(movement.nature || "");
    setEditExpenseType(movement.expense_type || "");
    setEditCardId(movement.card_id || "");
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    const numAmount = parseFloat(editAmount.replace(",", "."));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor, digite um valor válido maior que zero.");
      return;
    }
    if (!editCategory) {
      toast.error("Por favor, selecione uma categoria.");
      return;
    }
    if (!editAccount) {
      toast.error("Por favor, selecione uma conta.");
      return;
    }
    if (!editDate) {
      toast.error("Por favor, selecione uma data.");
      return;
    }
    if (editType === "despesa" && !editNature) {
      toast.error("Por favor, selecione a natureza da despesa.");
      return;
    }
    if (editType === "despesa" && !editExpenseType) {
      toast.error("Por favor, selecione se a despesa é fixa ou variável.");
      return;
    }
    if (!movementToEdit?.id) return;
    setEditSaving(true);
    try {
      const selectedCard = creditCards.find((card: any) => card.id === editCardId);
      const invoiceInfo = selectedCard ? getCreditCardInvoiceInfo(editDate, selectedCard) : null;

      await updateMovementMutation.mutateAsync({
        id: movementToEdit.id,
        date: editDate,
        description: editDescription.trim(),
        category: editCategory,
        account: editAccount,
        type: editType,
        amount: numAmount,
        ...(editType === "despesa"
          ? {
              nature: editNature as "credito" | "debito" | "dinheiro",
              expense_type: editExpenseType as "fixo" | "variavel",
              card_id: selectedCard?.id || null,
              invoice_month: invoiceInfo?.monthKey || null,
            }
          : { nature: null, expense_type: null, card_id: null, invoice_month: null }),
      });

      toast.success("Movimentação atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setMovementToEdit(null);
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteRequest = (movement: any) => {
    setMovementToDelete(movement);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!movementToDelete?.id) return;
    try {
      await deleteMovementMutation.mutateAsync(movementToDelete.id);
      toast.success("Movimentação excluída com sucesso!");
      setIsDeleteDialogOpen(false);
      setMovementToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const allCategories = [...categoriesList.receitas, ...categoriesList.despesas];

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (search && !m.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (month !== "all" && new Date(m.date).getMonth() + 1 !== Number(month)) return false;
      if (cat !== "all" && m.category !== cat) return false;
      if (acc !== "all" && m.account !== acc) return false;
      if (type !== "all" && m.type !== type) return false;
      return true;
    });
  }, [movements, search, month, cat, acc, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader title="Movimentações" subtitle="Todas as entradas e saídas" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando movimentações...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Movimentações" subtitle="Todas as entradas e saídas" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <Card className="glass-card">
          <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar descrição..."
                className="pl-9"
              />
            </div>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((n, i) => (
                  <SelectItem key={n} value={String(i + 1)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {allCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={acc} onValueChange={setAcc}>
              <SelectTrigger><SelectValue placeholder="Conta" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right w-[90px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      Nenhuma movimentação encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {pageData.map((m) => (
                  <TableRow key={m.id} className="hover:bg-accent/30">
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(m.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">{m.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{m.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.account}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {m.card_id ? (() => {
                        const card = creditCards.find((item) => item.id === m.card_id);
                        const info = getCreditCardInvoiceInfo(m.date, card);
                        return info ? `${info.label} · vence ${info.dueDate}` : "Cartão";
                      })() : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.type === "receita"
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {m.type === "receita" ? "Entrada" : "Saída"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        m.type === "receita" ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {m.type === "receita" ? "+" : "-"} {format(m.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => handleEditRequest(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteRequest(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
              <p className="text-xs text-muted-foreground">
                Exibindo {pageData.length} de {filtered.length} movimentações
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <span className="px-2 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setMovementToDelete(null);
        }}>
          <DialogContent className="glass-card sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">Excluir movimentação</DialogTitle>
              <DialogDescription className="text-center">
                Tem certeza que deseja excluir esta movimentação?
                {movementToDelete && (
                  <span className="mt-2 block font-medium text-foreground">
                    {movementToDelete.description}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMovementMutation.isPending}>
                {deleteMovementMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setMovementToEdit(null);
        }}>
          <DialogContent className="glass-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Editar Movimentação</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <Tabs value={editType} onValueChange={(v) => {
                setEditType(v as "receita" | "despesa");
                setEditCategory("");
                setEditNature("");
                setEditExpenseType("");
                setEditCardId("");
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="receita" className="data-[state=active]:bg-primary/25 data-[state=active]:text-primary">
                    Receita
                  </TabsTrigger>
                  <TabsTrigger value="despesa" className="data-[state=active]:bg-destructive/25 data-[state=active]:text-destructive">
                    Despesa
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  placeholder="R$ 0,00"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  disabled={editSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={editCategory} onValueChange={setEditCategory} disabled={editSaving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editType === "receita" ? storedCategories.receitas : storedCategories.despesas).map((c: string) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select value={editAccount} onValueChange={setEditAccount} disabled={editSaving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editType === "despesa" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Natureza da despesa</Label>
                    <Select value={editNature} onValueChange={(v) => setEditNature(v)} disabled={editSaving}>
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
                    <Select value={editExpenseType} onValueChange={(v) => setEditExpenseType(v)} disabled={editSaving}>
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

              {editType === "despesa" && (
                <div className="space-y-2">
                  <Label>Cartão utilizado</Label>
                  <Select value={editCardId} onValueChange={setEditCardId} disabled={editSaving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cartão (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditCards.map((card: any) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} · Fechamento {card.closing_day} · Vencimento {card.due_day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editCardId && (
                    <p className="text-xs text-muted-foreground">
                      {getCreditCardInvoiceInfo(editDate, creditCards.find((card: any) => card.id === editCardId))?.label} · vence {getCreditCardInvoiceInfo(editDate, creditCards.find((card: any) => card.id === editCardId))?.dueDate}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} disabled={editSaving} />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea rows={3} placeholder="Descreva a movimentação" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} disabled={editSaving} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={editSaving}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? (
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
      </main>
      <NewMovementFab />
    </div>
  );
}
