# Nexa — rotina e valores pessoais

App React (Vite) para acompanhar checklists semanais ligados aos seus valores, com um
assistente de IA (via NVIDIA NIM) que ajuda a marcar e sugerir itens.

## Como funciona

- **Dados**: ficam salvos como JSON no `localStorage` do navegador automaticamente.
  Use os botões **Exportar JSON** / **Importar JSON** no rodapé para fazer backup ou
  levar seus dados para outro dispositivo.
- **Ciclo**: cada semana (segunda a domingo) é um "ciclo" novo — os itens marcados
  não se acumulam de uma semana pra outra, mas o histórico de ciclos passados fica
  guardado no JSON.
- **IA**: o front-end nunca fala direto com a NVIDIA (isso exporia sua API key). Ele
  chama `/api/ai`, uma função serverless que você mesmo hospeda com sua chave.

## Rodando localmente

```bash
npm install
npm run dev
```

Isso sobe só o front-end em `http://localhost:5173`. O assistente de IA só vai
funcionar quando a função `/api/ai` estiver disponível — veja abaixo.

## Configurando a IA (NVIDIA NIM)

1. Crie uma conta gratuita em https://build.nvidia.com e gere uma API key (`nvapi-...`).
2. Copie `.env.example` para `.env` e cole sua chave em `NVIDIA_API_KEY`.
3. Escolha um modelo em `NVIDIA_MODEL` (ex: `meta/llama-3.1-70b-instruct`,
   `mistralai/mistral-large`). Consulte o catálogo atualizado em
   build.nvidia.com/models — a lista de modelos gratuitos muda com o tempo.

### Rodando a função serverless localmente

A forma mais simples é via Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Isso serve tanto o front-end quanto `/api/ai.js` juntos em `http://localhost:3000`,
já lendo o `.env`.

### Deploy

Suba o projeto para o GitHub e importe na Vercel (ou Netlify, adaptando a pasta
`/api`). Configure `NVIDIA_API_KEY` e `NVIDIA_MODEL` como variáveis de ambiente no
painel do projeto — nunca no código.

## Estrutura

```
src/
  data/defaultData.js     valores e itens iniciais (semente)
  hooks/useAppData.js      persistência local + lógica do ciclo semanal
  components/              UI (checklist, selo de progresso, chat da IA)
  services/aiService.js    chamada ao /api/ai
api/ai.js                  proxy serverless para a NVIDIA (esconde a API key)
```

## Limitações conhecidas

- O tier gratuito da NVIDIA tem limite de ~40 requisições/minuto e um saldo de
  créditos iniciais — suficiente para uso pessoal, não para produção com muitos
  usuários.
- `localStorage` é por navegador/dispositivo. Sem um backend com login, os dados
  não sincronizam sozinhos entre celular e computador — use exportar/importar
  enquanto isso não existir.
