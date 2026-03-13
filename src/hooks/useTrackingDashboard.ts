import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import { getStageSteps } from '@/lib/stageStepDefinitions';

export interface PIMTrackingInfo {
  pimId: string;
  // Current stage
  currentStageKey: string | null;
  currentStageName: string | null;
  currentStageColor: string | null;
  stageIndex: number; // 0-3
  completedStages: number;
  // Current step within stage
  currentStepName: string | null;
  completedSteps: number;
  totalSteps: number;
  // Timing
  diasEnProceso: number;
  fechaInicio: string | null;
  // Responsable
  responsable: string | null;
  departamento: string | null;
  // SLA
  slaStatus: 'verde' | 'amarillo' | 'rojo';
  slaDays: number;
  // Is completed
  allComplete: boolean;
  // Logistics (from step datos)
  nroBl: string | null;
  vapor: string | null;
  nroInvoice: string | null;
  fechaEmbarqueReal: string | null;
  fechaArribo: string | null;
  derechosUsd: number | null;
  // Payment status (inferred from tracking)
  paymentStatus: 'pendiente' | 'en_proceso' | 'pagado';
}

function daysBetween(from: string, to: Date = new Date()): number {
  const start = new Date(from);
  const diff = to.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function useTrackingDashboard() {
  return useQuery({
    queryKey: ['tracking-dashboard'],
    queryFn: async () => {
      // Query 1: All tracking stages with full details
      const { data: stagesData, error: stagesErr } = await supabase
        .from('pim_tracking_stages')
        .select('pim_id, stage_key, status, fecha_inicio, responsable')
        .order('created_at', { ascending: true });
      if (stagesErr) throw stagesErr;

      // Query 2: All steps (include datos for logistics extraction)
      const { data: stepsData, error: stepsErr } = await supabase
        .from('pim_stage_steps')
        .select('pim_id, stage_key, step_key, status, datos')
        .order('step_order', { ascending: true });
      if (stepsErr) throw stepsErr;

      // Build maps
      const stagesByPim = new Map<string, typeof stagesData>();
      for (const row of stagesData || []) {
        if (!stagesByPim.has(row.pim_id)) stagesByPim.set(row.pim_id, []);
        stagesByPim.get(row.pim_id)!.push(row);
      }

      const stepsByPimStage = new Map<string, typeof stepsData>();
      for (const row of stepsData || []) {
        const key = `${row.pim_id}::${row.stage_key}`;
        if (!stepsByPimStage.has(key)) stepsByPimStage.set(key, []);
        stepsByPimStage.get(key)!.push(row);
      }

      // Index all steps by pimId for cross-stage lookups
      const allStepsByPim = new Map<string, typeof stepsData>();
      for (const row of stepsData || []) {
        if (!allStepsByPim.has(row.pim_id)) allStepsByPim.set(row.pim_id, []);
        allStepsByPim.get(row.pim_id)!.push(row);
      }

      // Build result map
      const result = new Map<string, PIMTrackingInfo>();

      for (const [pimId, stages] of stagesByPim) {
        const stageMap = new Map(stages.map((s) => [s.stage_key, s]));
        const completedStages = stages.filter((s) => s.status === 'completado').length;
        const allComplete = completedStages === TRACKING_STAGES.length;

        // Find current (en_progreso) stage
        const currentStage = stages.find((s) => s.status === 'en_progreso');
        const currentStageKey = currentStage?.stage_key || null;
        const currentStageDef = currentStageKey
          ? TRACKING_STAGES.find((s) => s.key === currentStageKey)
          : null;
        const stageIndex = currentStageDef
          ? TRACKING_STAGES.indexOf(currentStageDef)
          : allComplete
            ? TRACKING_STAGES.length
            : -1;

        // Current step info
        let currentStepName: string | null = null;
        let completedSteps = 0;
        let totalSteps = 0;

        if (currentStageKey) {
          const stepDefs = getStageSteps(currentStageKey);
          // Exclude cierre_proceso from count
          const trackableStepDefs = stepDefs.filter((d) => d.key !== 'cierre_proceso');
          totalSteps = trackableStepDefs.length;

          const pimSteps = stepsByPimStage.get(`${pimId}::${currentStageKey}`) || [];
          const stepStatusMap = new Map(pimSteps.map((s) => [s.step_key, s.status]));

          completedSteps = trackableStepDefs.filter(
            (d) => stepStatusMap.get(d.key) === 'completado' || stepStatusMap.get(d.key) === 'saltado'
          ).length;

          // Find the current in_progreso step
          const activeStep = pimSteps.find((s) => s.status === 'en_progreso');
          if (activeStep) {
            const stepDef = stepDefs.find((d) => d.key === activeStep.step_key);
            currentStepName = stepDef?.name || activeStep.step_key;
          }
        }

        // Timing
        const fechaInicio = currentStage?.fecha_inicio || null;
        const diasEnProceso = fechaInicio ? daysBetween(fechaInicio) : 0;

        // SLA
        const slaDays = currentStageDef?.slaDefaultDays || 10;
        let slaStatus: 'verde' | 'amarillo' | 'rojo' = 'verde';
        if (diasEnProceso > slaDays) slaStatus = 'rojo';
        else if (diasEnProceso > slaDays * 0.7) slaStatus = 'amarillo';

        // Extract logistics data from step datos
        const pimAllSteps = allStepsByPim.get(pimId) || [];
        const recepcionDocsStep = pimAllSteps.find(
          (s) => s.step_key === 'recepcion_docs_digitales' && s.status === 'completado'
        );
        const gestionPagoIntStep = pimAllSteps.find(
          (s) => s.step_key === 'gestion_pago_internacion' && s.status === 'completado'
        );

        const recepcionDatos = recepcionDocsStep?.datos as any;
        const gestionDatos = gestionPagoIntStep?.datos as any;

        // Payment status from P2 (gestion_pago) stage
        const p2Stage = stageMap.get('gestion_pago');
        let paymentStatus: 'pendiente' | 'en_proceso' | 'pagado' = 'pendiente';
        if (p2Stage?.status === 'completado') paymentStatus = 'pagado';
        else if (p2Stage?.status === 'en_progreso') paymentStatus = 'en_proceso';

        result.set(pimId, {
          pimId,
          currentStageKey,
          currentStageName: currentStageDef?.name || null,
          currentStageColor: currentStageDef?.color || null,
          stageIndex,
          completedStages,
          currentStepName,
          completedSteps,
          totalSteps,
          diasEnProceso,
          fechaInicio,
          responsable: currentStage?.responsable || null,
          departamento: null,
          slaStatus: allComplete ? 'verde' : slaStatus,
          slaDays,
          allComplete,
          // Logistics
          nroBl: recepcionDatos?.nro_bl || null,
          vapor: recepcionDatos?.vapor || null,
          nroInvoice: recepcionDatos?.nro_invoice || null,
          fechaEmbarqueReal: recepcionDatos?.fecha_embarque_real || null,
          fechaArribo: recepcionDatos?.fecha_arribo || null,
          derechosUsd: gestionDatos?.derechos_usd ?? null,
          paymentStatus,
        });
      }

      return result;
    },
    staleTime: 15000,
  });
}
