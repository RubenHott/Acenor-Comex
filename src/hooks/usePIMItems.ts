import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PIMItem {
  id: string;
  pim_id: string;
  producto_id: string;
  codigo_producto: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario_usd: number;
  total_usd: number;
  toneladas: number;
  cantidad_recibida: number | null;
}

export function usePIMItems(pimId: string | undefined) {
  return useQuery({
    queryKey: ['pim-items', pimId],
    queryFn: async () => {
      if (!pimId) return [];
      const { data, error } = await supabase
        .from('pim_items')
        .select('*')
        .eq('pim_id', pimId)
        .order('codigo_producto');

      if (error) throw error;
      return data as PIMItem[];
    },
    enabled: !!pimId,
  });
}
