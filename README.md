# RELEASE - ARGOS

Data: 12/04/2026  
Versão: 0.1.0

## Visão geral

O **ARGOS** é um sistema web para **gestão pericial e monitoramento de sinistros**.
A aplicação centraliza indicadores operacionais, orquestração do fluxo de sinistros, cadastros, rede credenciada e alertas de inteligência em uma interface única.

## O que o sistema faz

- Exibe **dashboard** com KPIs, gráficos de severidade, feed de alertas e tabela de sinistros recentes.
- Permite **orquestrar sinistros** por pipeline (visão operacional do fluxo).
- Oferece módulo de **cadastros** (clientes, usuários e veículos).
- Disponibiliza gestão da **rede credenciada** (oficinas, fornecedores e parceiros).
- Possui **central de alertas** com classificação, leitura e filtros.
- Inclui **configurações do sistema** (perfil, notificações, IA e aparência).

## Módulos e rotas principais

- `/` - Dashboard
- `/orquestracao` - Gestão de sinistros
- `/registros` - Cadastros e dados
- `/rede-credenciada` - Rede credenciada
- `/alertas` - Central de inteligência e alertas
- `/configuracoes` - Configurações do sistema
- `/perfil` - Meu perfil
- `/login` - Tela de login
- `/logout` - Saída da sessão

## Tecnologias utilizadas

### Base

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**

### UI e Design System

- **Tailwind CSS 4**
- **Radix UI** (componentes acessíveis)
- **shadcn/ui** (padrão de componentes)
- **Lucide React** (ícones)

### Formulários e validação

- **React Hook Form**
- **Zod**

### Gráficos e visualização

- **Recharts**

### Utilitários

- **date-fns**, **clsx**, **tailwind-merge**

## Pré-requisitos

- **Node.js** 20+
- **pnpm** (recomendado)

## Como abrir e executar o sistema (desenvolvimento)

1. Clonar o repositório:
   ```bash
   git clone https://github.com/nayaradellamura/web-argos.git
   cd web-argos
   ```
2. Instalar dependências:
   ```bash
   pnpm install
   ```
3. Rodar ambiente de desenvolvimento:
   ```bash
   pnpm dev
   ```
4. Abrir no navegador:
   - http://localhost:3000

## Como gerar build e executar em produção

1. Gerar build:
   ```bash
   pnpm build
   ```
2. Iniciar servidor de produção:
   ```bash
   pnpm start
   ```

## Scripts disponíveis

- `pnpm dev` - Inicia ambiente de desenvolvimento
- `pnpm build` - Gera build de produção
- `pnpm start` - Inicia aplicação em modo produção
- `pnpm lint` - Executa análise de lint

## Estrutura resumida do projeto

- `app/` - Rotas e páginas (App Router)
- `components/` - Componentes de layout, domínio e UI
- `lib/` - Utilitários compartilhados
- `hooks/` - Hooks reutilizáveis
- `public/` - Arquivos estáticos
- `styles/` - Estilos globais

## Observações de release

- Projeto inicial.
- Aplicação preparada para evolução incremental por módulos.
- Analytics da Vercel ativado apenas em ambiente de produção.
