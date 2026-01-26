import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type WorkOrder = Tables<'work_orders'>;
export type WorkOrderInsert = TablesInsert<'work_orders'>;
export type WorkOrderUpdate = TablesUpdate<'work_orders'>;

// Fetch all work orders
export function useWorkOrders() {
  return useQuery({
    queryKey: ['work_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single work order
export function useWorkOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['work_orders', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Create work order
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: WorkOrderInsert) => {
      const { data, error } = await supabase
        .from('work_orders')
        .insert(newOrder)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
    },
  });
}

// Update work order
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: WorkOrderUpdate }) => {
      const { data, error } = await supabase
        .from('work_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_orders', variables.id] });
    },
  });
}

// Work order stats
export function useWorkOrderStats() {
  return useQuery({
    queryKey: ['work_orders', 'stats'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('work_orders')
        .select('estado, prioridad');
      
      if (error) throw error;

      return {
        total: orders?.length || 0,
        pendientes: orders?.filter(o => o.estado === 'pendiente').length || 0,
        enProgreso: orders?.filter(o => o.estado === 'en_progreso').length || 0,
        completadas: orders?.filter(o => o.estado === 'completada').length || 0,
        urgentes: orders?.filter(o => o.prioridad === 'urgente' && o.estado !== 'completada').length || 0,
      };
    },
  });
}
