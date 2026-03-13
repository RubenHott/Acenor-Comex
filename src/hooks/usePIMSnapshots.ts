import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PIMSnapshotItem {
  codigo_producto: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario_usd: number;
  total_usd: number;
  toneladas: number;
  molino_id?: string | null;
}

export interface PIMSnapshotData {
  pim: {
    codigo: string;
    descripcion: string;
    proveedor_nombre: string | null;
    modalidad_pago: string;
    total_usd: number;
    total_toneladas: number;
    condicion_precio: string | null;
    origen: string | null;
  };
  items: PIMSnapshotItem[];
}

export interface PIMSnapshot {
  id: string;
  pim_id: string;
  tipo: string;
  datos: PIMSnapshotData;
  created_at: string;
}

/** Fetch snapshot for a PIM (typically the 'creacion' snapshot) */
export function usePIMSnapshot(pimId: string | undefined) {
  return useQuery({
    queryKey: ['pim-snapshot', pimId],
    enabled: !!pimId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_snapshots')
        .select('*')
        .eq('pim_id', pimId!)
        .eq('tipo', 'creacion')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PIMSnapshot | null;
    },
  });
}

/** Create a snapshot */
export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pimId, datos }: { pimId: string; datos: PIMSnapshotData }) => {
      const { data, error } = await supabase
        .from('pim_snapshots')
        .insert({
          pim_id: pimId,
          tipo: 'creacion',
          datos,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pim-snapshot', vars.pimId] });
    },
  });
}
