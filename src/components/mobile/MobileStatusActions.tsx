import React from 'react';
import { WorkOrderStatus } from '../../types';
import { Car, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getAvailableStatusActions } from '../../services/workOrderStateService';

interface MobileStatusActionsProps {
  currentStatus: WorkOrderStatus;
  onUpdateStatus: (newStatus: WorkOrderStatus) => void;
  loading?: boolean;
}

export const MobileStatusActions: React.FC<MobileStatusActionsProps> = ({
  currentStatus,
  onUpdateStatus,
  loading = false,
}) => {
  const availableNext = getAvailableStatusActions(currentStatus);

  if (availableNext.length === 0) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-semibold text-slate-500">
        Status Concluído (Sem ações pendentes)
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableNext.includes('EM_DESLOCAMENTO') && (
        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus('EM_DESLOCAMENTO')}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Car className="w-4 h-4" />
          <span>Iniciar Deslocamento</span>
        </button>
      )}

      {availableNext.includes('EM_ATENDIMENTO') && (
        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus('EM_ATENDIMENTO')}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>Cheguei / Iniciar</span>
        </button>
      )}

      {availableNext.includes('AGUARDANDO') && (
        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus('AGUARDANDO')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          <span>Aguardando Peça</span>
        </button>
      )}

      {availableNext.includes('CONCLUIDA') && (
        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus('CONCLUIDA')}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Finalizar Atendimento</span>
        </button>
      )}
    </div>
  );
};
