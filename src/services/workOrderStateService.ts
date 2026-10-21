import { WorkOrderStatus, UserRole, TechnicianStatus } from '../types';

/**
 * Mapeamento das transições de status válidas (Máquina de Estados Finitos - FSM)
 */
export const VALID_WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  ABERTA: ['AGENDADA', 'EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'CANCELADA'],
  AGENDADA: ['EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'AGUARDANDO', 'CANCELADA'],
  EM_DESLOCAMENTO: ['EM_ATENDIMENTO', 'AGUARDANDO', 'CANCELADA'],
  EM_ATENDIMENTO: ['AGUARDANDO', 'CONCLUIDA', 'CANCELADA'],
  AGUARDANDO: ['EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [], // Estado terminal por padrão
  CANCELADA: ['ABERTA'], // Permitir reabertura apenas por Administradores
};

/**
 * Títulos padronizados para cada evento de transição na timeline
 */
export const STATUS_TRANSITION_TITLES: Record<WorkOrderStatus, string> = {
  ABERTA: 'Chamado Aberto',
  AGENDADA: 'Atendimento Agendado',
  EM_DESLOCAMENTO: 'Técnico em Deslocamento',
  EM_ATENDIMENTO: 'Serviço em Andamento',
  AGUARDANDO: 'Aguardando Peças / Aprovação',
  CONCLUIDA: 'Atendimento Concluído com Sucesso',
  CANCELADA: 'Ordem de Serviço Cancelada',
};

/**
 * Determina se uma transição de status é permitida segundo a FSM e o papel do usuário
 */
export function canTransitionWorkOrder(
  currentStatus: WorkOrderStatus,
  targetStatus: WorkOrderStatus,
  userRole?: UserRole | string
): boolean {
  if (currentStatus === targetStatus) return true;

  // Administrador possui prerrogativa de reabertura ou correção emergencial
  const isAdmin = userRole === 'admin' || userRole === 'manager';
  if (isAdmin) {
    if (currentStatus === 'CONCLUIDA' && (targetStatus === 'EM_ATENDIMENTO' || targetStatus === 'AGUARDANDO')) {
      return true;
    }
    if (currentStatus === 'CANCELADA' && targetStatus === 'ABERTA') {
      return true;
    }
  } else {
    // Funcionários e técnicos não podem reabrir OS cancelada nem reabrir concluída
    if (currentStatus === 'CANCELADA' || currentStatus === 'CONCLUIDA') {
      return false;
    }
  }

  const allowedNextStates = VALID_WORK_ORDER_TRANSITIONS[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Retorna lista de ações de status disponíveis para a OS considerando o perfil
 */
export function getAvailableStatusActions(
  currentStatus: WorkOrderStatus,
  userRole?: UserRole | string
): WorkOrderStatus[] {
  const allowed = VALID_WORK_ORDER_TRANSITIONS[currentStatus] || [];
  const isAdmin = userRole === 'admin' || userRole === 'manager';

  if (!isAdmin) {
    // Técnicos não reabrem chamados cancelados
    return allowed.filter((status) => status !== 'ABERTA');
  }

  return allowed;
}

/**
 * Mapeia o status do técnico automaticamente com base no status da OS
 */
export function getTechnicianStatusForWorkOrder(
  orderStatus: WorkOrderStatus
): TechnicianStatus | null {
  switch (orderStatus) {
    case 'EM_DESLOCAMENTO':
      return 'Em deslocamento';
    case 'EM_ATENDIMENTO':
      return 'Em atendimento';
    case 'CONCLUIDA':
    case 'CANCELADA':
      return 'Disponível';
    default:
      return null;
  }
}

/**
 * Verifica se o status é terminal (bloqueia edições normais em campo)
 */
export function isTerminalStatus(status: WorkOrderStatus): boolean {
  return status === 'CONCLUIDA' || status === 'CANCELADA';
}

/**
 * Verifica se a OS exige quitação / baixa financeira no encerramento
 */
export function requiresPaymentSettlement(status: WorkOrderStatus): boolean {
  return status === 'CONCLUIDA';
}
