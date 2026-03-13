import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPIMDocuments,
  fetchStageDocumentStatus,
  uploadDocument,
  deleteDocument,
  invokeDHLTracking,
} from '@/services/documentService';
import type { DocumentType } from '@/lib/trackingChecklists';
import type { UserRole } from '@/types/comex';

// Re-export types and constants from the service layer
export type { PIMDocument, StageDocumentStatus, UploadDocumentParams } from '@/services/documentService';
export { DOCUMENT_TYPES, UPLOAD_ACCEPT, validateFile } from '@/services/documentService';

export function usePIMDocuments(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['pim-documents', pimId, stageKey],
    queryFn: () => fetchPIMDocuments(pimId!, stageKey),
    enabled: !!pimId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
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
    mutationFn: ({ docId, pimId, userRole }: { docId: string; pimId: string; userRole?: UserRole }) =>
      deleteDocument(docId, userRole),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pim-documents', vars.pimId] });
    },
  });
}

// DHL Tracking
export function useDHLTracking() {
  return useMutation({
    mutationFn: ({ trackingNumber, pimId }: { trackingNumber: string; pimId: string }) =>
      invokeDHLTracking(trackingNumber, pimId),
  });
}

export function useStageDocumentStatus(
  pimId?: string,
  requiredTypes?: DocumentType[]
) {
  return useQuery({
    queryKey: ['stage-doc-status', pimId, requiredTypes],
    queryFn: () => fetchStageDocumentStatus(pimId!, requiredTypes!),
    enabled: !!pimId && !!requiredTypes && requiredTypes.length > 0,
  });
}
