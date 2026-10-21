import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Trash2,
  Check,
  Shield,
  User as UserIcon,
  Phone,
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { compressAvatarImage } from '../../utils/imageProcessor';
import { getRoleBadge } from '../../utils/permissions';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateAvatar, updateProfile } = useAuth();
  const { showToast } = useNotification();

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(user?.avatar || null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !user) return null;

  const roleBadge = getRoleBadge(user.role);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      // Otimiza e comprime para avatar centralizado leve e nítido de 320x320 (~35KB)
      const base64 = await compressAvatarImage(file, 320, 0.82);
      setPreviewAvatar(base64);
      showToast('Foto carregada', 'Clique em Salvar Foto e Perfil para persistir suas alterações no Firebase.', 'info');
    } catch (err: any) {
      showToast('Erro ao processar imagem', err.message || 'Tente outra foto.', 'error');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (previewAvatar !== user.avatar) {
        await updateAvatar(previewAvatar || '');
      }
      if (name.trim() !== user.name || phone.trim() !== (user.phone || '')) {
        await updateProfile({
          name: name.trim() || user.name,
          phone: phone.trim(),
        });
      }
      showToast('Perfil Atualizado!', 'Sua foto e dados foram salvos com sucesso e persistidos na nuvem.', 'success');
      onClose();
    } catch (err: any) {
      showToast('Erro ao salvar perfil', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Meu Perfil de Usuário</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personalize sua foto de identificação e dados</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar Area */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700">
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                ) : previewAvatar ? (
                  <img src={previewAvatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-slate-400" />
                )}
              </div>

              {/* Botão de câmera sobreposto */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform active:scale-95 cursor-pointer ring-2 ring-white"
                title="Tirar foto com a câmera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Role Badge: estritamente Administrador ou Funcionário */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</h4>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadge.colorClass}`}>
                  <Shield className="w-3 h-3" />
                  Perfil: {roleBadge.label}
                </span>
              </div>
            </div>

            {/* Ações de Foto */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Tirar Foto</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Arquivo</span>
              </button>
              {previewAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition-colors cursor-pointer"
                  title="Remover foto de perfil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Nome de Exibição</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Telefone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(54) 99123-4567"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>E-mail / Usuário de Login</span>
              </label>
              <input
                type="text"
                disabled
                value={user.email || user.username || ''}
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">O login é gerenciado pelo Administrador do sistema.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || isProcessing}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Foto e Perfil</span>
              </>
            )}
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
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
    </div>
  );
};
