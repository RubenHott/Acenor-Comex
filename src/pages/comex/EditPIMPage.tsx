import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { usePIM, useUpdatePIM } from '@/hooks/usePIMs';
import { usePIMItems } from '@/hooks/usePIMItems';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePIMPuertos, useSavePIMPuertos } from '@/hooks/usePuertos';
import { PIMForm, type PIMFormData } from '@/components/pim/PIMForm';
import { PIMContractConditions, type ContractConditionsData } from '@/components/pim/PIMContractConditions';
import { PIMEditItemsTable, type EditableItem } from '@/components/pim/PIMEditItemsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Ship, Save, FileText, Package, ShieldAlert } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { canDo } from '@/lib/permissions';
import type { UserRole } from '@/types/comex';

export default function EditPIMPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEditPIM = canDo(user?.role as UserRole | undefined, 'edit_pim');

  // --- Permission guard ---
  if (!canEditPIM) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="Acceso denegado"
          subtitle="No tienes permiso para editar PIMs"
          backTo="/comex/pims"
        />
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Permisos insuficientes</h2>
            <p className="text-sm text-muted-foreground">
              Tu rol actual no tiene acceso a la edición de PIMs. Contacta a un administrador si necesitas realizar cambios.
            </p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { data: pim, isLoading: isLoadingPIM } = usePIM(id);
  const { data: pimItems, isLoading: isLoadingItems } = usePIMItems(id);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: pimPuertos } = usePIMPuertos(id);
  const savePIMPuertos = useSavePIMPuertos();
  const updatePIM = useUpdatePIM();

  const [formData, setFormData] = useState<PIMFormData>({
    descripcion: '',
    proveedorId: '',
    modalidadPago: 'carta_credito',
    diasCredito: 90,
    porcentajeAnticipo: null,
    codigoCorrelativo: '',
  });

  const [contractConditions, setContractConditions] = useState<ContractConditionsData>({
    condicionPrecio: '',
    fechaEmbarqueInicio: undefined,
    fechaEmbarqueFin: undefined,
    origen: '',
    fabricasOrigen: '',
    molinoId: '',
    notasPago: '',
    puertosDestino: [],
  });

  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-populate form when PIM data loads
  useEffect(() => {
    if (pim && !initialized) {
      setFormData({
        descripcion: pim.descripcion ?? '',
        proveedorId: pim.proveedor_id ?? '',
        modalidadPago: (pim.modalidad_pago as PIMFormData['modalidadPago']) ?? 'carta_credito',
        diasCredito: pim.dias_credito ?? null,
        porcentajeAnticipo: pim.porcentaje_anticipo ?? null,
        codigoCorrelativo: (pim as any).codigo_correlativo ?? '',
      });

      let fechaInicio: Date | undefined;
      let fechaFin: Date | undefined;
      if (pim.fecha_embarque) {
        const parts = pim.fecha_embarque.split(' - ');
        if (parts[0]) fechaInicio = new Date(parts[0]);
        if (parts[1]) fechaFin = new Date(parts[1]);
      }

      setContractConditions({
        condicionPrecio: pim.condicion_precio ?? '',
        fechaEmbarqueInicio: fechaInicio,
        fechaEmbarqueFin: fechaFin,
        origen: pim.origen ?? '',
        fabricasOrigen: pim.fabricas_origen ?? '',
        molinoId: pim.molino_id ?? '',
        notasPago: pim.notas_pago ?? '',
        puertosDestino: pimPuertos?.map((p) => p.id) ?? [],
      });

      setInitialized(true);
    }
  }, [pim, initialized]);

  // Pre-populate items
  useEffect(() => {
    if (pimItems && pimItems.length > 0 && editedItems.length === 0 && initialized) {
      setEditedItems(pimItems.map(item => ({
        id: item.id,
        producto_id: item.producto_id,
        codigo_producto: item.codigo_producto,
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        precio_unitario_usd: item.precio_unitario_usd,
        total_usd: item.total_usd,
        toneladas: item.toneladas,
        molino_id: item.molino_id ?? undefined,
      })));
    }
  }, [pimItems, initialized, editedItems.length]);

  // Computed totals
  const totalToneladas = useMemo(() =>
    editedItems.reduce((sum, item) => {
      if (item.unidad === 'UND' || item.unidad === 'PZA') return sum;
      if (item.unidad === 'KG') return sum + item.cantidad / 1000;
      if (item.unidad === 'TON') return sum + item.cantidad;
      return sum + item.toneladas;
    }, 0),
    [editedItems]
  );

  const totalUnidades = useMemo(() =>
    editedItems.reduce((sum, item) => {
      if (item.unidad === 'UND' || item.unidad === 'PZA') return sum + item.cantidad;
      return sum;
    }, 0),
    [editedItems]
  );

  const totalUsd = useMemo(() =>
    editedItems.reduce((sum, item) => sum + item.total_usd, 0),
    [editedItems]
  );

  const handleSave = async () => {
    if (!id || !pim) return;
    setSaving(true);

    try {
      // Get supplier name
      const { data: supplier } = await supabase
        .from('proveedores')
        .select('nombre')
        .eq('id', formData.proveedorId)
        .single();

      // Get molino name if selected
      let molinoNombre: string | null = null;
      if (contractConditions.molinoId) {
        const { data: molino } = await supabase
          .from('fabricas_molinos')
          .select('nombre')
          .eq('id', contractConditions.molinoId)
          .single();
        molinoNombre = molino?.nombre ?? null;
      }

      // Update PIM header
      await updatePIM.mutateAsync({
        id,
        updates: {
          descripcion: formData.descripcion,
          proveedor_id: formData.proveedorId,
          proveedor_nombre: supplier?.nombre ?? pim.proveedor_nombre,
          modalidad_pago: formData.modalidadPago,
          dias_credito: formData.diasCredito,
          porcentaje_anticipo: formData.porcentajeAnticipo,
          condicion_precio: contractConditions.condicionPrecio || null,
          fecha_embarque: contractConditions.fechaEmbarqueInicio
            ? `${contractConditions.fechaEmbarqueInicio.toISOString().split('T')[0]}${contractConditions.fechaEmbarqueFin ? ' - ' + contractConditions.fechaEmbarqueFin.toISOString().split('T')[0] : ''}`
            : null,
          origen: contractConditions.origen || null,
          fabricas_origen: contractConditions.fabricasOrigen || null,
          molino_id: contractConditions.molinoId || null,
          molino_nombre: molinoNombre,
          notas_pago: contractConditions.notasPago || null,
          codigo_correlativo: formData.codigoCorrelativo?.trim() || null,
          total_toneladas: totalToneladas,
          total_usd: totalUsd,
        },
      });

      // Save puertos
      await savePIMPuertos.mutateAsync({
        pimId: id,
        puertoIds: contractConditions.puertosDestino || [],
      });

      // 1. Delete removed items
      for (const removedId of removedItemIds) {
        await supabase.from('pim_items').delete().eq('id', removedId);
      }

      // 2. Update existing items & insert new ones
      for (const item of editedItems) {
        const toneladas = item.unidad === 'KG' ? item.cantidad / 1000 : item.unidad === 'TON' ? item.cantidad : 0;

        const molinoId = item.molino_id ?? (contractConditions.molinoId || null);
        if (item.isNew) {
          // Insert new item
          await supabase.from('pim_items').insert({
            id: crypto.randomUUID(),
            pim_id: id,
            producto_id: item.producto_id ?? '',
            codigo_producto: item.codigo_producto,
            descripcion: item.descripcion,
            unidad: item.unidad,
            cantidad: item.cantidad,
            precio_unitario_usd: item.precio_unitario_usd,
            total_usd: item.total_usd,
            toneladas,
            molino_id: molinoId,
          });
        } else {
          // Update existing
          await supabase
            .from('pim_items')
            .update({
              cantidad: item.cantidad,
              precio_unitario_usd: item.precio_unitario_usd,
              total_usd: item.total_usd,
              toneladas,
              molino_id: molinoId,
            })
            .eq('id', item.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['pim-items', id] });
      queryClient.invalidateQueries({ queryKey: ['pims'] });

      toast({
        title: 'PIM actualizado',
        description: `Se actualizó el PIM ${pim.codigo} correctamente.`,
      });

      navigate('/comex/pims');
    } catch (error) {
      toast({
        title: 'Error al actualizar PIM',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingPIM || isLoadingItems) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Editar PIM" subtitle="Cargando datos..." />
        <div className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!pim) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="PIM no encontrado" subtitle="" />
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header
        title={`Editar ${(pim as any).codigo_correlativo || pim.codigo}`}
        subtitle={`${(pim as any).codigo_correlativo ? pim.codigo + ' — ' : ''}Modificar datos del PIM — ${pim.proveedor_nombre ?? 'Sin proveedor'}`}
      />

      <div className="p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  Datos del PIM
                  <Badge variant="secondary" className="ml-auto">{pim.estado}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="contrato" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Contrato
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="general">
                    <PIMForm
                      formData={formData}
                      onFormDataChange={setFormData}
                      suppliers={suppliers ?? []}
                      isLoadingSuppliers={isLoadingSuppliers}
                    />
                  </TabsContent>
                  <TabsContent value="contrato">
                    <PIMContractConditions
                      data={contractConditions}
                      onChange={setContractConditions}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Toneladas</Label>
                    <p className="text-xl font-bold">
                      {totalToneladas.toLocaleString('es-PE', { minimumFractionDigits: 2 })} t
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Unidades</Label>
                    <p className="text-xl font-bold">
                      {totalUnidades.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div>
                  <Label className="text-xs text-muted-foreground">Total USD</Label>
                  <p className="text-xl font-bold text-primary">
                    ${totalUsd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full gradient-primary"
              size="lg"
              disabled={saving || editedItems.length === 0}
              onClick={handleSave}
            >
              {saving ? 'Guardando...' : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Guardar Cambios
                </>
              )}
            </Button>
          </div>

          {/* Right: Items table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Materiales del PIM
                  <Badge variant="outline" className="ml-2">{editedItems.length} ítems</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PIMEditItemsTable
                  items={editedItems}
                  onItemsChange={setEditedItems}
                  removedItemIds={removedItemIds}
                  onRemovedItemIdsChange={setRemovedItemIds}
                  molinoId={contractConditions.molinoId || undefined}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
