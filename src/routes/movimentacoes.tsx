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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { movements, accounts, categoriesList } from "@/lib/mock-data";
import { useValueVisibility } from "@/lib/value-visibility";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

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
  }, [search, month, cat, acc, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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
      </main>
      <NewMovementFab />
    </div>
  );
}
