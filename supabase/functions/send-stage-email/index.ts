const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface StageEmailPayload {
  pimCodigo: string
  pimCodigoCorrelativo: string | null
  etapaCompletada: string
  etapaSiguiente: string | null
  quienAvanzo: string
  responsableSiguiente: string | null
  departamentoSiguiente: string[] | null
  destinatarios: string[]
}

function buildEmailHtml(data: StageEmailPayload): string {
  const pimLabel = data.pimCodigoCorrelativo || data.pimCodigo
  const isCierre = !data.etapaSiguiente

  const nextStageBlock = isCierre
    ? `<tr>
        <td style="padding:12px 20px;background:#f0fdf4;border-radius:8px;">
          <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">
            Todas las etapas han sido completadas. El PIM ha sido cerrado.
          </p>
        </td>
      </tr>`
    : `<tr>
        <td style="padding:0 0 8px;">
          <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Siguiente etapa</p>
          <p style="margin:4px 0 0;font-size:16px;color:#1e293b;font-weight:700;">${data.etapaSiguiente}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 8px;">
          <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Departamento responsable</p>
          <p style="margin:4px 0 0;font-size:16px;color:#1e293b;font-weight:700;">${data.responsableSiguiente || 'Sin asignar'}</p>
        </td>
      </tr>`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:24px 32px;">
              <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:700;">COMEX — Avance de Proceso</h1>
            </td>
          </tr>
          <!-- PIM Badge -->
          <tr>
            <td style="padding:24px 32px 16px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 16px;">
                    <span style="font-size:13px;color:#2563eb;font-weight:700;font-family:monospace;">${pimLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 8px;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Etapa completada</p>
                    <p style="margin:4px 0 0;font-size:16px;color:#15803d;font-weight:700;">${data.etapaCompletada}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Avanzado por</p>
                    <p style="margin:4px 0 0;font-size:16px;color:#1e293b;font-weight:700;">${data.quienAvanzo}</p>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid #e2e8f0;padding:16px 0 0;"></td></tr>
                ${nextStageBlock}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Este es un mensaje automático del sistema COMEX · Acenor Aceros del Norte S.A.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'COMEX Acenor <acenor@notificaciones.acenorchile.com>'

    const payload: StageEmailPayload = await req.json()

    if (!payload.destinatarios || payload.destinatarios.length === 0) {
      return new Response(
        JSON.stringify({ error: 'destinatarios is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pimLabel = payload.pimCodigoCorrelativo || payload.pimCodigo
    const subject = payload.etapaSiguiente
      ? `[${pimLabel}] Etapa completada: ${payload.etapaCompletada} → ${payload.etapaSiguiente}`
      : `[${pimLabel}] Proceso completado: ${payload.etapaCompletada}`

    const html = buildEmailHtml(payload)

    console.log(`Sending stage email to ${payload.destinatarios.length} recipients for PIM ${pimLabel}`)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: payload.destinatarios,
        subject,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text()
      console.error(`Resend API error [${resendResponse.status}]: ${errorBody}`)
      throw new Error(`Resend API returned ${resendResponse.status}: ${errorBody}`)
    }

    const resendData = await resendResponse.json()
    console.log(`Email sent successfully. Resend ID: ${resendData.id}`)

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Send stage email error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
