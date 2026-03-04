/**
 * Email trigger definitions: determine when, to whom, and what content to send.
 *
 * These are invoked client-side after specific mutations succeed.
 * They build the email payload and call the useSendEmail hook.
 */

export interface EmailPayload {
  to: string[];
  subject: string;
  htmlBody: string;
  pimId?: string;
  ncId?: string;
}

// --- Template helpers ---

function wrapHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #2563eb;">Acenor COMEX</h2>
  </div>
  ${content}
  <div style="margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
    Este es un mensaje automatico del sistema Acenor COMEX. No responda a este correo.
  </div>
</body>
</html>`.trim();
}

// --- Trigger functions ---

/** NC created in a stage */
export function buildNCCreatedEmail(params: {
  pimCodigo: string;
  ncCodigo: string;
  ncTipo: string;
  ncDescripcion: string;
  ncPrioridad: string;
  stageNombre: string;
  creadoPor: string;
  destinatarios: string[];
}): EmailPayload {
  const prioridadColors: Record<string, string> = {
    baja: '#6B7280',
    media: '#F59E0B',
    alta: '#EF4444',
    critica: '#DC2626',
  };
  const prioridadColor = prioridadColors[params.ncPrioridad] || '#6B7280';

  return {
    to: params.destinatarios,
    subject: `[PIM ${params.pimCodigo}] NC ${params.ncCodigo} en ${params.stageNombre}`,
    htmlBody: wrapHtml(`
      <h3 style="color: #EF4444;">No Conformidad Creada</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 140px;">PIM</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.pimCodigo}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">NC</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.ncCodigo}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Tipo</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.ncTipo}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Prioridad</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><span style="color: ${prioridadColor}; font-weight: 600;">${params.ncPrioridad.toUpperCase()}</span></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Etapa</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.stageNombre}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Creada por</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.creadoPor}</td></tr>
      </table>
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600;">Descripcion:</p>
        <p style="margin: 8px 0 0;">${params.ncDescripcion}</p>
      </div>
    `),
  };
}

/** Stage advanced — notification to next department */
export function buildStageAdvanceEmail(params: {
  pimCodigo: string;
  etapaCompletada: string;
  siguienteEtapa: string;
  departamentoSiguiente: string;
  avanzadoPor: string;
  destinatarios: string[];
  resumen?: { totalUsd?: number; proveedor?: string; modalidadPago?: string };
}): EmailPayload {
  const resumenHtml = params.resumen
    ? `<div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600; font-size: 13px;">Resumen:</p>
        ${params.resumen.proveedor ? `<p style="margin: 4px 0 0; font-size: 13px;">Proveedor: ${params.resumen.proveedor}</p>` : ''}
        ${params.resumen.totalUsd ? `<p style="margin: 4px 0 0; font-size: 13px;">Monto: USD ${params.resumen.totalUsd.toLocaleString()}</p>` : ''}
        ${params.resumen.modalidadPago ? `<p style="margin: 4px 0 0; font-size: 13px;">Modalidad: ${params.resumen.modalidadPago}</p>` : ''}
      </div>`
    : '';

  return {
    to: params.destinatarios,
    subject: `[PIM ${params.pimCodigo}] Etapa "${params.siguienteEtapa}" iniciada`,
    htmlBody: wrapHtml(`
      <h3 style="color: #10B981;">Etapa Completada</h3>
      <p>La etapa <strong>"${params.etapaCompletada}"</strong> del PIM <strong>${params.pimCodigo}</strong> ha sido completada.</p>
      <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;">Siguiente etapa: <strong>${params.siguienteEtapa}</strong></p>
        <p style="margin: 8px 0 0;">Departamento: <strong>${params.departamentoSiguiente}</strong></p>
      </div>
      ${resumenHtml}
      <p style="font-size: 13px; color: #6B7280;">Avanzado por: ${params.avanzadoPor}</p>
    `),
  };
}

/** SWIFT received — notify COMEX */
export function buildSwiftReceivedEmail(params: {
  pimCodigo: string;
  destinatarios: string[];
}): EmailPayload {
  return {
    to: params.destinatarios,
    subject: `[PIM ${params.pimCodigo}] SWIFT recibido`,
    htmlBody: wrapHtml(`
      <h3 style="color: #2563eb;">SWIFT Recibido</h3>
      <p>Se ha recibido el SWIFT para el PIM <strong>${params.pimCodigo}</strong>.</p>
      <p>El documento esta disponible para enviar al proveedor.</p>
    `),
  };
}

/** NC iteration — notify responsible area */
export function buildNCIterationEmail(params: {
  pimCodigo: string;
  ncCodigo: string;
  iteracionTipo: string;
  iteracionDescripcion: string;
  iteracionNumero: number;
  creadoPor: string;
  destinatarios: string[];
}): EmailPayload {
  return {
    to: params.destinatarios,
    subject: `[PIM ${params.pimCodigo}] NC ${params.ncCodigo} - ${params.iteracionTipo} (#${params.iteracionNumero})`,
    htmlBody: wrapHtml(`
      <h3 style="color: #F59E0B;">Actualizacion de No Conformidad</h3>
      <p>La NC <strong>${params.ncCodigo}</strong> del PIM <strong>${params.pimCodigo}</strong> tiene una nueva iteracion.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 140px;">Iteracion</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">#${params.iteracionNumero} - ${params.iteracionTipo}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Por</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.creadoPor}</td></tr>
      </table>
      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;">${params.iteracionDescripcion}</p>
      </div>
    `),
  };
}
