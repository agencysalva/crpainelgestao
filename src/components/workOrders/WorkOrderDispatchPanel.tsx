import React, { useState } from 'react';
import { WorkOrder, Technician } from '../../types';
import { Bell, Send, CheckCircle2, MessageSquare, Volume2, Car, User } from 'lucide-react';

interface WorkOrderDispatchPanelProps {
  workOrder: WorkOrder;
  technicians: Technician[];
  onDispatch: (technicianId: string, audioNote?: string) => Promise<void>;
  onSendWhatsApp?: (tech: Technician) => void;
  loading?: boolean;
}

export const WorkOrderDispatchPanel: React.FC<WorkOrderDispatchPanelProps> = ({
  workOrder,
  technicians,
  onDispatch,
  onSendWhatsApp,
  loading = false,
}) => {
  const [selectedTechId, setSelectedTechId] = useState(workOrder.technicianId || '');
  const [dispatchNote, setDispatchNote] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const selectedTech = technicians.find((t) => t.id === selectedTechId);

  const handleConfirmDispatch = async () => {
    if (!selectedTechId) return;
    await onDispatch(selectedTechId, dispatchNote);
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
  };

  return (
    <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-blue-100">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wide">
          <Bell className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Painel de Despacho Operacional</span>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
          OS {workOrder.code}
        </span>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Designar / Despachar Técnico em Campo:
        </label>
        <select
          value={selectedTechId}
          onChange={(e) => setSelectedTechId(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
        >
          <option value="">-- Selecione o técnico responsável --</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name} ({tech.role || 'Técnico'}) - {tech.phone || 'Sem telefone'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Instruções ou Alerta de Despacho (Opcional):
        </label>
        <input
          type="text"
          value={dispatchNote}
          onChange={(e) => setDispatchNote(e.target.value)}
          placeholder="Ex: Prioridade alta, cliente solicitou chegar antes das 11h..."
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        {selectedTech && onSendWhatsApp && (
          <button
            type="button"
            onClick={() => onSendWhatsApp(selectedTech)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Avisar no WhatsApp</span>
          </button>
        )}

        <button
          type="button"
          disabled={!selectedTechId || loading}
          onClick={handleConfirmDispatch}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{loading ? 'Despachando...' : 'Confirmar Despacho'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Chamado despachado com sucesso para o técnico!</span>
        </div>
      )}
    </div>
  );
};
