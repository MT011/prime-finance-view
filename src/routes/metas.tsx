import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useValueVisibility } from "@/lib/value-visibility";
import { Target, Loader2, Edit2, Plus, Sparkles, RotateCcw, Banknote } from "lucide-react";
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal, useGoalHistory, useCreditCards } from "@/hooks/queries";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function getGoalTypeLabel(type?: string) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("patrimônio")) return "Meta de patrimônio";
  if (normalized.includes("investimento")) return "Meta de investimento";
  if (normalized.includes("reserva") || normalized.includes("emergência")) return "Reserva de emergência";

  return "Meta de economia";
}



function getCalendarMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCardCycleKey(card: { closing_day: number }): string {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const cd = card.closing_day;

  if (day > cd) {
    const nextMonth = month + 1;
    const cy = nextMonth > 11 ? year + 1 : year;
    const cm = nextMonth > 11 ? 0 : nextMonth;
    return `${cy}-${String(cm + 1).padStart(2, "0")}-${String(cd).padStart(2, "0")}`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(cd).padStart(2, "0")}`;
}

function getCycleKey(goal: any, cards: any[]): string {
  if (goal.card_id) {
    const card = cards.find((c: any) => c.id === goal.card_id);
    if (card?.closing_day) return getCardCycleKey(card);
  }
  return getCalendarMonthKey();
}

function formatCycleKey(key: string): string {
  const parts = key.split("-");
  if (parts.length === 3) {
    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const m = parseInt(parts[1]) - 1;
    const label = `${months[m]}/${parts[0]}`;
    if (parts[2]) return `${label} (fecha dia ${parseInt(parts[2])})`;
    return label;
  }
  return key;
}

function getCurrentMonthLabel(cards: any[], goal?: any): string {
  if (goal?.card_id) {
    const card = cards.find((c: any) => c.id === goal.card_id);
    if (card?.closing_day) {
      const key = getCardCycleKey(card);
      return formatCycleKey(key);
    }
  }
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const d = new Date();
  return `${months[d.getMonth()]}/${d.getFullYear()}`;
}

function getGoalDisplayTitle(goal: any) {
  const customTitle = (goal?.title || "").trim();
  if (customTitle) return customTitle;
  return getGoalTypeLabel(goal?.period);
}

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title: "Metas — Finance Dashboard" },
      { name: "description", content: "Acompanhe suas metas financeiras mensais e anuais." },
    ],
  }),
  component: MetasPage,
});

function MetasPage() {
  const { format } = useValueVisibility();
  const { data: goals = [], isLoading } = useGoals();
  const { data: creditCards = [] } = useCreditCards();
  const { data: goalHistory = [] } = useGoalHistory();
  const updateGoalMutation = useUpdateGoal();
  const createGoalMutation = useCreateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [currentVal, setCurrentVal] = useState("");
  const [targetVal, setTargetVal] = useState("");
  const [goalType, setGoalType] = useState("Economia");
  const [goalPeriod, setGoalPeriod] = useState("Mensal");
  const [description, setDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [card_id, setCardId] = useState<string>("");

  const [depositGoal, setDepositGoal] = useState<any>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const suggestedGoals = [
    { title: "Economia mensal", type: "Economia", period: "Mensal", target: 2000, current: 0, description: "Estabeleça uma reserva mensal para suas despesas e economia." },
    { title: "Economia anual", type: "Economia", period: "Anual", target: 24000, current: 0, description: "Defina um objetivo de economia para o ano." },
    { title: "Meta de patrimônio", type: "Patrimônio", period: "Anual", target: 100000, current: 0, description: "Acompanhe o crescimento do seu patrimônio líquido." },
    { title: "Meta de investimento", type: "Investimento", period: "Anual", target: 15000, current: 0, description: "Monitore aportes regulares em seus investimentos." },
  ];

  const visibleGoals = goals;
  const isEmptyState = goals.length === 0;

  const resetForm = () => {
    setSelectedGoal(null);
    setTitle("");
    setCurrentVal("");
    setTargetVal("");
    setGoalType("Economia");
    setGoalPeriod("Mensal");
    setDescription("");
    setCardId("");
    setIsDialogOpen(false);
  };

  const handleOpenCreate = (template?: (typeof suggestedGoals)[number]) => {
    setSelectedGoal(null);
    setTitle(template?.title || "");
    setCurrentVal(template ? String(template.current) : "");
    setTargetVal(template ? String(template.target) : "");
    setGoalType(template?.type || "Economia");
    setGoalPeriod(template?.period || "Mensal");
    setDescription(template?.description || "");
    setCardId("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (g: any) => {
    setSelectedGoal(g);
    setTitle((g.title || "").trim() && (g.title || "").trim() !== getGoalTypeLabel(g.period) ? g.title : "");
    setCurrentVal(String(g.current));
    setTargetVal(String(g.target));
    setGoalType(g.period || "Economia");
    setGoalPeriod(g.reset_monthly ? "Mensal" : "Anual");
    setDescription(g.description || "");
    setCardId(g.card_id || "");
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (goal: any) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete?.id) return;

    try {
      await deleteGoalMutation.mutateAsync(goalToDelete.id);
      toast.success("Meta excluída com sucesso!");
      setIsDeleteDialogOpen(false);
      setGoalToDelete(null);
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao excluir meta: " + error.message);
    }
  };

  const handleDepositRequest = (goal: any) => {
    setDepositGoal(goal);
    setDepositAmount("");
    setIsDepositDialogOpen(true);
  };

  const confirmDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido para depositar.");
      return;
    }
    if (!depositGoal?.id) return;
    try {
      const newCurrent = (depositGoal.current || 0) + amount;
      const cycleKey = getCycleKey(depositGoal, creditCards);
      await updateGoalMutation.mutateAsync({
        id: depositGoal.id,
        current: newCurrent,
        last_reset_month: cycleKey,
      });
      toast.success(`R$ ${amount.toFixed(2)} adicionado à meta!`);
      setIsDepositDialogOpen(false);
      setDepositGoal(null);
    } catch (error: any) {
      toast.error("Erro ao adicionar depósito: " + error.message);
    }
  };

  const handleResetMonth = async (goal: any) => {
    if (!goal?.id) return;
    try {
      const cycleKey = getCycleKey(goal, creditCards);
      await updateGoalMutation.mutateAsync({
        id: goal.id,
        current: 0,
        last_reset_month: cycleKey,
      });
      toast.success("Mês zerado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao zerar mês: " + error.message);
    }
  };

  const handleSave = async () => {
    const current = currentVal ? parseFloat(currentVal) : 0;
    const target = parseFloat(targetVal);
    const resolvedTitle = title.trim() || getGoalTypeLabel(goalType);
    if (isNaN(target) || target <= 0) {
      toast.error("Defina um valor alvo válido para salvar a meta.");
      return;
    }

    const isMonthly = goalPeriod === "Mensal";

    setUpdating(true);
    try {
      if (selectedGoal) {
        await updateGoalMutation.mutateAsync({
          id: selectedGoal.id,
          title: resolvedTitle,
          current,
          target,
          description: description.trim() || null,
          reset_monthly: isMonthly || undefined,
          card_id: card_id || null,
        });
        toast.success("Meta atualizada com sucesso!");
      } else {
        await createGoalMutation.mutateAsync({
          title: resolvedTitle,
          current,
          target,
          period: goalType,
          description: description.trim() || null,
          reset_monthly: isMonthly,
          card_id: card_id || null,
        });
        toast.success("Meta criada com sucesso!");
      }
      resetForm();
    } catch (error: any) {
      toast.error(selectedGoal ? "Erro ao atualizar meta: " + error.message : "Erro ao criar meta: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader title="Metas" subtitle="Objetivos financeiros de curto e longo prazo" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando metas...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Metas" subtitle="Objetivos financeiros de curto e longo prazo" />
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Planejamento financeiro</p>
            <h2 className="text-xl font-semibold">Defina metas claras e acompanhe seu progresso.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize objetivos mensais, anuais, de patrimônio e de investimento em um só lugar.
            </p>
          </div>
          <Button onClick={() => handleOpenCreate()} className="gap-2">
            <Plus className="h-4 w-4" /> Nova meta
          </Button>
        </div>

        {isEmptyState && (
          <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Comece com sugestões rápidas para estruturar seu planejamento.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleGoals.map((g: any) => {
            const pct = Math.min(100, Math.round((Number(g.current) / Number(g.target)) * 100));
            const displayTitle = getGoalDisplayTitle(g);
            const isMonthly = g.reset_monthly || g.period === "Mensal";
            return (
              <Card key={g.id || g.title} className="glass-card card-hover relative group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Target className="h-4 w-4" />
                    </span>
                    <CardTitle className="text-sm truncate">{displayTitle}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-primary/15 text-primary shrink-0">
                    {pct}%
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {g.description && (
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  )}
                  <div>
                    {isMonthly && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {getCurrentMonthLabel(creditCards, g)}
                      </p>
                    )}
                    <p className="text-2xl font-bold">{format(Number(g.current))}</p>
                    <p className="text-xs text-muted-foreground">
                      de {format(Number(g.target))} · {g.reset_monthly ? "Mensal" : g.period}
                    </p>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Faltam {format(Math.max(0, Number(g.target) - Number(g.current)))}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs gap-1"
                        onClick={() => handleDepositRequest(g)}
                      >
                        <Banknote className="h-3.5 w-3.5" /> Depositar
                      </Button>
                      {isMonthly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleResetMonth(g)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleOpenEdit(g)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRequest(g)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {goalHistory.length > 0 && (
          <Card className="glass-card mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Target className="h-4 w-4" />
                </span>
                <CardTitle className="text-base">Histórico de metas mensais</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meta</TableHead>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Alcançado</TableHead>
                      <TableHead className="text-right">Meta</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goalHistory.slice(0, 20).map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.goal_title}</TableCell>
                        <TableCell className="text-muted-foreground">{h.month}</TableCell>
                        <TableCell className="text-right">
                          {h.achieved ? (
                            <span className="text-success font-medium">Sim</span>
                          ) : (
                            <span className="text-destructive font-medium">Não</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{format(Number(h.target))}</TableCell>
                        <TableCell className="text-right">{format(Number(h.current))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setGoalToDelete(null);
      }}>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir meta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a meta {goalToDelete ? `"${getGoalDisplayTitle(goalToDelete)}"` : "selecionada"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteGoalMutation.isPending}>
              {deleteGoalMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDepositDialogOpen} onOpenChange={(open) => {
        setIsDepositDialogOpen(open);
        if (!open) setDepositGoal(null);
      }}>
        <DialogContent className="glass-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar depósito</DialogTitle>
            <DialogDescription>
              {depositGoal ? `Adicione um valor à meta "${getGoalDisplayTitle(depositGoal)}".` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {depositGoal && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso atual</span>
                <span className="font-medium">{format(Number(depositGoal.current))} de {format(Number(depositGoal.target))}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Valor do depósito</Label>
              <Input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Ex.: 200"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setIsDepositDialogOpen(false); setDepositGoal(null); }}>
              Cancelar
            </Button>
            <Button onClick={confirmDeposit} disabled={updateGoalMutation.isPending}>
              {updateGoalMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
            <DialogDescription>
              {selectedGoal ? `Atualize os valores para a meta: ${getGoalDisplayTitle(selectedGoal)}` : "Defina uma meta personalizada para o seu planejamento financeiro."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalType">Tipo de meta</Label>
                <Select value={goalType} onValueChange={setGoalType} disabled={updating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Economia">Economia</SelectItem>
                    <SelectItem value="Patrimônio">Patrimônio</SelectItem>
                    <SelectItem value="Investimento">Investimento</SelectItem>
                    <SelectItem value="Reserva">Reserva de emergência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalPeriod">Período</Label>
                <Select value={goalPeriod} onValueChange={setGoalPeriod} disabled={updating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Nome personalizado (opcional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Casamento, casa, viagem"
                disabled={updating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Motivo da meta</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Quero juntar dinheiro para o casamento em 2026"
                rows={3}
                disabled={updating}
              />
            </div>
            <div className="space-y-2">
              <Label>Vincular cartão (opcional)</Label>
              <Select value={card_id} onValueChange={(v) => setCardId(v === "none" ? "" : v)} disabled={updating}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cartão</SelectItem>
                  {creditCards.map((card: any) => (
                    <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentVal">Valor Atual <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="currentVal"
                type="number"
                step="0.01"
                value={currentVal}
                onChange={(e) => setCurrentVal(e.target.value)}
                disabled={updating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetVal">Valor Alvo</Label>
              <Input
                id="targetVal"
                type="number"
                step="0.01"
                value={targetVal}
                onChange={(e) => setTargetVal(e.target.value)}
                disabled={updating}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetForm} disabled={updating}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updating}>
              {updating ? "Salvando..." : selectedGoal ? "Salvar" : "Criar meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
