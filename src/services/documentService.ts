/**
 * Document data-access service — pure async functions (no React dependencies).
 *
 * Consumed by the React hooks in `usePIMDocuments.ts`.
 */
import { supabase } from '@/integrations/supabase/client';
import { canDo } from '@/lib/permissions';
import type { UserRole } from '@/types/comex';
import type { DocumentType } from '@/lib/trackingChecklists';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PIMDocument {
  id: string;
  pim_id: string;
  tipo: string;
  nombre: string;
  url: string;
  subido_por: string;
  observaciones: string | null;
  fecha_subida: string | null;
  stage_key: string | null;
  version: number;
  version_group: string | null;
}

export interface StageDocumentStatus {
  uploadedTypes: string[];
  missingTypes: DocumentType[];
  allUploaded: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'cierre_compra', label: 'Cierre de Compra' },
  { value: 'borrador_lc', label: 'Borrador Carta de Crédito' },
  { value: 'factura', label: 'Factura Comercial' },
  { value: 'bl', label: 'Bill of Lading (BL)' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'swift', label: 'SWIFT' },
  { value: 'comprobante_pago', label: 'Comprobante de Pago' },
  { value: 'certificado_calidad', label: 'Certificado de Calidad' },
  { value: 'certificado_origen', label: 'Certificado de Origen' },
  { value: 'enmienda', label: 'Enmienda' },
  { value: 'costeo', label: 'Costeo' },
  { value: 'acta_recepcion', label: 'Acta de Recepcion' },
  { value: 'dus', label: 'DUS (Declaracion Unica de Salida)' },
  { value: 'alzamiento', label: 'Alzamiento' },
  { value: 'otro', label: 'Otro' },
] as const;

/** Allowed MIME types for document uploads */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'message/rfc822',
]);

/** Allowed file extensions (fallback when MIME is empty/generic) */
const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif',
  'xlsx', 'xls', 'docx', 'doc', 'txt', 'csv',
  'zip', 'rar', 'eml', 'msg',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/** Accept string for <input type="file"> */
export const UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.tiff,.tif,.xlsx,.xls,.docx,.doc,.txt,.csv,.zip,.rar,.eml,.msg';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId() {
  return crypto.randomUUID();
}

export function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el tamano maximo de 50 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Tipo de archivo no permitido (.${ext}). Formatos aceptados: PDF, imagenes, Excel, Word, CSV, ZIP.`);
  }
  if (file.type && file.type !== 'application/octet-stream' && !ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Tipo MIME no permitido (${file.type}). Contacte al administrador si necesita subir este formato.`);
  }
}

function buildDocFilename(
  pimCodigo: string | undefined,
  tipo: string,
  version: number | undefined,
  originalFilename: string,
): string {
  if (!pimCodigo) return originalFilename;
  const docType = DOCUMENT_TYPES.find((d) => d.value === tipo);
  const typeLabel = docType
    ? docType.label
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip accents (é→e, ñ→n …)
        .replace(/\s+/g, '_')
        .replace(/[()]/g, '')
    : tipo;
  const ext = originalFilename.split('.').pop() || 'pdf';
  const versionSuffix = version && version > 1 ? `_v${version}` : '';
  const uniqueSuffix = generateId().slice(0, 4);
  return `${pimCodigo}-${typeLabel}${versionSuffix}_${uniqueSuffix}.${ext}`;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function fetchPIMDocuments(pimId: string, stageKey?: string) {
  let query = supabase
    .from('pim_documentos')
    .select('id, pim_id, tipo, nombre, url, subido_por, observaciones, fecha_subida, stage_key, version, version_group')
    .eq('pim_id', pimId);
  if (stageKey) query = query.eq('stage_key', stageKey);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PIMDocument[];
}

export async function fetchStageDocumentStatus(
  pimId: string,
  requiredTypes: DocumentType[],
): Promise<StageDocumentStatus> {
  if (!requiredTypes || requiredTypes.length === 0) {
    return { uploadedTypes: [], missingTypes: [], allUploaded: true };
  }
  const { data: docs } = await supabase
    .from('pim_documentos')
    .select('tipo')
    .eq('pim_id', pimId);

  const uploadedTypes = [...new Set((docs || []).map((d) => d.tipo))];
  const uploadedSet = new Set(uploadedTypes);
  const missingTypes = requiredTypes.filter((t) => !uploadedSet.has(t));

  return { uploadedTypes, missingTypes, allUploaded: missingTypes.length === 0 };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface UploadDocumentParams {
  pimId: string;
  file: File;
  tipo: string;
  stageKey: string;
  observaciones?: string;
  usuario: string;
  versionGroup?: string;
  version?: number;
  userRole?: UserRole;
  pimCodigo?: string;
}

export async function uploadDocument(params: UploadDocumentParams) {
  const { pimId, file, tipo, stageKey, observaciones, usuario, versionGroup, version, userRole, pimCodigo } = params;

  if (userRole && !canDo(userRole, 'upload_document')) {
    throw new Error('No tienes permiso para subir documentos');
  }

  validateFile(file);

  const renamedFilename = buildDocFilename(pimCodigo, tipo, version, file.name);
  const filePath = `${pimId}/${stageKey}/${renamedFilename}`;

  const { error: uploadErr } = await supabase.storage
    .from('pim-documentos')
    .upload(filePath, file);
  if (uploadErr) throw new Error(`Storage: ${uploadErr.message}`);

  const { data: urlData } = supabase.storage
    .from('pim-documentos')
    .getPublicUrl(filePath);

  const docId = generateId();
  const group = versionGroup || generateId();

  const { error: insertErr } = await supabase
    .from('pim_documentos')
    .insert({
      id: docId,
      pim_id: pimId,
      tipo,
      nombre: renamedFilename,
      url: urlData.publicUrl,
      subido_por: usuario,
      observaciones: observaciones || null,
      stage_key: stageKey,
      version: version || 1,
      version_group: group,
    });
  if (insertErr) throw new Error(`Metadata: ${insertErr.message}`);

  // Log activity (non-fatal)
  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: stageKey,
    tipo: 'note',
    descripcion: `Documento subido: ${renamedFilename} (${tipo}${version && version > 1 ? ` v${version}` : ''})`,
    usuario,
  }).then(({ error }) => {
    if (error) console.warn('[Upload] Activity log error (non-fatal):', error);
  });

  return { docId, group };
}

export async function deleteDocument(docId: string, userRole?: UserRole) {
  if (userRole && !canDo(userRole, 'delete_document')) {
    throw new Error('No tienes permiso para eliminar documentos');
  }
  const { error } = await supabase
    .from('pim_documentos')
    .delete()
    .eq('id', docId);
  if (error) throw error;
}

export async function invokeDHLTracking(trackingNumber: string, pimId: string) {
  const { data, error } = await supabase.functions.invoke('dhl-tracking', {
    body: { trackingNumber, pimId },
  });
  if (error) throw error;
  return data;
}
