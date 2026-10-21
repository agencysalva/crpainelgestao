export const VALID_WORK_ORDER_TRANSITIONS: Record<string, string[]> = {
  ABERTA: ['AGENDADA', 'EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'CANCELADA'],
  AGENDADA: ['EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'AGUARDANDO', 'CANCELADA'],
  EM_DESLOCAMENTO: ['EM_ATENDIMENTO', 'AGUARDANDO', 'CANCELADA'],
  EM_ATENDIMENTO: ['AGUARDANDO', 'CONCLUIDA', 'CANCELADA'],
  AGUARDANDO: ['EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [],
  CANCELADA: ['ABERTA'],
};

export const STATUS_TITLES: Record<string, string> = {
  ABERTA: "Chamado Aberto",
  AGENDADA: "Atendimento Agendado",
  EM_DESLOCAMENTO: "Técnico em Deslocamento",
  EM_ATENDIMENTO: "Serviço em Andamento",
  AGUARDANDO: "Aguardando Peças / Aprovação",
  CONCLUIDA: "Atendimento Concluído com Sucesso",
  CANCELADA: "Ordem de Serviço Cancelada"
};

export function validateStateTransition(
  currentStatus: string,
  targetStatus: string,
  userRole?: string
): { isValid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { isValid: true };
  }

  const isAdmin = userRole === 'admin' || userRole === 'manager';

  if (!isAdmin) {
    if (currentStatus === 'CONCLUIDA') {
      return { isValid: false, error: "Ordens de serviço concluídas não podem ser alteradas por técnicos." };
    }
    if (currentStatus === 'CANCELADA') {
      return { isValid: false, error: "Ordens de serviço canceladas só podem ser reabertas pelo Administrador." };
    }
  }

  const allowed = VALID_WORK_ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus) && !isAdmin) {
    return {
      isValid: false,
      error: `Transição inválida: não é permitido alterar direto de '${currentStatus}' para '${targetStatus}'.`
    };
  }

  return { isValid: true };
}

export function mapTechnicianStatusFromOrder(targetStatus: string): string | null {
  switch (targetStatus) {
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
