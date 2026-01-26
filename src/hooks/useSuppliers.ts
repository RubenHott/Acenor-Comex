import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type Supplier = Tables<'proveedores'>;
export type SupplierInsert = TablesInsert<'proveedores'>;
export type SupplierUpdate = TablesUpdate<'proveedores'>;

// Fetch all suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch active suppliers
export function useActiveSuppliers() {
  return useQuery({
    queryKey: ['proveedores', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single supplier
export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['proveedores', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Create supplier
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSupplier: SupplierInsert) => {
      const { data, error } = await supabase
        .from('proveedores')
        .insert(newSupplier)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
  });
}

// Update supplier
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SupplierUpdate }) => {
      const { data, error } = await supabase
        .from('proveedores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      queryClient.invalidateQueries({ queryKey: ['proveedores', variables.id] });
    },
  });
}
