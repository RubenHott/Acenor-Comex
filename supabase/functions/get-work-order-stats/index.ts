import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkOrderStats {
  total: number;
  pendientes: number;
  en_progreso: number;
  completadas: number;
  urgentes: number;
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

    console.log('Fetching work order stats...');

    const { data, error } = await supabase.rpc('fn_work_order_stats');

    if (error) {
      console.error('Error fetching work order stats:', error);
      throw error;
    }

    const stats = data?.[0] as WorkOrderStats | undefined;

    const response = stats ? {
      total: stats.total || 0,
      pendientes: stats.pendientes || 0,
      enProgreso: stats.en_progreso || 0,
      completadas: stats.completadas || 0,
      urgentes: stats.urgentes || 0,
    } : {
      total: 0,
      pendientes: 0,
      enProgreso: 0,
      completadas: 0,
      urgentes: 0,
    };

    console.log('Work order stats fetched successfully:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Error in get-work-order-stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
