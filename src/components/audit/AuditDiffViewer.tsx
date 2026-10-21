import React from 'react';
import { ArrowRight, CheckCircle2, MinusCircle, AlertCircle } from 'lucide-react';

interface AuditDiffViewerProps {
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  title?: string;
}

export const AuditDiffViewer: React.FC<AuditDiffViewerProps> = ({
  previousState,
  newState,
  title = 'Comparador de Alterações (Diff)',
}) => {
  if (!previousState && !newState) {
    return null;
  }

  const prev = previousState || {};
  const current = newState || {};
  const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(current)]));

  const changedKeys = allKeys.filter((key) => {
    return JSON.stringify(prev[key]) !== JSON.stringify(current[key]);
  });

  if (changedKeys.length === 0) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center font-medium">
        Nenhuma alteração de campos detectada entre os estados.
      </div>
    );
  }

  const formatValue = (val: any): string => {
    if (val === undefined) return '<não definido>';
    if (val === null) return '<nulo>';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-xs font-mono border border-slate-800 space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 font-sans text-xs font-bold">
        <span>{title}</span>
        <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-amber-400">
          {changedKeys.length} campo(s) modificado(s)
        </span>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {changedKeys.map((key) => {
          const valBefore = prev[key];
          const valAfter = current[key];

          return (
            <div
              key={key}
              className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex flex-col gap-1"
            >
              <span className="text-amber-400 font-bold text-[11px] font-sans">
                {key}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-start gap-1 text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-900/40">
                  <MinusCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="break-all">{formatValue(valBefore)}</span>
                </div>
                <div className="flex items-start gap-1 text-emerald-400 bg-emerald-950/30 p-1.5 rounded border border-emerald-900/40">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="break-all">{formatValue(valAfter)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
