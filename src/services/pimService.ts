/**
 * PIM data-access service — pure async functions (no React dependencies).
 *
 * These are consumed by the React hooks in `usePIMs.ts` so the business
 * logic can be tested and reused independently of React Query.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type PIM = Tables<'pims'>;
export type PIMInsert = TablesInsert<'pims'>;
export type PIMUpdate = TablesUpdate<'pims'>;

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function fetchPIMs() {
  const { data, error } = await supabase
    .from('pims')
    .select('*')
    .order('fecha_creacion', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

export async function fetchPIM(id: string) {
  const { data, error } = await supabase
    .from('pims')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchPIMsWithItems() {
  const { data, error } = await supabase
    .from('pims')
    .select(`
      *,
      items:pim_items(
        *,
        producto:producto_id(espesor, categoria, ancho)
      )
    `)
    .order('fecha_creacion', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createPIM(newPIM: PIMInsert) {
  const { data, error } = await supabase
    .from('pims')
    .insert(newPIM)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePIM(id: string, updates: PIMUpdate) {
  const { data, error } = await supabase
    .from('pims')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePIM(id: string) {
  // 1. Fetch pim_requirement_items to return kilos to the requirement
  const { data: pimReqItems, error: fetchErr } = await supabase
    .from('pim_requirement_items')
    .select('requirement_item_id, kilos_consumidos')
    .eq('pim_id', id);
  if (fetchErr) throw fetchErr;

  if (pimReqItems && pimReqItems.length > 0) {
    const kilosByRequerimiento: Record<string, number> = {};

    for (const pri of pimReqItems) {
      const kilos = pri.kilos_consumidos ?? 0;
      if (kilos <= 0) continue;

      const { data: reqItem, error: reqItemErr } = await supabase
        .from('requerimiento_items')
        .select('requerimiento_id, kilos_consumidos, kilos_disponibles')
        .eq('id', pri.requirement_item_id)
        .single();
      if (reqItemErr) throw reqItemErr;

      const newConsumidos = Math.max(0, (reqItem.kilos_consumidos ?? 0) - kilos);
      const newDisponibles = (reqItem.kilos_disponibles ?? 0) + kilos;

      const { error: updateItemErr } = await supabase
        .from('requerimiento_items')
        .update({ kilos_consumidos: newConsumidos, kilos_disponibles: newDisponibles })
        .eq('id', pri.requirement_item_id);
      if (updateItemErr) throw updateItemErr;

      const reqId = reqItem.requerimiento_id;
      kilosByRequerimiento[reqId] = (kilosByRequerimiento[reqId] ?? 0) + kilos;
    }

    for (const [reqId, kilosToRelease] of Object.entries(kilosByRequerimiento)) {
      const { data: req, error: reqFetchErr } = await supabase
        .from('requerimientos_mensuales')
        .select('kilos_consumidos, kilos_disponibles')
        .eq('id', reqId)
        .single();
      if (reqFetchErr) throw reqFetchErr;

      const { error: reqUpdateErr } = await supabase
        .from('requerimientos_mensuales')
        .update({
          kilos_consumidos: Math.max(0, (req.kilos_consumidos ?? 0) - kilosToRelease),
          kilos_disponibles: (req.kilos_disponibles ?? 0) + kilosToRelease,
        })
        .eq('id', reqId);
      if (reqUpdateErr) throw reqUpdateErr;
    }
  }

  // 2. Delete pim_requirement_items
  const { error: errReqItems } = await supabase
    .from('pim_requirement_items')
    .delete()
    .eq('pim_id', id);
  if (errReqItems) throw errReqItems;

  // 3. Delete pim_items
  const { error: errItems } = await supabase
    .from('pim_items')
    .delete()
    .eq('pim_id', id);
  if (errItems) throw errItems;

  // 4. Delete the PIM
  const { error } = await supabase
    .from('pims')
    .delete()
    .eq('id', id);
  if (error) throw error;

  return id;
}
