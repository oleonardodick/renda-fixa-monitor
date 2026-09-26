# Renda Fixa Monitor

Aplicação para acompanhamento e análise de investimentos de renda fixa, com foco no controle de aportes, rentabilidade e exposição ao Fundo Garantidor de Créditos (FGC).

O projeto é organizado como um monorepo e foi estruturado para permitir a evolução independente do frontend, backend e código compartilhado, mantendo contratos e regras de negócio centralizados quando necessário.

## Objetivo

O **Renda Fixa Monitor** tem como objetivo facilitar o acompanhamento dos investimentos de renda fixa e fornecer uma visão consolidada das informações relevantes para o investidor.

Entre os principais objetivos estão:

* Registrar investimentos e aportes;
* Acompanhar a evolução dos investimentos;
* Consolidar investimentos por instituição e conglomerado financeiro;
* Acompanhar a utilização dos limites do FGC;
* Projetar valores futuros considerando a rentabilidade dos investimentos;
* Centralizar regras, tipos e contratos compartilhados entre frontend e backend.

> O projeto possui caráter pessoal e de estudo.

## Tecnologias

### Frontend

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* Axios
* Zustand
* Lucide React
* Vitest

### Backend

* Node.js
* TypeScript
* Fastify
* Mongoose
* MongoDB
* Zod
* bcrypt
* Scalar
* Vitest

### Monorepo

* pnpm Workspaces
* TypeScript
* Pacote compartilhado entre aplicações

## Estrutura do projeto

```text
renda-fixa-monitor/
├── apps/
│   ├── frontend/
│   │   └── src/
│   └── backend/
│       └── src/
│
├── packages/
│   └── shared/
│       └── src/
│
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── tsconfig.json
```

### `apps/frontend`

Aplicação web responsável pela interface do sistema.

Contém:

* páginas;
* componentes;
* formulários;
* gerenciamento de estado;
* integração com a API;
* componentes do shadcn/ui;
* testes de interface.

Os componentes do shadcn/ui ficam inicialmente em:

```text
apps/frontend/src/components/ui/
```

Um pacote compartilhado de UI só deverá ser criado caso exista uma necessidade real de reutilização entre múltiplas aplicações.

### `apps/backend`

API responsável por:

* regras de negócio;
* autenticação;
* acesso ao banco de dados;
* APIs REST;
* validação dos dados;
* integração com serviços externos.

### `packages/shared`

Código compartilhado entre as aplicações.

Deve conter principalmente:

* schemas Zod;
* tipos TypeScript;
* constantes;
* contratos de API;
* estruturas que precisam ser conhecidas pelo frontend e backend.

Regras específicas de frontend ou backend não devem ser colocadas neste pacote.

## Requisitos

Antes de executar o projeto, certifique-se de possuir:

* Node.js;
* pnpm;
* MongoDB, quando necessário para executar o backend.

Verifique as versões instaladas:

```bash
node --version
pnpm --version
```

## Instalação

Clone o projeto e instale as dependências:

```bash
git clone <repository-url>
cd renda-fixa-monitor
pnpm install
```

## Desenvolvimento

Para iniciar frontend e backend simultaneamente:

```bash
pnpm dev
```

Para executar somente o frontend:

```bash
pnpm --filter frontend dev
```

Para executar somente o backend:

```bash
pnpm --filter backend dev
```

## Scripts

Os principais scripts disponíveis na raiz do projeto são:

### Desenvolvimento

```bash
pnpm dev
```

Inicia as aplicações de frontend e backend em paralelo.

### Build

```bash
pnpm build
```

Gera os builds das aplicações e do pacote compartilhado.

### Testes

```bash
pnpm test
```

Executa os testes automatizados do frontend e backend.

Para executar os testes de uma aplicação específica:

```bash
pnpm --filter frontend test
pnpm --filter backend test
```

### Type checking

```bash
pnpm typecheck
```

Executa a verificação de tipos TypeScript.

Também é possível verificar um workspace individual:

```bash
pnpm --filter frontend typecheck
pnpm --filter backend typecheck
pnpm --filter @renda-fixa-monitor/shared typecheck
```

## Variáveis de ambiente

As variáveis de ambiente específicas de cada aplicação devem permanecer dentro do respectivo workspace.

Exemplo:

```text
apps/
├── frontend/
│   └── .env
└── backend/
    └── .env
```

Arquivos contendo informações sensíveis não devem ser versionados.

Utilize os arquivos `.env.example` para documentar as variáveis necessárias sem incluir valores reais.

## Arquitetura

O projeto utiliza uma arquitetura de monorepo:

```text
                 ┌─────────────────┐
                 │    Frontend     │
                 │ React + Vite    │
                 └────────┬────────┘
                          │
                          │ HTTP
                          ▼
                 ┌─────────────────┐
                 │     Backend     │
                 │ Fastify + Node  │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │     MongoDB     │
                 └─────────────────┘

                 ┌─────────────────┐
                 │     Shared      │
                 │ Types + Schemas │
                 └─────────────────┘
                    ▲           ▲
                    │           │
                Frontend     Backend
```

O `shared` não representa uma camada de negócio. Ele existe para evitar duplicação de contratos e estruturas que precisam ser compartilhadas entre aplicações.

## Princípios de desenvolvimento

O projeto busca manter uma implementação simples e previsível.

### Separação de responsabilidades

Cada aplicação deve possuir responsabilidades bem definidas.

* Frontend: apresentação e interação com o usuário;
* Backend: regras de negócio e persistência;
* Shared: contratos e estruturas compartilhadas.

### Validação

Dados recebidos pela API devem ser validados utilizando schemas Zod.

Quando um contrato é compartilhado entre frontend e backend, o schema deve preferencialmente ser definido em `packages/shared`.

### Componentes

O frontend utiliza shadcn/ui como base para os componentes visuais.

Componentes específicos da aplicação devem ser criados fora de `components/ui` quando representarem uma composição ou regra própria da aplicação.

### Complexidade

Evitar abstrações prematuras.

Uma solução simples deve ser preferida quando não houver uma necessidade concreta de uma arquitetura mais complexa.

## Desenvolvimento com agentes de IA

O projeto foi estruturado para ser utilizado também com agentes de programação, como Cline, Cursor ou outros agentes compatíveis.

As regras de desenvolvimento devem ser mantidas no próprio repositório para que possam ser reutilizadas independentemente da ferramenta utilizada.

As regras devem definir principalmente:

* arquitetura;
* responsabilidades de cada workspace;
* padrões de código;
* convenções de commits;
* estratégia de testes;
* uso do `shared`;
* regras para frontend e backend;
* critérios para criação de novas abstrações.

O agente deve consultar essas regras antes de implementar novas funcionalidades.

## Fluxo recomendado para novas funcionalidades

Uma funcionalidade normalmente deve seguir o fluxo:

```text
Requisito
   ↓
Regra de negócio
   ↓
Contrato / Schema
```
