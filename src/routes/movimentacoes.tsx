import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { NewMovementFab } from "@/components/new-movement-fab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { accounts } from "@/lib/accounts";
import { useValueVisibility } from "@/lib/value-visibility";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Search,
  Trash2,
  AlertTriangle,
  Pencil,
  Square,
  CheckSquare,
  SquareCheck,
} from "lucide-react";
import {
  useMovements,
  useDeleteMovement,
  useUpdateMovement,
  useCreditCards,
  useCategories,
  useBulkDeleteMovements,
} from "@/hooks/queries";
import { toast } from "sonner";
import {
  getCreditCardInvoiceInfo,
  getCurrentInvoiceMonthKey,
  getNextInvoiceMonthKey,
  getInvoiceMonthLabel,
} from "@/lib/credit-cards";

export const Route = createFileRoute("/movimentacoes")({
  validateSearch: (search: Record<string, string | undefined>) => ({
    card: search.card || undefined,
    tab: (search.tab as "atual" | "proxima" | "historico" | undefined) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Movimentações — Finance Dashboard" },
      { name: "description", content: "Todas as suas movimentações financeiras filtráveis." },
    ],
  }),
  component: MovimentacoesPage,
});

function getInvoiceMovements(movements: any[], cardId: string, monthKey: string) {
  return movements.filter((m) => m.card_id === cardId && m.invoice_month === monthKey);
}

function getInvoiceMonthsFromMovements(movements: any[], cardId: string): string[] {
  const months = new Set<string>();
  movements.forEach((m) => {
    if (m.card_id === cardId && m.invoice_month) {
      months.add(m.invoice_month);
    }
  });
  return Array.from(months).sort();
}

const PAGE_SIZE = 8;

function renderMovementTable(
  data: any[],
  creditCards: any[],
  format: (v: any) => string,
  onEdit: (m: any) => void,
  onDelete: (m: any) => void,
  selectionMode?: boolean,
  selectedIds?: Set<string>,
  onToggleSelect?: (id: string) => void,
  onToggleAll?: (ids: string[]) => void,
) {
  const allIds = data.map((m) => m.id);
  const allSelected = data.length > 0 && allIds.every((id) => selectedIds?.has(id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectionMode && (
            <TableHead className="w-[40px]">
              <button
                onClick={() => onToggleAll?.(allIds)}
                className="flex items-center justify-center"
              >
                {allSelected ? (
                  <SquareCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </TableHead>
          )}
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
        {data.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={selectionMode ? 9 : 8}
              className="py-12 text-center text-muted-foreground"
            >
              Nenhuma movimentação encontrada.
            </TableCell>
          </TableRow>
        )}
        {data.map((m) => (
          <TableRow
            key={m.id}
            className={`hover:bg-accent/30 ${selectedIds?.has(m.id) ? "bg-primary/5" : ""}`}
          >
            {selectionMode && (
              <TableCell className="w-[40px]">
                <button
                  onClick={() => onToggleSelect?.(m.id)}
                  className="flex items-center justify-center"
                >
                  {selectedIds?.has(m.id) ? (
                    <SquareCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TableCell>
            )}
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {new Date(m.date).toLocaleDateString("pt-BR")}
            </TableCell>
            <TableCell className="font-medium">
              {m.description}
              {m.total_installments && m.total_installments > 1 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({m.installment_number}/{m.total_installments})
                </span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-normal">
                {m.category}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{m.account}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {m.card_id
                ? (() => {
                    const card = creditCards.find((item: any) => item.id === m.card_id);
                    const info = getCreditCardInvoiceInfo(m.date, card);
                    return info ? `${info.label} · vence ${info.dueDate}` : "Cartão";
                  })()
                : "—"}
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
              {!selectionMode && (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => onEdit(m)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(m)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MovimentacoesPage() {
  const { format } = useValueVisibility();
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const selectedCardId = searchParams.card;
  const cardViewTab = searchParams.tab || "atual";
  const [historyMonth, setHistoryMonth] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [cat, setCat] = useState("all");
  const [acc, setAcc] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const { data: movements = [], isLoading } = useMovements();
  const { data: creditCards = [] } = useCreditCards();
  const deleteMovementMutation = useDeleteMovement();
  const bulkDeleteMutation = useBulkDeleteMovements();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const [movementToDelete, setMovementToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "all">("single");

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
  const [editMode, setEditMode] = useState<"single" | "all">("single");
  const updateMovementMutation = useUpdateMovement();
  const { data: categoriesData } = useCategories();
  const storedCategories = {
    receitas: (categoriesData || []).filter((c) => c.type === "receita").map((c) => c.name),
    despesas: (categoriesData || []).filter((c) => c.type === "despesa").map((c) => c.name),
  };

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
    setEditMode("single");
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

      const isInstallmentGroup =
        movementToEdit.total_installments && movementToEdit.total_installments > 1;

      if (isInstallmentGroup && editMode === "all") {
        await updateMovementMutation.mutateAsync({
          id: movementToEdit.id,
          editAllInstallments: true,
          installmentGroupId: movementToEdit.installment_group_id,
          description: editDescription.trim(),
          category: editCategory,
          account: editAccount,
        });
        toast.success("Todas as parcelas atualizadas com sucesso!");
      } else {
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
                nature: editNature as "credito" | "debito" | "pix",
                expense_type: editExpenseType as "fixo" | "variavel",
                card_id: selectedCard?.id || null,
                invoice_month: invoiceInfo?.monthKey || null,
              }
            : { nature: null, expense_type: null, card_id: null, invoice_month: null }),
        });
        toast.success("Movimentação atualizada com sucesso!");
      }

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
    setDeleteMode("single");
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!movementToDelete?.id) return;
    try {
      const isInstallment =
        movementToDelete.total_installments && movementToDelete.total_installments > 1;
      if (isInstallment && deleteMode === "all") {
        await deleteMovementMutation.mutateAsync({
          id: movementToDelete.id,
          installmentGroupId: movementToDelete.installment_group_id,
          deleteAll: true,
        });
        toast.success("Compra parcelada excluída com sucesso!");
      } else {
        await deleteMovementMutation.mutateAsync(movementToDelete.id);
        toast.success("Movimentação excluída com sucesso!");
      }
      setIsDeleteDialogOpen(false);
      setMovementToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      return new Set(ids);
    });
  };

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`${ids.length} movimentação(ões) excluída(s) com sucesso!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setIsBulkDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const allCategories = [...storedCategories.receitas, ...storedCategories.despesas];

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

  const selectedCard = selectedCardId
    ? creditCards.find((c) => c.id === selectedCardId) || null
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Movimentações" subtitle="Todas as entradas e saídas" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        {selectedCard ? (
          <>
            {/* Card Detail Header */}
            <Card className="glass-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="relative pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate({
                        to: "/movimentacoes",
                        search: { card: undefined, tab: undefined },
                      })
                    }
                    className="gap-1.5 text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> Todas as movimentações
                  </Button>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <Select
                      value={selectedCardId}
                      onValueChange={(v) =>
                        navigate({
                          to: "/movimentacoes",
                          search: {
                            card: v,
                            tab: cardViewTab as "atual" | "proxima" | "historico",
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {creditCards.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Banco</p>
                    <p className="font-semibold">{selectedCard.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Limite Total</p>
                    <p className="font-semibold">{format(Number(selectedCard.limit))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Limite Disponível</p>
                    <p className="font-semibold text-primary">
                      {format(
                        Number(selectedCard.limit) -
                          getInvoiceMovements(
                            movements,
                            selectedCard.id,
                            getCurrentInvoiceMonthKey(selectedCard),
                          ).reduce((s, m) => s + Number(m.amount), 0),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fechamento</p>
                    <p className="font-semibold">Dia {selectedCard.closing_day}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="font-semibold">Dia {selectedCard.due_day}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fatura Atual</p>
                    <p className="font-semibold">
                      {format(
                        getInvoiceMovements(
                          movements,
                          selectedCard.id,
                          getCurrentInvoiceMonthKey(selectedCard),
                        ).reduce((s, m) => s + Number(m.amount), 0),
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Tabs */}
            <div className="flex items-center justify-between gap-2">
              <Tabs
                value={cardViewTab}
                onValueChange={(v) =>
                  navigate({
                    to: "/movimentacoes",
                    search: { card: selectedCard.id, tab: v as "atual" | "proxima" | "historico" },
                  })
                }
                className="flex-1"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="atual">Fatura Atual</TabsTrigger>
                  <TabsTrigger value="proxima">Próxima Fatura</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>
              </Tabs>
              {selectionMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {selectedIds.size} selecionado(s)
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {bulkDeleteMutation.isPending ? "Excluindo..." : "Excluir"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={exitSelectionMode}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  className="gap-1.5"
                >
                  <Square className="h-3.5 w-3.5" />
                  Selecionar
                </Button>
              )}
            </div>

            <Tabs value={cardViewTab}>
              <TabsContent value="atual" className="mt-4">
                {renderMovementTable(
                  getInvoiceMovements(
                    movements,
                    selectedCard.id,
                    getCurrentInvoiceMonthKey(selectedCard),
                  ),
                  creditCards,
                  format,
                  handleEditRequest,
                  handleDeleteRequest,
                  selectionMode,
                  selectedIds,
                  toggleSelect,
                  toggleAll,
                )}
              </TabsContent>

              <TabsContent value="proxima" className="mt-4">
                {renderMovementTable(
                  getInvoiceMovements(
                    movements,
                    selectedCard.id,
                    getNextInvoiceMonthKey(selectedCard),
                  ),
                  creditCards,
                  format,
                  handleEditRequest,
                  handleDeleteRequest,
                  selectionMode,
                  selectedIds,
                  toggleSelect,
                  toggleAll,
                )}
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <div className="space-y-4">
                  {(() => {
                    const months = getInvoiceMonthsFromMovements(movements, selectedCard.id).filter(
                      (m) =>
                        m !== getCurrentInvoiceMonthKey(selectedCard) &&
                        m !== getNextInvoiceMonthKey(selectedCard),
                    );
                    if (months.length === 0) {
                      return (
                        <Card className="glass-card">
                          <CardContent className="py-12 text-center text-muted-foreground">
                            Nenhuma fatura anterior encontrada.
                          </CardContent>
                        </Card>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {months.map((monthKey) => {
                          const total = movements
                            .filter(
                              (m) => m.card_id === selectedCardId && m.invoice_month === monthKey,
                            )
                            .reduce((s, m) => s + Number(m.amount), 0);
                          const isSelected = historyMonth === monthKey;
                          return (
                            <div key={monthKey}>
                              <button
                                onClick={() => setHistoryMonth(isSelected ? null : monthKey)}
                                className={`w-full rounded-xl border p-4 text-left transition-all ${
                                  isSelected
                                    ? "border-primary/50 bg-primary/5"
                                    : "border-border/60 bg-background/40 hover:border-primary/30 hover:bg-accent/20"
                                }`}
                              >
                                <p className="font-semibold">{getInvoiceMonthLabel(monthKey)}</p>
                                <p className="text-sm text-muted-foreground">
                                  Total: {format(total)}
                                </p>
                              </button>
                              {isSelected && (
                                <div className="mt-3">
                                  {renderMovementTable(
                                    movements.filter(
                                      (m) =>
                                        m.card_id === selectedCardId &&
                                        m.invoice_month === monthKey,
                                    ),
                                    creditCards,
                                    format,
                                    handleEditRequest,
                                    handleDeleteRequest,
                                    selectionMode,
                                    selectedIds,
                                    toggleSelect,
                                    toggleAll,
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            {creditCards.length > 0 && (
              <Card className="glass-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground mr-1">Cartões:</span>
                    {creditCards.map((c) => (
                      <Button
                        key={c.id}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate({ to: "/movimentacoes", search: { card: c.id, tab: "atual" } })
                        }
                        className="gap-1.5"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        {c.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {[
                      "Janeiro",
                      "Fevereiro",
                      "Março",
                      "Abril",
                      "Maio",
                      "Junho",
                      "Julho",
                      "Agosto",
                      "Setembro",
                      "Outubro",
                      "Novembro",
                      "Dezembro",
                    ].map((n, i) => (
                      <SelectItem key={n} value={String(i + 1)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={acc} onValueChange={setAcc}>
                  <SelectTrigger>
                    <SelectValue placeholder="Conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
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
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Movimentações</p>
                  {selectionMode ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {selectedIds.size} selecionado(s)
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                        onClick={() => setIsBulkDeleteDialogOpen(true)}
                        className="gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {bulkDeleteMutation.isPending ? "Excluindo..." : "Excluir"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={exitSelectionMode}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectionMode(true)}
                      className="gap-1.5"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Selecionar
                    </Button>
                  )}
                </div>
                {renderMovementTable(
                  filtered,
                  creditCards,
                  format,
                  handleEditRequest,
                  handleDeleteRequest,
                  selectionMode,
                  selectedIds,
                  toggleSelect,
                  toggleAll,
                )}
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
          </>
        )}

        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setMovementToDelete(null);
          }}
        >
          <DialogContent className="glass-card sm:max-w-md max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">Excluir movimentação</DialogTitle>
              <DialogDescription className="text-center">
                {movementToDelete?.total_installments && movementToDelete.total_installments > 1
                  ? "Esta movimentação faz parte de uma compra parcelada."
                  : "Tem certeza que deseja excluir esta movimentação?"}
                {movementToDelete && (
                  <span className="mt-2 block font-medium text-foreground">
                    {movementToDelete.description}
                    {movementToDelete.total_installments > 1 && (
                      <>
                        {" "}
                        ({movementToDelete.installment_number}/{movementToDelete.total_installments}
                        )
                      </>
                    )}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            {movementToDelete?.total_installments && movementToDelete.total_installments > 1 ? (
              <div className="flex flex-col gap-2 px-6">
                <Button
                  variant={deleteMode === "single" ? "destructive" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setDeleteMode("single")}
                >
                  Excluir apenas esta parcela
                </Button>
                <Button
                  variant={deleteMode === "all" ? "destructive" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setDeleteMode("all")}
                >
                  Excluir toda a compra parcelada
                </Button>
              </div>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMovementMutation.isPending}
              >
                {deleteMovementMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent className="glass-card sm:max-w-md max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">Excluir movimentações</DialogTitle>
              <DialogDescription className="text-center">
                Tem certeza que deseja excluir{" "}
                <span className="font-medium text-foreground">
                  {selectedIds.size} movimentação(ões)
                </span>
                ? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending
                  ? "Excluindo..."
                  : `Excluir ${selectedIds.size} movimentação(ões)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setMovementToEdit(null);
          }}
        >
          <DialogContent className="glass-card sm:max-w-md max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Editar Movimentação</DialogTitle>
            </DialogHeader>

            {movementToEdit?.total_installments && movementToEdit.total_installments > 1 && (
              <div className="px-2 pb-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  Esta movimentação faz parte de uma compra parcelada (
                  {movementToEdit.installment_number}/{movementToEdit.total_installments}). Deseja
                  alterar:
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={editMode === "single" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setEditMode("single")}
                  >
                    Apenas esta parcela
                  </Button>
                  <Button
                    size="sm"
                    variant={editMode === "all" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setEditMode("all")}
                  >
                    Todas as parcelas
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-4 py-2">
              <Tabs
                value={editType}
                onValueChange={(v) => {
                  setEditType(v as "receita" | "despesa");
                  setEditCategory("");
                  setEditNature("");
                  setEditExpenseType("");
                  setEditCardId("");
                }}
              >
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
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  disabled={editSaving || editMode === "all"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editCategory}
                    onValueChange={setEditCategory}
                    disabled={editSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editType === "receita"
                        ? storedCategories.receitas
                        : storedCategories.despesas
                      ).map((c: string) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
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
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editType === "despesa" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Natureza da despesa</Label>
                    <Select
                      value={editNature}
                      onValueChange={(v) => setEditNature(v)}
                      disabled={editSaving || editMode === "all"}
                    >
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
                    <Select
                      value={editExpenseType}
                      onValueChange={(v) => setEditExpenseType(v)}
                      disabled={editSaving}
                    >
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
                  <Select
                    value={editCardId}
                    onValueChange={setEditCardId}
                    disabled={editSaving || editMode === "all"}
                  >
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
                      {
                        getCreditCardInvoiceInfo(
                          editDate,
                          creditCards.find((card: any) => card.id === editCardId),
                        )?.label
                      }{" "}
                      · vence{" "}
                      {
                        getCreditCardInvoiceInfo(
                          editDate,
                          creditCards.find((card: any) => card.id === editCardId),
                        )?.dueDate
                      }
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={editSaving || editMode === "all"}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  placeholder="Descreva a movimentação"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={editSaving}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={editSaving}
              >
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
