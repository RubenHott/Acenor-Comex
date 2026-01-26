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
    },
  });
}

// Dashboard stats
export function usePIMStats() {
  return useQuery({
    queryKey: ['pims', 'stats'],
    queryFn: async () => {
      const { data: pims, error } = await supabase
        .from('pims')
        .select('estado, total_usd, total_toneladas');
      
      if (error) throw error;

      const activos = pims?.filter(p => 
        !['cerrado', 'entregado'].includes(p.estado)
      ).length || 0;

      const pendientes = pims?.filter(p => 
        ['creado', 'en_negociacion', 'contrato_pendiente'].includes(p.estado)
      ).length || 0;

      return {
        totalPIMs: pims?.length || 0,
        pimsActivos: activos,
        pimsPendientes: pendientes,
        alertasSLA: 2, // Would need sla_data join
        montoTotalUSD: pims?.reduce((sum, p) => sum + (p.total_usd || 0), 0) || 0,
        toneladasMes: pims?.reduce((sum, p) => sum + (p.total_toneladas || 0), 0) || 0,
      };
    },
  });
}
