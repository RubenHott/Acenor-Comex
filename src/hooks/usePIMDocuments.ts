import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentType } from '@/lib/trackingChecklists';

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

const DOCUMENT_TYPES = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'cierre_compra', label: 'Cierre de Compra' },
  { value: 'factura', label: 'Factura Comercial' },
  { value: 'bl', label: 'Bill of Lading (BL)' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'swift', label: 'SWIFT' },
  { value: 'comprobante_pago', label: 'Comprobante de Pago' },
  { value: 'certificado_calidad', label: 'Certificado de Calidad' },
  { value: 'certificado_origen', label: 'Certificado de Origen' },
  { value: 'enmienda', label: 'Enmienda' },
  { value: 'costeo', label: 'Costeo' },
  { value: 'acta_recepcion', label: 'Acta de Recepción' },
  { value: 'dus', label: 'DUS (Declaración Única de Salida)' },
  { value: 'alzamiento', label: 'Alzamiento' },
  { value: 'otro', label: 'Otro' },
] as const;

export { DOCUMENT_TYPES };

function generateId() {
  return crypto.randomUUID();
}

export function usePIMDocuments(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['pim-documents', pimId, stageKey],
    queryFn: async () => {
      let query = supabase
        .from('pim_documentos')
        .select('*')
        .eq('pim_id', pimId!);
      if (stageKey) query = query.eq('stage_key', stageKey);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PIMDocument[];
    },
    enabled: !!pimId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      file,
      tipo,
      stageKey,
      observaciones,
      usuario,
      versionGroup,
      version,
    }: {
      pimId: string;
      file: File;
      tipo: string;
      stageKey: string;
      observaciones?: string;
      usuario: string;
      versionGroup?: string;
      version?: number;
    }) => {
      const ext = file.name.split('.').pop();
      const filePath = `${pimId}/${stageKey}/${generateId()}.${ext}`;

      // Upload to storage
      console.log('[Upload] Starting storage upload:', filePath);
      const { error: uploadErr } = await supabase.storage
        .from('pim-documentos')
        .upload(filePath, file);
      if (uploadErr) {
        console.error('[Upload] Storage error:', uploadErr);
        throw new Error(`Storage: ${uploadErr.message}`);
      }
      console.log('[Upload] Storage OK');

      const { data: urlData } = supabase.storage
        .from('pim-documentos')
        .getPublicUrl(filePath);

      const docId = generateId();
      const group = versionGroup || generateId();

      // Save metadata
      console.log('[Upload] Inserting metadata:', { docId, pimId, tipo, stageKey });
      const { error: insertErr } = await supabase
        .from('pim_documentos')
        .insert({
          id: docId,
          pim_id: pimId,
          tipo,
          nombre: file.name,
          url: urlData.publicUrl,
          subido_por: usuario,
          observaciones: observaciones || null,
          stage_key: stageKey,
          version: version || 1,
          version_group: group,
        });
      if (insertErr) {
        console.error('[Upload] Metadata insert error:', insertErr);
        throw new Error(`Metadata: ${insertErr.message}`);
      }
      console.log('[Upload] Metadata OK');

      // Log activity
      const { error: logErr } = await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'note',
        descripcion: `Documento subido: ${file.name} (${tipo}${version && version > 1 ? ` v${version}` : ''})`,
        usuario,
      });
      if (logErr) console.warn('[Upload] Activity log error (non-fatal):', logErr);

      return { docId, group };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pim-documents', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['stage-doc-status', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ docId, pimId }: { docId: string; pimId: string }) => {
      const { error } = await supabase
        .from('pim_documentos')
        .delete()
        .eq('id', docId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pim-documents', vars.pimId] });
    },
  });
}

// DHL Tracking
export function useDHLTracking() {
  return useMutation({
    mutationFn: async ({
      trackingNumber,
      pimId,
    }: {
      trackingNumber: string;
      pimId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('dhl-tracking', {
        body: { trackingNumber, pimId },
      });
      if (error) throw error;
      return data;
    },
  });
}

// Check required documents for a stage
export interface StageDocumentStatus {
  uploadedTypes: string[];
  missingTypes: DocumentType[];
  allUploaded: boolean;
}

export function useStageDocumentStatus(
  pimId?: string,
  requiredTypes?: DocumentType[]
) {
  return useQuery({
    queryKey: ['stage-doc-status', pimId, requiredTypes],
    queryFn: async (): Promise<StageDocumentStatus> => {
      if (!requiredTypes || requiredTypes.length === 0) {
        return { uploadedTypes: [], missingTypes: [], allUploaded: true };
      }

      const { data: docs } = await supabase
        .from('pim_documentos')
        .select('tipo')
        .eq('pim_id', pimId!);

      const uploadedTypes = [...new Set((docs || []).map((d) => d.tipo))];
      const uploadedSet = new Set(uploadedTypes);
      const missingTypes = requiredTypes.filter((t) => !uploadedSet.has(t));

      return {
        uploadedTypes,
        missingTypes,
        allUploaded: missingTypes.length === 0,
      };
    },
    enabled: !!pimId && !!requiredTypes && requiredTypes.length > 0,
  });
}
