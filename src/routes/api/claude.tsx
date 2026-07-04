import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/claude")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const message = typeof body?.message === "string" ? body.message : "";
        const context = typeof body?.context === "string" ? body.context : "Usuário está usando um dashboard financeiro pessoal.";

        if (!message) {
          return Response.json({ error: "Mensagem é obrigatória." }, { status: 400 });
        }

        const apiKey = process.env.CLAUDE_API_KEY;

        if (!apiKey) {
          return Response.json(
            { error: "A variável de ambiente CLAUDE_API_KEY não está configurada." },
            { status: 500 },
          );
        }

        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-latest",
              max_tokens: 400,
              system: "Você é um assistente financeiro prestativo e objetivo.",
              messages: [
                {
                  role: "user",
                  content: `Contexto: ${context}\n\nPergunta do usuário: ${message}`,
                },
              ],
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return Response.json({ error: data?.error?.message || "Erro na API do Claude." }, { status: response.status });
          }

          const reply = data?.content?.[0]?.text || "Não consegui montar uma resposta.";

          return Response.json({ reply });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Erro inesperado." }, { status: 500 });
        }
      },
    },
  },
  component: () => null,
});
