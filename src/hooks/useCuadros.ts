import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Cuadro = Tables<'cuadros_importacion'>;
export type CuadroInsert = TablesInsert<'cuadros_importacion'>;
export type CuadroUpdate = TablesUpdate<'cuadros_importacion'>;

export function useCuadros() {
  return useQuery({
    queryKey: ['cuadros_importacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuadros_importacion')
        .select('*')
        .eq('activo', true)
        .order('codigo', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

/** Todos los cuadros (para módulo Maestros) */
export function useCuadrosAll() {
  return useQuery({
    queryKey: ['cuadros_importacion', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuadros_importacion')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCuadro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<CuadroInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('cuadros_importacion')
        .insert({ ...row, id: crypto.randomUUID() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuadros_importacion'] });
    },
  });
}

export function useUpdateCuadro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CuadroUpdate }) => {
      const { data, error } = await supabase
        .from('cuadros_importacion')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuadros_importacion'] });
    },
  });
}

export function useDeleteCuadro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cuadros_importacion').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuadros_importacion'] });
    },
  });
}
