import React, { useState } from 'react';
import { WorkOrder, Customer, CustomerLocation, Technician, ServiceItem, WorkOrderStatus, AuditLog } from '../../types';
import { 
  X, 
  Printer, 
  MessageSquare, 
  Trash2, 
  Car, 
  CheckCircle2, 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Shield, 
  FileText, 
  Activity, 
  ChevronRight,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { formatCurrencyBRL, formatDatePTBR } from '../../utils/formatters';
import { getWorkOrderStatusStyle } from '../../constants/workOrderConstants';
import { AddressGpsLinks } from '../common/AddressGpsLinks';
import { WorkOrderReportTab } from './WorkOrderReportTab';
import { WorkOrderDispatchPanel } from './WorkOrderDispatchPanel';
import { AuditTimeline } from '../audit/AuditTimeline';
import { AuditDiffViewer } from '../audit/AuditDiffViewer';
import { useAuth } from '../../context/AuthContext';

interface WorkOrderDetailDrawerProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
  customer?: Customer;
  location?: CustomerLocation;
  technicians: Technician[];
  services: ServiceItem[];
  auditLogs?: AuditLog[];
  onOpenPrintModal: (wo: WorkOrder) => void;
  onOpenWhatsApp?: (payload: { customer?: Customer; workOrder?: WorkOrder }) => void;
  onDeleteWorkOrder?: (wo: WorkOrder) => void;
  onUpdateStatus?: (wo: WorkOrder, nextStatus: WorkOrderStatus) => Promise<void>;
  onDispatchTechnician?: (technicianId: string, note?: string) => Promise<void>;
  canDelete?: boolean;
}

export const WorkOrderDetailDrawer: React.FC<WorkOrderDetailDrawerProps> = ({
  workOrder,
  onClose,
  customer,
  location,
  technicians,
  services,
  auditLogs = [],
  onOpenPrintModal,
  onOpenWhatsApp,
  onDeleteWorkOrder,
  onUpdateStatus,
  onDispatchTechnician,
  canDelete = false,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const [activeTab, setActiveTab] = useState<'details' | 'report' | 'audit'>('details');

  if (!workOrder) return null;

  const statusStyle = getWorkOrderStatusStyle(workOrder.status);
  const tech = technicians.find((t) => t.id === workOrder.technicianId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              OS {workOrder.code}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyle.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColorClass}`} />
              {statusStyle.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenPrintModal(workOrder)}
              title="Imprimir / Exportar PDF"
              className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={() => onOpenWhatsApp({ customer, workOrder })}
                title="Mensagem no WhatsApp"
                className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            {canDelete && onDeleteWorkOrder && (
              <button
                type="button"
                onClick={() => onDeleteWorkOrder(workOrder)}
                title="Excluir Chamado"
                className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Detalhes do Chamado</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Laudo & Evidências</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Auditoria & Logs</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Dispatch Component if needed */}
              {onDispatchTechnician && (
                <WorkOrderDispatchPanel
                  workOrder={workOrder}
                  technicians={technicians}
                  onDispatch={onDispatchTechnician}
                  onSendWhatsApp={(tech) => {
                    if (onOpenWhatsApp) onOpenWhatsApp({ customer, workOrder });
                  }}
                />
              )}

              {/* Client and Location Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Cliente & Endereço
                </span>
                <div className="text-sm font-extrabold text-slate-900">
                  {customer?.name || workOrder.customerName || 'Cliente não identificado'}
                </div>
                <div className="text-xs text-slate-600">
                  {customer?.cpfCnpj || customer?.document ? `CPF/CNPJ: ${customer.cpfCnpj || customer.document} • ` : ''}
                  Telefone: {customer?.phone || customer?.whatsapp || workOrder.customerPhone || 'Não informado'}
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <AddressGpsLinks
                    address={
                      customer
                        ? `${customer.street}, ${customer.number} - ${customer.neighborhood}, ${customer.city || 'Caxias do Sul'}`
                        : workOrder.locationAddress || 'Endereço não informado'
                    }
                  />
                </div>
              </div>

              {/* Service & Problem Details */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Descrição do Serviço Solicitado
                </span>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                  {workOrder.problemDescription || 'Sem observações adicionais.'}
                </div>
              </div>

              {/* Schedule, Technician & Values Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Agendamento
                  </span>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatDatePTBR(workOrder.scheduledDate)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Horário: {workOrder.scheduledTime || '09:00'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Técnico Designado
                  </span>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{tech?.name || 'Não designado'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {tech?.phone || 'Sem telefone'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Valor do Chamado
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {formatCurrencyBRL(workOrder.value)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Forma: {workOrder.paymentMethod || 'PIX'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Garantia do Serviço
                  </span>
                  <div className="text-xs font-bold text-slate-800">
                    {workOrder.warrantyTerms || '90 dias'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <WorkOrderReportTab workOrder={workOrder} customer={customer} />
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <AuditTimeline logs={auditLogs} entityCode={workOrder.code} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
