import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useRequirementsWithItems } from '@/hooks/useRequirements';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCuadros } from '@/hooks/useCuadros';
import { useCreatePIMWithItems } from '@/hooks/usePIMCreation';
import { PIMItemSelector, type PIMItemSelection } from '@/components/pim/PIMItemSelector';
import { PIMForm, type PIMFormData } from '@/components/pim/PIMForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Ship, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [selectedReqId, setSelectedReqId] = useState<string>(preselectedReqId ?? '');
  const [selections, setSelections] = useState<PIMItemSelection[]>([]);
  const [formData, setFormData] = useState<PIMFormData>({
    descripcion: '',
    proveedorId: '',
    modalidadPago: 'carta_credito',
    diasCredito: 90,
    porcentajeAnticipo: null,
  });

  // Filter requirements with available items
  const availableRequirements = useMemo(() => {
    return (requirements ?? []).filter((req) => req.kilos_disponibles > 0);
  }, [requirements]);

  const selectedRequirement = useMemo(() => {
    return availableRequirements.find((r) => r.id === selectedReqId);
  }, [availableRequirements, selectedReqId]);

  const selectedReqItems = useMemo(() => {
    if (!selectedRequirement) return [];
    return ((selectedRequirement as { items?: RequirementItem[] }).items ?? []).filter(
      (item) => item.kilos_disponibles > 0
    );
  }, [selectedRequirement]);

  const cuadroName = useMemo(() => {
    if (!selectedRequirement || !cuadros) return '';
    const cuadro = cuadros.find((c) => c.id === selectedRequirement.cuadro_id);
    return cuadro ? `${cuadro.codigo} — ${cuadro.nombre}` : '';
  }, [selectedRequirement, cuadros]);

  // Reset selections when requirement changes
  const handleReqChange = useCallback((reqId: string) => {
    setSelectedReqId(reqId);
    setSelections([]);
  }, []);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedReqId) errors.push('Debe seleccionar un requerimiento.');
    if (selections.length === 0) errors.push('Debe seleccionar al menos un ítem.');
    if (!formData.descripcion.trim()) errors.push('Debe ingresar una descripción.');
    if (!formData.proveedorId) errors.push('Debe seleccionar un proveedor.');

    const hasExceedLimit = selections.some(
      (s) => s.cantidadAConsumir > s.cantidadDisponible
    );
    if (hasExceedLimit)
      errors.push('Hay ítems con cantidad mayor a la disponible.');

    const hasZeroQty = selections.some((s) => s.cantidadAConsumir <= 0);
    if (hasZeroQty) errors.push('Hay ítems con cantidad 0 o negativa.');

    return errors;
  }, [selectedReqId, selections, formData]);

  const canSave = validationErrors.length === 0;

  const handleSave = async () => {
    if (!canSave || !selectedRequirement) return;

    try {
      const result = await createPIM.mutateAsync({
        requerimientoId: selectedRequirement.id,
        cuadroId: selectedRequirement.cuadro_id,
        formData,
        items: selections,
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
      <Header title="Crear PIM" subtitle="Nuevo proceso de importación" />

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

        {availableRequirements.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay requerimientos con saldo disponible para crear PIMs. Primero
              ingrese un requerimiento mensual.
            </AlertDescription>
          </Alert>
        ) : (
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
                <CardContent className="space-y-6">
                  {/* Requirement selector */}
                  <div className="space-y-2">
                    <Label>Requerimiento *</Label>
                    <Select value={selectedReqId} onValueChange={handleReqChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar requerimiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRequirements.map((req) => {
                          const cuadro = cuadros?.find(
                            (c) => c.id === req.cuadro_id
                          );
                          return (
                            <SelectItem key={req.id} value={req.id}>
                              {req.mes} — {cuadro?.codigo ?? 'Sin cuadro'} (
                              {req.kilos_disponibles.toLocaleString()} kg disp.)
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedRequirement && (
                      <p className="text-xs text-muted-foreground">{cuadroName}</p>
                    )}
                  </div>

                  {/* PIM Form */}
                  <PIMForm
                    formData={formData}
                    onFormDataChange={setFormData}
                    suppliers={suppliers ?? []}
                    isLoadingSuppliers={isLoadingSuppliers}
                  />
                </CardContent>
              </Card>

              {/* Validation errors */}
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

            {/* Right: Item selector */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Seleccionar Ítems del Requerimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedReqId ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Ship className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Seleccione un requerimiento para ver los ítems disponibles</p>
                    </div>
                  ) : (
                    <PIMItemSelector
                      items={selectedReqItems}
                      selections={selections}
                      onSelectionsChange={setSelections}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
