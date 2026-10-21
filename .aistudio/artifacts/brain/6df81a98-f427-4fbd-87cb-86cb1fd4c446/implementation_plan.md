# Sincronização em Tempo Real Firebase, Correção Visual Dark Mode e Persistência de Perfil

Plano completo para corrigir a visibilidade e contraste dos valores e números no Dashboard em modo escuro, garantir a persistência imediata da foto de perfil no Firebase Firestore e estabelecer sincronização bidirecional em tempo real (onSnapshot) entre o funcionário e o painel do administrador.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> As decisões de produto e arquitetura foram alinhadas com as respostas do usuário:
> 
> - **Sincronização em Tempo Real**: Conexão direta com **Firebase Firestore (`onSnapshot`)**, garantindo que, assim que o funcionário concluir um atendimento no celular, o dashboard do administrador atualize instantaneamente sem necessidade de recarregar a página.
> - **Foto de Perfil do Usuário**: Compressão inteligente (max 320x320 com qualidade otimizada ~40KB) e persistência direta no documento Firestore (`app_data/cr_store`) e backend, eliminando perda de dados ao atualizar ou trocar de dispositivo.
> - **Identidade Visual no Modo Escuro**: Faturamento e métricas financeiras destacadas em **Verde Esmeralda Luminoso (`#10b981` / `#34d399`)**, números e contadores em **Branco Puro (`#ffffff` / `#f8fafc`)**, com superfícies de cartões executivas em ardósia escura (`#131f37`) e bordas nítidas de alto contraste (`#243553`).

---

## 1. Overview & Core Concept

- **O que faz**:
  1. **Visibilidade Impecável no Dark Mode**: Corrige o bug de sobreposição de estilos onde os números e valores em reais ficavam invisíveis no modo escuro (substituição de containers com fundo branco estático por superfícies adaptáveis e tipografia de alto contraste).
  2. **Persistência Total da Foto de Perfil**: Otimização do upload para gravar a imagem no estado global, localStorage, banco local e documento dedicado do Firebase Firestore.
  3. **Conexão Real-Time Funcionário ↔ Administrador**: Conexão de escuta em tempo real (`onSnapshot`) no cliente web do administrador e do funcionário, refletindo ordens concluídas, faturamento do dia e novos chamados imediatamente.
- **Público-Alvo**: Cristiano Ramos (Administrador Geral) e seus técnicos/funcionários operacionais, acessando tanto via computador (painel executivo) quanto via smartphone (PWA de campo).
- **Valor Principal**: Zero atrito operacional — o administrador tem visão ao vivo de toda a operação enquanto os técnicos em campo executam os serviços, com dados salvos na nuvem do Firebase com total segurança.

---

## 2. User Experience & Visual Design

### Fluxos Principais

1. **Visualização do Dashboard (Modo Escuro & Claro)**:
   - Cartão 1 (**Faturamento**): Valor em **Verde Esmeralda Luminoso (`text-emerald-400 dark:text-emerald-300`)** com badge e ícone iluminados, visível de qualquer distância e tamanho de tela.
   - Cartões 2, 3 e 4 (**Ordens Pendentes, Orçamentos e Concluídos**): Números grandes em **Branco Puro (`text-white`)** no modo escuro e cinza escuro executivo (`text-slate-900`) no modo claro, com tipografia tabular (`tabular-nums`) alinhada.
   - Gráficos e Tabelas: Fundo adaptativo em ardósia profunda (`#131f37`), textos de apoio em `#94a3b8` e divisórias suaves em `#243553`.
2. **Atualização da Foto de Perfil**:
   - O usuário abre o modal de perfil (clicando no avatar do Header ou da tela do Funcionário).
   - Tira foto com a câmera ou escolhe da galeria.
   - O sistema comprime a imagem para tamanho leve e nítido.
   - Ao salvar, a foto atualiza no Header, Sidebar, Perfil, no banco do servidor e no Firestore.
3. **Ciclo em Tempo Real de Finalização de OS**:
   - O funcionário em campo avança a OS para `CONCLUIDA` e registra o recebimento.
   - O Firebase Firestore dispara o evento de sincronização.
   - No painel do administrador, o contador de *Serviços Concluídos* incrementa, o valor entra no *Faturamento Hoje* e o gráfico de pico reflete a alteração sem refresh manual.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Sincronização em Tempo Real via Firestore `onSnapshot`**:
  - *Abordagem*: Listener ativo no documento Firestore `app_data/cr_store` com sincronização bidirecional.
  - *Por que*: O Firestore notifica todos os clientes em menos de 100ms sem sobrecarregar o servidor com polling HTTP contínuo.
- **Decisão 2: Remoção de Seletores de Tag Globais em `index.css`**:
  - *Abordagem*: Remover `html.dark h3 { color: var(--color-text-main); }` que sobrescrevia as classes utilitárias do Tailwind (`text-emerald-400`, `text-orange-500`), garantindo que cores semânticas personalizadas sejam respeitadas.
- **Decisão 3: Padronização dos Cartões do Dashboard**:
  - *Abordagem*: Aplicar `bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800` em todos os cartões, métricas e seções do `DashboardPage.tsx` e `EmployeeDashboard.tsx`.

---

## 4. Technical Architecture & Data Strategy

### Diagrama do Fluxo em Tempo Real

```
┌─────────────────────────────────────────────────────────────┐
│                 Técnico em Campo (Mobile)                   │
│   Altera status da OS -> "CONCLUIDA" + Informa Recebimento   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Servidor Express & API REST (/api/*)           │
│   Valida transição de estado, atualiza caixa e auditoria    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Grava no banco da nuvem
┌─────────────────────────────────────────────────────────────┐
│             Firebase Cloud Firestore (Remoto)               │
│        Coleção: `app_data` / Documento: `cr_store`          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ onSnapshot (Tempo Real < 100ms)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Painel do Administrador (Desktop)             │
│   Recebe delta instantâneo -> Dashboard atualiza na hora    │
│   • Faturamento Hoje (+ R$)                                 │
│   • Serviços Concluídos (+ 1)                               │
│   • Tabela de Ordens Recentes                               │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Envolvidos

1. **`src/index.css`**:
   - Ajuste das variáveis e classes de superfície para garantir que as classes de cor do Tailwind (`text-emerald-400`, etc.) tenham precedência sobre tags nativas.
2. **`src/pages/DashboardPage.tsx`**:
   - Adequação completa dos 4 cartões de indicadores, do gráfico `InteractivePeakChart`, da tabela de ordens recentes e da barra de equipe para suportar o modo escuro com alto contraste.
   - Faturamento destacado em Verde Esmeralda Luminoso (`text-emerald-500 dark:text-emerald-400`).
3. **`src/components/profile/UserProfileModal.tsx` & `src/context/AuthContext.tsx`**:
   - Ajuste da compressão de imagem para 320x320 com qualidade otimizada para avatar.
   - Atualização síncrona do avatar em `AuthContext`, no `user`, no Header e em `users` de `App.tsx`.
4. **`src/lib/firebaseSync.ts` / `src/App.tsx`**:
   - Implementação do listener em tempo real `onSnapshot` do Firestore no documento `app_data/cr_store`.
   - Propagação instantânea para o estado global (`workOrders`, `customers`, `financialTransactions`, `users`).
