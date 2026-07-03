import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { goals } from "@/lib/mock-data";
import { useValueVisibility } from "@/lib/value-visibility";
import { Target } from "lucide-react";

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
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Metas" subtitle="Objetivos financeiros de curto e longo prazo" />
      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <Card key={g.id} className="glass-card card-hover">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Target className="h-4 w-4" />
                    </span>
                    <CardTitle className="text-sm">{g.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-primary/15 text-primary">
                    {pct}%
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold">{format(g.current)}</p>
                    <p className="text-xs text-muted-foreground">
                      de {format(g.target)} · {g.period}
                    </p>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Faltam {format(g.target - g.current)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
