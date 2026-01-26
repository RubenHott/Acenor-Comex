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

// Create work order via edge function (generates code and due date server-side)
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: {
      titulo: string;
      descripcion: string;
      prioridad: string;
      tipo_trabajo: string;
      area: string;
      solicitante: string;
      tecnico_asignado?: string;
      equipo_id?: string;
      observaciones?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-work-order', {
        body: newOrder,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['work-order-stats'] });
    },
  });
}

// Work order stats from edge function
export function useWorkOrderStats() {
  return useQuery({
    queryKey: ['work-order-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-work-order-stats');
      
      if (error) throw error;
      return data as {
        total: number;
        pendientes: number;
        enProgreso: number;
        completadas: number;
        urgentes: number;
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}
