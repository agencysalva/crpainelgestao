import React, { useState, useEffect, useRef } from 'react';
import { 
  WorkOrder, 
  WorkOrderStatus, 
  Customer, 
  CustomerLocation, 
  Technician, 
  ServiceItem,
  AuditLog
} from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { 
  WorkOrderFilterBar, 
  WorkOrderListTable, 
  WorkOrderDetailDrawer, 
  WorkOrderCreateModal 
} from '../components/workOrders';

interface WorkOrdersPageProps {
  workOrders: WorkOrder[];
  customers: Customer[];
  locations?: CustomerLocation[];
  technicians: Technician[];
  services: ServiceItem[];
  onRefresh: () => void;
  onOpenPrintModal: (wo: WorkOrder) => void;
  onOpenWhatsApp?: (payload: { customer?: Customer; workOrder?: WorkOrder }) => void;
  selectedWorkOrderInit?: WorkOrder | null;
  openCreateModalInit?: boolean;
  onCloseCreateModalInit?: () => void;
}

export const WorkOrdersPage: React.FC<WorkOrdersPageProps> = ({
  workOrders,
  customers,
  locations = [],
  technicians,
  services,
  onRefresh,
  onOpenPrintModal,
  onOpenWhatsApp,
  selectedWorkOrderInit = null,
  openCreateModalInit = false,
  onCloseCreateModalInit,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { canDelete, isEmployee } = usePermissions();

  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(selectedWorkOrderInit);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [woToDelete, setWoToDelete] = useState<WorkOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Fetch audit logs for the selected work order only when ID changes
  useEffect(() => {
    const targetId = selectedWo?.id;
    if (!targetId) return;
    let isMounted = true;
    const fetchAudit = async () => {
      try {
        const logs = await api.getAuditLogs();
        if (isMounted) setAuditLogs(logs || []);
      } catch (err) {
        // Silently handle if audit fetch is restricted
      }
    };
    fetchAudit();
    return () => {
      isMounted = false;
    };
  }, [selectedWo?.id]);

  // Keep selected work order synced with main list only if data meaningfully changes
  useEffect(() => {
    if (selectedWo) {
      const fresh = workOrders.find((w) => w.id === selectedWo.id);
      if (
        fresh &&
        (fresh.status !== selectedWo.status ||
          fresh.updatedAt !== selectedWo.updatedAt ||
          fresh.value !== selectedWo.value ||
          fresh.dispatchStatus !== selectedWo.dispatchStatus)
      ) {
        setSelectedWo(fresh);
      }
    }
  }, [workOrders, selectedWo]);

  const onCloseCreateModalRef = useRef(onCloseCreateModalInit);
  onCloseCreateModalRef.current = onCloseCreateModalInit;

  // Handle opening create modal via global keyboard shortcut / prop
  useEffect(() => {
    if (openCreateModalInit) {
      setCreateModalOpen(true);
      if (onCloseCreateModalRef.current) onCloseCreateModalRef.current();
    }
  }, [openCreateModalInit]);

  // Restrição de visibilidade para perfil operacional
  const visibleWorkOrders = workOrders.filter((wo) => {
    if (!isEmployee) return true;
    if (wo.technicianId === user?.id || wo.technicianId === `tech-${user?.id}`) return true;
    const currentTech = technicians.find(
      (t) => t.email === user?.email || (user?.name && t.name.toLowerCase().includes(user.name.toLowerCase()))
    );
    if (currentTech && wo.technicianId === currentTech.id) return true;
    return false;
  });

  // Filter and search
  const filteredWorkOrders = visibleWorkOrders.filter((wo) => {
    const matchesStatus = filterStatus === 'TODOS' || wo.status === filterStatus;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cust = customers.find((c) => c.id === wo.customerId);
    const clientName = (cust?.name || wo.customerName || '').toLowerCase();
    const code = (wo.code || '').toLowerCase();
    const problem = (wo.problemDescription || '').toLowerCase();

    return clientName.includes(q) || code.includes(q) || problem.includes(q);
  });

  // Status counts for badge tags
  const statusCounts = visibleWorkOrders.reduce<Record<string, number>>((acc, wo) => {
    acc[wo.status] = (acc[wo.status] || 0) + 1;
    return acc;
  }, {});

  // Handlers
  const handleCreateWorkOrder = async (data: any) => {
    try {
      setActionLoading(true);
      const cust = customers.find((c) => c.id === data.customerId);
      const tech = technicians.find((t) => t.id === data.technicianId);

      await api.createWorkOrder({
        ...data,
        customerName: cust?.name,
        customerPhone: cust?.phone || cust?.whatsapp,
        customerAddress: cust ? `${cust.street}, ${cust.number} - ${cust.neighborhood}` : undefined,
        technicianName: tech?.name,
      });

      showToast('Ordem de Serviço criada com sucesso!');
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao criar OS', err.message || 'Falha na requisição.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (wo: WorkOrder, nextStatus: WorkOrderStatus) => {
    try {
      setActionLoading(true);
      await api.updateWorkOrderStatus(wo.id, {
        status: nextStatus,
        note: `Status alterado no painel administrativo por ${user?.name || 'Administrador'}.`,
        userName: user?.name || 'Administrador',
      });
      showToast(`Status atualizado para ${nextStatus}`);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao atualizar status', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (technicianId: string, dispatchNote?: string) => {
    if (!selectedWo) return;
    try {
      setActionLoading(true);
      const tech = technicians.find((t) => t.id === technicianId);
      await api.updateWorkOrder(selectedWo.id, {
        technicianId,
        technicianName: tech?.name,
        status: 'EM_DESLOCAMENTO',
      });
      showToast('Chamado despachado com sucesso!', `Técnico designado: ${tech?.name}`);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao despachar', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!woToDelete) return;
    try {
      setActionLoading(true);
      await api.deleteWorkOrder(woToDelete.id);
      showToast('Ordem de serviço excluída com sucesso.');
      if (selectedWo?.id === woToDelete.id) {
        setSelectedWo(null);
      }
      setDeleteModalOpen(false);
      setWoToDelete(null);
      onRefresh();
    } catch (err: any) {
      showToast('Erro ao excluir', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!filteredWorkOrders.length) {
      showToast('Aviso', 'Nenhuma ordem de serviço para exportar.', 'warning');
      return;
    }
    const headers = ['Código', 'Cliente', 'Endereço', 'Técnico', 'Data', 'Horário', 'Valor', 'Status', 'Forma de Pagamento'];
    const rows = filteredWorkOrders.map((wo) => {
      const cust = customers.find((c) => c.id === wo.customerId);
      const tech = technicians.find((t) => t.id === wo.technicianId);
      return [
        wo.code,
        cust ? `"${cust.name}"` : `"${wo.customerName || 'Cliente'}"`,
        `"${wo.locationAddress || (cust ? `${cust.street}, ${cust.number} - ${cust.neighborhood}` : '')}"`,
        tech ? `"${tech.name}"` : '"Não atribuído"',
        wo.scheduledDate,
        wo.scheduledTime || '09:00',
        wo.value,
        wo.status,
        wo.paymentMethod
      ].join(';');
    });
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ordens_servico_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exportação concluída', `${filteredWorkOrders.length} ordens de serviço exportadas com sucesso.`, 'success');
  };

  const selectedCustomer = selectedWo ? customers.find((c) => c.id === selectedWo.customerId) : undefined;
  const selectedLocation = selectedWo ? locations.find((l) => l.id === selectedWo.locationId) : undefined;

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <WorkOrderFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={filterStatus}
        onStatusChange={setFilterStatus}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        onExportCsv={handleExportCsv}
        totalOrdersCount={visibleWorkOrders.length}
        statusCounts={statusCounts}
      />

      {/* Work Orders List Table */}
      <WorkOrderListTable
        workOrders={filteredWorkOrders}
        customers={customers}
        technicians={technicians}
        onSelectWorkOrder={(wo) => setSelectedWo(wo)}
        onOpenPrintModal={onOpenPrintModal}
        onOpenWhatsApp={onOpenWhatsApp}
        onDeleteWorkOrder={(wo) => {
          setWoToDelete(wo);
          setDeleteModalOpen(true);
        }}
        canDelete={canDelete}
      />

      {/* Work Order Detail Drawer */}
      <WorkOrderDetailDrawer
        workOrder={selectedWo}
        onClose={() => setSelectedWo(null)}
        customer={selectedCustomer}
        location={selectedLocation}
        technicians={technicians}
        services={services}
        auditLogs={auditLogs}
        onOpenPrintModal={onOpenPrintModal}
        onOpenWhatsApp={onOpenWhatsApp}
        onDeleteWorkOrder={(wo) => {
          setWoToDelete(wo);
          setDeleteModalOpen(true);
        }}
        onUpdateStatus={handleUpdateStatus}
        onDispatchTechnician={handleDispatch}
        canDelete={canDelete}
      />

      {/* Multi-step Create Modal */}
      <WorkOrderCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateWorkOrder}
        customers={customers}
        locations={locations}
        technicians={technicians}
        services={services}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWoToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Ordem de Serviço"
        message={`Tem certeza que deseja excluir o chamado ${woToDelete?.code}? Esta ação é permanente e será registrada na auditoria.`}
        loading={actionLoading}
      />
    </div>
  );
};
