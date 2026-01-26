import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for dashboard stats from edge function
export interface DashboardStats {
  pimStats: {
    totalPIMs: number;
    pimsActivos: number;
    pimsPendientes: number;
    alertasSLA: number;
    montoTotalUSD: number;
    toneladasMes: number;
  };
  statusDistribution: Array<{
    estado: string;
    cantidad: number;
  }>;
  monthlyTrend: Array<{
    mes: string;
    anio: number;
    mes_orden: string;
    total_pims: number;
    total_toneladas: number;
  }>;
  slaStats: {
    negociacion: { estimados: number; reales: number | null; alerta: 'verde' | 'amarillo' | 'rojo' };
    contrato: { estimados: number; reales: number | null; alerta: 'verde' | 'amarillo' | 'rojo' };
    transito: { estimados: number; reales: number | null; alerta: 'verde' | 'amarillo' | 'rojo' };
    produccion: { estimados: number; reales: number | null; alerta: 'verde' | 'amarillo' | 'rojo' };
    aduana: { estimados: number; reales: number | null; alerta: 'verde' | 'amarillo' | 'rojo' };
    total: { estimados: number; reales: number | null; alerta: 'verde' | 'amarillo' | 'rojo' };
  };
  criticalPim: {
    id: string;
    codigo: string;
    descripcion: string;
    estado: string;
  } | null;
}

// Fetch all dashboard stats from edge function
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
      
      if (error) throw error;
      return data;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

// Convenience hooks that extract specific parts of dashboard stats
export function usePIMStatsFromDashboard() {
  const { data, ...rest } = useDashboardStats();
  return {
    data: data?.pimStats,
    ...rest,
  };
}

export function useStatusDistribution() {
  const { data, ...rest } = useDashboardStats();
  return {
    data: data?.statusDistribution,
    ...rest,
  };
}

export function useMonthlyTrend() {
  const { data, ...rest } = useDashboardStats();
  return {
    data: data?.monthlyTrend,
    ...rest,
  };
}

export function useSLAStatsFromDashboard() {
  const { data, ...rest } = useDashboardStats();
  return {
    data: data?.slaStats,
    ...rest,
  };
}

export function useCriticalPIM() {
  const { data, ...rest } = useDashboardStats();
  return {
    data: data?.criticalPim,
    ...rest,
  };
}
