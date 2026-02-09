import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type Molino = Tables<'fabricas_molinos'>;
export type MolinoInsert = TablesInsert<'fabricas_molinos'>;
export type MolinoUpdate = TablesUpdate<'fabricas_molinos'>;

// Fetch all molinos
export function useMolinos() {
  return useQuery({
    queryKey: ['fabricas_molinos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fabricas_molinos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Fetch active molinos
export function useActiveMolinos() {
  return useQuery({
    queryKey: ['fabricas_molinos', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fabricas_molinos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Fetch single molino
export function useMolino(id: string | undefined) {
  return useQuery({
    queryKey: ['fabricas_molinos', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('fabricas_molinos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Create molino
export function useCreateMolino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMolino: MolinoInsert) => {
      const { data, error } = await supabase
        .from('fabricas_molinos')
        .insert(newMolino)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabricas_molinos'] });
    },
  });
}

// Update molino
export function useUpdateMolino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MolinoUpdate }) => {
      const { data, error } = await supabase
        .from('fabricas_molinos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fabricas_molinos'] });
      queryClient.invalidateQueries({ queryKey: ['fabricas_molinos', variables.id] });
    },
  });
}

// Delete molino
export function useDeleteMolino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fabricas_molinos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabricas_molinos'] });
    },
  });
}

// Bulk insert molinos
export function useBulkInsertMolinos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: Omit<MolinoInsert, 'id'>[]) => {
      const withIds = rows.map((r) => ({ ...r, id: crypto.randomUUID() }));
      const { data, error } = await supabase.from('fabricas_molinos').insert(withIds).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabricas_molinos'] });
    },
  });
}
