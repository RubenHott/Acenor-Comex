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
      // 1. Obtener pim_requirement_items para devolver kilos al requerimiento
      const { data: pimReqItems, error: fetchErr } = await supabase
        .from('pim_requirement_items')
        .select('requirement_item_id, kilos_consumidos')
        .eq('pim_id', id);

      if (fetchErr) throw fetchErr;

      if (pimReqItems && pimReqItems.length > 0) {
        const kilosByRequerimiento: Record<string, number> = {};

        for (const pri of pimReqItems) {
          const kilos = pri.kilos_consumidos ?? 0;
          if (kilos <= 0) continue;

          // Obtener requerimiento_id del item
          const { data: reqItem, error: reqItemErr } = await supabase
            .from('requerimiento_items')
            .select('requerimiento_id, kilos_consumidos, kilos_disponibles')
            .eq('id', pri.requirement_item_id)
            .single();

          if (reqItemErr) throw reqItemErr;

          // Devolver kilos al requerimiento_item
          const newConsumidos = Math.max(0, (reqItem.kilos_consumidos ?? 0) - kilos);
          const newDisponibles = (reqItem.kilos_disponibles ?? 0) + kilos;

          const { error: updateItemErr } = await supabase
            .from('requerimiento_items')
            .update({ kilos_consumidos: newConsumidos, kilos_disponibles: newDisponibles })
            .eq('id', pri.requirement_item_id);

          if (updateItemErr) throw updateItemErr;

          // Acumular para actualizar requerimientos_mensuales
          const reqId = reqItem.requerimiento_id;
          kilosByRequerimiento[reqId] = (kilosByRequerimiento[reqId] ?? 0) + kilos;
        }

        // Actualizar requerimientos_mensuales
        for (const [reqId, kilosToRelease] of Object.entries(kilosByRequerimiento)) {
          const { data: req, error: reqFetchErr } = await supabase
            .from('requerimientos_mensuales')
            .select('kilos_consumidos, kilos_disponibles')
            .eq('id', reqId)
            .single();

          if (reqFetchErr) throw reqFetchErr;

          const { error: reqUpdateErr } = await supabase
            .from('requerimientos_mensuales')
            .update({
              kilos_consumidos: Math.max(0, (req.kilos_consumidos ?? 0) - kilosToRelease),
              kilos_disponibles: (req.kilos_disponibles ?? 0) + kilosToRelease,
            })
            .eq('id', reqId);

          if (reqUpdateErr) throw reqUpdateErr;
        }
      }

      // 2. Eliminar pim_requirement_items
      const { error: errReqItems } = await supabase
        .from('pim_requirement_items')
        .delete()
        .eq('pim_id', id);
      if (errReqItems) throw errReqItems;

      // 3. Eliminar pim_items
      const { error: errItems } = await supabase
        .from('pim_items')
        .delete()
        .eq('pim_id', id);
      if (errItems) throw errItems;

      // 4. Eliminar el PIM
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
