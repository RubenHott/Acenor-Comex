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

// Calculate average SLA stats across all PIMs
export function useSLAStats() {
  return useQuery({
    queryKey: ['sla_data', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_data')
        .select('*');
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          negociacion: { estimados: 5, reales: null, alerta: 'verde' as const },
          contrato: { estimados: 3, reales: null, alerta: 'verde' as const },
          transito: { estimados: 25, reales: null, alerta: 'verde' as const },
          produccion: { estimados: 30, reales: null, alerta: 'verde' as const },
          aduana: { estimados: 5, reales: null, alerta: 'verde' as const },
          total: { estimados: 70, reales: null, alerta: 'verde' as const },
        };
      }

      const avg = (arr: (number | null)[]) => {
        const valid = arr.filter((v): v is number => v !== null);
        return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
      };

      const getAlerta = (estimados: number, reales: number | null): 'verde' | 'amarillo' | 'rojo' => {
        if (reales === null) return 'verde';
        if (reales <= estimados) return 'verde';
        if (reales <= estimados * 1.2) return 'amarillo';
        return 'rojo';
      };

      const negociacionReales = avg(data.map(d => d.tiempo_negociacion_dias_reales));
      const contratoReales = avg(data.map(d => d.tiempo_contrato_dias_reales));
      const transitoReales = avg(data.map(d => d.tiempo_transito_dias_reales));
      const produccionReales = avg(data.map(d => d.tiempo_produccion_dias_reales));
      const aduanaReales = avg(data.map(d => d.tiempo_aduana_dias_reales));
      const totalReales = avg(data.map(d => d.tiempo_total_dias_reales));

      const negociacionEstimados = Math.round(data.reduce((a, b) => a + b.tiempo_negociacion_dias_estimados, 0) / data.length);
      const contratoEstimados = Math.round(data.reduce((a, b) => a + b.tiempo_contrato_dias_estimados, 0) / data.length);
      const transitoEstimados = Math.round(data.reduce((a, b) => a + b.tiempo_transito_dias_estimados, 0) / data.length);
      const produccionEstimados = Math.round(data.reduce((a, b) => a + b.tiempo_produccion_dias_estimados, 0) / data.length);
      const aduanaEstimados = Math.round(data.reduce((a, b) => a + b.tiempo_aduana_dias_estimados, 0) / data.length);
      const totalEstimados = Math.round(data.reduce((a, b) => a + b.tiempo_total_dias_estimados, 0) / data.length);

      return {
        negociacion: { 
          estimados: negociacionEstimados, 
          reales: negociacionReales, 
          alerta: getAlerta(negociacionEstimados, negociacionReales) 
        },
        contrato: { 
          estimados: contratoEstimados, 
          reales: contratoReales, 
          alerta: getAlerta(contratoEstimados, contratoReales) 
        },
        transito: { 
          estimados: transitoEstimados, 
          reales: transitoReales, 
          alerta: getAlerta(transitoEstimados, transitoReales) 
        },
        produccion: { 
          estimados: produccionEstimados, 
          reales: produccionReales, 
          alerta: getAlerta(produccionEstimados, produccionReales) 
        },
        aduana: { 
          estimados: aduanaEstimados, 
          reales: aduanaReales, 
          alerta: getAlerta(aduanaEstimados, aduanaReales) 
        },
        total: { 
          estimados: totalEstimados, 
          reales: totalReales, 
          alerta: getAlerta(totalEstimados, totalReales) 
        },
      };
    },
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
