import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// --- Types ---

export interface Transportista {
  id: string;
  nombre: string;
  rut: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  contacto_email: string | null;
  direccion: string | null;
  activo: boolean;
  created_at: string;
  created_by: string | null;
}

// --- Queries ---

/** List all active transportistas */
export function useTransportistas() {
  return useQuery({
    queryKey: ['transportistas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportistas')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as Transportista[];
    },
  });
}

// --- Mutations ---

/** Create a new transportista */
export function useCreateTransportista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nombre,
      rut,
      contactoNombre,
      contactoTelefono,
      contactoEmail,
      direccion,
      createdBy,
    }: {
      nombre: string;
      rut?: string;
      contactoNombre?: string;
      contactoTelefono?: string;
      contactoEmail?: string;
      direccion?: string;
      createdBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('transportistas')
        .insert({
          nombre,
          rut: rut || null,
          contacto_nombre: contactoNombre || null,
          contacto_telefono: contactoTelefono || null,
          contacto_email: contactoEmail || null,
          direccion: direccion || null,
          created_by: createdBy || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Transportista;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportistas'] });
    },
  });
}
