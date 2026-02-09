import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TRACKING_STAGES } from '@/lib/trackingChecklists';

// Types
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
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function generateId() {
  return crypto.randomUUID();
}

// Initialize tracking for a PIM (creates stages + checklist items)
export function useInitializeTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pimId: string) => {
      // Create all 5 stages
      const stages = TRACKING_STAGES.map((s, idx) => ({
        id: generateId(),
        pim_id: pimId,
        stage_key: s.key,
        status: idx === 0 ? 'en_progreso' : 'pendiente',
        fecha_inicio: idx === 0 ? new Date().toISOString() : null,
      }));

      const { error: stageErr } = await supabase
        .from('pim_tracking_stages')
        .insert(stages);
      if (stageErr) throw stageErr;

      // Create all checklist items
      const items = TRACKING_STAGES.flatMap((s) =>
        s.checklist.map((c) => ({
          id: generateId(),
          pim_id: pimId,
          stage_key: s.key,
          checklist_key: c.id,
          texto: c.text,
          critico: c.critical,
          completado: false,
        }))
      );

      const { error: checkErr } = await supabase
        .from('pim_checklist_items')
        .insert(items);
      if (checkErr) throw checkErr;

      // Log initialization
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        tipo: 'status_change',
        descripcion: 'Seguimiento inicializado. Etapa Contrato iniciada.',
        usuario: 'Sistema',
      });

      return stages;
    },
    onSuccess: (_, pimId) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', pimId] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items', pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', pimId] });
    },
  });
}

// Fetch stages for a single PIM
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

// Fetch tracking stages for ALL PIMs (for list/dashboard views)
export function useAllTrackingStages() {
  return useQuery({
    queryKey: ['tracking-stages', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pim_tracking_stages')
        .select('pim_id, stage_key, status')
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Group by pim_id
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

// Fetch checklist items
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

// Toggle checklist item
export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      pimId,
      completado,
      usuario,
      texto,
      stageKey,
    }: {
      itemId: string;
      pimId: string;
      completado: boolean;
      usuario: string;
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

      // Log action
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'checklist_check',
        descripcion: completado
          ? `Completado: "${texto}"`
          : `Desmarcado: "${texto}"`,
        usuario,
        metadata: { checklist_key: itemId, completado },
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// Update stage status
export function useUpdateStageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stageId,
      pimId,
      status,
      usuario,
      stageName,
    }: {
      stageId: string;
      pimId: string;
      status: string;
      usuario: string;
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
        stage_key: stageId,
        tipo: 'stage_advance',
        descripcion: `Etapa "${stageName}" cambiada a ${status}`,
        usuario,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-stages', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// Add note
export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      stageKey,
      texto,
      usuario,
    }: {
      pimId: string;
      stageKey?: string;
      texto: string;
      usuario: string;
    }) => {
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey || null,
        tipo: 'note',
        descripcion: texto,
        usuario,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

// Fetch activity log
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

// Split PIM
export function useSplitPIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalPimId,
      itemIds,
      usuario,
    }: {
      originalPimId: string;
      itemIds: string[];
      usuario: string;
    }) => {
      // 1. Get original PIM
      const { data: originalPim, error: pimErr } = await supabase
        .from('pims')
        .select('*')
        .eq('id', originalPimId)
        .single();
      if (pimErr) throw pimErr;

      // 2. Get items to move
      const { data: itemsToMove, error: itemsErr } = await supabase
        .from('pim_items')
        .select('*')
        .in('id', itemIds);
      if (itemsErr) throw itemsErr;

      // 3. Create new PIM code
      const newCode = originalPim.codigo + '-B';
      const newPimId = generateId();

      const newTotalUsd = itemsToMove.reduce((s: number, i: any) => s + (i.total_usd || 0), 0);
      const newTotalTon = itemsToMove.reduce((s: number, i: any) => s + (i.toneladas || 0), 0);

      // 4. Create new PIM (con mismas condiciones de contrato que el original)
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

      // 5. Move items to new PIM
      const { error: moveErr } = await supabase
        .from('pim_items')
        .update({ pim_id: newPimId })
        .in('id', itemIds);
      if (moveErr) throw moveErr;

      // 6. Update original PIM totals
      const remainingUsd = (originalPim.total_usd || 0) - newTotalUsd;
      const remainingTon = (originalPim.total_toneladas || 0) - newTotalTon;
      await supabase
        .from('pims')
        .update({ total_usd: Math.max(0, remainingUsd), total_toneladas: Math.max(0, remainingTon) })
        .eq('id', originalPimId);

      // 7. Log in both PIMs
      const logEntries = [
        {
          id: generateId(),
          pim_id: originalPimId,
          tipo: 'split',
          descripcion: `PIM dividido. ${itemsToMove.length} items movidos a ${newCode}`,
          usuario,
          metadata: { new_pim_id: newPimId, new_pim_code: newCode, items_moved: itemIds },
        },
        {
          id: generateId(),
          pim_id: newPimId,
          tipo: 'split',
          descripcion: `PIM creado por división de ${originalPim.codigo}`,
          usuario,
          metadata: { original_pim_id: originalPimId, original_pim_code: originalPim.codigo },
        },
      ];
      await supabase.from('pim_activity_log').insert(logEntries);

      return { newPimId, newCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-stages'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}
