import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type Product = Tables<'productos'>;
export type ProductInsert = TablesInsert<'productos'>;
export type ProductUpdate = TablesUpdate<'productos'>;

// Fetch all products
export function useProducts() {
  return useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('codigo', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single product
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['productos', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProduct: ProductInsert) => {
      const { data, error } = await supabase
        .from('productos')
        .insert(newProduct)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProductUpdate }) => {
      const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos', variables.id] });
    },
  });
}
