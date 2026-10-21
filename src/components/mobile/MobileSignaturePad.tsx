import React from 'react';
import { useSignatureCanvas } from '../../hooks/useSignatureCanvas';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface MobileSignaturePadProps {
  onSaveSignature: (signatureBase64: string) => void;
  onCancel?: () => void;
  title?: string;
}

export const MobileSignaturePad: React.FC<MobileSignaturePadProps> = ({
  onSaveSignature,
  onCancel,
  title = 'Assinatura Digital do Cliente',
}) => {
  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    getSignatureBase64,
    hasSignature,
  } = useSignatureCanvas();

  const handleSave = () => {
    const base64 = getSignatureBase64();
    if (base64) {
      onSaveSignature(base64);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 text-sm font-bold">
          <PenTool className="w-4 h-4 text-blue-600" />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={clearSignature}
          disabled={!hasSignature}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold disabled:opacity-30 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar</span>
        </button>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50">
        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-44 touch-none cursor-crosshair block"
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
            Assine com o dedo ou caneta touch aqui
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          disabled={!hasSignature}
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-40 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Confirmar Assinatura</span>
        </button>
      </div>
    </div>
  );
};
