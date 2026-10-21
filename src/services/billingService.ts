import { PaymentMethod, WorkOrder, FinancialTransaction, QuoteItem } from '../types';
import { formatCurrencyBRL } from '../utils/formatters';

export interface BillingCalculationInput {
  baseValue: number;
  discountValue?: number;
  additionalValue?: number;
  metersCount?: number;
  pricePerMeter?: number;
  paymentMethod: PaymentMethod;
}

export interface BillingCalculationResult {
  baseValue: number;
  discountValue: number;
  additionalValue: number;
  finalValue: number;
  formattedFinalValue: string;
}

/**
 * Realiza o cálculo financeiro consolidado da Ordem de Serviço
 * Considera valor base, eventuais serviços por metragem, adicionais/upsell e descontos.
 */
export function calculateWorkOrderTotal(input: BillingCalculationInput): BillingCalculationResult {
  let base = Math.max(0, input.baseValue || 0);

  // Se houver cálculo por metragem no local (desentupimento por metro)
  if (input.metersCount && input.metersCount > 0 && input.pricePerMeter && input.pricePerMeter > 0) {
    base = input.metersCount * input.pricePerMeter;
  }

  const discount = Math.max(0, input.discountValue || 0);
  const additional = Math.max(0, input.additionalValue || 0);

  const finalVal = Math.max(0, base - discount + additional);

  return {
    baseValue: base,
    discountValue: discount,
    additionalValue: additional,
    finalValue: finalVal,
    formattedFinalValue: formatCurrencyBRL(finalVal),
  };
}

/**
 * Calcula o subtotal a partir de uma lista de itens de serviço
 */
export function calculateItemsSubtotal(items: QuoteItem[]): number {
  if (!items || !items.length) return 0;
  return items.reduce((acc, it) => acc + (Number(it.totalPrice) || (Number(it.quantity) * Number(it.unitPrice)) || 0), 0);
}

/**
 * Calcula comissão técnica com base no percentual acordado
 */
export function calculateCommission(totalValue: number, commissionPercent = 10): number {
  if (!totalValue || totalValue <= 0) return 0;
  return Number(((totalValue * commissionPercent) / 100).toFixed(2));
}

/**
 * Rótulo amigável para exibição da forma de pagamento
 */
export function formatPaymentMethodLabel(method?: PaymentMethod | string): string {
  switch (method) {
    case 'PIX':
      return 'PIX Instantâneo';
    case 'DINHEIRO':
      return 'Dinheiro em Espécie';
    case 'CARTAO_CREDITO':
      return 'Cartão de Crédito';
    case 'CARTAO_DEBITO':
      return 'Cartão de Débito';
    case 'BOLETO':
      return 'Boleto Bancário';
    case 'TRANSFERENCIA':
      return 'Transferência Bancária';
    case 'FATURADO':
      return 'Faturado / Boleto a Prazo';
    default:
      return method || 'PIX';
  }
}

/**
 * Verifica se a ordem de serviço já teve seu faturamento quitado
 */
export function isOrderFullySettled(workOrder: WorkOrder): boolean {
  return workOrder.paymentStatus === 'received' || workOrder.status === 'CONCLUIDA';
}

/**
 * Gera o payload padronizado da transação financeira de receita originada da OS
 */
export function createReceivableTransaction(
  workOrder: WorkOrder,
  customerName = 'Cliente'
): Omit<FinancialTransaction, 'id' | 'createdAt'> {
  return {
    type: 'receita',
    category: 'Serviço Prestado',
    description: `${workOrder.code} - ${workOrder.problemDescription || 'Serviço Técnico'} (${customerName})`,
    amount: Number(workOrder.value) || 0,
    date: workOrder.scheduledDate || new Date().toISOString().split('T')[0],
    paymentMethod: workOrder.paymentMethod || 'PIX',
    status: isOrderFullySettled(workOrder) ? 'pago' : 'pendente',
    workOrderId: workOrder.id,
    workOrderCode: workOrder.code,
  };
}
