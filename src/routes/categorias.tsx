import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Loader2,
  DollarSign,
  CircleX,
} from "lucide-react";
import {
  useCategories,
  useCategoryBudgets,
  useUpsertCategoryBudget,
  useDeleteCategoryBudget,
} from "@/hooks/queries";
import {
  addCategory as addCategoryToDb,
  removeCategory as removeCategoryFromDb,
} from "@/lib/categories-storage";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Finance Dashboard" },
      { name: "description", content: "Gerencie suas categorias de receitas e despesas." },
    ],
  }),
  component: CategoriasPage,
});

function CategoriaList({
  title,
  items,
  color,
  icon,
  onAdd,
  onRemove,
  budgets,
  onBudgetChange,
  onBudgetRemove,
}: {
  title: string;
  items: string[];
  color: "success" | "danger";
  icon: React.ReactNode;
  onAdd: () => void;
  onRemove: (name: string) => void;
  budgets?: Record<string, number>;
  onBudgetChange?: (category: string, limit: number) => void;
  onBudgetRemove?: (category: string) => void;
}) {
  const badgeCls =
    color === "success" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive";
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState("");

  const handleStartEdit = (cat: string) => {
    setEditingBudget(cat);
    setBudgetValue(budgets?.[cat] ? String(budgets[cat]) : "");
  };

  const handleSaveBudget = (cat: string) => {
    const val = parseFloat(budgetValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Valor inválido para o limite.");
      return;
    }
    onBudgetChange?.(cat, val);
    setEditingBudget(null);
  };

  const handleRemoveBudget = (cat: string) => {
    onBudgetRemove?.(cat);
    setEditingBudget(null);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${badgeCls}`}>{icon}</span>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((c) => {
          const hasBudget = budgets?.[c] !== undefined;
          return (
            <div
              key={c}
              className="group flex flex-col gap-2 rounded-lg border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={badgeCls}>
                    {c.charAt(0)}
                  </Badge>
                  <span className="font-medium">{c}</span>
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100">
                  {color === "danger" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleStartEdit(c)}
                      title="Definir limite mensal"
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onRemove(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {color === "danger" && hasBudget && editingBudget !== c && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3 text-primary" />
                  <span>
                    Limite mensal: <strong>R$ {budgets[c].toFixed(2)}</strong>
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 ml-auto"
                    onClick={() => handleRemoveBudget(c)}
                    title="Remover limite"
                  >
                    <CircleX className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              )}
              {color === "danger" && editingBudget === c && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetValue}
                      onChange={(e) => setBudgetValue(e.target.value)}
                      placeholder="500.00"
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveBudget(c)}>
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => setEditingBudget(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CategoriasPage() {
  const { data: categories, isLoading, refetch } = useCategories();
  const { data: budgets = [] } = useCategoryBudgets();
  const upsertBudget = useUpsertCategoryBudget();
  const deleteBudget = useDeleteCategoryBudget();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const receitas = (categories || []).filter((c) => c.type === "receita").map((c) => c.name);
  const despesas = (categories || []).filter((c) => c.type === "despesa").map((c) => c.name);

  const budgetsMap: Record<string, number> = {};
  budgets.forEach((b) => {
    budgetsMap[b.category] = b.monthly_limit;
  });

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Digite o nome da categoria.");
      return;
    }

    setSaving(true);
    try {
      await addCategoryToDb(type, trimmed);
      refetch();
      setName("");
      setOpen(false);
      toast.success("Categoria criada com sucesso!");
    } catch {
      toast.error("Erro ao criar categoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (categoryType: "receita" | "despesa", categoryName: string) => {
    setSaving(true);
    try {
      await removeCategoryFromDb(categoryType, categoryName);
      refetch();
      toast.success("Categoria removida.");
    } catch {
      toast.error("Erro ao remover categoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleBudgetChange = async (category: string, limit: number) => {
    try {
      await upsertBudget.mutateAsync({ category, monthly_limit: limit });
      toast.success("Limite salvo!");
    } catch (err) {
      console.error("Erro ao salvar limite:", err);
      const msg = typeof err === "object" && err !== null
        ? JSON.stringify(err)
        : String(err);
      toast.error("Erro ao salvar limite: " + msg);
    }
  };

  const handleBudgetRemove = async (category: string) => {
    try {
      await deleteBudget.mutateAsync(category);
      toast.success("Limite removido.");
    } catch (err) {
      console.error("Erro ao remover limite:", err);
      const msg = typeof err === "object" && err !== null
        ? JSON.stringify(err)
        : String(err);
      toast.error("Erro ao remover limite: " + msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader title="Categorias" subtitle="Organize suas receitas e despesas" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando categorias...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Categorias" subtitle="Organize suas receitas e despesas" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CategoriaList
            title="Receitas"
            items={receitas}
            color="success"
            icon={<TrendingUp className="h-4 w-4" />}
            onAdd={() => {
              setType("receita");
              setOpen(true);
            }}
            onRemove={(name) => handleRemove("receita", name)}
          />
          <CategoriaList
            title="Despesas"
            items={despesas}
            color="danger"
            icon={<TrendingDown className="h-4 w-4" />}
            onAdd={() => {
              setType("despesa");
              setOpen(true);
            }}
            onRemove={(name) => handleRemove("despesa", name)}
            budgets={budgetsMap}
            onBudgetChange={handleBudgetChange}
            onBudgetRemove={handleBudgetRemove}
          />
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input value={type === "receita" ? "Receita" : "Despesa"} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome da categoria</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Freelance"
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
