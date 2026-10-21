export interface FinancialSyncInput {
  workOrder: any;
  customerName?: string;
  paymentMethod?: string;
  isPaid?: boolean;
}

export function syncWorkOrderFinancialTransaction(db: any, input: FinancialSyncInput) {
  const { workOrder, customerName = "Cliente", paymentMethod, isPaid } = input;
  const woValue = Number(workOrder.value) || 0;

  if (woValue <= 0) return null;

  const existingTx = db.financialTransactions?.find((tx: any) => tx.workOrderId === workOrder.id);
  const statusToSet = isPaid || workOrder.paymentStatus === 'received' || workOrder.status === 'CONCLUIDA' ? 'pago' : 'pendente';
  const methodToSet = paymentMethod || workOrder.paymentMethod || 'PIX';

  if (existingTx) {
    existingTx.amount = woValue;
    existingTx.paymentMethod = methodToSet;
    existingTx.status = statusToSet;
    return existingTx;
  }

  const newTx = {
    id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: "receita",
    category: "Serviço Prestado",
    description: `${workOrder.code} - ${workOrder.problemDescription || "Serviço Concluído"} (${customerName})`,
    amount: woValue,
    date: workOrder.scheduledDate || new Date().toISOString().split("T")[0],
    paymentMethod: methodToSet,
    status: statusToSet,
    workOrderId: workOrder.id,
    workOrderCode: workOrder.code,
    createdAt: new Date().toISOString()
  };

  if (!db.financialTransactions) {
    db.financialTransactions = [];
  }
  db.financialTransactions.unshift(newTx);
  return newTx;
}
