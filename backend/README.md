# NEXA - Backend API

Esta é a API oficial do NEXA, desenvolvida com [NestJS](https://nestjs.com/) e [Prisma](https://www.prisma.io/). O projeto serve como a espinha dorsal de dados para o painel administrativo, clientes e projetos.

## 🚀 Principais Funcionalidades

*   **Autenticação e Segurança**: JWT via Cookies HttpOnly (SSR-ready), senhas criptografadas e proteção de CPFs com `pgcrypto` nativo do PostgreSQL.
*   **Gerenciamento de Entidades**: Rotas validadas por DTOs (`class-validator`) cobrindo CRUD paginado de Clientes, Colaboradores, Projetos, Financeiro e Tickets de Suporte.
*   **Contratos e Arquivos**: Suporte nativo a assinaturas e upload de arquivos `.zip/pdf/png` rodando via requisições `Multipart` (FormData), com fallback em memória ou Supabase.
*   **Notificações em Tempo Real**: `Socket.io` implementado para despachar eventos (`notification.created`) e manter o front-end ciente de interações, como em respostas a chamados.
*   **Containers**: Preparado com um `Dockerfile` multi-stage para builds mínimos, somado a um pipeline CI no `.github/workflows/ci.yml`.

## 📦 Configuração e Execução

### Pré-requisitos
* Node.js (v18+)
* PostgreSQL (Local ou Nuvem)

### 1. Variáveis de Ambiente
Crie um arquivo `.env` baseado nas variáveis abaixo:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nexa"
JWT_SECRET="sua-chave-secreta-forte"
CPF_CRYPTO_KEY="sua-chave-pgcrypto-de-16-ou-32-chars"
API_BASE_URL="http://localhost:3001"
ALLOWED_ORIGINS="http://localhost:3000"
```

### 2. Instalação
```bash
npm install
```

### 3. Banco de Dados (Prisma)
Gere os artefatos e efetue o push do schema (e seed):
```bash
npx prisma generate
npx prisma db push
npm run seed:dev
```

### 4. Executando
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 🛠 Comandos Úteis
*   **Linter**: `npm run lint`
*   **Formatador**: `npm run format`

---
*Este projeto passou por auditorias de segurança mitigando IDOR, vazamento de memória por falta de paginação e mutações indevidas.*
