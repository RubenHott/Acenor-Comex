import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type PIM = Tables<'pims'>;
export type PIMInsert = TablesInsert<'pims'>;
export type PIMUpdate = TablesUpdate<'pims'>;

// Fetch all PIMs
export function usePIMs() {
  return useQuery({
    queryKey: ['pims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pims')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single PIM
export function usePIM(id: string | undefined) {
  return useQuery({
    queryKey: ['pims', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('pims')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Fetch PIMs with items
export function usePIMsWithItems() {
  return useQuery({
    queryKey: ['pims', 'with-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pims')
        .select(`
          *,
          items:pim_items(*)
        `)
        .order('fecha_creacion', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Create PIM
export function useCreatePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPIM: PIMInsert) => {
      const { data, error } = await supabase
        .from('pims')
        .insert(newPIM)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Update PIM
export function useUpdatePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PIMUpdate }) => {
      const { data, error } = await supabase
        .from('pims')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['pims', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Delete PIM (and its items)
export function useDeletePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete pim_requirement_items
      const { error: errReqItems } = await supabase
        .from('pim_requirement_items')
        .delete()
        .eq('pim_id', id);
      
      if (errReqItems) throw errReqItems;

      // Delete pim_items
      const { error: errItems } = await supabase
        .from('pim_items')
        .delete()
        .eq('pim_id', id);
      
      if (errItems) throw errItems;

      // Then delete the PIM
      const { error } = await supabase
        .from('pims')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
    },
  });
}

// Dashboard stats - now uses edge function via useDashboardStats
// Keeping this for backwards compatibility
export function usePIMStats() {
  return useQuery({
    queryKey: ['dashboard-stats', 'pim-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
      
      if (error) throw error;
      
      return data?.pimStats || {
        totalPIMs: 0,
        pimsActivos: 0,
        pimsPendientes: 0,
        alertasSLA: 0,
        montoTotalUSD: 0,
        toneladasMes: 0,
      };
    },
    staleTime: 30000,
  });
}
