import React, { useState } from 'react';
import { Customer, CustomerLocation, Technician, ServiceItem, PaymentMethod } from '../../types';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  Wrench, 
  MapPin, 
  Shield, 
  Plus 
} from 'lucide-react';
import { formatCurrencyBRL } from '../../utils/formatters';

interface WorkOrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  customers: Customer[];
  locations?: CustomerLocation[];
  technicians: Technician[];
  services: ServiceItem[];
  loading?: boolean;
}

export const WorkOrderCreateModal: React.FC<WorkOrderCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  locations = [],
  technicians,
  services,
  loading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [problemDescription, setProblemDescription] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [warrantyTerms, setWarrantyTerms] = useState('Garantia legal de 90 dias para serviços executados.');

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerLocations = locations.filter((loc) => loc.customerId === customerId);

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentStep === 1) {
      if (!customerId) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!problemDescription.trim()) return;
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(serviceValue) || 0;
    await onSubmit({
      customerId,
      locationId: locationId || undefined,
      technicianId: technicianId || undefined,
      scheduledDate,
      scheduledTime,
      problemDescription: problemDescription.trim(),
      value: val,
      paymentMethod,
      warrantyTerms,
    });
    // Reset form
    setCurrentStep(1);
    setCustomerId('');
    setLocationId('');
    setTechnicianId('');
    setProblemDescription('');
    setServiceValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Nova Ordem de Serviço
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Etapa {currentStep} de 3 — {currentStep === 1 ? 'Identificação do Cliente' : currentStep === 2 ? 'Agendamento e Serviço' : 'Valores e Fechamento'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Selecione o Cliente *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setLocationId('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                  required
                >
                  <option value="">-- Escolha um cliente cadastrado --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.cpfCnpj || c.document ? `(${c.cpfCnpj || c.document})` : ''} - {c.city || 'Caxias do Sul'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs space-y-1 text-slate-600">
                  <div className="font-bold text-blue-900 text-sm">{selectedCustomer.name}</div>
                  <div>Telefone/WhatsApp: {selectedCustomer.phone || selectedCustomer.whatsapp || 'Não informado'}</div>
                  <div>Endereço Principal: {selectedCustomer.street}, {selectedCustomer.number} - {selectedCustomer.neighborhood}</div>
                </div>
              )}

              {customerLocations.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Local / Filial de Atendimento (Opcional):
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                  >
                    <option value="">-- Usar endereço padrão do cliente --</option>
                    {customerLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name || loc.title} ({loc.street}, {loc.number})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Data do Agendamento *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Horário Previsto *
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Técnico Responsável (Opcional no momento da abertura)
                </label>
                <select
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                >
                  <option value="">-- Deixar sem atribuição (Despachar depois) --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role || 'Técnico'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Service Selection */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  <span>Escolha Rápida do Tipo de Serviço:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Desentupimento hidrojateamento',
                    'Desentupimento de fossa',
                    'Desentupimento de esgoto',
                    'Elétrica e Manutenção',
                    'Serviços gerais',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProblemDescription(s)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                        problemDescription === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrição Detalhada do Problema / Chamado *
                </label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Informe o problema relatado pelo cliente, ponto de acesso ou referências..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Valor Estimado ou Acordado (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceValue}
                      onChange={(e) => setServiceValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Forma de Pagamento Prevista
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Faturado">Faturado (PJ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Termos e Garantia
                </label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Resumo do Fechamento</span>
                </div>
                <div>Cliente: {selectedCustomer?.name || 'Cliente Selecionado'}</div>
                <div>Previsão: {scheduledDate} às {scheduledTime}</div>
                <div>Valor Total: {formatCurrencyBRL(parseFloat(serviceValue) || 0)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              disabled={currentStep === 1 ? !customerId : !problemDescription.trim()}
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>Avançar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Criando Chamado...' : 'Criar Ordem de Serviço'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
