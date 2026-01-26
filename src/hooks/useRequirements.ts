import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type Requirement = Tables<'requerimientos_mensuales'>;
export type RequirementInsert = TablesInsert<'requerimientos_mensuales'>;
export type RequirementUpdate = TablesUpdate<'requerimientos_mensuales'>;
export type RequirementItem = Tables<'requerimiento_items'>;

// Fetch all requirements
export function useRequirements() {
  return useQuery({
    queryKey: ['requerimientos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .select('*')
        .order('mes', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch requirements with items
export function useRequirementsWithItems() {
  return useQuery({
    queryKey: ['requerimientos', 'with-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .select(`
          *,
          items:requerimiento_items(*)
        `)
        .order('mes', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single requirement
export function useRequirement(id: string | undefined) {
  return useQuery({
    queryKey: ['requerimientos', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .select(`
          *,
          items:requerimiento_items(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Create requirement
export function useCreateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newReq: RequirementInsert) => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .insert(newReq)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
    },
  });
}

// Update requirement
export function useUpdateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RequirementUpdate }) => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
      queryClient.invalidateQueries({ queryKey: ['requerimientos', variables.id] });
    },
  });
}
