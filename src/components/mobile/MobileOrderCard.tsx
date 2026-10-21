import React from 'react';
import { WorkOrder, Customer } from '../../types';
import { getWorkOrderStatusStyle } from '../../constants/workOrderConstants';
import { formatCurrencyBRL, formatDatePTBR } from '../../utils/formatters';
import { Clock, MapPin, ChevronRight, Phone, Car } from 'lucide-react';
import { AddressGpsLinks } from '../common/AddressGpsLinks';

interface MobileOrderCardProps {
  workOrder: WorkOrder;
  customer?: Customer;
  onClick: () => void;
  onCallCustomer?: () => void;
}

export const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  workOrder,
  customer,
  onClick,
  onCallCustomer,
}) => {
  const statusStyle = getWorkOrderStatusStyle(workOrder.status);
  const clientName = customer?.name || workOrder.customerName || 'Cliente';
  const phone = customer?.phone || customer?.whatsapp || workOrder.customerPhone || '';
  const address = customer 
    ? `${customer.street}, ${customer.number} - ${customer.neighborhood}` 
    : (workOrder.locationAddress || 'Endereço não informado');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all active:scale-[0.99] cursor-pointer space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">
            {workOrder.code}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusStyle.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColorClass}`} />
            {statusStyle.label}
          </span>
        </div>
        <span className="font-bold text-sm text-slate-900">
          {formatCurrencyBRL(workOrder.value)}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{clientName}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
          {workOrder.problemDescription || 'Manutenção técnica solicitada.'}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {formatDatePTBR(workOrder.scheduledDate)} às {workOrder.scheduledTime || '09:00'}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Ligar para cliente"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {customer && (
            <AddressGpsLinks
              address={`${address}, ${customer.city || 'Caxias do Sul'}`}
              className="scale-90 origin-right"
            />
          )}
        </div>
      </div>
    </div>
  );
};
