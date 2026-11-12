# Prime Finance — Plano de evolução da experiência

## Objetivo
Transformar o Prime Finance em um gerenciador financeiro pessoal simples, rápido e premium, com prioridade para celular. Preservar React/TypeScript, TanStack, Supabase, autenticação, dados existentes e regras financeiras. Evoluir em etapas, sem reescrever o banco nem remover funcionalidades às cegas.

## Navegação
**Mobile:** barra inferior com Início, Lançamentos, Cartões, Planejamento e Mais.
**Desktop:** navegação lateral compacta com a mesma hierarquia.
Em Mais ficam Relatórios, Categorias, Configurações e Perfil. Manter rotas antigas e links diretos até validar a nova navegação.

## Direção visual
- Fintech premium, limpa e contemporânea; evitar aparência de painel administrativo.
- Tema escuro como referência principal, superfícies discretas e verde para ações/receitas positivas; vermelho apenas para despesas e alertas.
- Hierarquia tipográfica forte, números tabulares, cards compactos e pouco espaço desperdiçado.
- Mobile-first, acessível, com estados de carregamento, vazio, erro e sucesso.
- Preservar suporte ao tema claro já existente.

## Início
Priorizar: resumo do período, receitas/despesas/resultado, próximos vencimentos e faturas, gráfico simples e últimas movimentações. Manter ocultação de valores. Não chamar limite de cartão de saldo disponível nem misturar patrimônio, saldo e limite de crédito.

## Cadastro rápido
Fluxo progressivo:
1. Tipo: despesa ou receita.
2. Valor, descrição, categoria e data (hoje por padrão).
3. Para despesa, forma de pagamento: Pix, débito ou crédito.
4. Somente no crédito, pedir cartão e parcelamento.
5. Recorrência/fixo: perguntar frequência e duração, mostrar resumo das ocorrências e pedir confirmação antes de gerar lançamentos futuros.
6. Receita não mostra campos exclusivos de despesa.
Separar corretamente conta bancária de cartão; não usar nomes de cartões como se fossem contas.

## Cartões e faturas
Exibir limite total, limite utilizado/disponível apenas quando calculado com segurança, fatura atual, próxima fatura e vencimento. Considerar dia de fechamento, dia de vencimento, virada de mês e meses com menos dias. Compra parcelada deve distribuir parcelas em faturas consecutivas, sem duplicar valores. Nunca alterar lançamentos existentes sem migração explícita e validação.

## Lançamentos
Lista agrupada por dia no celular, com busca e filtros simples por período, tipo, categoria e cartão. Ações de editar/excluir acessíveis sem tabela horizontal. Desktop pode usar tabela mais densa.

## Planejamento
Reunir orçamentos por categoria, metas e reserva de emergência com indicadores claros e históricos. Não confundir meta com saldo real.

## Segurança e integridade
- Preservar IDs, user_id, relacionamentos e dados.
- Manter RLS habilitada em todas as tabelas financeiras; revisar políticas e testar isolamento entre usuários.
- Nunca expor service-role key no cliente ou no Git.
- Não versionar .env com credenciais; manter .env.example com valores fictícios. Se uma chave real tiver sido publicada, orientar rotação no provedor.
- Não descartar campos financeiros silenciosamente em fallback de inserção; erros de esquema devem ser explícitos e rastreáveis.
- Toda operação em grupo (parcelas/recorrências) deve informar claramente seu alcance antes de confirmar.

## Sequência de implementação
1. Auditoria final de rotas, hooks, schema, migrations, RLS e cálculos.
2. Corrigir e testar regras de fatura/parcelas antes de redesenhar componentes dependentes.
3. Criar sistema visual e navegação responsiva.
4. Redesenhar Início e cadastro rápido.
5. Redesenhar Lançamentos, Cartões e Planejamento.
6. Redesenhar telas secundárias, acessibilidade e estados de erro/vazio.
7. Executar lint/build e testes; revisar diff e abrir PR para validação antes de integrar à main.

## Critérios de aceite
- Login e sessão existentes continuam funcionando.
- Usuários só acessam seus próprios dados via RLS.
- Criar, editar e excluir receitas/despesas continua íntegro.
- Parcelas, recorrências e despesas fixas mantêm grupos e totais corretos.
- Datas de fatura respeitam fechamento e vencimento, inclusive virada de ano.
- Interface utilizável em telas pequenas sem rolagem horizontal.
- Nenhum dado real é apagado ou migrado sem plano e validação.
