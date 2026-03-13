import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStageSteps,
  fetchCurrentStep,
  initializeSteps as initializeStepsService,
  completeStep as completeStepService,
  skipSteps as skipStepsService,
  reactivateStep as reactivateStepService,
  updateStepData as updateStepDataService,
} from '@/services/stepsService';

// Re-export types from the service layer
export type { StageStep } from '@/services/stepsService';

// --- Queries ---

/** All steps for a PIM stage */
export function useStageSteps(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['stage-steps', pimId, stageKey],
    queryFn: () => fetchStageSteps(pimId!, stageKey!),
    enabled: !!pimId && !!stageKey,
  });
}

/** Get the current active step (first non-completed) */
export function useCurrentStep(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['current-step', pimId, stageKey],
    queryFn: () => fetchCurrentStep(pimId!, stageKey!),
    enabled: !!pimId && !!stageKey,
  });
}

// --- Mutations ---

/** Initialize all steps for a stage (creates rows in pim_stage_steps) */
export function useInitializeSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initializeStepsService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

/** Complete a step and activate the next one */
export function useCompleteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeStepService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

/** Skip conditional steps and activate the next pending step */
export function useSkipSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: skipStepsService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

/** Reactivate a step (e.g., when COMEX rejects or admin reverts) */
export function useReactivateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateStepService,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['pim-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages'] });
    },
  });
}

/** Update step data (JSONB) without changing status */
export function useUpdateStepData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, pimId, stageKey, datos }: { stepId: string; pimId: string; stageKey: string; datos: Record<string, unknown> }) =>
      updateStepDataService(stepId, datos),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
    },
  });
}
