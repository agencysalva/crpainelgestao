import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  PenTool,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  User,
  DollarSign,
  ArrowLeft,
  Upload,
  RefreshCw,
  Calendar,
  Shield,
  FileText,
  Plus,
  X
} from 'lucide-react';
import { WorkOrder, Customer, Technician, ServiceItem, CompanySettings, WorkOrderStatus } from '../../types';
import { api } from '../../lib/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { AddressGpsLinks } from '../common/AddressGpsLinks';
import { UserProfileModal } from '../profile/UserProfileModal';
import { SpontaneousWorkOrderModal } from './SpontaneousWorkOrderModal';
import { formatCurrencyBRL, formatDatePTBR } from '../../utils/formatters';
import { getWorkOrderStatusStyle } from '../../constants/workOrderConstants';
import { 
  MobileOrderCard, 
  MobileStatusActions, 
  MobilePhotoUploader, 
  MobileSignaturePad 
} from '../mobile';

interface MobileTechnicianViewProps {
  workOrders: WorkOrder[];
  customers: Customer[];
  technicians: Technician[];
  services: ServiceItem[];
  settings: CompanySettings;
  onRefresh: () => void;
  onOpenWhatsApp: (payload: { phone?: string; customer?: Customer; workOrder?: WorkOrder }) => void;
  onExitMobileMode?: () => void;
}

export const MobileTechnicianView: React.FC<MobileTechnicianViewProps> = ({
  workOrders,
  customers,
  technicians,
  services,
  settings,
  onRefresh,
  onOpenWhatsApp,
  onExitMobileMode,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('in_progress');
  const [actionLoading, setActionLoading] = useState(false);

  // Spontaneous modal state (Fim do Caderno)
  const [spontaneousModalOpen, setSpontaneousModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Price editing modal state
  const [editingPriceModalOpen, setEditingPriceModalOpen] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editPriceReason, setEditPriceReason] = useState('');

  // Completion modal state & warranty terms
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [technicalReport, setTechnicalReport] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [finalServiceValue, setFinalServiceValue] = useState('');
  const [warrantyDays, setWarrantyDays] = useState('90 dias');
  const [warrantyCovered, setWarrantyCovered] = useState(
    'Desobstrução e fluxo normalizado no ponto trabalhado. Mão de obra técnica da CR Serviços Gerais.'
  );
  const [warrantyNotCovered, setWarrantyNotCovered] = useState(
    'Mau uso (descarte de papel higiênico, gordura sólida, absorventes após a entrega), quebras estruturais e químicos corrosivos.'
  );
  const [warrantyExclusionReason, setWarrantyExclusionReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);

  // Filter work orders for this technician if technician role
  const currentTech = technicians.find((t) => t.email === user?.email || t.name === user?.name) || technicians[0];
  const myWorkOrders = user?.role === 'technician' && currentTech
    ? workOrders.filter((w) => w.technicianId === currentTech.id)
    : workOrders;

  const inProgressWOs = myWorkOrders.filter(
    (w) => w.status === 'EM_DESLOCAMENTO' || w.status === 'EM_ATENDIMENTO'
  );
  const pendingWOs = myWorkOrders.filter(
    (w) => w.status === 'AGENDADA' || w.status === 'ABERTA' || w.status === 'AGUARDANDO'
  );
  const completedWOs = myWorkOrders.filter((w) => w.status === 'CONCLUIDA');

  const displayedWOs =
    activeTab === 'in_progress'
      ? inProgressWOs
      : activeTab === 'pending'
      ? pendingWOs
      : completedWOs;

  // Sync selected work order
  useEffect(() => {
    if (selectedWO) {
      const fresh = workOrders.find((w) => w.id === selectedWO.id);
      if (
        fresh &&
        (fresh.status !== selectedWO.status ||
          fresh.updatedAt !== selectedWO.updatedAt ||
          fresh.value !== selectedWO.value)
      ) {
        setSelectedWO(fresh);
      }
    }
  }, [workOrders, selectedWO]);

  useEffect(() => {
    if (selectedWO) {
      setFinalServiceValue(String(selectedWO.value));
      setEditPriceValue(String(selectedWO.value));
      setEditPriceReason(selectedWO.customPriceReason || '');
      setWarrantyDays(selectedWO.report?.warranty || settings.warrantyDefault || '90 dias');
    }
  }, [selectedWO?.id, selectedWO?.value, settings.warrantyDefault]);

  const handleUpdateStatus = async (wo: WorkOrder, nextStatus: WorkOrderStatus, note?: string) => {
    if (nextStatus === 'CONCLUIDA') {
      setSelectedWO(wo);
      setCompletionModalOpen(true);
      return;
    }

    try {
      setActionLoading(true);
      await api.updateWorkOrderStatus(wo.id, {
        status: nextStatus,
        note: note || `Atualizado pelo técnico em campo: ${user?.name || 'Técnico'}`,
        userName: user?.name || 'Técnico',
      });
      showToast(`Status atualizado para ${nextStatus}!`);
      onRefresh();
      if (selectedWO?.id === wo.id) {
        setSelectedWO((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err: any) {
      showToast('Erro ao atualizar status', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEditedPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;

    const numVal = parseFloat(editPriceValue.replace(',', '.')) || 0;
    if (numVal <= 0) {
      showToast('Valor inválido', 'Informe um valor maior que zero.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await api.updateWorkOrder(selectedWO.id, {
        value: numVal,
        customPriceReason: editPriceReason.trim() || 'Preço reajustado pelo técnico no local (metragem/upsell)',
      });

      setSelectedWO(updated);
      showToast('Valor atualizado com sucesso!', `Novo valor de ${formatCurrencyBRL(numVal)} registrado.`, 'success');
      setEditingPriceModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao atualizar valor', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishWorkOrder = async () => {
    if (!selectedWO) return;
    const currentCustomer = customers.find((c) => c.id === selectedWO.customerId);
    try {
      setActionLoading(true);
      const numFinalVal = parseFloat(finalServiceValue.replace(',', '.')) || selectedWO.value;

      if (numFinalVal !== selectedWO.value) {
        await api.updateWorkOrder(selectedWO.id, {
          value: numFinalVal,
          customPriceReason: 'Valor final ajustado no encerramento do serviço',
        });
      }

      await api.updateWorkOrderReport(selectedWO.id, {
        problemFound: selectedWO.problemDescription || 'Manutenção técnica especializada',
        servicePerformed: technicalReport || 'Serviço executado com sucesso e testado perante o cliente.',
        materialsUsed: partsUsed || 'Nenhum material adicional consumido',
        result: 'Operação 100% normalizada e verificada',
        warranty: warrantyDays || settings.warrantyDefault || '90 dias',
        warrantyCovered,
        warrantyNotCovered,
        warrantyExclusionsReason: warrantyExclusionReason,
        afterPhotos: uploadedPhotos,
        customerSignature: signatureBase64 || undefined,
        clientSigned: Boolean(signatureBase64),
        clientSignatureName: currentCustomer?.name || 'Cliente',
        clientSignatureDate: new Date().toLocaleDateString('pt-BR'),
      });

      await api.updateWorkOrderStatus(selectedWO.id, {
        status: 'CONCLUIDA',
        note: `Finalizado por ${user?.name || 'Técnico'} em campo com termo de garantia técnica e recibo.`,
        userName: user?.name || 'Técnico',
      });

      showToast('Atendimento Finalizado com Sucesso!', 'Garantia e recibo gerados.', 'success');
      setCompletionModalOpen(false);
      setSelectedWO(null);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao finalizar serviço', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const currentCustomer = selectedWO ? customers.find((c) => c.id === selectedWO.customerId) : undefined;

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center group cursor-pointer"
              title="Toque para alterar sua foto de perfil"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.slice(0, 2).toUpperCase() || 'CR'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
            <div onClick={() => setProfileModalOpen(true)} className="cursor-pointer">
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
                Painel do Funcionário
              </h1>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>Olá, {user?.name || 'Funcionário'}</span>
                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1 rounded">Foto</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpontaneousModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Chamado</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('in_progress');
              setSelectedWO(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'in_progress'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Em Rota ({inProgressWOs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('pending');
              setSelectedWO(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({pendingWOs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('completed');
              setSelectedWO(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Concluídos ({completedWOs.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {selectedWO ? (
          /* Selected Work Order Detailed View */
          <div className="space-y-4 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => setSelectedWO(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para meus chamados</span>
            </button>

            {/* Main Active Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-slate-900">
                  {selectedWO.code}
                </span>
                <span className="font-extrabold text-base text-blue-600">
                  {formatCurrencyBRL(selectedWO.value)}
                </span>
              </div>

              {/* Status Action Buttons */}
              <MobileStatusActions
                currentStatus={selectedWO.status}
                onUpdateStatus={(newStatus) => handleUpdateStatus(selectedWO, newStatus)}
                loading={actionLoading}
              />

              {/* Client & GPS Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-extrabold text-slate-900 text-sm">
                  {currentCustomer?.name || selectedWO.customerName}
                </div>
                <div className="text-slate-600">
                  Telefone: {currentCustomer?.phone || currentCustomer?.whatsapp || selectedWO.customerPhone || 'Não informado'}
                </div>
                <AddressGpsLinks
                  address={
                    currentCustomer
                      ? `${currentCustomer.street}, ${currentCustomer.number} - ${currentCustomer.neighborhood}, ${currentCustomer.city || 'Caxias do Sul'}`
                      : selectedWO.locationAddress || 'Endereço não informado'
                  }
                />
              </div>

              {/* Problem Description */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Problema Relatado
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedWO.problemDescription || 'Sem detalhes informados.'}
                </p>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPriceModalOpen(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ajustar Valor (Upsell)</span>
                </button>
                {onOpenWhatsApp && (
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp({ customer: currentCustomer, workOrder: selectedWO })}
                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List of Orders */
          <div className="space-y-3">
            {displayedWOs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Nenhum chamado nesta aba no momento.</p>
              </div>
            ) : (
              displayedWOs.map((wo) => {
                const cust = customers.find((c) => c.id === wo.customerId);
                return (
                  <MobileOrderCard
                    key={wo.id}
                    workOrder={wo}
                    customer={cust}
                    onClick={() => setSelectedWO(wo)}
                  />
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Completion Modal */}
      {completionModalOpen && selectedWO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Finalizar Atendimento — {selectedWO.code}
              </h3>
              <button
                type="button"
                onClick={() => setCompletionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Laudo Técnico do Serviço Executado:
                </label>
                <textarea
                  rows={2}
                  value={technicalReport}
                  onChange={(e) => setTechnicalReport(e.target.value)}
                  placeholder="Ex: Desobstrução realizada com sucesso com máquina K-50..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {/* Photo Upload with live camera/gallery */}
              <MobilePhotoUploader
                label="Foto de Evidência / Conclusão do Ponto"
                photoUrl={uploadedPhotos[0] || null}
                onPhotoUploaded={(b64) => setUploadedPhotos([b64])}
                onPhotoRemoved={() => setUploadedPhotos([])}
              />

              {/* Customer Digital Signature */}
              <MobileSignaturePad
                onSaveSignature={(b64) => {
                  setSignatureBase64(b64);
                  showToast('Assinatura capturada com sucesso!');
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Cobrado:</label>
                  <input
                    type="text"
                    value={finalServiceValue}
                    onChange={(e) => setFinalServiceValue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forma de Pagto:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleFinishWorkOrder}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                {actionLoading ? 'Gravando Encerramento...' : 'Emitir Recibo & Concluir Chamado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Editing Modal */}
      {editingPriceModalOpen && selectedWO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Ajustar Valor do Serviço
              </h3>
              <button
                type="button"
                onClick={() => setEditingPriceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPrice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Novo Valor (R$):</label>
                <input
                  type="text"
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo do Reajuste:</label>
                <input
                  type="text"
                  value={editPriceReason}
                  onChange={(e) => setEditPriceReason(e.target.value)}
                  placeholder="Ex: Metragem adicional ou serviço extra"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar Novo Valor'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spontaneous Order Modal */}
      {spontaneousModalOpen && (
        <SpontaneousWorkOrderModal
          isOpen={spontaneousModalOpen}
          onClose={() => setSpontaneousModalOpen(false)}
          technician={currentTech || null}
          technicianName={user?.name || 'Técnico'}
          customers={customers}
          services={services}
          onCreatedSuccess={() => {
            setSpontaneousModalOpen(false);
            onRefresh();
          }}
        />
      )}

      {/* Modal de Foto de Perfil do Funcionário */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};
