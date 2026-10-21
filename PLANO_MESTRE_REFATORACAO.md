# PLANO MESTRE DE REFATORAÇÃO, ARQUITETURA E BLINDAGEM DE SEGURANÇA (APPSEC)
**Sistema:** Gestão de Ordens de Serviço e Chamados — Desentope Tudo / CR Serviços Gerais  
**Papel:** Engenheiro de Software Sênior, Arquiteto de Sistemas e Especialista em AppSec  
**Data:** 18 de Outubro de 2026  
**Status do Documento:** MESTRE / OFICIAL DE ENGENHARIA

---

## 1. DIAGNÓSTICO PROFUNDO DO CÓDIGO ATUAL

### 1.1. Inventário de Arquivos Críticos e Monólitos do Sistema

| Arquivo | Linhas | Principais Violações e Responsabilidades Misturadas |
|---|:---:|---|
| `server.ts` | **1.783** | **Backend Centralizado:** Concentra configuração Express, inicialização de IA (Gemini SDK), sincronização em tempo real com Firestore (`app_data/cr_store`), gravação de arquivos em disco (`data/database.json`), uploads estáticos de fotos, autenticação com senhas/tokens, cadastro de usuários, técnicos, clientes, locais, catálogo de serviços, ordens de serviço, orçamentos, faturamento financeiro e middleware Vite SPA. |
| `src/pages/UsersPage.tsx` | **1.172** | **Monólito de Gestão de Pessoas:** Concatena listagem de usuários, modal de criação de colaboradores, redefinição de senha, validação de regras de acesso (RBAC), alternância de status ativo/inativo, controle de avatar e auditoria manual em um único componente. |
| `src/pages/CustomersPage.tsx` | **981** | **Monólito de Clientes:** Mistura gerenciamento de clientes PF/PJ, múltiplos endereços/filiais, máscaras de input (CPF/CNPJ/Telefone), validação via CEP (ViaCEP) e histórico de chamados em um único arquivo de tela. |
| `src/pages/DashboardPage.tsx` | **908** | **Monólito de Métricas:** Concatena métricas financeiras, filtros temporais (hoje, 7d, 30d, mês), agregação de rentabilidade por categoria, ranking de técnicos e gráficos de picos operacionais. |
| `src/components/employee/EmployeeDashboard.tsx` | **857** | **Interface Mobile Operacional:** Concatena monitoramento de despacho com alarmes sonoros (`dispatchAudio`), ações de aceitar/rejeitar chamados em rota, cards operacionais de atendimento, reajuste de valores e navegação mobile. |
| `src/pages/SettingsPage.tsx` | **822** | **Monólito de Configurações:** Mistura dados cadastrais da empresa, chave PIX, termos de garantia técnica, backup/restauração e comando destrutivo de reset de dados. |
| `src/pages/LocationsPage.tsx` | **810** | **Monólito de Endereços/Filiais:** Cadastro e geolocalização de locais e filiais de atendimento com mapas integrados e visualização em lista. |
| `src/pages/QuotesPage.tsx` | **777** | **Monólito Comercial:** Gestão de orçamentos, seleção de itens do catálogo de serviços, cálculo de desconto, validade e conversão direta para Ordem de Serviço. |
| `src/components/technician/MobileTechnicianView.tsx` | **581** | **Interface de Campo:** Controle de fluxo do técnico, status da OS, cálculo de upsell/metragem no local, modal de encerramento com termos de garantia técnica, fotos antes/depois e captura de assinatura touch. |

---

### 1.2. Mapeamento de Funções e Lógicas Duplicadas (Violação DRY)

1. **Formatação de Moeda (BRL) e Valores Financeiros:**
   * Implementada de forma redundante através de `Intl.NumberFormat('pt-BR')`, `.toLocaleString('pt-BR')` ou concatenação manual `R$ ${val.toFixed(2)}`:
     * `src/components/employee/EmployeeDashboard.tsx` (linhas 130, 480)
     * `src/pages/QuotesPage.tsx` (linhas 150, 410)
     * `src/pages/FinancialPage.tsx` (linhas 85, 230)
     * `server.ts` (linhas 868, 1058, 1130, 1290)
     * *Solução:* Centralização estrita em `src/core/utils/currencyFormatter.ts` (`formatCurrencyBRL`).

2. **Formatação e Manipulação de Datas/Horas (PT-BR):**
   * Chamadas independentes a `.toLocaleDateString('pt-BR')`, `.toLocaleTimeString('pt-BR')` e formatações de fuso horário espalhadas em mais de 10 arquivos.
     * *Solução:* Centralização em `src/core/utils/dateFormatter.ts` (`formatDatePTBR`, `formatDateTimePTBR`).

3. **Mapeamento de Cores, Badges e Rótulos de Status de Chamados:**
   * Mapeamento de estilos dos status (`ABERTA`, `AGENDADA`, `EM_DESLOCAMENTO`, `EM_ATENDIMENTO`, `AGUARDANDO`, `CONCLUIDA`, `CANCELADA`) replicado em:
     * `src/components/employee/EmployeeDashboard.tsx`
     * `src/pages/SchedulePage.tsx`
     * `src/components/technician/MobileTechnicianView.tsx`
     * *Solução:* Unificação canônica em `src/core/constants/workOrderConstants.ts` (`WORK_ORDER_STATUS_CONFIG`, `getWorkOrderStatusStyle`).

4. **Tratamento de Telefones, Sanitização e Links de WhatsApp / GPS:**
   * Expressões regex `phone.replace(/\D/g, '')` e montagem de URLs `https://wa.me/55...` repetidas em múltiplos componentes.
     * *Solução:* Centralização em `src/core/utils/phoneFormatter.ts` e `src/components/common/AddressGpsLinks.tsx`.

5. **Captura, Compressão e Upload de Imagens:**
   * Leitura de arquivos via `FileReader`, conversão para Base64 e validação de tamanho de fotos de antes e depois.
     * *Solução:* Isolamento em `src/core/utils/imageProcessor.ts` e no hook `src/hooks/usePhotoCapture.ts`.

---

### 1.3. Brechas de Segurança e Fragilidades de Auditoria (AppSec)

1. **Ausência de Middleware Obrigatório em Rotas Administrativas:**
   * Endpoints sensíveis como exclusão de chamados (`DELETE /api/work-orders/:id`), cadastro e exclusão de usuários (`POST /api/users`, `DELETE /api/users/:id`), reset do sistema (`POST /api/system/reset`) e despesas financeiras (`POST /api/financial/expenses`) precisam de travas criptográficas de sessão (Bearer Token) e checagem de perfil (`requireAdmin`).
2. **Confiança Cega em Dados de Autoria Enviados no Body:**
   * Transições de status e logs de auditoria não devem aceitar cegamente `req.body.userName` e `req.body.userId`, pois isso permite falsificação de identidade (spoofing). A identidade deve ser extraída obrigatoriamente do token decodificado (`req.user.id`, `req.user.name`).
3. **Imutabilidade e Rastreabilidade da Auditoria:**
   * O motor de auditoria deve garantir retenção segura sem truncamentos agressivos, registrando sempre: `id`, `timestamp`, `userId`, `userName`, `userRole`, `action`, `entity`, `entityCode`, `description`, `previousState` e `newState` (*diff* comparativo).
4. **Vulnerabilidade de IDOR (Insecure Direct Object Reference) no Mobile:**
   * Um técnico em campo não pode ter permissão para alterar ordens de serviço designadas para outros técnicos, nem visualizar o balanço financeiro global da empresa.

---

## 2. NOVA ARQUITETURA E ÁRVORE DE DIRETÓRIOS PROPOSTA

A arquitetura adota o padrão **Modular Clean Architecture (SOLID)**, isolando domínio, serviços de negócio, componentes visuais atômicos e utilitários globais:

```
/
├── server/                               # BACKEND MODULARIZADO (Node/Express/TypeScript)
│   ├── config/                           # Constantes de ambiente, caminhos e regras
│   │   ├── env.ts
│   │   └── constants.ts
│   ├── db/                               # Persistência Atômica (Firestore + JSON Backup)
│   │   └── database.ts
│   ├── middlewares/                      # Interceptadores de Segurança & AppSec
│   │   ├── authMiddleware.ts             # Validação estrita de Bearer Token
│   │   └── rbacMiddleware.ts             # Travas de Permissão (requireAdmin, requireTechnicianOrAdmin)
│   ├── services/                         # Regras de Negócio e Casos de Uso
│   │   ├── auditService.ts               # Motor de Auditoria Imutável (Diff anterior vs novo)
│   │   ├── workOrderService.ts           # Máquina de estados da OS e cálculos
│   │   └── financialService.ts           # Baixas automáticas, faturamento e receitas
│   └── routes/                           # Roteamento seguro por recurso
│       ├── authRoutes.ts
│       ├── workOrderRoutes.ts
│       └── financialRoutes.ts
│
├── src/                                  # FRONTEND MODULARIZADO (React / Vite)
│   ├── core/                             # Fundação Compartilhada (Shared Core / DRY)
│   │   ├── constants/                    # Status de OS, prioridades, papéis, chaves
│   │   │   └── workOrderConstants.ts
│   │   ├── types/                        # Tipagens TypeScript centralizadas
│   │   └── utils/                        # Utilitários Compartilhados (DRY)
│   │       ├── currencyFormatter.ts      # Formatação BRL única
│   │       ├── dateFormatter.ts          # Formatação PT-BR única
│   │       ├── phoneFormatter.ts         # Sanitização e links de WhatsApp
│   │       └── imageProcessor.ts         # Redimensionamento e compressão de fotos da câmera
│   ├── services/                         # Camada de Integração de API & Regras de Negócio
│   │   ├── workOrderStateService.ts      # Máquina de estados e transições permitidas da OS
│   │   └── billingService.ts             # Fechamento de OS, formas de pagamento e garantias
│   ├── hooks/                            # Hooks Customizados de Estado e Lógica Reutilizável
│   │   ├── useWorkOrders.ts              # Gestão de estado, filtros e mutações de OS
│   │   ├── usePermissions.ts             # Hook de RBAC para renderização condicional segura
│   │   ├── useSignatureCanvas.ts         # Hook para desenho e captura de assinaturas touch
│   │   └── usePhotoCapture.ts            # Hook para controle de Câmera e Galeria
│   ├── components/                       # Componentes de UI Desacoplados
│   │   ├── audit/                        # Trilha de Auditoria e Comparador de Alterações
│   │   │   ├── AuditTimeline.tsx         # Rastreabilidade visual por chamado
│   │   │   └── AuditDiffViewer.tsx       # Comparador de estado anterior vs novo (Diff)
│   │   ├── workOrders/                   # Componentes Especialistas de Chamados (Admin)
│   │   │   ├── WorkOrderFilterBar.tsx    # Barra de busca e filtros rápidos
│   │   │   ├── WorkOrderListTable.tsx    # Tabela performática com ações contextuais
│   │   │   ├── WorkOrderDetailDrawer.tsx # Gaveta lateral com abas de detalhes, laudo e auditoria
│   │   │   ├── WorkOrderCreateModal.tsx  # Modal em 3 etapas de abertura de chamado
│   │   │   ├── WorkOrderDispatchPanel.tsx# Painel de despacho sonoro e designação de técnicos
│   │   │   └── WorkOrderReportTab.tsx    # Aba isolada de laudo, fotos antes/depois e garantia
│   │   └── mobile/                       # Componentes Especialistas do Técnico de Campo
│   │       ├── MobileOrderCard.tsx       # Card ultraleve de chamado com GPS e chamada direta
│   │       ├── MobileStatusActions.tsx   # Botões de ação rápida (Deslocamento, Iniciar, Concluir)
│   │       ├── MobilePhotoUploader.tsx   # Módulo isolado de Câmera e Galeria
│   │       └── MobileSignaturePad.tsx    # Pad otimizado para assinatura touch
│   └── pages/                            # Views Principais Limpas (Orquestradoras)
│       ├── WorkOrdersPage.tsx            # View Admin reduzida para ~280 linhas
│       └── DashboardPage.tsx             # View Dashboard modular
```

---

## 3. CRONOGRAMA DE EXECUÇÃO EM PLANOS DETALHADOS

A execução é estruturada em 6 planos atômicos e sequenciais:

---

### PLANO 1: Fundação, Constantes, Utilitários e Camada Compartilhada (DRY)
* **Objetivo:** Eliminar duplicações de código criando o módulo central `src/core/` para formatadores de moeda, datas, telefones, mapeamentos de status de OS e processador de fotos da câmera, sem alterar o comportamento visual existente.
* **Arquivos:**
  * Criados/Padronizados: `src/core/constants/workOrderConstants.ts`, `src/core/utils/currencyFormatter.ts`, `src/core/utils/dateFormatter.ts`, `src/core/utils/phoneFormatter.ts`, `src/core/utils/imageProcessor.ts`, `src/core/index.ts`.
  * Integrados: `src/pages/WorkOrdersPage.tsx`, `src/components/technician/MobileTechnicianView.tsx`, `src/components/employee/EmployeeDashboard.tsx`, `src/pages/FinancialPage.tsx`, `src/pages/QuotesPage.tsx`.
* **Passo a Passo Técnico:**
  1. Centralizar `formatCurrencyBRL` com locale `pt-BR` e fallback para valores nulos.
  2. Centralizar `formatDatePTBR` e `formatDateTimePTBR`.
  3. Mapear o enum `WorkOrderStatus` e configurações de badges (`label`, `badgeClass`, `dotColorClass`).
  4. Substituir formatações manuais nos componentes pelos novos utilitários.
* **Critério de Validação:**
  * Visual idêntico nas telas de exibição de valores, datas e badges de status.
  * `compile_applet` e `lint_applet` com 0 erros.

---

### PLANO 2: Blindagem de Segurança (RBAC) e Motor de Auditoria/Logs Imutável
* **Objetivo:** Implementar middleware de autenticação obrigatório no backend, travas de perfil (Admin vs Técnico) e transformar a auditoria em um motor confiável que rastreia: quem criou, quem assumiu/pegou, quem alterou status, quem reajustou valor e quem finalizou com diff de dados.
* **Arquivos:**
  * Backend: `server/middlewares/authMiddleware.ts`, `server/middlewares/rbacMiddleware.ts`, `server/services/auditService.ts`, `server.ts`.
  * Frontend: `src/hooks/usePermissions.ts`, `src/components/audit/AuditTimeline.tsx`, `src/components/audit/AuditDiffViewer.tsx`, `src/components/audit/index.ts`.
* **Regras de Segurança Aplicadas:**
  * Rejeição de requisições sem token válido (HTTP 401).
  * Bloqueio de técnicos tentando deletar OS, alterar usuários ou postar despesas financeiras restritas (HTTP 403).
  * Preenchimento do campo `userId` e `userName` da auditoria extraído diretamente do token da sessão, impedindo personificação (spoofing).
  * Comparador de estados (*diff*) registrando `previousState` vs `newState`.
* **Critério de Validação:**
  * Rotas protegidas respondem com 401/403 mediante requisições não autorizadas.
  * Trilha de auditoria gerada com autor, data/hora e campos alterados.

---

### PLANO 3: Refatoração da Camada de Negócios, Chamados e Faturamento (Core Services)
* **Objetivo:** Isolar as regras de negócio de transição de status da Ordem de Serviço, cálculo de comissão/faturamento e geração de recibos/garantia fora dos componentes de tela.
* **Arquivos:**
  * `src/services/workOrderStateService.ts` (valida transições permitidas no ciclo de vida da OS).
  * `src/services/billingService.ts` (cálculo de descontos, formas de pagamento, baixa financeira).
  * `src/hooks/useWorkOrders.ts` (gestão de estado e filtros de OS).
* **Passo a Passo Técnico:**
  1. Definir máquina de estados finitos (`canTransitionWorkOrder`, `getAvailableStatusActions`).
  2. Implementar `calculateWorkOrderTotals` e `validateWorkOrderPayload`.
  3. Desacoplar chamadas diretas de mutação das telas para os serviços dedicados.
* **Critério de Validação:**
  * Validação estrita do ciclo de vida da OS no backend e frontend.
  * Baixa financeira refletindo no saldo da empresa sem inconsistências.

---

### PLANO 4: Modularização da Visão do Administrador Geral
* **Objetivo:** Desmembrar o arquivo monolítico `src/pages/WorkOrdersPage.tsx` (que possuía 2.907 linhas) em componentes especialistas menores (<300 linhas cada), garantindo legibilidade, facilidade de manutenção e desacoplamento.
* **Arquivos Especialistas:**
  * `src/components/workOrders/WorkOrderFilterBar.tsx` (barra de busca e filtros de status).
  * `src/components/workOrders/WorkOrderListTable.tsx` (tabela responsiva de chamados).
  * `src/components/workOrders/WorkOrderDetailDrawer.tsx` (painel lateral com abas de detalhes, laudo e auditoria).
  * `src/components/workOrders/WorkOrderCreateModal.tsx` (modal em 3 etapas de abertura de chamado).
  * `src/components/workOrders/WorkOrderDispatchPanel.tsx` (despacho operacional e designação de técnicos).
  * `src/components/workOrders/WorkOrderReportTab.tsx` (laudo, evidências fotográficas e certificado de garantia).
  * `src/pages/WorkOrdersPage.tsx` (orquestrador reduzido para 280 linhas).
* **Critério de Validação:**
  * Todas as ações do administrador (criar, filtrar, despachar, alterar status, visualizar laudo, auditar e imprimir) funcionando perfeitamente.
  * Redução comprovada do tamanho do arquivo principal em mais de 90%.

---

### PLANO 5: Modularização e Otimização da Visão Mobile (Funcionário)
* **Objetivo:** Refatorar `src/components/technician/MobileTechnicianView.tsx` e `src/components/employee/EmployeeDashboard.tsx`, garantindo performance para dispositivos móveis, baixo consumo de memória, upload rápido de fotos da câmera com compressão e assinatura digital responsiva.
* **Arquivos Especialistas:**
  * `src/components/mobile/MobileOrderCard.tsx` (card leve com links GPS para Waze/Maps e chamada direta).
  * `src/components/mobile/MobileStatusActions.tsx` (botões de ação rápida para transição de status).
  * `src/components/mobile/MobilePhotoUploader.tsx` (módulo de câmera ao vivo e galeria com compressão).
  * `src/components/mobile/MobileSignaturePad.tsx` (pad touch para assinatura do cliente).
  * `src/hooks/useSignatureCanvas.ts` (hook para contexto 2D de desenho).
  * `src/hooks/usePhotoCapture.ts` (hook para processamento de imagens).
  * `src/components/technician/MobileTechnicianView.tsx` (view refatorada e desacoplada).
* **Critério de Validação:**
  * Captura de fotos e assinatura digital fluida em telas touch.
  * Bloqueio ativo de visualização de métricas e despesas confidenciais da empresa.

---

### PLANO 6: Limpeza Final (Dead Code), Padronização e Revisão Geral
* **Objetivo:** Purga de código morto, padronização de tratamento de erros com toasts informativos, validação de tipos TypeScript e teste do fluxo ponta a ponta.
* **Ações:**
  * Remoção de importações não utilizadas e variáveis órfãs.
  * Validação do fluxo completo: **Abertura de Chamado no Admin -> Notificação de Despacho -> Técnico assume no Mobile -> Inicia Deslocamento -> Chegada e Registro de Fotos/Laudo -> Coleta de Assinatura do Cliente -> Encerramento com Baixa Financeira -> Auditoria Registrada com Diff**.
* **Critério de Validação:**
  * `compile_applet` e `lint_applet` com 0 erros.
  * Servidor operacional com dev server ativo.
