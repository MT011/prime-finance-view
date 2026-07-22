import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  useCreateCreditCard,
  useCreditCards,
  useDeleteCreditCard,
  useCardNames,
  useCreateCardName,
} from "@/hooks/queries";
import { useState, useMemo, useCallback } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  CreditCard as CreditCardIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cartoes")({
  head: () => ({
    meta: [
      { title: "Cartões — Finance Dashboard" },
      { name: "description", content: "Gerencie seus cartões de crédito e suas faturas." },
    ],
  }),
  component: CartoesPage,
});

function CartoesPage() {
  const { data: cards = [], isLoading } = useCreditCards();
  const { data: savedCardNames = [] } = useCardNames();
  const createCardMutation = useCreateCreditCard();
  const deleteCardMutation = useDeleteCreditCard();
  const createCardNameMutation = useCreateCardName();

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("2");
  const [dueDay, setDueDay] = useState("10");
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const allSuggestions = useMemo(() => {
    const savedNames = savedCardNames.map((cn) => cn.name);
    const merged = [...new Set(savedNames)];
    return merged.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [savedCardNames]);

  const filteredSuggestions = useMemo(() => {
    if (!name.trim()) return allSuggestions;
    return allSuggestions.filter((s) => s.toLowerCase().includes(name.toLowerCase()));
  }, [allSuggestions, name]);

  const handleSelectCardName = useCallback((selectedName: string) => {
    setName(selectedName);
    setComboboxOpen(false);
  }, []);

  const handleCreate = async () => {
    const parsedLimit = Number(limit);
    const parsedClosingDay = Number(closingDay);
    const parsedDueDay = Number(dueDay);

    if (!name.trim()) {
      toast.error("Informe o nome do cartão.");
      return;
    }

    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      toast.error("Informe um limite válido.");
      return;
    }

    if (!Number.isInteger(parsedClosingDay) || parsedClosingDay < 1 || parsedClosingDay > 31) {
      toast.error("Informe um dia de fechamento válido.");
      return;
    }

    if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      toast.error("Informe um dia de vencimento válido.");
      return;
    }

    try {
      await createCardMutation.mutateAsync({
        name: name.trim(),
        limit: parsedLimit,
        closing_day: parsedClosingDay,
        due_day: parsedDueDay,
      });

      createCardNameMutation.mutate(name.trim());

      toast.success("Cartão cadastrado com sucesso!");
      setName("");
      setLimit("");
      setClosingDay("2");
      setDueDay("10");
    } catch (error: any) {
      toast.error("Erro ao salvar cartão: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCardMutation.mutateAsync(id);
      toast.success("Cartão removido com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover cartão: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader title="Cartões" subtitle="Gerencie seus cartões de crédito" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando cartões...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Cartões" subtitle="Controle de crédito e faturas" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Adicionar cartão</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Nome do cartão</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {name || "Selecione ou digite o nome"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar ou cadastrar cartão..."
                      value={name}
                      onValueChange={setName}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <span className="text-muted-foreground">
                          Pressione Enter para cadastrar "{name}"
                        </span>
                      </CommandEmpty>
                      <CommandGroup heading="Sugestões">
                        {filteredSuggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion}
                            value={suggestion}
                            onSelect={() => handleSelectCardName(suggestion)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                name === suggestion ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {suggestion}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Limite</Label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Dia de fechamento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dia de vencimento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button
              onClick={handleCreate}
              disabled={createCardMutation.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />{" "}
              {createCardMutation.isPending ? "Salvando..." : "Cadastrar cartão"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.length === 0 ? (
            <Card className="glass-card md:col-span-2 xl:col-span-3">
              <CardContent className="flex min-h-[180px] flex-col items-center justify-center text-center text-muted-foreground">
                <CreditCardIcon className="mb-2 h-8 w-8" />
                <p>Nenhum cartão cadastrado ainda.</p>
                <p className="text-sm">
                  Adicione um cartão para associar despesas e controlar faturas.
                </p>
              </CardContent>
            </Card>
          ) : (
            cards.map((card) => (
              <Card key={card.id} className="glass-card card-hover">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{card.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Limite: R$ {Number(card.limit).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Fechamento da fatura: dia {card.closing_day}</p>
                  <p>Vencimento: dia {card.due_day}</p>
                  <p>
                    Compras antes ou no dia {card.closing_day} entram na fatura atual; depois disso,
                    na seguinte.
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
