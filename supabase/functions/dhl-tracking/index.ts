import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const DHL_API_KEY = Deno.env.get('DHL_API_KEY')
    if (!DHL_API_KEY) {
      throw new Error('DHL_API_KEY is not configured')
    }

    const { trackingNumber, pimId } = await req.json()

    if (!trackingNumber) {
      return new Response(
        JSON.stringify({ error: 'trackingNumber is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Tracking DHL shipment: ${trackingNumber}`)

    // Call DHL Tracking API
    const dhlResponse = await fetch(
      `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
      {
        headers: {
          'DHL-API-Key': DHL_API_KEY,
          'Accept': 'application/json',
        },
      }
    )

    if (!dhlResponse.ok) {
      const errorBody = await dhlResponse.text()
      console.error(`DHL API error [${dhlResponse.status}]: ${errorBody}`)
      throw new Error(`DHL API returned ${dhlResponse.status}: ${errorBody}`)
    }

    const dhlData = await dhlResponse.json()
    console.log(`DHL response received for ${trackingNumber}`)

    // Extract latest status
    const shipment = dhlData.shipments?.[0]
    const latestStatus = shipment?.status?.statusCode || 'unknown'
    const statusDescription = shipment?.status?.description || 'Sin información'

    // Update PIM with latest DHL status if pimId provided
    if (pimId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { error: updateErr } = await supabase
        .from('pims')
        .update({
          dhl_tracking_code: trackingNumber,
          dhl_last_status: statusDescription,
          dhl_last_checked_at: new Date().toISOString(),
        })
        .eq('id', pimId)

      if (updateErr) {
        console.error('Error updating PIM with DHL status:', updateErr)
      }

      // Log activity
      await supabase.from('pim_activity_log').insert({
        id: crypto.randomUUID(),
        pim_id: pimId,
        tipo: 'note',
        descripcion: `DHL Tracking actualizado: ${statusDescription}`,
        usuario: 'Sistema',
        metadata: { tracking_number: trackingNumber, status_code: latestStatus },
      })
    }

    return new Response(
      JSON.stringify({
        trackingNumber,
        status: latestStatus,
        statusDescription,
        shipment: shipment || null,
        events: shipment?.events || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('DHL tracking error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
