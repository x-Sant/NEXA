# Livro de Regras de Acesso - NEXA AI

Este documento estabelece as regras rígidas de segurança e de controle de acesso a dados (Role-Based Access Control - RBAC) que o **NEXA AI** (Assistente Inteligente da NEXA) deve seguir ao formular respostas para os usuários. 

Para evitar vazamentos de informações confidenciais corporativas, acadêmicas ou financeiras, o assistente filtra dinamicamente as informações do banco de dados antes de alimentar o contexto da inteligência artificial, de acordo com o nível de acesso da conta do usuário autenticado.

---

## Tabela Geral de Permissões de Acesso do NEXA AI

| Informação / Recurso | NÍVEL 3 (Admin) | PROFESSOR | NÍVEL 2 (Estagiário 2) | NÍVEL 1 (Estagiário 1) | CLIENTE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Financeiro Global** (Receitas, Despesas, Saldo Líquido) | **Sim** | Não | Não | Não | Não |
| **Orçamento de Projetos** (Valores confidenciais de contratos) | **Sim** | Não | Apenas dos próprios projetos | Não | Apenas do próprio projeto |
| **Projetos Alheios** (Projetos em que não está alocado) | **Sim** | **Sim** | Não | Não | Não |
| **Próprios Projetos** (Projetos em que está alocado/é dono) | **Sim** | **Sim** | **Sim** | **Sim** | **Sim** |
| **Métricas de Produtividade de Outros Colaboradores** | **Sim** | **Sim** | Não | Não | Não |
| **Próprias Métricas de Produtividade** | **Sim** | **Sim** | **Sim** | **Sim** | Não se aplica |
| **Lista Geral de Colaboradores e Níveis** | **Sim** | **Sim** | **Sim** | **Sim** | Não |

---

## Detalhamento das Regras por Perfil de Usuário

### 1. NÍVEL 3 (Administrador)
* **Perfil:** Diretores e gestores seniores da NEXA.
* **Escopo de Acesso:** **Irrestrito.**
* **Regras de Contexto no NEXA AI:**
  * Acesso total aos dados financeiros consolidados da empresa (faturamento, despesas de bolsas, saldo em caixa).
  * Acesso a todos os projetos (ativos, pausados, cancelados ou concluídos), incluindo prazos, clientes e orçamentos individuais.
  * Acesso a métricas de produtividade (`productivity`) e progresso (`progress`) de todos os estagiários da plataforma para fins de avaliação de desempenho.

### 2. PROFESSOR (Orientador/Mentor)
* **Perfil:** Professores e mentores acadêmicos da Empresa Júnior.
* **Escopo de Acesso:** **Acadêmico e Desempenho de Projetos.**
* **Regras de Contexto no NEXA AI:**
  * Acesso a todos os projetos cadastrados na plataforma para acompanhar o andamento técnico e o cumprimento de prazos.
  * Acesso a métricas de produtividade e progresso de todos os estagiários para fins de orientação e feedback pedagógico.
  * **Restrição Rígida:** Não tem acesso a dados financeiros consolidados da NEXA (total de receitas, despesas e saldo líquido) e os orçamentos dos projetos são omitidos ou ocultados para manter o sigilo comercial.

### 3. NÍVEL 2 (Estagiário Nível 2)
* **Perfil:** Estagiários seniores e líderes de projetos.
* **Escopo de Acesso:** **Colaborativo Geral com Restrição Financeira/Desempenho.**
* **Regras de Contexto no NEXA AI:**
  * Pode acessar o diretório de pessoas e visualizar a listagem geral de todos os colaboradores do sistema.
  * Pode ver detalhes técnicos e o **orçamento específico** dos projetos em que **está ativamente alocado** como membro.
  * Pode visualizar suas próprias métricas de produtividade e progresso.
  * **Restrição Rígida:** Não pode ver dados financeiros globais da NEXA, não pode visualizar o orçamento de projetos em que não participa e não tem acesso às métricas individuais de produtividade de outros estagiários.

### 4. NÍVEL 1 (Estagiário Nível 1)
* **Perfil:** Estagiários juniores em período de desenvolvimento.
* **Escopo de Acesso:** **Estritamente focado no próprio escopo de atuação, com acesso ao diretório de equipe.**
* **Regras de Contexto no NEXA AI:**
  * Pode acessar o diretório de pessoas e visualizar a listagem geral de todos os colaboradores do sistema.
  * Pode ver detalhes, prazos e status dos projetos nos quais **está ativamente alocado** como membro.
  * Pode visualizar as suas próprias métricas de produtividade e progresso nos projetos associados.
  * **Restrição Rígida:** Não tem acesso a projetos alheios, não pode visualizar orçamentos de nenhum projeto (mesmo os que participa) e não tem acesso a dados financeiros gerais ou métricas de desempenho individuais de outros estagiários.

### 5. CLIENTE (Cliente Parceiro)
* **Perfil:** Empresas contratantes e parceiras da NEXA.
* **Escopo de Acesso:** **Estrito à própria conta comercial.**
* **Regras de Contexto no NEXA AI:**
  * Pode ver apenas informações referentes aos **seus próprios projetos** (`client_id` associado ao seu ID de usuário).
  * Pode ver prazos, status e os valores financeiros faturados/orçamentos do **seu próprio contrato**.
  * Pode saber os nomes dos estagiários alocados no seu projeto.
  * **Restrição Rígida:** Proibido visualizar dados de outros clientes, métricas internas de produtividade individual dos estagiários (apenas progresso macro do projeto), dados financeiros gerais da NEXA ou listagens de membros que não pertencem ao escopo do seu projeto.
