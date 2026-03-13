import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStageByKey } from '@/lib/trackingChecklists';
import { canDo, type PIMAction } from '@/lib/permissions';
import type { UserRole } from '@/types/comex';

function generateId() {
  return crypto.randomUUID();
}

/** Log a permission denial and throw */
async function enforcePermission(
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
  throw new Error(`No tienes permiso para realizar esta acción (${action})`);
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
      userRole,
    }: {
      originalPimId: string;
      splitItems: SplitItemConfig[];
      usuario: string;
      usuarioId?: string;
      userRole?: UserRole;
    }) => {
      await enforcePermission(userRole, 'split_pim', { pimId: originalPimId, usuario, usuarioId });

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

        // Batch update all full-item requirement links in one query
        const fullProductoIds = fullItemIds.map(
          (id) => affectedItems.find((i: any) => i.id === id)!.producto_id
        );
        if (fullProductoIds.length > 0) {
          await supabase
            .from('pim_requirement_items')
            .update({ pim_id: newPimId })
            .eq('pim_id', originalPimId)
            .in('producto_id', fullProductoIds);
        }
      }

      // 8. Handle PARTIAL items
      if (partialItems.length > 0) {
        // Batch-fetch all requirement items for partial splits in one query
        const partialProductoIds = [
          ...new Set(
            partialItems.map(
              (p) => affectedItems.find((i: any) => i.id === p.itemId)!.producto_id
            )
          ),
        ];
        const { data: allPartialReqItems } = await supabase
          .from('pim_requirement_items')
          .select('*')
          .eq('pim_id', originalPimId)
          .in('producto_id', partialProductoIds);

        const reqItemsByProducto = new Map<string, any[]>();
        for (const r of allPartialReqItems || []) {
          if (!reqItemsByProducto.has(r.producto_id)) reqItemsByProducto.set(r.producto_id, []);
          reqItemsByProducto.get(r.producto_id)!.push(r);
        }

        // Collect batch inserts
        const newPimItemsToInsert: any[] = [];
        const newReqItemsToInsert: any[] = [];

        for (const partial of partialItems) {
          const item = affectedItems.find((i: any) => i.id === partial.itemId)!;
          const splitQty = partial.cantidad!;
          const ratio = splitQty / item.cantidad;

          const remainingQty = item.cantidad - splitQty;
          const splitToneladas = item.toneladas * ratio;
          const splitTotalUsd = (item.total_usd || 0) * ratio;

          // Individual update (different values per row)
          const { error: updateOrigErr } = await supabase
            .from('pim_items')
            .update({
              cantidad: remainingQty,
              toneladas: item.toneladas - splitToneladas,
              total_usd: (item.total_usd || 0) - splitTotalUsd,
            })
            .eq('id', item.id);
          if (updateOrigErr) throw updateOrigErr;

          newPimItemsToInsert.push({
            id: generateId(),
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

          const reqItems = reqItemsByProducto.get(item.producto_id) || [];
          for (const reqItem of reqItems) {
            const splitKilos = (reqItem.kilos_consumidos || 0) * ratio;
            const remainingKilos = (reqItem.kilos_consumidos || 0) - splitKilos;

            // Individual update (different values per row)
            await supabase
              .from('pim_requirement_items')
              .update({ kilos_consumidos: remainingKilos })
              .eq('id', reqItem.id);

            newReqItemsToInsert.push({
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

        // Batch insert all new pim_items in one query
        if (newPimItemsToInsert.length > 0) {
          const { error: insertErr } = await supabase
            .from('pim_items')
            .insert(newPimItemsToInsert);
          if (insertErr) throw insertErr;
        }

        // Batch insert all new pim_requirement_items in one query
        if (newReqItemsToInsert.length > 0) {
          const { error: reqInsertErr } = await supabase
            .from('pim_requirement_items')
            .insert(newReqItemsToInsert);
          if (reqInsertErr) throw reqInsertErr;
        }
      }

      // 9. Update original PIM totals
      const remainingUsd = (originalPim.total_usd || 0) - newTotalUsd;
      const remainingTon = (originalPim.total_toneladas || 0) - newTotalTon;
      await supabase
        .from('pims')
        .update({ total_usd: Math.max(0, remainingUsd), total_toneladas: Math.max(0, remainingTon) })
        .eq('id', originalPimId);

      // 10. Inherit tracking stages from parent
      const { data: parentStages } = await supabase
        .from('pim_tracking_stages')
        .select('*')
        .eq('pim_id', originalPimId)
        .order('created_at', { ascending: true });

      const now = new Date().toISOString();
      if (parentStages && parentStages.length > 0) {
        const childStages = parentStages.map((ps: any) => ({
          id: generateId(),
          pim_id: newPimId,
          stage_key: ps.stage_key,
          status: ps.status,
          fecha_inicio: ps.status === 'en_progreso' ? now : ps.fecha_inicio,
          fecha_fin: ps.fecha_fin,
          fecha_limite: ps.fecha_limite,
          departamento: ps.departamento,
          responsable: ps.responsable,
          responsable_id: ps.responsable_id,
          assigned_to: ps.assigned_to,
          notas: null,
        }));

        const { error: stagesErr } = await supabase
          .from('pim_tracking_stages')
          .insert(childStages);
        if (stagesErr) console.warn('Error copying stages:', stagesErr);
      }

      // 11. Inherit checklist items
      const { data: parentChecklist } = await supabase
        .from('pim_checklist_items')
        .select('*')
        .eq('pim_id', originalPimId);

      if (parentChecklist && parentChecklist.length > 0) {
        const completedStageKeys = new Set(
          (parentStages || [])
            .filter((s: any) => s.status === 'completado')
            .map((s: any) => s.stage_key)
        );

        const childChecklist = parentChecklist.map((pc: any) => ({
          id: generateId(),
          pim_id: newPimId,
          stage_key: pc.stage_key,
          checklist_key: pc.checklist_key,
          texto: pc.texto,
          critico: pc.critico,
          completado: completedStageKeys.has(pc.stage_key) ? pc.completado : false,
          completado_por: completedStageKeys.has(pc.stage_key) ? pc.completado_por : null,
          completado_en: completedStageKeys.has(pc.stage_key) ? pc.completado_en : null,
        }));

        const { error: checkErr } = await supabase
          .from('pim_checklist_items')
          .insert(childChecklist);
        if (checkErr) console.warn('Error copying checklist:', checkErr);
      }

      // 12. Inherit documents (reference same URLs, not duplicate files)
      const { data: parentDocs } = await supabase
        .from('pim_documentos')
        .select('*')
        .eq('pim_id', originalPimId);

      let inheritedDocsCount = 0;
      if (parentDocs && parentDocs.length > 0) {
        const childDocs = parentDocs.map((pd: any) => ({
          id: generateId(),
          pim_id: newPimId,
          tipo: pd.tipo,
          nombre: pd.nombre,
          url: pd.url,
          subido_por: 'Sistema (herencia)',
          observaciones: `Heredado de PIM ${originalPim.codigo}`,
          stage_key: pd.stage_key,
          version: pd.version,
          version_group: generateId(),
        }));

        const { error: docsErr } = await supabase
          .from('pim_documentos')
          .insert(childDocs);
        if (docsErr) console.warn('Error copying documents:', docsErr);
        inheritedDocsCount = childDocs.length;
      }

      // 13. Log
      const fullCount = fullItemIds.length;
      const partialCount = partialItems.length;
      const descParts: string[] = [];
      if (fullCount > 0) descParts.push(`${fullCount} items movidos completos`);
      if (partialCount > 0) descParts.push(`${partialCount} items divididos parcialmente`);

      const inheritedStage = (parentStages || []).find((s: any) => s.status === 'en_progreso');
      const inheritedStageName = inheritedStage
        ? getStageByKey(inheritedStage.stage_key)?.name || inheritedStage.stage_key
        : 'N/A';

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
          descripcion: `PIM creado por división de ${originalPim.codigo}. Hereda etapa "${inheritedStageName}" y ${inheritedDocsCount} documento(s)`,
          usuario,
          usuario_id: usuarioId || null,
          metadata: {
            original_pim_id: originalPimId,
            original_pim_code: originalPim.codigo,
            inherited_stage: inheritedStage?.stage_key,
            inherited_docs_count: inheritedDocsCount,
          },
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
      queryClient.invalidateQueries({ queryKey: ['pim-documents'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['child-pims'] });
    },
  });
}
