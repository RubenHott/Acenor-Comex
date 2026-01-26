import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type SLAData = Tables<'sla_data'>;

// Fetch SLA data for a specific PIM
export function usePIMSLA(pimId: string | undefined) {
  return useQuery({
    queryKey: ['sla_data', pimId],
    queryFn: async () => {
      if (!pimId) return null;
      const { data, error } = await supabase
        .from('sla_data')
        .select('*')
        .eq('pim_id', pimId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!pimId,
  });
}

// Fetch all SLA data for stats
export function useAllSLAData() {
  return useQuery({
    queryKey: ['sla_data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_data')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });
}

// Calculate average SLA stats from edge function
export function useSLAStats() {
  return useQuery({
    queryKey: ['dashboard-stats', 'sla-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
      
      if (error) throw error;
      
      return data?.slaStats || {
        negociacion: { estimados: 5, reales: null, alerta: 'verde' as const },
        contrato: { estimados: 3, reales: null, alerta: 'verde' as const },
        transito: { estimados: 30, reales: null, alerta: 'verde' as const },
        produccion: { estimados: 15, reales: null, alerta: 'verde' as const },
        aduana: { estimados: 5, reales: null, alerta: 'verde' as const },
        total: { estimados: 60, reales: null, alerta: 'verde' as const },
      };
    },
    staleTime: 30000,
  });
}

// Helper to format SLA data for display
export function formatSLAForPIM(slaData: SLAData | null | undefined) {
  if (!slaData) {
    return {
      negociacion: { estimados: 5, reales: undefined, alerta: 'verde' as const },
      contrato: { estimados: 3, reales: undefined, alerta: 'verde' as const },
      produccion: { estimados: 30, reales: undefined, alerta: 'verde' as const },
      transito: { estimados: 25, reales: undefined, alerta: 'verde' as const },
      aduana: { estimados: 5, reales: undefined, alerta: 'verde' as const },
      total: { estimados: 70, reales: undefined, alerta: 'verde' as const },
    };
  }

  const mapAlerta = (alerta: string | null): 'verde' | 'amarillo' | 'rojo' => {
    if (alerta === 'amarillo' || alerta === 'rojo') return alerta;
    return 'verde';
  };

  return {
    negociacion: {
      estimados: slaData.tiempo_negociacion_dias_estimados,
      reales: slaData.tiempo_negociacion_dias_reales ?? undefined,
      alerta: mapAlerta(slaData.tiempo_negociacion_alerta),
    },
    contrato: {
      estimados: slaData.tiempo_contrato_dias_estimados,
      reales: slaData.tiempo_contrato_dias_reales ?? undefined,
      alerta: mapAlerta(slaData.tiempo_contrato_alerta),
    },
    produccion: {
      estimados: slaData.tiempo_produccion_dias_estimados,
      reales: slaData.tiempo_produccion_dias_reales ?? undefined,
      alerta: mapAlerta(slaData.tiempo_produccion_alerta),
    },
    transito: {
      estimados: slaData.tiempo_transito_dias_estimados,
      reales: slaData.tiempo_transito_dias_reales ?? undefined,
      alerta: mapAlerta(slaData.tiempo_transito_alerta),
    },
    aduana: {
      estimados: slaData.tiempo_aduana_dias_estimados,
      reales: slaData.tiempo_aduana_dias_reales ?? undefined,
      alerta: mapAlerta(slaData.tiempo_aduana_alerta),
    },
    total: {
      estimados: slaData.tiempo_total_dias_estimados,
      reales: slaData.tiempo_total_dias_reales ?? undefined,
      alerta: mapAlerta(slaData.tiempo_total_alerta),
    },
  };
}
