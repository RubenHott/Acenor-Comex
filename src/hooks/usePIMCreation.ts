import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PIMItemSelection } from '@/components/pim/PIMItemSelector';
import type { PIMExtraItem } from '@/components/pim/PIMExtraProductSelector';
import type { PIMFormData } from '@/components/pim/PIMForm';
import type { ContractConditionsData } from '@/components/pim/PIMContractConditions';

interface CreatePIMPayload {
  cuadroId: string;
  formData: PIMFormData;
  items: PIMItemSelection[];
  extraItems: PIMExtraItem[];
  observaciones?: string;
  contractConditions?: ContractConditionsData;
}

// Generate next PIM code: PIM-YYYY-NNN
async function generatePIMCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PIM-${year}-`;

  const { count, error } = await supabase
    .from('pims')
    .select('*', { count: 'exact', head: true })
    .like('codigo', `${prefix}%`);

  if (error) throw error;

  const nextNumber = (count ?? 0) + 1;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

export function useCreatePIMWithItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePIMPayload) => {
      const { cuadroId, formData, items, extraItems, observaciones, contractConditions } = payload;

      if (items.length === 0 && extraItems.length === 0) {
        throw new Error('Debe seleccionar al menos un ítem o producto extra');
      }
      if (!formData.proveedorId) {
        throw new Error('Debe seleccionar un proveedor');
      }
      if (!formData.descripcion.trim()) {
        throw new Error('Debe ingresar una descripción');
      }

      // Get supplier name
      const { data: supplier } = await supabase
        .from('proveedores')
        .select('nombre')
        .eq('id', formData.proveedorId)
        .single();

      const codigo = await generatePIMCode();
      const pimId = crypto.randomUUID();

      // Calculate totals from requirement items
      const totalToneladasReq = items.reduce((sum, item) => {
        if (item.unidad === 'TON') return sum + item.cantidadAConsumir;
        if (item.unidad === 'KG') return sum + item.cantidadAConsumir / 1000;
        return sum;
      }, 0);

      const totalUsdReq = items.reduce((sum, item) => sum + item.totalUsd, 0);

      // Calculate totals from extra items
      const totalToneladasExtra = extraItems.reduce((sum, item) => {
        if (item.unidad === 'TON') return sum + item.cantidad;
        if (item.unidad === 'KG') return sum + item.cantidad / 1000;
        return sum;
      }, 0);

      const totalUsdExtra = extraItems.reduce((sum, item) => sum + item.totalUsd, 0);

      const totalToneladas = totalToneladasReq + totalToneladasExtra;
      const totalUsd = totalUsdReq + totalUsdExtra;

      // Get the first requirement ID if we have items from requirements
      const requerimientoId = items.length > 0 ? items[0].requerimientoId : null;

      // Build description with observaciones if present
      const descripcionFinal = observaciones
        ? `${formData.descripcion}\n\n[${observaciones}]`
        : formData.descripcion;

      // 1. Insert PIM header
      const { error: pimError } = await supabase.from('pims').insert({
        id: pimId,
        codigo,
        descripcion: descripcionFinal,
        requerimiento_id: requerimientoId ?? items[0]?.requerimientoId ?? cuadroId,
        cuadro_id: cuadroId,
        proveedor_id: formData.proveedorId,
        proveedor_nombre: supplier?.nombre ?? null,
        modalidad_pago: formData.modalidadPago,
        dias_credito: formData.diasCredito,
        porcentaje_anticipo: formData.porcentajeAnticipo,
        estado: 'creado',
        tipo: 'principal',
        total_toneladas: totalToneladas,
        total_usd: totalUsd,
        // Contract conditions
        condicion_precio: contractConditions?.condicionPrecio || null,
        fecha_embarque: contractConditions?.fechaEmbarque || null,
        origen: contractConditions?.origen || null,
        fabricas_origen: contractConditions?.fabricasOrigen || null,
        notas_pago: contractConditions?.notasPago || null,
      });

      if (pimError) throw pimError;

      // 2. Insert PIM items from requirements
      if (items.length > 0) {
        const pimItems = items.map((item) => ({
          id: crypto.randomUUID(),
          pim_id: pimId,
          producto_id: item.productoId,
          codigo_producto: item.codigoProducto,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidad: item.cantidadAConsumir,
          precio_unitario_usd: item.precioUnitarioUsd ?? 0,
          total_usd: item.totalUsd,
          toneladas:
            item.unidad === 'TON'
              ? item.cantidadAConsumir
              : item.unidad === 'KG'
              ? item.cantidadAConsumir / 1000
              : 0,
        }));

        const { error: itemsError } = await supabase.from('pim_items').insert(pimItems);
        if (itemsError) throw itemsError;

        // 3. Insert PIM-requirement relationships
        const pimReqItems = items.map((item) => ({
          id: crypto.randomUUID(),
          pim_id: pimId,
          requirement_item_id: item.itemId,
          producto_id: item.productoId,
          codigo_producto: item.codigoProducto,
          descripcion: item.descripcion,
          kilos_consumidos: item.cantidadAConsumir,
        }));

        const { error: relError } = await supabase
          .from('pim_requirement_items')
          .insert(pimReqItems);
        if (relError) throw relError;

        // 4. Update requerimiento_items - decrease kilos_disponibles
        // Group by requerimiento to batch updates
        const updatesByReq: Record<string, PIMItemSelection[]> = {};
        items.forEach((item) => {
          if (!updatesByReq[item.requerimientoId]) {
            updatesByReq[item.requerimientoId] = [];
          }
          updatesByReq[item.requerimientoId].push(item);
        });

        for (const [reqId, reqItems] of Object.entries(updatesByReq)) {
          // Update each item
          for (const item of reqItems) {
            const { data: reqItem, error: fetchErr } = await supabase
              .from('requerimiento_items')
              .select('kilos_consumidos, kilos_disponibles')
              .eq('id', item.itemId)
              .single();

            if (fetchErr) throw fetchErr;

            const newConsumidos = (reqItem.kilos_consumidos ?? 0) + item.cantidadAConsumir;
            const newDisponibles = (reqItem.kilos_disponibles ?? 0) - item.cantidadAConsumir;

            const { error: updateErr } = await supabase
              .from('requerimiento_items')
              .update({
                kilos_consumidos: newConsumidos,
                kilos_disponibles: Math.max(0, newDisponibles),
              })
              .eq('id', item.itemId);

            if (updateErr) throw updateErr;
          }

          // 5. Update requerimientos_mensuales totals
          const { data: req, error: reqFetchErr } = await supabase
            .from('requerimientos_mensuales')
            .select('kilos_consumidos, kilos_disponibles')
            .eq('id', reqId)
            .single();

          if (reqFetchErr) throw reqFetchErr;

          const totalKilosConsumidosEnPIM = reqItems.reduce(
            (sum, item) => sum + item.cantidadAConsumir,
            0
          );

          const { error: reqUpdateErr } = await supabase
            .from('requerimientos_mensuales')
            .update({
              kilos_consumidos: (req.kilos_consumidos ?? 0) + totalKilosConsumidosEnPIM,
              kilos_disponibles: Math.max(
                0,
                (req.kilos_disponibles ?? 0) - totalKilosConsumidosEnPIM
              ),
            })
            .eq('id', reqId);

          if (reqUpdateErr) throw reqUpdateErr;
        }
      }

      // 6. Insert extra items (not linked to requirements)
      if (extraItems.length > 0) {
        const extraPimItems = extraItems.map((item) => ({
          id: crypto.randomUUID(),
          pim_id: pimId,
          producto_id: item.productoId,
          codigo_producto: item.codigoProducto,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidad: item.cantidad,
          precio_unitario_usd: item.precioUnitarioUsd,
          total_usd: item.totalUsd,
          toneladas:
            item.unidad === 'TON'
              ? item.cantidad
              : item.unidad === 'KG'
              ? item.cantidad / 1000
              : 0,
        }));

        const { error: extraItemsError } = await supabase
          .from('pim_items')
          .insert(extraPimItems);
        if (extraItemsError) throw extraItemsError;
      }

      return { id: pimId, codigo };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Hook to get requirement items with available quantity
export function useRequirementItemsWithAvailability(requerimientoId: string | null) {
  const queryClient = useQueryClient();

  return {
    invalidate: () => {
      if (requerimientoId) {
        queryClient.invalidateQueries({ queryKey: ['requerimientos', requerimientoId] });
      }
    },
  };
}
