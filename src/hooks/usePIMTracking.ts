import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTrackingStages,
  fetchAllTrackingStages,
  fetchChecklistItems,
  fetchActivityLog,
  checkCanAdvanceStage,
  fetchChildPIMs,
  fetchParentPIM,
  initializeTracking as initializeTrackingService,
  toggleChecklistItem as toggleChecklistService,
  updateStageStatus as updateStageStatusService,
  advanceStage as advanceStageService,
  returnStage as returnStageService,
  addNote as addNoteService,
  assignStageResponsable as assignStageResponsableService,
} from '@/services/trackingService';

// Re-export types from the service layer
export type {
  TrackingStage,
  ChecklistItem,
  ActivityLog,
  StageBlocker,
  CanAdvanceResult,
} from '@/services/trackingService';

// --- Initialize Tracking ---

export function useInitializeTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initializeTrackingService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// --- Fetch stages for a single PIM ---

export function useTrackingStages(pimId?: string) {
  return useQuery({
    queryKey: ['tracking-stages', pimId],
    queryFn: () => fetchTrackingStages(pimId!),
    enabled: !!pimId,
  });
}

// --- Fetch tracking stages for ALL PIMs (list/dashboard views) ---

export function useAllTrackingStages() {
  return useQuery({
    queryKey: ['tracking-stages', 'all'],
    queryFn: fetchAllTrackingStages,
    staleTime: 15000,
  });
}

// --- Fetch checklist items ---

export function useChecklistItems(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['checklist-items', pimId, stageKey],
    queryFn: () => fetchChecklistItems(pimId!, stageKey),
    enabled: !!pimId,
  });
}

// --- Toggle checklist item ---

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleChecklistService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId, vars.stageKey] });
    },
  });
}

// --- Update stage status ---

export function useUpdateStageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStageStatusService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// --- Gate Validation: Can Advance Stage ---

export function useCanAdvanceStage(
  pimId?: string,
  stageKey?: string,
  modalidadPago?: string
) {
  return useQuery({
    queryKey: ['can-advance', pimId, stageKey, modalidadPago],
    queryFn: () => checkCanAdvanceStage(pimId!, stageKey!, modalidadPago),
    enabled: !!pimId && !!stageKey,
    staleTime: 5000,
  });
}

// --- Advance Stage (with gate validation) ---

export function useAdvanceStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: advanceStageService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['pim-data', vars.pimId] });
    },
  });
}

// --- Return Stage ---

export function useReturnStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: returnStageService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

// --- Add note ---

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addNoteService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// --- Fetch activity log ---

export function useActivityLog(pimId?: string) {
  return useQuery({
    queryKey: ['activity-log', pimId],
    queryFn: () => fetchActivityLog(pimId!),
    enabled: !!pimId,
  });
}

// Re-export from dedicated module for backward compatibility
export { useSplitPIM, type SplitItemConfig } from './usePIMSplit';

// --- Assign Responsable to a Stage ---

export function useAssignStageResponsable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignStageResponsableService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// --- Fetch Child PIMs ---

export function useChildPIMs(pimId?: string) {
  return useQuery({
    queryKey: ['child-pims', pimId],
    queryFn: () => fetchChildPIMs(pimId!),
    enabled: !!pimId,
  });
}

// --- Fetch Parent PIM code ---

export function useParentPIM(pimPadreId?: string | null) {
  return useQuery({
    queryKey: ['parent-pim', pimPadreId],
    queryFn: () => fetchParentPIM(pimPadreId!),
    enabled: !!pimPadreId,
  });
}
