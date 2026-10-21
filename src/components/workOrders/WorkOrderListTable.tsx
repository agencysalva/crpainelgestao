import React from 'react';
import { WorkOrder, Customer, Technician } from '../../types';
import { getWorkOrderStatusStyle } from '../../constants/workOrderConstants';
import { formatCurrencyBRL, formatDatePTBR } from '../../utils/formatters';
import { Eye, Printer, MessageSquare, Trash2, Clock, User, ChevronRight } from 'lucide-react';

interface WorkOrderListTableProps {
  workOrders: WorkOrder[];
  customers: Customer[];
  technicians: Technician[];
  onSelectWorkOrder: (wo: WorkOrder) => void;
  onOpenPrintModal: (wo: WorkOrder) => void;
  onOpenWhatsApp?: (payload: { customer?: Customer; workOrder?: WorkOrder }) => void;
  onDeleteWorkOrder?: (wo: WorkOrder) => void;
  canDelete?: boolean;
}

export const WorkOrderListTable: React.FC<WorkOrderListTableProps> = ({
  workOrders,
  customers,
  technicians,
  onSelectWorkOrder,
  onOpenPrintModal,
  onOpenWhatsApp,
  onDeleteWorkOrder,
  canDelete = false,
}) => {
  if (workOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
        <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <h3 className="text-base font-bold text-slate-800">Nenhuma ordem de serviço encontrada</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Tente ajustar os filtros ou a busca para localizar os chamados desejados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Código</th>
              <th className="py-3.5 px-4">Cliente / Endereço</th>
              <th className="py-3.5 px-4">Técnico</th>
              <th className="py-3.5 px-4">Agendamento</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Valor</th>
              <th className="py-3.5 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workOrders.map((wo) => {
              const cust = customers.find((c) => c.id === wo.customerId);
              const tech = technicians.find((t) => t.id === wo.technicianId);
              const statusStyle = getWorkOrderStatusStyle(wo.status);

              return (
                <tr
                  key={wo.id}
                  onClick={() => onSelectWorkOrder(wo)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">{wo.code}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{cust?.name || wo.customerName || 'Cliente'}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                      {cust ? `${cust.street}, ${cust.number} - ${cust.neighborhood}` : (wo.locationAddress || 'Caxias do Sul - RS')}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {tech ? (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {tech.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Não atribuído</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div>{formatDatePTBR(wo.scheduledDate)}</div>
                    <div className="text-[11px] text-slate-400">{wo.scheduledTime || '09:00'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${statusStyle.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColorClass}`} />
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatCurrencyBRL(wo.value)}
                  </td>
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectWorkOrder(wo)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Ver detalhes da OS"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenPrintModal(wo)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Imprimir / Gerar PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {onOpenWhatsApp && (
                        <button
                          type="button"
                          onClick={() => onOpenWhatsApp({ customer: cust, workOrder: wo })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && onDeleteWorkOrder && (
                        <button
                          type="button"
                          onClick={() => onDeleteWorkOrder(wo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir OS"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="lg:hidden divide-y divide-slate-100">
        {workOrders.map((wo) => {
          const cust = customers.find((c) => c.id === wo.customerId);
          const statusStyle = getWorkOrderStatusStyle(wo.status);

          return (
            <div
              key={wo.id}
              onClick={() => onSelectWorkOrder(wo)}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">{wo.code}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${statusStyle.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColorClass}`} />
                  {statusStyle.label}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{cust?.name || wo.customerName || 'Cliente'}</h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {wo.problemDescription || 'Atendimento técnico geral'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                <span className="text-slate-500">
                  {formatDatePTBR(wo.scheduledDate)} • {wo.scheduledTime || '09:00'}
                </span>
                <span className="font-bold text-sm text-slate-900">{formatCurrencyBRL(wo.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
