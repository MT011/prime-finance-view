import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useValueVisibility } from "@/lib/value-visibility";
import { Target, Loader2, Edit2, Plus, Sparkles } from "lucide-react";
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from "@/hooks/queries";
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

function getGoalTypeLabel(period?: string) {
  const normalized = (period || "").toLowerCase();

  if (normalized.includes("anual")) return "Meta anual";
  if (normalized.includes("patrimônio")) return "Meta de patrimônio";
  if (normalized.includes("investimento")) return "Meta de investimento";
  if (normalized.includes("reserva") || normalized.includes("emergência")) return "Reserva de emergência";
  if (normalized.includes("economia") || normalized.includes("mensal")) return "Meta de economia";

  return "Meta";
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
  const updateGoalMutation = useUpdateGoal();
  const createGoalMutation = useCreateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [currentVal, setCurrentVal] = useState("");
  const [targetVal, setTargetVal] = useState("");
  const [period, setPeriod] = useState("Economia");
  const [description, setDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const suggestedGoals = [
    { title: "Meta mensal", period: "Mensal", target: 2000, current: 0, description: "Estabeleça uma reserva mensal para suas despesas e economia." },
    { title: "Meta anual", period: "Anual", target: 24000, current: 0, description: "Defina um objetivo de economia ou investimento para o ano." },
    { title: "Meta de patrimônio", period: "Patrimônio", target: 100000, current: 0, description: "Acompanhe o crescimento do seu patrimônio líquido." },
    { title: "Meta de investimento", period: "Investimento", target: 15000, current: 0, description: "Monitore aportes regulares em seus investimentos." },
  ];

  const visibleGoals = goals;
  const isEmptyState = goals.length === 0;

  const resetForm = () => {
    setSelectedGoal(null);
    setTitle("");
    setCurrentVal("");
    setTargetVal("");
    setPeriod("Economia");
    setDescription("");
    setIsDialogOpen(false);
  };

  const handleOpenCreate = (template?: (typeof suggestedGoals)[number]) => {
    setSelectedGoal(null);
    setTitle(template?.title || "");
    setCurrentVal(template ? String(template.current) : "");
    setTargetVal(template ? String(template.target) : "");
    setPeriod(template?.period || "Economia");
    setDescription(template?.description || "");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (g: any) => {
    setSelectedGoal(g);
    setTitle((g.title || "").trim() && (g.title || "").trim() !== getGoalTypeLabel(g.period) ? g.title : "");
    setCurrentVal(String(g.current));
    setTargetVal(String(g.target));
    setPeriod(g.period || "Economia");
    setDescription(g.description || "");
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

  const handleSave = async () => {
    const current = parseFloat(currentVal);
    const target = parseFloat(targetVal);
    const resolvedTitle = title.trim() || getGoalTypeLabel(period);
    if (isNaN(current) || isNaN(target) || target <= 0) {
      toast.error("Preencha valores válidos para salvar a meta.");
      return;
    }

    setUpdating(true);
    try {
      if (selectedGoal) {
        await updateGoalMutation.mutateAsync({
          id: selectedGoal.id,
          title: resolvedTitle,
          current,
          target,
          description: description.trim() || null,
        });
        toast.success("Meta atualizada com sucesso!");
      } else {
        await createGoalMutation.mutateAsync({
          title: resolvedTitle,
          current,
          target,
          period,
          description: description.trim() || null,
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
                    <p className="text-2xl font-bold">{format(Number(g.current))}</p>
                    <p className="text-xs text-muted-foreground">
                      de {format(Number(g.target))} · {g.period}
                    </p>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between items-center min-h-[32px] gap-2">
                    <p className="text-xs text-muted-foreground">
                      Faltam {format(Math.max(0, Number(g.target) - Number(g.current)))}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleOpenEdit(g)}
                      >
                        <Edit2 className="mr-1 h-3.5 w-3.5" /> Editar
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
            <DialogDescription>
              {selectedGoal ? `Atualize os valores para a meta: ${getGoalDisplayTitle(selectedGoal)}` : "Defina uma meta personalizada para o seu planejamento financeiro."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="period">Tipo de meta</Label>
              <Select value={period} onValueChange={setPeriod} disabled={updating}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economia">Meta de economia</SelectItem>
                  <SelectItem value="Mensal">Meta mensal</SelectItem>
                  <SelectItem value="Anual">Meta anual</SelectItem>
                  <SelectItem value="Patrimônio">Meta de patrimônio</SelectItem>
                  <SelectItem value="Investimento">Meta de investimento</SelectItem>
                  <SelectItem value="Reserva">Reserva de emergência</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="currentVal">Valor Atual</Label>
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
