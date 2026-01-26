import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PIMStats {
  total_pims: number;
  pims_activos: number;
  pims_pendientes: number;
  alertas_sla: number;
  monto_total_usd: number;
  toneladas_mes: number;
}

interface StatusDistribution {
  estado: string;
  cantidad: number;
}

interface MonthlyTrend {
  mes: string;
  anio: number;
  mes_orden: string;
  total_pims: number;
  total_toneladas: number;
}

interface CriticalPIM {
  id: string;
  codigo: string;
  descripcion: string;
  estado: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching dashboard stats...');

    // Execute all SQL functions in parallel
    const [pimStatsResult, statusDistResult, monthlyTrendResult, slaStatsResult, criticalPimResult] = await Promise.all([
      supabase.rpc('fn_pim_stats'),
      supabase.rpc('fn_pim_status_distribution'),
      supabase.rpc('fn_pim_monthly_trend', { months_back: 4 }),
      supabase.rpc('fn_sla_global_stats'),
      supabase.rpc('fn_get_critical_pim'),
    ]);

    // Check for errors
    if (pimStatsResult.error) {
      console.error('Error fetching PIM stats:', pimStatsResult.error);
      throw pimStatsResult.error;
    }
    if (statusDistResult.error) {
      console.error('Error fetching status distribution:', statusDistResult.error);
      throw statusDistResult.error;
    }
    if (monthlyTrendResult.error) {
      console.error('Error fetching monthly trend:', monthlyTrendResult.error);
      throw monthlyTrendResult.error;
    }
    if (slaStatsResult.error) {
      console.error('Error fetching SLA stats:', slaStatsResult.error);
      throw slaStatsResult.error;
    }
    if (criticalPimResult.error) {
      console.error('Error fetching critical PIM:', criticalPimResult.error);
      throw criticalPimResult.error;
    }

    const pimStats = pimStatsResult.data?.[0] as PIMStats | undefined;
    const statusDistribution = statusDistResult.data as StatusDistribution[];
    const monthlyTrend = monthlyTrendResult.data as MonthlyTrend[];
    const slaStats = slaStatsResult.data;
    const criticalPim = criticalPimResult.data?.[0] as CriticalPIM | undefined;

    const response = {
      pimStats: pimStats ? {
        totalPIMs: pimStats.total_pims || 0,
        pimsActivos: pimStats.pims_activos || 0,
        pimsPendientes: pimStats.pims_pendientes || 0,
        alertasSLA: pimStats.alertas_sla || 0,
        montoTotalUSD: Number(pimStats.monto_total_usd) || 0,
        toneladasMes: Number(pimStats.toneladas_mes) || 0,
      } : {
        totalPIMs: 0,
        pimsActivos: 0,
        pimsPendientes: 0,
        alertasSLA: 0,
        montoTotalUSD: 0,
        toneladasMes: 0,
      },
      statusDistribution: statusDistribution || [],
      monthlyTrend: monthlyTrend || [],
      slaStats: slaStats || {
        negociacion: { estimados: 5, reales: null, alerta: 'verde' },
        contrato: { estimados: 3, reales: null, alerta: 'verde' },
        transito: { estimados: 30, reales: null, alerta: 'verde' },
        produccion: { estimados: 15, reales: null, alerta: 'verde' },
        aduana: { estimados: 5, reales: null, alerta: 'verde' },
        total: { estimados: 60, reales: null, alerta: 'verde' },
      },
      criticalPim: criticalPim || null,
    };

    console.log('Dashboard stats fetched successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Error in get-dashboard-stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
