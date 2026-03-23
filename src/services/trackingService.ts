/**
 * Tracking data-access service — pure async functions (no React dependencies).
 *
 * Consumed by the React hooks in `usePIMTracking.ts`.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  TRACKING_STAGES,
  getStageByKey,
  getFilteredChecklist,
  getRequiredDocuments,
  type DocumentType,
} from '@/lib/trackingChecklists';
import { canDo, type PIMAction } from '@/lib/permissions';
import type { UserRole } from '@/types/comex';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrackingStage {
  id: string;
  pim_id: string;
  stage_key: string;
  status: string;
  fecha_inicio: string | null;
  fecha_limite: string | null;
  fecha_fin: string | null;
  responsable: string | null;
  notas: string | null;
  departamento: string | null;
  assigned_to: string | null;
  responsable_id: string | null;
}

export interface ChecklistItem {
  id: string;
  pim_id: string;
  stage_key: string;
  checklist_key: string;
  texto: string;
  critico: boolean;
  completado: boolean;
  completado_por: string | null;
  completado_en: string | null;
}

export interface ActivityLog {
  id: string;
  pim_id: string;
  stage_key: string | null;
  tipo: string;
  descripcion: string;
  usuario: string;
  usuario_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StageBlocker {
  type: 'checklist' | 'document' | 'nc' | 'bank_account' | 'lc_bank' | 'steps';
  message: string;
}

export interface CanAdvanceResult {
  canAdvance: boolean;
  blockers: StageBlocker[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId() {
  return crypto.randomUUID();
}

export async function enforcePermission(
  userRole: UserRole | undefined,
  action: PIMAction,
  ctx: { pimId: string; stageKey?: string; usuario: string; usuarioId?: string }
) {
  if (canDo(userRole, action)) return;
  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: ctx.pimId,
    stage_key: ctx.stageKey || null,
    tipo: 'permission_denied',
    descripcion: `Permiso denegado: ${action}`,
    usuario: ctx.usuario,
    usuario_id: ctx.usuarioId || null,
    metadata: { action, role: userRole },
  });
  throw new Error(`No tienes permiso para realizar esta accion (${action})`);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function fetchTrackingStages(pimId: string) {
  const { data, error } = await supabase
    .from('pim_tracking_stages')
    .select('id, pim_id, stage_key, status, fecha_inicio, fecha_limite, fecha_fin, responsable, notas, departamento, assigned_to, responsable_id')
    .eq('pim_id', pimId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as TrackingStage[];
}

export async function fetchAllTrackingStages() {
  const { data, error } = await supabase
    .from('pim_tracking_stages')
    .select('pim_id, stage_key, status')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const map = new Map<string, { stage_key: string; status: string }[]>();
  for (const row of data) {
    if (!map.has(row.pim_id)) map.set(row.pim_id, []);
    map.get(row.pim_id)!.push({ stage_key: row.stage_key, status: row.status });
  }
  return map;
}

export async function fetchChecklistItems(pimId: string, stageKey?: string) {
  let query = supabase
    .from('pim_checklist_items')
    .select('id, pim_id, stage_key, checklist_key, texto, critico, completado, completado_por, completado_en')
    .eq('pim_id', pimId);
  if (stageKey) query = query.eq('stage_key', stageKey);
  query = query.order('created_at', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data as ChecklistItem[];
}

export async function fetchActivityLog(pimId: string) {
  const { data, error } = await supabase
    .from('pim_activity_log')
    .select('id, pim_id, stage_key, tipo, descripcion, usuario, usuario_id, metadata, created_at')
    .eq('pim_id', pimId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as ActivityLog[];
}

export async function checkCanAdvanceStage(
  pimId: string,
  stageKey: string,
  modalidadPago?: string,
): Promise<CanAdvanceResult> {
  const blockers: StageBlocker[] = [];
  const stageDef = getStageByKey(stageKey);
  if (!stageDef) return { canAdvance: false, blockers: [{ type: 'checklist', message: 'Etapa no encontrada' }] };

  if (stageDef.useStepFlow) {
    const { data: steps } = await supabase
      .from('pim_stage_steps')
      .select('step_key, status')
      .eq('pim_id', pimId)
      .eq('stage_key', stageKey);

    if (!steps || steps.length === 0) {
      blockers.push({ type: 'steps', message: 'Pasos no inicializados' });
    } else {
      const pending = steps.filter((s) => s.step_key !== 'cierre_proceso' && s.status !== 'completado' && s.status !== 'saltado');
      if (pending.length > 0) {
        blockers.push({ type: 'steps', message: `${pending.length} paso(s) pendiente(s) de completar` });
      }
    }
    return { canAdvance: blockers.length === 0, blockers };
  }

  // Checklist-based stages
  const { data: checklistItems } = await supabase
    .from('pim_checklist_items')
    .select('critico, completado, texto')
    .eq('pim_id', pimId)
    .eq('stage_key', stageKey);

  const pendingCritical = (checklistItems || []).filter((i) => i.critico && !i.completado);
  if (pendingCritical.length > 0) {
    blockers.push({ type: 'checklist', message: `${pendingCritical.length} item(s) critico(s) pendiente(s)` });
  }

  const requiredDocs = getRequiredDocuments(stageKey, modalidadPago || '');
  if (requiredDocs.length > 0) {
    const { data: uploadedDocs } = await supabase
      .from('pim_documentos')
      .select('tipo')
      .eq('pim_id', pimId);
    const uploadedTypes = new Set((uploadedDocs || []).map((d) => d.tipo));
    const missingDocs = requiredDocs.filter((t) => !uploadedTypes.has(t));
    if (missingDocs.length > 0) {
      blockers.push({ type: 'document', message: `Documento(s) obligatorio(s) faltante(s): ${missingDocs.join(', ')}` });
    }
  }

  if (stageDef.ncBlocks) {
    const { count } = await supabase
      .from('no_conformidades')
      .select('id', { count: 'exact', head: true })
      .eq('pim_id', pimId)
      .eq('stage_key', stageKey)
      .in('estado', ['abierta', 'en_revision']);
    if (count && count > 0) {
      blockers.push({ type: 'nc', message: `${count} no conformidad(es) abierta(s)` });
    }
  }

  return { canAdvance: blockers.length === 0, blockers };
}

export async function fetchChildPIMs(pimId: string) {
  const { data, error } = await supabase
    .from('pims')
    .select('id, codigo')
    .eq('pim_padre_id', pimId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as { id: string; codigo: string }[];
}

export async function fetchParentPIM(pimPadreId: string) {
  const { data, error } = await supabase
    .from('pims')
    .select('id, codigo')
    .eq('id', pimPadreId)
    .single();
  if (error) throw error;
  return data as { id: string; codigo: string };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface InitializeTrackingParams {
  pimId: string;
  modalidadPago: string;
  userId?: string;
  userName?: string;
}

export async function initializeTracking(params: InitializeTrackingParams) {
  const { pimId, modalidadPago, userId, userName } = params;
  const now = new Date().toISOString();

  const stages = TRACKING_STAGES.map((s, idx) => ({
    id: generateId(),
    pim_id: pimId,
    stage_key: s.key,
    status: idx === 0 ? 'en_progreso' : 'pendiente',
    fecha_inicio: idx === 0 ? now : null,
    departamento: s.primaryDepartment,
  }));

  const { error: stageErr } = await supabase
    .from('pim_tracking_stages')
    .insert(stages);
  if (stageErr) throw stageErr;

  const items = TRACKING_STAGES
    .filter((s) => !s.useStepFlow)
    .flatMap((s) => {
      const filtered = getFilteredChecklist(s.key, modalidadPago);
      return filtered.map((c) => ({
        id: generateId(),
        pim_id: pimId,
        stage_key: s.key,
        checklist_key: c.id,
        texto: c.text,
        critico: c.critical,
        completado: false,
      }));
    });

  if (items.length > 0) {
    const { error: checkErr } = await supabase
      .from('pim_checklist_items')
      .insert(items);
    if (checkErr) throw checkErr;
  }

  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    tipo: 'status_change',
    descripcion: `Seguimiento inicializado con ${TRACKING_STAGES.length} etapas. Etapa "Revision de Contrato" iniciada.`,
    usuario: userName || 'Sistema',
    usuario_id: userId || null,
  });

  return stages;
}

export interface ToggleChecklistParams {
  itemId: string;
  pimId: string;
  completado: boolean;
  usuario: string;
  usuarioId?: string;
  texto: string;
  stageKey: string;
  userRole?: UserRole;
}

export async function toggleChecklistItem(params: ToggleChecklistParams) {
  const { itemId, pimId, completado, usuario, usuarioId, texto, stageKey, userRole } = params;
  await enforcePermission(userRole, 'toggle_checklist', { pimId, stageKey, usuario, usuarioId });

  const { error } = await supabase
    .from('pim_checklist_items')
    .update({
      completado,
      completado_por: completado ? usuario : null,
      completado_en: completado ? new Date().toISOString() : null,
    })
    .eq('id', itemId);
  if (error) throw error;

  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: stageKey,
    tipo: 'checklist_check',
    descripcion: completado ? `Completado: "${texto}"` : `Desmarcado: "${texto}"`,
    usuario,
    usuario_id: usuarioId || null,
    metadata: { checklist_key: itemId, completado },
  });
}

export interface UpdateStageStatusParams {
  stageId: string;
  pimId: string;
  stageKey: string;
  status: string;
  usuario: string;
  usuarioId?: string;
  stageName: string;
}

export async function updateStageStatus(params: UpdateStageStatusParams) {
  const { stageId, pimId, stageKey, status, usuario, usuarioId, stageName } = params;

  const updates: Record<string, unknown> = { status };
  if (status === 'en_progreso') updates.fecha_inicio = new Date().toISOString();
  if (status === 'completado') updates.fecha_fin = new Date().toISOString();

  const { error } = await supabase
    .from('pim_tracking_stages')
    .update(updates)
    .eq('id', stageId);
  if (error) throw error;

  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: stageKey,
    tipo: 'stage_advance',
    descripcion: `Etapa "${stageName}" cambiada a ${status}`,
    usuario,
    usuario_id: usuarioId || null,
  });
}

export interface AdvanceStageParams {
  pimId: string;
  currentStageKey: string;
  modalidadPago: string;
  usuario: string;
  usuarioId?: string;
  userRole?: UserRole;
}

export async function advanceStage(params: AdvanceStageParams) {
  const { pimId, currentStageKey, modalidadPago, usuario, usuarioId, userRole } = params;
  await enforcePermission(userRole, 'advance_stage', { pimId, stageKey: currentStageKey, usuario, usuarioId });

  const currentStageDef = getStageByKey(currentStageKey);
  if (!currentStageDef) throw new Error('Etapa no encontrada');

  // Validate gate
  const blockers: StageBlocker[] = [];

  if (currentStageDef.useStepFlow) {
    const { data: steps } = await supabase
      .from('pim_stage_steps')
      .select('step_key, status')
      .eq('pim_id', pimId)
      .eq('stage_key', currentStageKey);

    if (!steps || steps.length === 0) {
      blockers.push({ type: 'steps', message: 'Pasos no inicializados' });
    } else {
      const pending = steps.filter((s) => s.step_key !== 'cierre_proceso' && s.status !== 'completado' && s.status !== 'saltado');
      if (pending.length > 0) {
        blockers.push({ type: 'steps', message: `${pending.length} paso(s) pendiente(s) de completar` });
      }
    }

    if (blockers.length > 0) {
      throw new Error('No se puede avanzar: ' + blockers.map((b) => b.message).join('; '));
    }
  } else {
    const { data: checklistItems } = await supabase
      .from('pim_checklist_items')
      .select('critico, completado')
      .eq('pim_id', pimId)
      .eq('stage_key', currentStageKey);

    const pendingCritical = (checklistItems || []).filter((i) => i.critico && !i.completado);
    if (pendingCritical.length > 0) {
      blockers.push({ type: 'checklist', message: `${pendingCritical.length} item(s) critico(s) pendiente(s)` });
    }

    const requiredDocs = getRequiredDocuments(currentStageKey, modalidadPago);
    if (requiredDocs.length > 0) {
      const { data: uploadedDocs } = await supabase
        .from('pim_documentos')
        .select('tipo')
        .eq('pim_id', pimId);
      const uploadedTypes = new Set((uploadedDocs || []).map((d) => d.tipo));
      const missingDocs = requiredDocs.filter((t) => !uploadedTypes.has(t));
      if (missingDocs.length > 0) {
        blockers.push({ type: 'document', message: `Documento(s) faltante(s): ${missingDocs.join(', ')}` });
      }
    }

    if (currentStageDef.ncBlocks) {
      const { count } = await supabase
        .from('no_conformidades')
        .select('id', { count: 'exact', head: true })
        .eq('pim_id', pimId)
        .eq('stage_key', currentStageKey)
        .in('estado', ['abierta', 'en_revision']);
      if (count && count > 0) {
        blockers.push({ type: 'nc', message: `${count} no conformidad(es) abierta(s)` });
      }
    }

    if (blockers.length > 0) {
      throw new Error('No se puede avanzar: ' + blockers.map((b) => b.message).join('; '));
    }
  }

  // Gate passed — complete current stage and start next
  if (currentStageDef.useStepFlow) {
    const now = new Date().toISOString();
    await supabase
      .from('pim_stage_steps')
      .update({
        status: 'completado',
        completado_en: now,
        completado_por: usuarioId || null,
        completado_por_nombre: usuario,
      })
      .eq('pim_id', pimId)
      .eq('stage_key', currentStageKey)
      .eq('step_key', 'cierre_proceso')
      .eq('status', 'en_progreso');
  }

  const { data: currentStageRow } = await supabase
    .from('pim_tracking_stages')
    .select('id')
    .eq('pim_id', pimId)
    .eq('stage_key', currentStageKey)
    .single();
  if (!currentStageRow) throw new Error('Stage row not found');

  const now = new Date().toISOString();

  await supabase
    .from('pim_tracking_stages')
    .update({ status: 'completado', fecha_fin: now })
    .eq('id', currentStageRow.id);

  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: currentStageKey,
    tipo: 'stage_advance',
    descripcion: `Etapa "${currentStageDef.name}" completada`,
    usuario,
    usuario_id: usuarioId || null,
  });

  const currentIdx = TRACKING_STAGES.findIndex((s) => s.key === currentStageKey);
  let nextStageKey: string | null = null;

  if (currentIdx < TRACKING_STAGES.length - 1) {
    const nextDef = TRACKING_STAGES[currentIdx + 1];
    nextStageKey = nextDef.key;

    const { data: nextStageRow } = await supabase
      .from('pim_tracking_stages')
      .select('id')
      .eq('pim_id', pimId)
      .eq('stage_key', nextStageKey)
      .single();

    if (nextStageRow) {
      await supabase
        .from('pim_tracking_stages')
        .update({ status: 'en_progreso', fecha_inicio: now })
        .eq('id', nextStageRow.id);

      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: nextStageKey,
        tipo: 'stage_advance',
        descripcion: `Etapa "${nextDef.name}" iniciada`,
        usuario,
        usuario_id: usuarioId || null,
      });
    }
  }

  // Notifications
  const nextDef = nextStageKey ? TRACKING_STAGES[currentIdx + 1] : null;
  const { data: pimData } = await supabase
    .from('pims')
    .select('codigo, codigo_correlativo')
    .eq('id', pimId)
    .single();
  const pimCodigo = pimData?.codigo || pimId;

  if (nextStageKey && nextDef) {
    const { data: allDeptUsers } = await supabase
      .from('user_profiles')
      .select('id, department')
      .in('department', nextDef.departments)
      .eq('active', true);

    if (allDeptUsers && allDeptUsers.length > 0) {
      const notifNow = new Date().toISOString();
      await supabase.from('notificaciones').insert(
        allDeptUsers.map((u) => ({
          id: generateId(),
          destinatario_id: u.id,
          pim_id: pimId,
          tipo: 'stage_advance',
          titulo: `Nueva etapa: ${nextDef.name} — ${pimCodigo}`,
          mensaje: `La etapa "${currentStageDef.name}" fue completada. La etapa "${nextDef.name}" ha iniciado.`,
          leido: false,
          prioridad: 'alta',
          fecha_creacion: notifNow,
        }))
      );
    }
  }

  // Send email notification to all active users (fire-and-forget)
  const { data: allUsers } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('active', true);

  const emails = allUsers?.map((u) => u.email).filter(Boolean) || [];
  if (emails.length > 0) {
    const deptNames: Record<string, string> = {
      comex: 'COMEX',
      finanzas: 'Finanzas',
      gerencia: 'Gerencia',
    };
    supabase.functions
      .invoke('send-stage-email', {
        body: {
          pimCodigo,
          pimCodigoCorrelativo: pimData?.codigo_correlativo || null,
          etapaCompletada: currentStageDef.name,
          etapaSiguiente: nextDef?.name || null,
          quienAvanzo: usuario,
          responsableSiguiente: nextDef
            ? nextDef.departments.map((d) => deptNames[d] || d).join(', ')
            : null,
          departamentoSiguiente: nextDef?.departments || null,
          destinatarios: emails,
        },
      })
      .catch((err) => console.error('Error sending stage email:', err));
  }

  // Mark PIM as cerrado when last stage completes
  if (currentIdx >= TRACKING_STAGES.length - 1) {
    await supabase.from('pims').update({ estado: 'cerrado' }).eq('id', pimId);

    await supabase.from('pim_activity_log').insert({
      id: generateId(),
      pim_id: pimId,
      stage_key: currentStageKey,
      tipo: 'stage_advance',
      descripcion: 'PIM cerrado — todos los procesos completados',
      usuario,
      usuario_id: usuarioId || null,
    });
  }

  return { completedStage: currentStageKey, nextStageKey };
}

export interface ReturnStageParams {
  pimId: string;
  currentStageKey: string;
  targetStageKey: string;
  motivo: string;
  usuario: string;
  usuarioId?: string;
}

export async function returnStage(params: ReturnStageParams) {
  const { pimId, currentStageKey, targetStageKey, motivo, usuario, usuarioId } = params;

  const currentDef = getStageByKey(currentStageKey);
  const targetDef = getStageByKey(targetStageKey);
  if (!currentDef || !targetDef) throw new Error('Etapa no encontrada');

  const { data: currentRow } = await supabase
    .from('pim_tracking_stages')
    .select('id')
    .eq('pim_id', pimId)
    .eq('stage_key', currentStageKey)
    .single();
  if (currentRow) {
    await supabase
      .from('pim_tracking_stages')
      .update({ status: 'pendiente' })
      .eq('id', currentRow.id);
  }

  const { data: targetRow } = await supabase
    .from('pim_tracking_stages')
    .select('id')
    .eq('pim_id', pimId)
    .eq('stage_key', targetStageKey)
    .single();
  if (targetRow) {
    await supabase
      .from('pim_tracking_stages')
      .update({ status: 'en_progreso', fecha_fin: null })
      .eq('id', targetRow.id);
  }

  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: currentStageKey,
    tipo: 'stage_return',
    descripcion: `Etapa "${currentDef.name}" devuelta a "${targetDef.name}". Motivo: ${motivo}`,
    usuario,
    usuario_id: usuarioId || null,
    metadata: { from: currentStageKey, to: targetStageKey, motivo },
  });

  return { returnedTo: targetStageKey };
}

export interface AddNoteParams {
  pimId: string;
  stageKey?: string;
  texto: string;
  usuario: string;
  usuarioId?: string;
  userRole?: UserRole;
}

export async function addNote(params: AddNoteParams) {
  const { pimId, stageKey, texto, usuario, usuarioId, userRole } = params;
  await enforcePermission(userRole, 'add_note', { pimId, stageKey, usuario, usuarioId });

  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: stageKey || null,
    tipo: 'note',
    descripcion: texto,
    usuario,
    usuario_id: usuarioId || null,
  });
}

export interface AssignStageResponsableParams {
  stageId: string;
  pimId: string;
  stageKey: string;
  assignedUserId: string;
  assignedUserName: string;
  usuario: string;
  usuarioId?: string;
  userRole?: UserRole;
}

export async function assignStageResponsable(params: AssignStageResponsableParams) {
  const { stageId, pimId, stageKey, assignedUserId, assignedUserName, usuario, usuarioId, userRole } = params;
  await enforcePermission(userRole, 'assign_stage', { pimId, stageKey, usuario, usuarioId });

  const { error } = await supabase
    .from('pim_tracking_stages')
    .update({
      responsable_id: assignedUserId,
      responsable: assignedUserName,
      assigned_to: assignedUserId,
    })
    .eq('id', stageId);
  if (error) throw error;

  const stageDef = getStageByKey(stageKey);
  await supabase.from('pim_activity_log').insert({
    id: generateId(),
    pim_id: pimId,
    stage_key: stageKey,
    tipo: 'stage_assigned',
    descripcion: `${assignedUserName} asignado como responsable de "${stageDef?.name || stageKey}"`,
    usuario,
    usuario_id: usuarioId || null,
    metadata: { assigned_user_id: assignedUserId, assigned_user_name: assignedUserName },
  });
}
