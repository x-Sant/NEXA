# NEXA - Frontend App

Este é o aplicativo Front-end do NEXA, desenvolvido com **Next.js 16** (App Router) e **React 19**. 
O sistema gerencia o Dashboard central, relatórios financeiros, suporte de tickets e comunicação por WebSockets.

## ✨ Principais Funcionalidades

*   **Design State-of-the-art**: Interface rica em *Glassmorphism*, gradientes interativos, Skeletons e modais animados via `framer-motion` e TailwindCSS.
*   **Gestão de Estado Robusta**: Uso do `Zustand` para cache local (Projetos, Tickets, Finanças e Usuários) minimizando acessos à API, incluindo *loading states* globais.
*   **Tempo Real**: WebSockets nativos (`socket.io-client`) garantindo notificações (Toasts) quando interações externas ocorrem.
*   **Busca Global Inteligente**: *Typeahead/Dropdown* que consulta localmente as *Stores* e despacha o usuário para a página de destino instantaneamente.
*   **Relatórios Locais**: Exportação de PDFs (`jspdf`) e CSV gerados diretamente no navegador (client-side) para a aba Financeira.
*   **Segurança SSR**: Todas as rotas de Dashboard interceptadas por `middleware.ts` checando o cookie HttpOnly `nexa-token`.
*   **Otimização para Produção**: Configurado com *Standalone Build* no `next.config.ts`, gerando containers Docker ultraleves.

## 📦 Configuração e Execução

### Pré-requisitos
* Node.js (v18+)

### 1. Variáveis de Ambiente
Crie um arquivo `.env` baseado nas variáveis abaixo:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 2. Instalação
```bash
npm install
```

### 3. Executando
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run start
```

## 🛠 Bibliotecas Chave
*   **Recharts**: Gráficos financeiros.
*   **Zod** & **React Hook Form**: Validação de formulários e schemas.
*   **Zustand**: Gestão global de estado (Stores).
*   **Socket.io-client**: Conexão com o Gateway do backend.
*   **jsPDF** e **jsPDF-AutoTable**: Geração de PDFs nativos.

---
*A interface foi auditada e reestruturada para prevenir bugs de FC-01 a FC-04 (mutações diretas), garantindo renderizações estáveis de dados assíncronos.*
