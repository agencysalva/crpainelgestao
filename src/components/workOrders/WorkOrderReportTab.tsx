import React, { useState } from 'react';
import { WorkOrder, Customer } from '../../types';
import { FileText, Camera, ShieldCheck, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { generateWarrantyCertificatePDF } from '../../utils/warrantyPdfGenerator';

interface WorkOrderReportTabProps {
  workOrder: WorkOrder;
  customer?: Customer;
}

export const WorkOrderReportTab: React.FC<WorkOrderReportTabProps> = ({
  workOrder,
  customer,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatingWarranty, setGeneratingWarranty] = useState(false);

  const report = workOrder.report;
  const beforePhotos = report?.beforePhotos || (workOrder.photoBefore ? [workOrder.photoBefore] : []);
  const afterPhotos = report?.afterPhotos || (workOrder.photoAfter ? [workOrder.photoAfter] : []);
  const signature = report?.customerSignature || workOrder.customerSignature;

  const handleDownloadWarranty = async () => {
    if (!customer) return;
    try {
      setGeneratingWarranty(true);
      await generateWarrantyCertificatePDF({
        workOrder,
        customer,
      });
    } catch (err) {
      console.error('Erro ao gerar certificado de garantia:', err);
    } finally {
      setGeneratingWarranty(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo Comparison Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-blue-600" />
          <span>Evidências Fotográficas do Serviço (Antes e Depois)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before Photos */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
              Antes do Atendimento
            </span>
            {beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {beforePhotos.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setPreviewImage(img)}
                    className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img src={img} alt={`Antes ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Nenhuma foto do início anexada.
              </div>
            )}
          </div>

          {/* After Photos */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
              Depois da Conclusão
            </span>
            {afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {afterPhotos.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setPreviewImage(img)}
                    className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img src={img} alt={`Depois ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Nenhuma foto da conclusão anexada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Technical Report & Text */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Laudo Técnico Operacional</span>
        </h4>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
          {report?.servicePerformed || workOrder.technicalReportText || (
            <span className="text-slate-400 italic">
              Nenhum laudo formal emitido ainda para esta ordem de serviço.
            </span>
          )}
        </div>
      </div>

      {/* Customer Signature & Warranty Certificate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2">Assinatura Digital do Cliente</h4>
          {signature ? (
            <div className="border border-slate-200 rounded-xl p-3 bg-white max-w-xs">
              <img src={signature} alt="Assinatura" className="max-h-20 mx-auto object-contain" />
              <p className="text-[10px] text-slate-400 text-center mt-1">
                Assinado digitalmente no dispositivo do técnico
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Assinatura pendente.</p>
          )}
        </div>

        {workOrder.status === 'CONCLUIDA' && customer && (
          <div className="flex flex-col justify-center items-start sm:items-end">
            <button
              type="button"
              disabled={generatingWarranty}
              onClick={handleDownloadWarranty}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{generatingWarranty ? 'Gerando...' : 'Emitir Certificado de Garantia (90 dias)'}</span>
            </button>
            <span className="text-[11px] text-slate-400 mt-1">Conforme Código de Defesa do Consumidor</span>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
