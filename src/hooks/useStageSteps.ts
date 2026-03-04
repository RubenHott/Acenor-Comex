import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStageSteps } from '@/lib/stageStepDefinitions';

function generateId() {
  return crypto.randomUUID();
}

// --- Types ---

export interface StageStep {
  id: string;
  pim_id: string;
  stage_key: string;
  step_key: string;
  step_order: number;
  status: 'pendiente' | 'en_progreso' | 'completado' | 'saltado';
  completado_por: string | null;
  completado_por_nombre: string | null;
  completado_en: string | null;
  datos: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- Queries ---

/** All steps for a PIM stage */
export function useStageSteps(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['stage-steps', pimId, stageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_stage_steps')
        .select('*')
        .eq('pim_id', pimId!)
        .eq('stage_key', stageKey!)
        .order('step_order', { ascending: true });
      if (error) throw error;
      return data as StageStep[];
    },
    enabled: !!pimId && !!stageKey,
  });
}

/** Get the current active step (first non-completed) */
export function useCurrentStep(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['current-step', pimId, stageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_stage_steps')
        .select('*')
        .eq('pim_id', pimId!)
        .eq('stage_key', stageKey!)
        .eq('status', 'en_progreso')
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as StageStep | null;
    },
    enabled: !!pimId && !!stageKey,
  });
}

// --- Mutations ---

/** Initialize all steps for a stage (creates rows in pim_stage_steps) */
export function useInitializeSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      stageKey,
      userId,
      userName,
    }: {
      pimId: string;
      stageKey: string;
      userId?: string;
      userName?: string;
    }) => {
      // Check if steps already exist
      const { count } = await supabase
        .from('pim_stage_steps')
        .select('id', { count: 'exact', head: true })
        .eq('pim_id', pimId)
        .eq('stage_key', stageKey);

      if (count && count > 0) return; // Already initialized

      const stepDefs = getStageSteps(stageKey);
      if (stepDefs.length === 0) return;

      const rows = stepDefs.map((step, idx) => ({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        step_key: step.key,
        step_order: step.order,
        status: idx === 0 ? 'en_progreso' : 'pendiente',
        datos: {},
      }));

      const { error } = await supabase.from('pim_stage_steps').insert(rows);
      if (error) throw error;

      // Log initialization
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'step_completed',
        descripcion: `Flujo de pasos inicializado para "${stageKey}" con ${stepDefs.length} pasos`,
        usuario: userName || 'Sistema',
        usuario_id: userId || null,
        metadata: { action: 'initialize_steps', step_count: stepDefs.length },
      });
    },
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
    mutationFn: async ({
      stepId,
      pimId,
      stageKey,
      stepKey,
      stepName,
      userId,
      userName,
      datos,
    }: {
      stepId: string;
      pimId: string;
      stageKey: string;
      stepKey: string;
      stepName: string;
      userId: string;
      userName: string;
      datos?: Record<string, unknown>;
    }) => {
      const now = new Date().toISOString();

      // Complete current step
      const updatePayload: Record<string, unknown> = {
        status: 'completado',
        completado_por: userId,
        completado_por_nombre: userName,
        completado_en: now,
        updated_at: now,
      };
      if (datos) {
        updatePayload.datos = datos;
      }

      const { error: updateErr } = await supabase
        .from('pim_stage_steps')
        .update(updatePayload)
        .eq('id', stepId);
      if (updateErr) throw updateErr;

      // Find and activate next step
      const { data: allSteps } = await supabase
        .from('pim_stage_steps')
        .select('*')
        .eq('pim_id', pimId)
        .eq('stage_key', stageKey)
        .order('step_order', { ascending: true });

      if (allSteps) {
        const currentIdx = allSteps.findIndex((s) => s.id === stepId);
        const nextStep = allSteps[currentIdx + 1];
        if (nextStep && nextStep.status === 'pendiente') {
          await supabase
            .from('pim_stage_steps')
            .update({ status: 'en_progreso', updated_at: now })
            .eq('id', nextStep.id);
        }
      }

      // Log activity
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'step_completed',
        descripcion: `Paso "${stepName}" completado`,
        usuario: userName,
        usuario_id: userId,
        metadata: { step_key: stepKey, step_name: stepName, datos },
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

/** Skip conditional steps (e.g., steps 3 & 4 when no NC) */
export function useSkipSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      stageKey,
      stepKeys,
      motivo,
      userId,
      userName,
    }: {
      pimId: string;
      stageKey: string;
      stepKeys: string[];
      motivo: string;
      userId: string;
      userName: string;
    }) => {
      const now = new Date().toISOString();

      for (const stepKey of stepKeys) {
        await supabase
          .from('pim_stage_steps')
          .update({
            status: 'saltado',
            completado_por: userId,
            completado_por_nombre: userName,
            completado_en: now,
            updated_at: now,
            datos: { saltado: true, motivo },
          })
          .eq('pim_id', pimId)
          .eq('stage_key', stageKey)
          .eq('step_key', stepKey);

        await supabase.from('pim_activity_log').insert({
          id: generateId(),
          pim_id: pimId,
          stage_key: stageKey,
          tipo: 'step_skipped',
          descripcion: `Paso "${stepKey}" saltado: ${motivo}`,
          usuario: userName,
          usuario_id: userId,
          metadata: { step_key: stepKey, motivo },
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

/** Reactivate a step (e.g., when COMEX rejects subsanación or admin reverts) */
export function useReactivateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      stageKey,
      stepKey,
      motivo,
      userId,
      userName,
    }: {
      pimId: string;
      stageKey: string;
      stepKey: string;
      motivo: string;
      userId: string;
      userName: string;
    }) => {
      const now = new Date().toISOString();

      // Set the target step back to en_progreso
      await supabase
        .from('pim_stage_steps')
        .update({
          status: 'en_progreso',
          completado_por: null,
          completado_por_nombre: null,
          completado_en: null,
          updated_at: now,
        })
        .eq('pim_id', pimId)
        .eq('stage_key', stageKey)
        .eq('step_key', stepKey);

      // Reset ALL later steps (en_progreso or completado) back to pendiente
      // This includes cierre_proceso which may have been auto-completed
      const { data: allSteps } = await supabase
        .from('pim_stage_steps')
        .select('*')
        .eq('pim_id', pimId)
        .eq('stage_key', stageKey)
        .order('step_order', { ascending: true });

      if (allSteps) {
        const targetStep = allSteps.find((s) => s.step_key === stepKey);
        if (targetStep) {
          const laterSteps = allSteps.filter(
            (s) => s.step_order > targetStep.step_order && (s.status === 'en_progreso' || s.status === 'completado')
          );
          for (const s of laterSteps) {
            await supabase
              .from('pim_stage_steps')
              .update({
                status: 'pendiente',
                completado_por: null,
                completado_por_nombre: null,
                completado_en: null,
                datos: {},
                updated_at: now,
              })
              .eq('id', s.id);
          }
        }
      }

      // If the stage was already completed, revert it to en_progreso
      const { data: stageData } = await supabase
        .from('pim_tracking_stages')
        .select('status')
        .eq('pim_id', pimId)
        .eq('stage_key', stageKey)
        .single();

      if (stageData?.status === 'completado') {
        await supabase
          .from('pim_tracking_stages')
          .update({ status: 'en_progreso', fecha_fin: null, updated_at: now })
          .eq('pim_id', pimId)
          .eq('stage_key', stageKey);

        // Also revert the next stage if it was started as a result of the advance
        // Find stages that started after this one was completed
        const { data: allStages } = await supabase
          .from('pim_tracking_stages')
          .select('*')
          .eq('pim_id', pimId)
          .order('created_at', { ascending: true });

        if (allStages) {
          // Find stages that are en_progreso and have no completed steps (just initialized)
          for (const stage of allStages) {
            if (stage.stage_key !== stageKey && stage.status === 'en_progreso') {
              const { count } = await supabase
                .from('pim_stage_steps')
                .select('id', { count: 'exact', head: true })
                .eq('pim_id', pimId)
                .eq('stage_key', stage.stage_key)
                .eq('status', 'completado');

              // Only revert stages with no completed steps (freshly started)
              if (!count || count === 0) {
                await supabase
                  .from('pim_tracking_stages')
                  .update({ status: 'pendiente', fecha_inicio: null, updated_at: now })
                  .eq('pim_id', pimId)
                  .eq('stage_key', stage.stage_key);
              }
            }
          }
        }
      }

      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'step_reactivated',
        descripcion: `Paso "${stepKey}" reactivado: ${motivo}`,
        usuario: userName,
        usuario_id: userId,
        metadata: { step_key: stepKey, motivo },
      });
    },
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
    mutationFn: async ({
      stepId,
      pimId,
      stageKey,
      datos,
    }: {
      stepId: string;
      pimId: string;
      stageKey: string;
      datos: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from('pim_stage_steps')
        .update({ datos, updated_at: new Date().toISOString() })
        .eq('id', stepId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId, vars.stageKey] });
      queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId, vars.stageKey] });
    },
  });
}
