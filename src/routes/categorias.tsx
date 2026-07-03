import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoriesList } from "@/lib/mock-data";
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
}: {
  title: string;
  items: string[];
  color: "success" | "danger";
  icon: React.ReactNode;
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
        <Button size="sm" variant="outline" className="gap-1">
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
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
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
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Categorias" subtitle="Organize suas receitas e despesas" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CategoriaList
            title="Receitas"
            items={categoriesList.receitas}
            color="success"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <CategoriaList
            title="Despesas"
            items={categoriesList.despesas}
            color="danger"
            icon={<TrendingDown className="h-4 w-4" />}
          />
        </div>
      </main>
    </div>
  );
}
