import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useValueVisibility } from "@/lib/value-visibility";
import { Target, Loader2, Edit2 } from "lucide-react";
import { useGoals, useUpdateGoal } from "@/hooks/queries";
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
import { toast } from "sonner";

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

  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [currentVal, setCurrentVal] = useState("");
  const [targetVal, setTargetVal] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleOpenEdit = (g: any) => {
    setSelectedGoal(g);
    setCurrentVal(String(g.current));
    setTargetVal(String(g.target));
  };

  const handleSave = async () => {
    if (!selectedGoal) return;
    const current = parseFloat(currentVal);
    const target = parseFloat(targetVal);
    if (isNaN(current) || isNaN(target) || target <= 0) {
      toast.error("Por favor, insira valores válidos.");
      return;
    }

    setUpdating(true);
    try {
      await updateGoalMutation.mutateAsync({
        id: selectedGoal.id,
        current,
        target,
      });
      toast.success("Meta atualizada com sucesso!");
      setSelectedGoal(null);
    } catch (error: any) {
      toast.error("Erro ao atualizar meta: " + error.message);
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((Number(g.current) / Number(g.target)) * 100));
            return (
              <Card key={g.id} className="glass-card card-hover relative group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Target className="h-4 w-4" />
                    </span>
                    <CardTitle className="text-sm truncate">{g.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-primary/15 text-primary shrink-0">
                    {pct}%
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold">{format(Number(g.current))}</p>
                    <p className="text-xs text-muted-foreground">
                      de {format(Number(g.target))} · {g.period}
                    </p>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between items-center min-h-[32px]">
                    <p className="text-xs text-muted-foreground">
                      Faltam {format(Math.max(0, Number(g.target) - Number(g.current)))}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleOpenEdit(g)}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <Dialog open={selectedGoal !== null} onOpenChange={(open) => !open && setSelectedGoal(null)}>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
            <DialogDescription>
              Atualize os valores para a meta: <strong>{selectedGoal?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
              <Label htmlFor="targetVal">Valor Alvo (Meta)</Label>
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
            <Button variant="outline" onClick={() => setSelectedGoal(null)} disabled={updating}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updating}>
              {updating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
