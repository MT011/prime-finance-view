import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { addCategory, getStoredCategories, removeCategory, type CategoryType } from "@/lib/categories-storage";
import { Pencil, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";

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
}: {
  title: string;
  items: string[];
  color: "success" | "danger";
  icon: React.ReactNode;
  onAdd: () => void;
  onRemove: (name: string) => void;
}) {
  const badgeCls =
    color === "success" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive";
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
        {items.map((c) => (
          <div
            key={c}
            className="group flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className={badgeCls}>
                {c.charAt(0)}
              </Badge>
              <span className="font-medium">{c}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemove(c)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CategoriasPage() {
  const [categories, setCategories] = useState(getStoredCategories());
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CategoryType>("receita");
  const [name, setName] = useState("");

  useEffect(() => {
    setCategories(getStoredCategories());
  }, []);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Digite o nome da categoria.");
      return;
    }

    const next = addCategory(type, trimmed);
    setCategories(next);
    setName("");
    setOpen(false);
    toast.success("Categoria criada com sucesso!");
  };

  const handleRemove = (categoryType: CategoryType, categoryName: string) => {
    const next = removeCategory(categoryType, categoryName);
    setCategories(next);
    toast.success("Categoria removida.");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Categorias" subtitle="Organize suas receitas e despesas" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CategoriaList
            title="Receitas"
            items={categories.receitas}
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
            items={categories.despesas}
            color="danger"
            icon={<TrendingDown className="h-4 w-4" />}
            onAdd={() => {
              setType("despesa");
              setOpen(true);
            }}
            onRemove={(name) => handleRemove("despesa", name)}
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
