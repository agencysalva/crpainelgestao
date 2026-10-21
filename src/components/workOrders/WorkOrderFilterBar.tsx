import React from 'react';
import { Search, Plus, Filter, FileSpreadsheet, X } from 'lucide-react';
import { WorkOrderStatus } from '../../types';
import { WORK_ORDER_STATUS_CONFIG } from '../../constants/workOrderConstants';

interface WorkOrderFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onOpenCreateModal: () => void;
  onExportCsv?: () => void;
  totalOrdersCount: number;
  statusCounts?: Record<string, number>;
}

export const WorkOrderFilterBar: React.FC<WorkOrderFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onOpenCreateModal,
  onExportCsv,
  totalOrdersCount,
  statusCounts = {},
}) => {
  const statusList: Array<{ key: string; label: string }> = [
    { key: 'TODOS', label: 'Todos os Chamados' },
    { key: 'ABERTA', label: 'Abertas' },
    { key: 'AGENDADA', label: 'Agendadas' },
    { key: 'EM_DESLOCAMENTO', label: 'Em Deslocamento' },
    { key: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
    { key: 'AGUARDANDO', label: 'Aguardando' },
    { key: 'CONCLUIDA', label: 'Concluídas' },
    { key: 'CANCELADA', label: 'Canceladas' },
  ];

  return (
    <div className="space-y-4">
      {/* Top search and Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código, cliente ou problema..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Exportar CSV de Ordens de Serviço"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ordem de Serviço</span>
          </button>
        </div>
      </div>

      {/* Status Filter Badges / Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {statusList.map((st) => {
          const isSelected = statusFilter === st.key;
          const count = st.key === 'TODOS' ? totalOrdersCount : statusCounts[st.key] || 0;

          return (
            <button
              key={st.key}
              type="button"
              onClick={() => onStatusChange(st.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
