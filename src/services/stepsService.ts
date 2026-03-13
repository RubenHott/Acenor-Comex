/**
 * Stage-steps data-access service — pure async functions (no React dependencies).
 *
 * Consumed by the React hooks in `useStageSteps.ts`.
 */
import { supabase } from '@/integrations/supabase/client';
import { getStageSteps, getStepsToSkipByPaymentMode, getPaymentModeLabel } from '@/lib/stageStepDefinitions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

function generateId() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function fetchStageSteps(pimId: string, stageKey: string) {
  const { data, error } = await supabase
    .from('pim_stage_steps')
    .select('*')
    .eq('pim_id', pimId)
    .eq('stage_key', stageKey)
    .order('step_order', { ascending: true });
  if (error) throw error;
  return data as StageStep[];
}

export async function fetchCurrentStep(pimId: string, stageKey: string) {
  const { data, error } = await supabase
    .from('pim_stage_steps')
    .select('*')
    .eq('pim_id', pimId)
    .eq('stage_key', stageKey)
    .eq('status', 'en_progreso')
    .order('step_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as StageStep | null;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface InitializeStepsParams {
  pimId: string;
  stageKey: string;
  userId?: string;
  userName?: string;
  modalidadPago?: string;
}

export async function initializeSteps(params: InitializeStepsParams) {
  const { pimId, stageKey, userId, userName, modalidadPago } = params;

  const { count } = await supabase
    .from('pim_stage_steps')
    .select('id', { count: 'exact', head: true })
    .eq('pim_id', pimId)
    .eq('stage_key', stageKey);

  if (count && count > 0) return; // Already initialized

  const stepDefs = getStageSteps(stageKey);
  if (stepDefs.length === 0) return;

  const stepsToSkip = modalidadPago
    ? new Set(getStepsToSkipByPaymentMode(stageKey, modalidadPago))
    : new Set<string>();

  const rows = stepDefs.map((step, idx) => ({
    id: generateId(),
    pim_id: pimId,
    stage_key: stageKey,
    step_key: step.key,
    step_order: step.order,
    status: stepsToSkip.has(step.key)
      ? 'saltado'
      : idx === 0
        ? 'en_progreso'
        : 'pendiente',
    datos: stepsToSkip.has(step.key)
      ? { saltado: true, motivo: `No aplica para modalidad: ${getPaymentModeLabel(modalidadPago!)}` }
      : {},
  }));

  const firstNonSkipped = rows.find((r) => r.status !== 'saltado');
  if (firstNonSkipped && firstNonSkipped.status === 'pendiente') {
    firstNonSkipped.status = 'en_progreso';
  }

  const { error } = await supabase.from('pim_stage_steps').insert(rows);
  if (error) throw error;

  const skippedCount = stepsToSkip.size;
  const activeCount = stepDefs.length - skippedCount;

  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: stageKey,
    tipo: 'step_completed',
    descripcion: `Flujo de pasos inicializado para "${stageKey}" con ${activeCount} pasos activos${skippedCount > 0 ? ` (${skippedCount} saltados por modalidad ${getPaymentModeLabel(modalidadPago!)})` : ''}`,
    usuario: userName || 'Sistema',
    usuario_id: userId || null,
    metadata: { action: 'initialize_steps', step_count: stepDefs.length, skipped: skippedCount, modalidadPago },
  });
}

export interface CompleteStepParams {
  stepId: string;
  pimId: string;
  stageKey: string;
  stepKey: string;
  stepName: string;
  userId: string;
  userName: string;
  datos?: Record<string, unknown>;
}

export async function completeStep(params: CompleteStepParams) {
  const { stepId, pimId, stageKey, stepKey, stepName, userId, userName, datos } = params;
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status: 'completado',
    completado_por: userId,
    completado_por_nombre: userName,
    completado_en: now,
    updated_at: now,
  };
  if (datos) updatePayload.datos = datos;

  const { error: updateErr } = await supabase
    .from('pim_stage_steps')
    .update(updatePayload)
    .eq('id', stepId);
  if (updateErr) throw updateErr;

  // Find and activate next step
  const { data: allSteps } = await supabase
    .from('pim_stage_steps')
    .select('id, step_order, status')
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
}

export interface SkipStepsParams {
  pimId: string;
  stageKey: string;
  stepKeys: string[];
  motivo: string;
  userId: string;
  userName: string;
}

export async function skipSteps(params: SkipStepsParams) {
  const { pimId, stageKey, stepKeys, motivo, userId, userName } = params;
  const now = new Date().toISOString();

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
    .in('step_key', stepKeys);

  await supabase.from('pim_activity_log').insert(
    stepKeys.map((stepKey) => ({
      id: generateId(),
      pim_id: pimId,
      stage_key: stageKey,
      tipo: 'step_skipped',
      descripcion: `Paso "${stepKey}" saltado: ${motivo}`,
      usuario: userName,
      usuario_id: userId,
      metadata: { step_key: stepKey, motivo },
    }))
  );

  const { data: allSteps } = await supabase
    .from('pim_stage_steps')
    .select('id, status, step_order')
    .eq('pim_id', pimId)
    .eq('stage_key', stageKey)
    .order('step_order', { ascending: true });

  if (allSteps) {
    const nextPending = allSteps.find((s) => s.status === 'pendiente');
    if (nextPending) {
      await supabase
        .from('pim_stage_steps')
        .update({ status: 'en_progreso', updated_at: now })
        .eq('id', nextPending.id);
    }
  }
}

export interface ReactivateStepParams {
  pimId: string;
  stageKey: string;
  stepKey: string;
  motivo: string;
  userId: string;
  userName: string;
}

export async function reactivateStep(params: ReactivateStepParams) {
  const { pimId, stageKey, stepKey, motivo, userId, userName } = params;
  const now = new Date().toISOString();

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

  const { data: allSteps } = await supabase
    .from('pim_stage_steps')
    .select('id, step_key, step_order, status')
    .eq('pim_id', pimId)
    .eq('stage_key', stageKey)
    .order('step_order', { ascending: true });

  if (allSteps) {
    const targetStep = allSteps.find((s) => s.step_key === stepKey);
    if (targetStep) {
      const laterStepIds = allSteps
        .filter(
          (s) => s.step_order > targetStep.step_order && (s.status === 'en_progreso' || s.status === 'completado')
        )
        .map((s) => s.id);
      if (laterStepIds.length > 0) {
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
          .in('id', laterStepIds);
      }
    }
  }

  // Revert stage if it was completed
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

    const { data: allStages } = await supabase
      .from('pim_tracking_stages')
      .select('stage_key, status')
      .eq('pim_id', pimId)
      .order('created_at', { ascending: true });

    if (allStages) {
      for (const stage of allStages) {
        if (stage.stage_key !== stageKey && stage.status === 'en_progreso') {
          const { count } = await supabase
            .from('pim_stage_steps')
            .select('id', { count: 'exact', head: true })
            .eq('pim_id', pimId)
            .eq('stage_key', stage.stage_key)
            .eq('status', 'completado');

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
}

export async function updateStepData(stepId: string, datos: Record<string, unknown>) {
  const { error } = await supabase
    .from('pim_stage_steps')
    .update({ datos, updated_at: new Date().toISOString() })
    .eq('id', stepId);
  if (error) throw error;
}
