import { useState, useMemo, useCallback } from 'react';
import { WorkOrder, WorkOrderStatus } from '../types';
import { api } from '../lib/api';
import { canTransitionWorkOrder } from '../services/workOrderStateService';

export interface UseWorkOrdersOptions {
  initialWorkOrders?: WorkOrder[];
  onRefresh?: () => Promise<void> | void;
}

export function useWorkOrders(options: UseWorkOrdersOptions = {}) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(options.initialWorkOrders || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [technicianFilter, setTechnicianFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      // Status filter
      if (statusFilter !== 'ALL' && wo.status !== statusFilter) {
        return false;
      }

      // Technician filter
      if (technicianFilter !== 'ALL' && wo.technicianId !== technicianFilter) {
        return false;
      }

      // Date filter
      if (dateFilter && wo.scheduledDate !== dateFilter) {
        return false;
      }

      // Search query filter (code, client name, problem description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (wo.code || '').toLowerCase().includes(q);
        const descMatch = (wo.problemDescription || '').toLowerCase().includes(q);
        const notesMatch = (wo.notes || '').toLowerCase().includes(q);
        const techMatch = (wo.technicianName || '').toLowerCase().includes(q);
        if (!codeMatch && !descMatch && !notesMatch && !techMatch) {
          return false;
        }
      }

      return true;
    });
  }, [workOrders, statusFilter, technicianFilter, dateFilter, searchQuery]);

  const updateStatus = useCallback(
    async (
      id: string,
      targetStatus: WorkOrderStatus,
      options?: {
        note?: string;
        userName?: string;
        paymentReceived?: boolean;
        paymentMethod?: string;
      }
    ) => {
      const current = workOrders.find((w) => w.id === id);
      if (current && !canTransitionWorkOrder(current.status, targetStatus)) {
        throw new Error(`Transição de status inválida: de ${current.status} para ${targetStatus}.`);
      }

      const updated = await api.updateWorkOrderStatus(id, {
        status: targetStatus,
        note: options?.note,
        userName: options?.userName,
        paymentReceived: options?.paymentReceived,
        paymentMethod: options?.paymentMethod,
      });

      setWorkOrders((prev) => prev.map((w) => (w.id === id ? updated : w)));
      if (options && options.note) {
        // optionally refresh parent
      }
      return updated;
    },
    [workOrders]
  );

  return {
    workOrders,
    setWorkOrders,
    filteredWorkOrders,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    technicianFilter,
    setTechnicianFilter,
    dateFilter,
    setDateFilter,
    loading,
    setLoading,
    error,
    setError,
    updateStatus,
  };
}
