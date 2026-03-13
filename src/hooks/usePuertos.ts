import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Puerto {
  id: string;
  nombre: string;
  codigo: string | null;
  pais: string;
  activo: boolean;
}

/** Fetch all active ports */
export function usePuertos() {
  return useQuery({
    queryKey: ['puertos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puertos')
        .select('id, nombre, codigo, pais, activo')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as Puerto[];
    },
  });
}

/** Create a new port */
export function useCreatePuerto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nombre: string; codigo?: string; pais?: string }) => {
      const { data, error } = await supabase
        .from('puertos')
        .insert({
          nombre: input.nombre,
          codigo: input.codigo || null,
          pais: input.pais || 'Chile',
        })
        .select('id, nombre, codigo, pais, activo')
        .single();
      if (error) throw error;
      return data as Puerto;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['puertos'] });
    },
  });
}

/** Fetch ports for ALL PIMs (batch) — returns Map<pimId, puerto names joined> */
export function useAllPIMPuertos() {
  return useQuery({
    queryKey: ['pim-puertos-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_puertos')
        .select('pim_id, puertos(nombre)');
      if (error) throw error;
      const map = new Map<string, string>();
      for (const row of data || []) {
        const nombre = (row as any).puertos?.nombre;
        if (!nombre) continue;
        const existing = map.get(row.pim_id);
        map.set(row.pim_id, existing ? `${existing}, ${nombre}` : nombre);
      }
      return map;
    },
    staleTime: 30000,
  });
}

/** Fetch ports assigned to a specific PIM */
export function usePIMPuertos(pimId: string | undefined) {
  return useQuery({
    queryKey: ['pim-puertos', pimId],
    enabled: !!pimId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_puertos')
        .select('puerto_id, puertos(id, nombre, codigo, pais)')
        .eq('pim_id', pimId!);
      if (error) throw error;
      return (data || []).map((row: any) => row.puertos as Puerto);
    },
  });
}

/** Save ports for a PIM (replaces all existing) */
export function useSavePIMPuertos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pimId, puertoIds }: { pimId: string; puertoIds: string[] }) => {
      // Delete existing
      const { error: delError } = await supabase
        .from('pim_puertos')
        .delete()
        .eq('pim_id', pimId);
      if (delError) throw delError;

      // Insert new
      if (puertoIds.length > 0) {
        const rows = puertoIds.map((pid) => ({ pim_id: pimId, puerto_id: pid }));
        const { error: insError } = await supabase
          .from('pim_puertos')
          .insert(rows);
        if (insError) throw insError;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pim-puertos', vars.pimId] });
    },
  });
}
