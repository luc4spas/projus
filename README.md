# ProJus - Sistema de Gestão Jurídica

Sistema completo para gestão de escritórios de advocacia: controle de clientes, processos, pastas digitais, prazos e tarefas (Kanban e calendário), financeiro integrado e gestão de equipe.

---

## 🛠️ Tecnologias

- **Framework:** [TanStack Start](https://tanstack.com/start) + [React](https://react.dev)
- **Roteamento & SSR:** [TanStack Router](https://tanstack.com/router)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com) + Radix UI
- **Backend / Database:** [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Storage, Auth)
- **Deploy:** [Netlify](https://www.netlify.com)

---

## 🚀 Como executar localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org) (v20 ou superior recomendado)
- npm ou pnpm

### 2. Instalação das dependências
```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-publica"
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sua-chave-publica"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role-admin"
```

### 4. Executando o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🌐 Deploy no Netlify

O projeto está preparado para deploy no Netlify utilizando o plugin `@netlify/vite-plugin-tanstack-start`.

### Passo a passo para o Deploy:

1. **Conecte o repositório no Netlify** (via GitHub, GitLab ou Netlify CLI).
2. O arquivo `netlify.toml` já contém as instruções de build:
   - **Build Command:** `npm run build`
   - **Publish directory:** `dist/client`
3. **Configure as Variáveis de Ambiente no painel do Netlify:**
   Acesse **Site configuration > Environment variables** e defina:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (usada pelas funções de administração de equipe no servidor)
4. Dispare o deploy.
