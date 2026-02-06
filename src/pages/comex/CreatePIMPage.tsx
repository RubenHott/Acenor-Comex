import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useRequirementsWithItems } from '@/hooks/useRequirements';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCuadros } from '@/hooks/useCuadros';
import { isCuadroPorUnidad } from '@/lib/cuadrosUnidad';
import { useCreatePIMWithItems } from '@/hooks/usePIMCreation';
import {
  PIMItemSelector,
  type PIMItemSelection,
  type RequirementItemWithContext,
} from '@/components/pim/PIMItemSelector';
import { PIMExtraProductSelector, type PIMExtraItem } from '@/components/pim/PIMExtraProductSelector';
import { PIMForm, type PIMFormData } from '@/components/pim/PIMForm';
import { PIMContractConditions, type ContractConditionsData } from '@/components/pim/PIMContractConditions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Ship, Save, AlertCircle, Package, Plus, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { RequirementItem } from '@/hooks/useRequirements';

export default function CreatePIMPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedReqId = searchParams.get('requerimiento');

  const { data: requirements, isLoading: isLoadingReqs } = useRequirementsWithItems();
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: cuadros } = useCuadros();

  const createPIM = useCreatePIMWithItems();

  // State
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>(
    preselectedReqId ? [preselectedReqId] : []
  );
  const [selections, setSelections] = useState<PIMItemSelection[]>([]);
  const [extraItems, setExtraItems] = useState<PIMExtraItem[]>([]);
  const [formData, setFormData] = useState<PIMFormData>({
    descripcion: '',
    proveedorId: '',
    modalidadPago: 'carta_credito',
    diasCredito: 90,
    porcentajeAnticipo: null,
  });
  const [contractConditions, setContractConditions] = useState<ContractConditionsData>({
    condicionPrecio: '',
    fechaEmbarqueInicio: undefined,
    fechaEmbarqueFin: undefined,
    origen: '',
    fabricasOrigen: '',
    notasPago: '',
  });

  // Get cuadro info
  const cuadroById = useMemo(() => {
    const m: Record<string, { codigo: string; nombre: string }> = {};
    (cuadros ?? []).forEach((c) => {
      m[c.id] = { codigo: c.codigo, nombre: c.nombre };
    });
    return m;
  }, [cuadros]);

  // Filter requirements with available items
  const availableRequirements = useMemo(() => {
    return (requirements ?? []).filter((req) => req.kilos_disponibles > 0);
  }, [requirements]);

  // Convert selected requirements' items to flat list with context
  const allAvailableItems = useMemo(() => {
    const items: RequirementItemWithContext[] = [];
    
    selectedReqIds.forEach((reqId) => {
      const req = requirements?.find((r) => r.id === reqId);
      if (!req) return;
      
      const reqItems = ((req as { items?: RequirementItem[] }).items ?? [])
        .filter((item) => item.kilos_disponibles > 0)
        .map((item) => ({
          ...item,
          requerimientoId: req.id,
          cuadroId: req.cuadro_id,
          cuadroCodigo: cuadroById[req.cuadro_id]?.codigo ?? 'N/A',
          requerimientoMes: req.mes,
        }));
      
      items.push(...reqItems);
    });
    
    return items;
  }, [selectedReqIds, requirements, cuadroById]);

  // Toggle requirement selection
  const toggleRequirement = useCallback((reqId: string, checked: boolean) => {
    if (checked) {
      setSelectedReqIds((prev) => [...prev, reqId]);
    } else {
      setSelectedReqIds((prev) => prev.filter((id) => id !== reqId));
      // Remove selections from this requirement
      setSelections((prev) => prev.filter((s) => s.requerimientoId !== reqId));
    }
  }, []);

  // Calculate totals
  const totalReqUsd = selections.reduce((sum, s) => sum + s.totalUsd, 0);
  const totalExtraUsd = extraItems.reduce((sum, i) => sum + i.totalUsd, 0);
  const totalUsd = totalReqUsd + totalExtraUsd;

  // Extra toneladas & unidades
  const extraToneladas = extraItems.reduce((sum, i) => {
    if (isCuadroPorUnidad(i.cuadro ?? '')) return sum;
    if (i.unidad === 'KG') return sum + i.cantidad / 1000;
    return sum + i.cantidad;
  }, 0);
  const extraUnidades = extraItems.reduce((sum, i) => {
    if (!isCuadroPorUnidad(i.cuadro ?? '')) return sum;
    return sum + i.cantidad;
  }, 0);

  const totalToneladas = selections.reduce((sum, s) => {
    if (isCuadroPorUnidad(s.cuadroCodigo)) return sum;
    if (s.unidad === 'KG') return sum + s.cantidadAConsumir / 1000;
    return sum + s.cantidadAConsumir;
  }, 0);

  // Validation
  const hasExceedingItems = selections.some((s) => s.exceedsLimit);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (selections.length === 0 && extraItems.length === 0) {
      errors.push('Debe seleccionar al menos un ítem o agregar productos extra.');
    }
    if (!formData.descripcion.trim()) errors.push('Debe ingresar una descripción.');
    if (!formData.proveedorId) errors.push('Debe seleccionar un proveedor.');

    const hasZeroQty = selections.some((s) => s.cantidadAConsumir <= 0);
    if (hasZeroQty) errors.push('Hay ítems con cantidad 0 o negativa.');

    const hasZeroExtraQty = extraItems.some((i) => i.cantidad <= 0);
    if (hasZeroExtraQty) errors.push('Hay productos extra con cantidad 0 o negativa.');

    return errors;
  }, [selections, extraItems, formData]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (hasExceedingItems) {
      w.push('Hay ítems que exceden el saldo disponible. Se registrará observación.');
    }
    return w;
  }, [hasExceedingItems]);

  const canSave = validationErrors.length === 0;

  const handleSave = async () => {
    if (!canSave) return;

    // Get unique cuadro IDs from selections
    const cuadroIds = [...new Set(selections.map((s) => s.cuadroId))];

    // Build observation if there are warnings
    const observaciones = hasExceedingItems
      ? `ALERTA: Items exceden saldo disponible - ${selections
          .filter((s) => s.exceedsLimit)
          .map((s) => `${s.codigoProducto}: ${s.cantidadAConsumir} > ${s.cantidadDisponible}`)
          .join('; ')}`
      : undefined;

    try {
      const result = await createPIM.mutateAsync({
        cuadroId: cuadroIds[0] ?? '',
        formData,
        items: selections,
        extraItems,
        observaciones,
        contractConditions,
      });

      toast({
        title: 'PIM creado exitosamente',
        description: `Se generó el PIM ${result.codigo}`,
      });

      navigate('/comex/pims');
    } catch (error) {
      toast({
        title: 'Error al crear PIM',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingReqs) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Crear PIM" subtitle="Nuevo proceso de importación" />
        <div className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header title="Crear PIM" subtitle="Nuevo proceso de importación - Multi-Cuadro" />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form & Requirement selector */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  Datos del PIM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="contrato" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Contrato
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

            {/* Requirement selector (multi) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Seleccionar Requerimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableRequirements.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hay requerimientos con saldo disponible.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableRequirements.map((req) => {
                      const cuadro = cuadroById[req.cuadro_id];
                      const isChecked = selectedReqIds.includes(req.id);

                      return (
                        <label
                          key={req.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-primary/5 border-primary/30'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              toggleRequirement(req.id, !!checked)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{req.mes}</span>
                              <Badge variant="secondary" className="text-xs">
                                {cuadro?.codigo ?? 'N/A'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {cuadro?.nombre}
                            </p>
                            <p className="text-sm text-primary font-medium mt-1">
                              {req.kilos_disponibles.toLocaleString()} kg disponibles
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedReqIds.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{selectedReqIds.length}</Badge>
                    <span>requerimiento(s) seleccionado(s)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation errors & warnings */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {warnings.length > 0 && validationErrors.length === 0 && (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground">
                  <ul className="list-disc list-inside text-sm">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Totals summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Toneladas</Label>
                    <p className="text-xl font-bold">
                      {(totalToneladas + extraToneladas).toLocaleString('es-PE', { minimumFractionDigits: 2 })} t
                    </p>
                    {extraToneladas > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ({extraToneladas.toLocaleString('es-PE', { minimumFractionDigits: 2 })} t extras)
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Unidades</Label>
                    <p className="text-xl font-bold">
                      {(selections.reduce((sum, s) => isCuadroPorUnidad(s.cuadroCodigo) ? sum + s.cantidadAConsumir : sum, 0) + extraUnidades).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                    </p>
                    {extraUnidades > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ({extraUnidades.toLocaleString()} extras)
                      </p>
                    )}
                  </div>
                </div>
                <Separator className="my-3" />
                <div>
                  <Label className="text-xs text-muted-foreground">Total USD</Label>
                  <p className="text-xl font-bold text-primary">
                    ${totalUsd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                  {extraItems.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      (Incluye ${totalExtraUsd.toLocaleString('es-PE', { minimumFractionDigits: 2 })} en productos adicionales)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save button */}
            <Button
              className="w-full gradient-primary"
              size="lg"
              disabled={!canSave || createPIM.isPending}
              onClick={handleSave}
            >
              {createPIM.isPending ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear PIM
                </>
              )}
            </Button>
          </div>

          {/* Right: Item selector & extras */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items from requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Items de Requerimientos Seleccionados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedReqIds.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ship className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Seleccione uno o más requerimientos para ver los ítems disponibles</p>
                  </div>
                ) : (
                  <PIMItemSelector
                    items={allAvailableItems}
                    selections={selections}
                    onSelectionsChange={setSelections}
                  />
                )}
              </CardContent>
            </Card>

            {/* Extra products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Productos Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PIMExtraProductSelector
                  extraItems={extraItems}
                  onExtraItemsChange={setExtraItems}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
