import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  TRACKING_STAGES,
  getStageByKey,
  getFilteredChecklist,
  getRequiredDocuments,
  type DocumentType,
} from '@/lib/trackingChecklists';

// --- Types ---

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
  type: 'checklist' | 'document' | 'nc';
  message: string;
}

export interface CanAdvanceResult {
  canAdvance: boolean;
  blockers: StageBlocker[];
}

function generateId() {
  return crypto.randomUUID();
}

// --- Initialize Tracking (6 stages, filtered checklist by modalidad_pago) ---

export function useInitializeTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      modalidadPago,
      userId,
      userName,
    }: {
      pimId: string;
      modalidadPago: string;
      userId?: string;
      userName?: string;
    }) => {
      // Create all 6 stages with department assignment
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

      // Create checklist items filtered by payment modality
      const items = TRACKING_STAGES.flatMap((s) => {
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

      const { error: checkErr } = await supabase
        .from('pim_checklist_items')
        .insert(items);
      if (checkErr) throw checkErr;

      // Log initialization
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        tipo: 'status_change',
        descripcion: 'Seguimiento inicializado con 6 etapas. Etapa "Revisión de Contrato" iniciada.',
        usuario: userName || 'Sistema',
        usuario_id: userId || null,
      });

      return stages;
    },
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_tracking_stages')
        .select('*')
        .eq('pim_id', pimId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TrackingStage[];
    },
    enabled: !!pimId,
  });
}

// --- Fetch tracking stages for ALL PIMs (list/dashboard views) ---

export function useAllTrackingStages() {
  return useQuery({
    queryKey: ['tracking-stages', 'all'],
    queryFn: async () => {
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
    },
    staleTime: 15000,
  });
}

// --- Fetch checklist items ---

export function useChecklistItems(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['checklist-items', pimId, stageKey],
    queryFn: async () => {
      let query = supabase
        .from('pim_checklist_items')
        .select('*')
        .eq('pim_id', pimId!);
      if (stageKey) query = query.eq('stage_key', stageKey);
      query = query.order('created_at', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!pimId,
  });
}

// --- Toggle checklist item ---

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      pimId,
      completado,
      usuario,
      usuarioId,
      texto,
      stageKey,
    }: {
      itemId: string;
      pimId: string;
      completado: boolean;
      usuario: string;
      usuarioId?: string;
      texto: string;
      stageKey: string;
    }) => {
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
        descripcion: completado
          ? `Completado: "${texto}"`
          : `Desmarcado: "${texto}"`,
        usuario,
        usuario_id: usuarioId || null,
        metadata: { checklist_key: itemId, completado },
      });
    },
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
    mutationFn: async ({
      stageId,
      pimId,
      stageKey,
      status,
      usuario,
      usuarioId,
      stageName,
    }: {
      stageId: string;
      pimId: string;
      stageKey: string;
      status: string;
      usuario: string;
      usuarioId?: string;
      stageName: string;
    }) => {
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
    },
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
    queryFn: async (): Promise<CanAdvanceResult> => {
      const blockers: StageBlocker[] = [];
      const stageDef = getStageByKey(stageKey!);
      if (!stageDef) return { canAdvance: false, blockers: [{ type: 'checklist', message: 'Etapa no encontrada' }] };

      // 1. Check critical checklist items
      const { data: checklistItems } = await supabase
        .from('pim_checklist_items')
        .select('critico, completado, texto')
        .eq('pim_id', pimId!)
        .eq('stage_key', stageKey!);

      const pendingCritical = (checklistItems || []).filter(
        (i) => i.critico && !i.completado
      );
      if (pendingCritical.length > 0) {
        blockers.push({
          type: 'checklist',
          message: `${pendingCritical.length} item(s) crítico(s) pendiente(s)`,
        });
      }

      // 2. Check required documents
      const requiredDocs = getRequiredDocuments(stageKey!, modalidadPago || '');
      if (requiredDocs.length > 0) {
        const { data: uploadedDocs } = await supabase
          .from('pim_documentos')
          .select('tipo')
          .eq('pim_id', pimId!);

        const uploadedTypes = new Set((uploadedDocs || []).map((d) => d.tipo));
        const missingDocs = requiredDocs.filter((t) => !uploadedTypes.has(t));
        if (missingDocs.length > 0) {
          blockers.push({
            type: 'document',
            message: `Documento(s) obligatorio(s) faltante(s): ${missingDocs.join(', ')}`,
          });
        }
      }

      // 3. Check open no conformidades
      if (stageDef.ncBlocks) {
        const { count } = await supabase
          .from('no_conformidades')
          .select('id', { count: 'exact', head: true })
          .eq('pim_id', pimId!)
          .eq('stage_key', stageKey!)
          .in('estado', ['abierta', 'en_revision']);

        if (count && count > 0) {
          blockers.push({
            type: 'nc',
            message: `${count} no conformidad(es) abierta(s)`,
          });
        }
      }

      return {
        canAdvance: blockers.length === 0,
        blockers,
      };
    },
    enabled: !!pimId && !!stageKey,
    staleTime: 5000,
  });
}

// --- Advance Stage (with gate validation) ---

export function useAdvanceStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      currentStageKey,
      modalidadPago,
      usuario,
      usuarioId,
    }: {
      pimId: string;
      currentStageKey: string;
      modalidadPago: string;
      usuario: string;
      usuarioId?: string;
    }) => {
      const currentStageDef = getStageByKey(currentStageKey);
      if (!currentStageDef) throw new Error('Etapa no encontrada');

      // Validate gate
      const blockers: StageBlocker[] = [];

      // 1. Critical checklist
      const { data: checklistItems } = await supabase
        .from('pim_checklist_items')
        .select('critico, completado')
        .eq('pim_id', pimId)
        .eq('stage_key', currentStageKey);

      const pendingCritical = (checklistItems || []).filter(
        (i) => i.critico && !i.completado
      );
      if (pendingCritical.length > 0) {
        blockers.push({
          type: 'checklist',
          message: `${pendingCritical.length} item(s) crítico(s) pendiente(s)`,
        });
      }

      // 2. Required documents
      const requiredDocs = getRequiredDocuments(currentStageKey, modalidadPago);
      if (requiredDocs.length > 0) {
        const { data: uploadedDocs } = await supabase
          .from('pim_documentos')
          .select('tipo')
          .eq('pim_id', pimId);

        const uploadedTypes = new Set((uploadedDocs || []).map((d) => d.tipo));
        const missingDocs = requiredDocs.filter((t) => !uploadedTypes.has(t));
        if (missingDocs.length > 0) {
          blockers.push({
            type: 'document',
            message: `Documento(s) faltante(s): ${missingDocs.join(', ')}`,
          });
        }
      }

      // 3. Open NCs
      if (currentStageDef.ncBlocks) {
        const { count } = await supabase
          .from('no_conformidades')
          .select('id', { count: 'exact', head: true })
          .eq('pim_id', pimId)
          .eq('stage_key', currentStageKey)
          .in('estado', ['abierta', 'en_revision']);

        if (count && count > 0) {
          blockers.push({
            type: 'nc',
            message: `${count} no conformidad(es) abierta(s)`,
          });
        }
      }

      if (blockers.length > 0) {
        throw new Error(
          'No se puede avanzar: ' + blockers.map((b) => b.message).join('; ')
        );
      }

      // --- Gate passed: complete current stage and start next ---

      // Get current stage row
      const { data: currentStageRow } = await supabase
        .from('pim_tracking_stages')
        .select('id')
        .eq('pim_id', pimId)
        .eq('stage_key', currentStageKey)
        .single();

      if (!currentStageRow) throw new Error('Stage row not found');

      const now = new Date().toISOString();

      // Complete current stage
      await supabase
        .from('pim_tracking_stages')
        .update({ status: 'completado', fecha_fin: now })
        .eq('id', currentStageRow.id);

      // Log completion
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: currentStageKey,
        tipo: 'stage_advance',
        descripcion: `Etapa "${currentStageDef.name}" completada`,
        usuario,
        usuario_id: usuarioId || null,
      });

      // Find and start next stage
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

      return { completedStage: currentStageKey, nextStageKey };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

// --- Return Stage (send back to previous for NC resolution) ---

export function useReturnStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      currentStageKey,
      targetStageKey,
      motivo,
      usuario,
      usuarioId,
    }: {
      pimId: string;
      currentStageKey: string;
      targetStageKey: string;
      motivo: string;
      usuario: string;
      usuarioId?: string;
    }) => {
      const currentDef = getStageByKey(currentStageKey);
      const targetDef = getStageByKey(targetStageKey);
      if (!currentDef || !targetDef) throw new Error('Etapa no encontrada');

      const now = new Date().toISOString();

      // Set current stage back to pendiente
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

      // Set target stage back to en_progreso
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

      // Log return
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
    },
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
    mutationFn: async ({
      pimId,
      stageKey,
      texto,
      usuario,
      usuarioId,
    }: {
      pimId: string;
      stageKey?: string;
      texto: string;
      usuario: string;
      usuarioId?: string;
    }) => {
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey || null,
        tipo: 'note',
        descripcion: texto,
        usuario,
        usuario_id: usuarioId || null,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// --- Fetch activity log ---

export function useActivityLog(pimId?: string) {
  return useQuery({
    queryKey: ['activity-log', pimId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_activity_log')
        .select('*')
        .eq('pim_id', pimId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!pimId,
  });
}

// --- Split PIM types ---

export interface SplitItemConfig {
  itemId: string;
  mode: 'full' | 'partial';
  cantidad?: number;
}

// --- Split PIM ---

export function useSplitPIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalPimId,
      splitItems,
      usuario,
      usuarioId,
    }: {
      originalPimId: string;
      splitItems: SplitItemConfig[];
      usuario: string;
      usuarioId?: string;
    }) => {
      // 1. Get original PIM
      const { data: originalPim, error: pimErr } = await supabase
        .from('pims')
        .select('*')
        .eq('id', originalPimId)
        .single();
      if (pimErr) throw pimErr;

      // 2. Separate full vs partial
      const fullItemIds = splitItems.filter((s) => s.mode === 'full').map((s) => s.itemId);
      const partialItems = splitItems.filter((s) => s.mode === 'partial');

      // 3. Fetch all affected items
      const allAffectedIds = splitItems.map((s) => s.itemId);
      const { data: affectedItems, error: itemsErr } = await supabase
        .from('pim_items')
        .select('*')
        .in('id', allAffectedIds);
      if (itemsErr) throw itemsErr;

      // 4. Create new PIM code
      const baseCode = /^(.+)-[A-Z]$/.test(originalPim.codigo)
        ? originalPim.codigo.replace(/-[A-Z]$/, '')
        : originalPim.codigo;

      const { count, error: countErr } = await supabase
        .from('pims')
        .select('id', { count: 'exact', head: true })
        .like('codigo', baseCode + '-%');
      if (countErr) throw countErr;

      const suffix = String.fromCharCode(66 + (count ?? 0));
      const newCode = baseCode + '-' + suffix;
      const newPimId = generateId();

      // 5. Calculate totals
      let newTotalUsd = 0;
      let newTotalTon = 0;

      for (const id of fullItemIds) {
        const item = affectedItems.find((i: any) => i.id === id)!;
        newTotalUsd += item.total_usd || 0;
        newTotalTon += item.toneladas || 0;
      }

      for (const partial of partialItems) {
        const item = affectedItems.find((i: any) => i.id === partial.itemId)!;
        const ratio = partial.cantidad! / item.cantidad;
        newTotalUsd += (item.total_usd || 0) * ratio;
        newTotalTon += (item.toneladas || 0) * ratio;
      }

      // 6. Create new PIM
      const { error: createErr } = await supabase.from('pims').insert({
        id: newPimId,
        codigo: newCode,
        descripcion: originalPim.descripcion + ' (División)',
        estado: originalPim.estado,
        tipo: 'sub-pim',
        pim_padre_id: originalPimId,
        requerimiento_id: originalPim.requerimiento_id,
        proveedor_id: originalPim.proveedor_id,
        proveedor_nombre: originalPim.proveedor_nombre,
        cuadro_id: originalPim.cuadro_id,
        modalidad_pago: originalPim.modalidad_pago,
        total_usd: newTotalUsd,
        total_toneladas: newTotalTon,
        condicion_precio: originalPim.condicion_precio,
        fecha_embarque: originalPim.fecha_embarque,
        origen: originalPim.origen,
        fabricas_origen: originalPim.fabricas_origen,
        molino_id: originalPim.molino_id,
        molino_nombre: originalPim.molino_nombre,
        notas_pago: originalPim.notas_pago,
        dias_credito: originalPim.dias_credito,
        porcentaje_anticipo: originalPim.porcentaje_anticipo,
      });
      if (createErr) throw createErr;

      // 7. Handle FULL items
      if (fullItemIds.length > 0) {
        const { error: moveErr } = await supabase
          .from('pim_items')
          .update({ pim_id: newPimId })
          .in('id', fullItemIds);
        if (moveErr) throw moveErr;

        for (const id of fullItemIds) {
          const item = affectedItems.find((i: any) => i.id === id)!;
          await supabase
            .from('pim_requirement_items')
            .update({ pim_id: newPimId })
            .eq('pim_id', originalPimId)
            .eq('producto_id', item.producto_id);
        }
      }

      // 8. Handle PARTIAL items
      for (const partial of partialItems) {
        const item = affectedItems.find((i: any) => i.id === partial.itemId)!;
        const splitQty = partial.cantidad!;
        const ratio = splitQty / item.cantidad;

        const remainingQty = item.cantidad - splitQty;
        const splitToneladas = item.toneladas * ratio;
        const splitTotalUsd = (item.total_usd || 0) * ratio;

        const { error: updateOrigErr } = await supabase
          .from('pim_items')
          .update({
            cantidad: remainingQty,
            toneladas: item.toneladas - splitToneladas,
            total_usd: (item.total_usd || 0) - splitTotalUsd,
          })
          .eq('id', item.id);
        if (updateOrigErr) throw updateOrigErr;

        const newItemId = generateId();
        const { error: insertErr } = await supabase.from('pim_items').insert({
          id: newItemId,
          pim_id: newPimId,
          producto_id: item.producto_id,
          codigo_producto: item.codigo_producto,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidad: splitQty,
          precio_unitario_usd: item.precio_unitario_usd,
          total_usd: splitTotalUsd,
          toneladas: splitToneladas,
          molino_id: item.molino_id,
          cantidad_recibida: null,
        });
        if (insertErr) throw insertErr;

        const { data: reqItems } = await supabase
          .from('pim_requirement_items')
          .select('*')
          .eq('pim_id', originalPimId)
          .eq('producto_id', item.producto_id);

        if (reqItems && reqItems.length > 0) {
          for (const reqItem of reqItems) {
            const splitKilos = (reqItem.kilos_consumidos || 0) * ratio;
            const remainingKilos = (reqItem.kilos_consumidos || 0) - splitKilos;

            await supabase
              .from('pim_requirement_items')
              .update({ kilos_consumidos: remainingKilos })
              .eq('id', reqItem.id);

            await supabase.from('pim_requirement_items').insert({
              id: generateId(),
              pim_id: newPimId,
              requirement_item_id: reqItem.requirement_item_id,
              producto_id: reqItem.producto_id,
              codigo_producto: reqItem.codigo_producto,
              descripcion: reqItem.descripcion,
              kilos_consumidos: splitKilos,
            });
          }
        }
      }

      // 9. Update original PIM totals
      const remainingUsd = (originalPim.total_usd || 0) - newTotalUsd;
      const remainingTon = (originalPim.total_toneladas || 0) - newTotalTon;
      await supabase
        .from('pims')
        .update({ total_usd: Math.max(0, remainingUsd), total_toneladas: Math.max(0, remainingTon) })
        .eq('id', originalPimId);

      // 10. Log
      const fullCount = fullItemIds.length;
      const partialCount = partialItems.length;
      const descParts: string[] = [];
      if (fullCount > 0) descParts.push(`${fullCount} items movidos completos`);
      if (partialCount > 0) descParts.push(`${partialCount} items divididos parcialmente`);

      const logEntries = [
        {
          id: generateId(),
          pim_id: originalPimId,
          tipo: 'split',
          descripcion: `PIM dividido. ${descParts.join(', ')} a ${newCode}`,
          usuario,
          usuario_id: usuarioId || null,
          metadata: {
            new_pim_id: newPimId,
            new_pim_code: newCode,
            full_items: fullItemIds,
            partial_items: partialItems.map((p) => ({ itemId: p.itemId, cantidad: p.cantidad })),
          },
        },
        {
          id: generateId(),
          pim_id: newPimId,
          tipo: 'split',
          descripcion: `PIM creado por división de ${originalPim.codigo}`,
          usuario,
          usuario_id: usuarioId || null,
          metadata: { original_pim_id: originalPimId, original_pim_code: originalPim.codigo },
        },
      ];
      await supabase.from('pim_activity_log').insert(logEntries);

      return { newPimId, newCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['pim-items'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}
