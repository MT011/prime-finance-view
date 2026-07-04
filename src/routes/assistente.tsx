import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  role: "assistant" | "user";
  content: string;
};

function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Posso te ajudar a entender seu painel financeiro, sugerir melhorias de orçamento ou planejar metas. Me diga o que você quer analisar.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = input.trim();

    if (!message) return;

    setMessages((previous) => [...previous, { role: "user", content: message }]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message,
          context:
            "Usuário está usando um dashboard financeiro pessoal com movimentações, metas e reserva de emergência.",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao consultar o Claude.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.reply || "Não consegui gerar uma resposta agora." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "Quero analisar meu orçamento",
    "Sugira 3 metas de economia",
    "Me ajude a reduzir despesas",
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Assistente Claude</h1>
                <p className="text-sm text-muted-foreground">
                  Tire dúvidas, receba sugestões e transforme seus dados em ações.
                </p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Integrado via API
          </Badge>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Conversa com o assistente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex min-h-[320px] flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "self-start bg-primary/10 text-foreground"
                      : "self-end bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              ))}

              {isLoading && (
                <div className="self-start rounded-2xl bg-primary/10 px-4 py-3 text-sm text-foreground">
                  O Claude está pensando na melhor resposta...
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ex.: Quais são os próximos passos para melhorar minhas finanças?"
                className="min-h-[100px] resize-none"
              />
              <Button type="submit" className="md:self-end" disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/assistente")({
  component: AssistantPage,
});
