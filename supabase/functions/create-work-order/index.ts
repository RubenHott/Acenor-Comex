import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateWorkOrderRequest {
  titulo: string;
  descripcion: string;
  prioridad: string;
  tipo_trabajo: string;
  area: string;
  solicitante: string;
  tecnico_asignado?: string;
  equipo_id?: string;
  observaciones?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CreateWorkOrderRequest = await req.json();

    // Validate required fields
    if (!body.titulo || !body.descripcion || !body.prioridad || !body.tipo_trabajo || !body.area || !body.solicitante) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Creating work order with data:', body);

    // Generate code using SQL function
    const { data: codeData, error: codeError } = await supabase.rpc('fn_generate_work_order_code');
    if (codeError) {
      console.error('Error generating code:', codeError);
      throw codeError;
    }
    const codigo = codeData as string;

    // Calculate due date using SQL function
    const { data: dueDateData, error: dueDateError } = await supabase.rpc('fn_calculate_due_date', { 
      priority: body.prioridad 
    });
    if (dueDateError) {
      console.error('Error calculating due date:', dueDateError);
      throw dueDateError;
    }
    const fechaLimite = dueDateData as string;

    console.log('Generated code:', codigo, 'Due date:', fechaLimite);

    // Insert work order
    const { data: workOrder, error: insertError } = await supabase
      .from('work_orders')
      .insert({
        codigo,
        titulo: body.titulo,
        descripcion: body.descripcion,
        prioridad: body.prioridad,
        tipo_trabajo: body.tipo_trabajo,
        area: body.area,
        solicitante: body.solicitante,
        tecnico_asignado: body.tecnico_asignado || null,
        equipo_id: body.equipo_id || null,
        observaciones: body.observaciones || null,
        estado: 'pendiente',
        fecha_limite: fechaLimite,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting work order:', insertError);
      throw insertError;
    }

    console.log('Work order created successfully:', workOrder);

    return new Response(JSON.stringify(workOrder), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error: unknown) {
    console.error('Error in create-work-order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
