import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type Requirement = Tables<'requerimientos_mensuales'>;
export type RequirementInsert = TablesInsert<'requerimientos_mensuales'>;
export type RequirementUpdate = TablesUpdate<'requerimientos_mensuales'>;
export type RequirementItem = Tables<'requerimiento_items'>;
export type RequirementItemInsert = TablesInsert<'requerimiento_items'>;

/** Payload para crear requerimiento con ítems (líneas consolidadas) */
export interface RequirementLinePayload {
  producto_id: string;
  codigo_producto: string;
  descripcion: string;
  cantidad_requerida: number;
  unidad: string;
  tipo_material: string;
  precio_unitario_usd: number | null;
  total_usd: number | null;
}

// Fetch all requirements
export function useRequirements() {
  return useQuery({
    queryKey: ['requerimientos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .select('*')
        .order('mes', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch requirements with items
export function useRequirementsWithItems() {
  return useQuery({
    queryKey: ['requerimientos', 'with-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .select(`
          *,
          items:requerimiento_items(*)
        `)
        .order('mes', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single requirement
export function useRequirement(id: string | undefined) {
  return useQuery({
    queryKey: ['requerimientos', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .select(`
          *,
          items:requerimiento_items(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Fetch requirement by mes + cuadro (para validar unicidad)
export function useRequirementByMesAndCuadro(mes: string | null, cuadroId: string | null) {
  return useQuery({
    queryKey: ['requerimientos', 'by-mes-cuadro', mes, cuadroId],
    queryFn: async () => {
      if (!mes || !cuadroId) return null;
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .select(`
          *,
          items:requerimiento_items(*)
        `)
        .eq('mes', mes)
        .eq('cuadro_id', cuadroId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!mes && !!cuadroId,
  });
}

// Create requirement
export function useCreateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newReq: RequirementInsert) => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .insert(newReq)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
    },
  });
}

// Update requirement
export function useUpdateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RequirementUpdate }) => {
      const { data, error } = await supabase
        .from('requerimientos_mensuales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
      queryClient.invalidateQueries({ queryKey: ['requerimientos', variables.id] });
    },
  });
}

// Create requirement with items (encabezado + líneas consolidadas)
export function useCreateRequirementWithItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      mes: string;
      cuadro_id: string;
      creado_por: string;
      items: RequirementLinePayload[];
    }) => {
      const { mes, cuadro_id, creado_por, items } = payload;
      const total_usd = items.reduce((sum, i) => sum + (i.total_usd ?? 0), 0);
      
      // Calculate total kilos from all items converting based on unit
      const total_kilos = items.reduce((sum, i) => {
        if (i.unidad === 'TON') return sum + i.cantidad_requerida * 1000;
        if (i.unidad === 'KG') return sum + i.cantidad_requerida;
        // For UN or other units, use cantidad as-is (could be pieces)
        return sum + i.cantidad_requerida;
      }, 0);
      
      const total_toneladas = total_kilos / 1000;

      const reqId = crypto.randomUUID();
      const { data: req, error: errReq } = await supabase
        .from('requerimientos_mensuales')
        .insert({
          id: reqId,
          mes,
          cuadro_id,
          creado_por,
          estado: 'aprobado',
          total_usd,
          total_toneladas,
          total_kilos,
          kilos_consumidos: 0,
          kilos_disponibles: total_kilos,
        })
        .select()
        .single();

      if (errReq) throw errReq;
      if (!req) throw new Error('No se creó el requerimiento');

      const itemsToInsert: RequirementItemInsert[] = items.map((line) => {
        // Calculate kilos_disponibles based on unit
        let kilosDisponibles = line.cantidad_requerida;
        if (line.unidad === 'TON') {
          kilosDisponibles = line.cantidad_requerida * 1000;
        } else if (line.unidad === 'KG') {
          kilosDisponibles = line.cantidad_requerida;
        }
        
        return {
          id: crypto.randomUUID(),
          requerimiento_id: req.id,
          producto_id: line.producto_id,
          codigo_producto: line.codigo_producto,
          descripcion: line.descripcion,
          cantidad_requerida: line.cantidad_requerida,
          unidad: line.unidad,
          tipo_material: line.tipo_material,
          precio_unitario_usd: line.precio_unitario_usd,
          total_usd: line.total_usd,
          kilos_consumidos: 0,
          kilos_disponibles: kilosDisponibles,
        };
      });

      if (itemsToInsert.length > 0) {
        const { error: errItems } = await supabase.from('requerimiento_items').insert(itemsToInsert);
        if (errItems) throw errItems;
      }

      return req;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
    },
  });
}

// Update requirement header and replace all items
export function useUpdateRequirementWithItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      updates: RequirementUpdate;
      items: RequirementLinePayload[];
    }) => {
      const { id, updates, items } = payload;
      const total_usd = items.reduce((sum, i) => sum + (i.total_usd ?? 0), 0);
      
      // Calculate total kilos from all items converting based on unit
      const total_kilos = items.reduce((sum, i) => {
        if (i.unidad === 'TON') return sum + i.cantidad_requerida * 1000;
        if (i.unidad === 'KG') return sum + i.cantidad_requerida;
        return sum + i.cantidad_requerida;
      }, 0);
      
      const total_toneladas = total_kilos / 1000;

      // Recalculate kilos_disponibles (total - consumed from existing PIMs)
      // For now, set it equal to total_kilos (will be updated by PIM creation)
      const kilos_disponibles = total_kilos;

      const { error: errReq } = await supabase
        .from('requerimientos_mensuales')
        .update({
          ...updates,
          total_usd,
          total_toneladas,
          total_kilos,
          kilos_disponibles,
        })
        .eq('id', id);

      if (errReq) throw errReq;

      const { error: errDel } = await supabase.from('requerimiento_items').delete().eq('requerimiento_id', id);
      if (errDel) throw errDel;

      const itemsToInsert: RequirementItemInsert[] = items.map((line) => {
        // Calculate kilos_disponibles based on unit
        let kilosDisponibles = line.cantidad_requerida;
        if (line.unidad === 'TON') {
          kilosDisponibles = line.cantidad_requerida * 1000;
        } else if (line.unidad === 'KG') {
          kilosDisponibles = line.cantidad_requerida;
        }
        
        return {
          id: crypto.randomUUID(),
          requerimiento_id: id,
          producto_id: line.producto_id,
          codigo_producto: line.codigo_producto,
          descripcion: line.descripcion,
          cantidad_requerida: line.cantidad_requerida,
          unidad: line.unidad,
          tipo_material: line.tipo_material,
          precio_unitario_usd: line.precio_unitario_usd,
          total_usd: line.total_usd,
          kilos_consumidos: 0,
          kilos_disponibles: kilosDisponibles,
        };
      });

      if (itemsToInsert.length > 0) {
        const { error: errItems } = await supabase.from('requerimiento_items').insert(itemsToInsert);
        if (errItems) throw errItems;
      }

      return { id, ...updates };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
      queryClient.invalidateQueries({ queryKey: ['requerimientos', variables.id] });
    },
  });
}

// Delete requirement (and its items via cascade or manual delete)
export function useDeleteRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete associated items
      const { error: errItems } = await supabase
        .from('requerimiento_items')
        .delete()
        .eq('requerimiento_id', id);
      
      if (errItems) throw errItems;

      // Then delete the requirement
      const { error } = await supabase
        .from('requerimientos_mensuales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
    },
  });
}
