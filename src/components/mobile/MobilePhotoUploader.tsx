import React, { useRef } from 'react';
import { Camera, Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { usePhotoCapture } from '../../hooks/usePhotoCapture';

interface MobilePhotoUploaderProps {
  label: string;
  photoUrl?: string | null;
  onPhotoUploaded: (base64: string) => void;
  onPhotoRemoved: () => void;
  required?: boolean;
}

export const MobilePhotoUploader: React.FC<MobilePhotoUploaderProps> = ({
  label,
  photoUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  required = false,
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const { isProcessing, error, processFile } = usePhotoCapture();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64 = await processFile(file);
    if (base64) {
      onPhotoUploaded(base64);
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {photoUrl && (
          <button
            type="button"
            onClick={onPhotoRemoved}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remover</span>
          </button>
        )}
      </div>

      {photoUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 group">
          <img src={photoUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-full bg-white text-slate-800 hover:bg-slate-100 shadow-md cursor-pointer"
              title="Tirar outra foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onPhotoRemoved}
              className="p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer"
              title="Excluir foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center space-y-3">
          {isProcessing ? (
            <div className="py-4 flex flex-col items-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Otimizando foto da câmera...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 max-w-[200px]">
                Capture ao vivo no local ou escolha da galeria
              </p>
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Câmera</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
