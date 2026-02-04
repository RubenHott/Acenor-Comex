import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useRequirements, useRequirementByMesAndCuadro, useRequirement, useCreateRequirementWithItems, useUpdateRequirementWithItems } from '@/hooks/useRequirements';
import { useCuadros } from '@/hooks/useCuadros';
import { useProducts, useProductsByCuadro } from '@/hooks/useProducts';
import { usePIMs } from '@/hooks/usePIMs';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Package, DollarSign, TrendingUp, Edit, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isCuadroPorUnidad } from '@/lib/cuadrosUnidad';
import { Badge } from '@/components/ui/badge';
import type { Requirement, RequirementItem } from '@/hooks/useRequirements';
import {
  RequirementEntryForm,
  buildLinePayloads,
  type RequirementLine,
} from '@/components/requirements/RequirementEntryForm';
import type { Product } from '@/hooks/useProducts';

// Convierte ítem de requerimiento a "producto" mínimo para el formulario (edición)
function requirementItemToProductLike(item: RequirementItem, productFromMaster: Product | null): Product | null {
  if (productFromMaster) return productFromMaster;
  return {
    id: item.producto_id,
    codigo: item.codigo_producto,
    descripcion: item.descripcion,
    categoria: item.tipo_material,
    unidad: item.unidad,
    ultimo_precio_usd: item.precio_unitario_usd,
    ultima_fecha_importacion: null,
    created_at: null,
    cuadro: null,
    clasificacion: null,
    cod_base_mp: null,
    cod_estadistico: null,
    sub_categoria: null,
    tipo_abc: null,
    origen: null,
    linea: null,
    peso: null,
    peso_compra: null,
    ancho: null,
    espesor: null,
    updated_at: null,
  } as Product;
}

function getDefaultMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function RequirementsPage() {
  const { user } = useAuth();
  const { data: requirements, isLoading, error } = useRequirements();
  const { data: cuadros } = useCuadros();
  const { data: products } = useProducts();
  const { data: pims } = usePIMs();

  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [formOpen, setFormOpen] = useState<'create' | 'edit' | null>(null);
  const [formMes, setFormMes] = useState(getDefaultMes);
  const [formCuadroId, setFormCuadroId] = useState('');
  const [formLines, setFormLines] = useState<RequirementLine[]>([]);
  const [editRequirementId, setEditRequirementId] = useState<string | null>(null);

  // Get the cuadro codigo for filtering products (productos.cuadro stores codigo, not id)
  const selectedCuadroCodigo = cuadros?.find((c) => c.id === formCuadroId)?.codigo;
  const { data: filteredProducts } = useProductsByCuadro(selectedCuadroCodigo);

  const { data: existingByMesCuadro } = useRequirementByMesAndCuadro(
    formOpen === 'create' && formMes && formCuadroId ? formMes : null,
    formOpen === 'create' && formCuadroId ? formCuadroId : null
  );
  const { data: requirementForEdit } = useRequirement(editRequirementId ?? undefined);

  const createMutation = useCreateRequirementWithItems();
  const updateMutation = useUpdateRequirementWithItems();

  // Default cuadro al abrir "Nuevo"
  useEffect(() => {
    if (formOpen === 'create' && cuadros?.length && !formCuadroId) {
      setFormCuadroId(cuadros[0].id);
    }
  }, [formOpen, cuadros, formCuadroId]);

  // Cargar datos en modo edición (solo cuando el requerimiento cargado es el que estamos editando)
  useEffect(() => {
    if (formOpen !== 'edit' || !editRequirementId || !requirementForEdit || requirementForEdit.id !== editRequirementId || !products) return;
    const items = (requirementForEdit as { items?: RequirementItem[] }).items ?? [];
    const lines: RequirementLine[] = items.map((item) => {
      const product = products.find((p) => p.id === item.producto_id) ?? null;
      const productLike = requirementItemToProductLike(item, product);
      return {
        tempId: item.id,
        product: productLike,
        cantidadRequerida: item.cantidad_requerida,
      };
    });
    setFormMes(requirementForEdit.mes);
    setFormCuadroId(requirementForEdit.cuadro_id);
    setFormLines(lines.length ? lines : [{ tempId: crypto.randomUUID(), product: null, cantidadRequerida: 0 }]);
  }, [formOpen, editRequirementId, requirementForEdit, products]);

  const openCreate = useCallback(() => {
    setFormMes(getDefaultMes());
    setFormCuadroId(cuadros?.[0]?.id ?? '');
    setFormLines([{ tempId: crypto.randomUUID(), product: null, cantidadRequerida: 0 }]);
    setEditRequirementId(null);
    setFormOpen('create');
  }, [cuadros]);

  const openEdit = useCallback((req: Requirement) => {
    setEditRequirementId(req.id);
    setFormLines([]); // Se rellenan cuando cargue useRequirement
    setFormOpen('edit');
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(null);
    setEditRequirementId(null);
  }, []);

  const goToExisting = useCallback(() => {
    if (existingByMesCuadro) {
      setSelectedRequirement(existingByMesCuadro as Requirement);
      closeForm();
    }
  }, [existingByMesCuadro, closeForm]);

  const validationErrors = useMemo(() => {
    const err: string[] = [];
    if (!formMes) err.push('Falta Mes/Año.');
    if (!formCuadroId) err.push('Falta Cuadro de importación.');
    const consolidated = formLines.filter((l) => l.product && l.cantidadRequerida > 0);
    const hasEmptyCode = formLines.some((l) => !l.product);
    const hasInvalidQty = formLines.some((l) => l.product != null && l.cantidadRequerida <= 0);
    if (consolidated.length === 0 && (hasEmptyCode || formLines.some((l) => l.cantidadRequerida > 0))) {
      if (hasEmptyCode) err.push('Hay líneas sin código de producto seleccionado.');
      if (hasInvalidQty) err.push('La cantidad requerida debe ser mayor a 0.');
    }
    if (consolidated.length === 0 && formLines.length > 0) {
      err.push('Debe haber al menos una línea con código seleccionado y cantidad mayor a 0.');
    }
    return err;
  }, [formMes, formCuadroId, formLines]);

  const canSave = validationErrors.length === 0 && formLines.some((l) => l.product && l.cantidadRequerida > 0);

  const handleCreate = useCallback(async () => {
    if (!canSave || !user) return;
    const items = buildLinePayloads(formLines);
    if (items.length === 0) return;
    try {
      const req = await createMutation.mutateAsync({
        mes: formMes,
        cuadro_id: formCuadroId,
        creado_por: user.id,
        items,
      });
      setSelectedRequirement(req as Requirement);
      closeForm();
    } catch (e) {
      console.error(e);
    }
  }, [canSave, user, formMes, formCuadroId, formLines, createMutation, closeForm]);

  const handleUpdate = useCallback(async () => {
    if (!canSave || !editRequirementId) return;
    const items = buildLinePayloads(formLines);
    try {
      await updateMutation.mutateAsync({
        id: editRequirementId,
        updates: {},
        items,
      });
      setSelectedRequirement(
        (r) => (r?.id === editRequirementId ? { ...r, total_usd: items.reduce((s, i) => s + (i.total_usd ?? 0), 0), total_toneladas: items.filter((i) => i.unidad === 'TON').reduce((s, i) => s + i.cantidad_requerida, 0) } as Requirement : r)
      );
      closeForm();
    } catch (e) {
      console.error(e);
    }
  }, [canSave, editRequirementId, formLines, updateMutation, closeForm]);

  // Set first requirement as selected when data loads
  useEffect(() => {
    if (requirements && requirements.length > 0 && !selectedRequirement) {
      setSelectedRequirement(requirements[0]);
    }
  }, [requirements, selectedRequirement]);

  const pimCountsByRequirement = useMemo(() => {
    if (!pims) return {} as Record<string, number>;
    return pims.reduce((acc, pim) => {
      acc[pim.requerimiento_id] = (acc[pim.requerimiento_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [pims]);

  const countPIMsForRequirement = (requirementId: string) => pimCountsByRequirement[requirementId] || 0;
  const totalPIMsGenerated = pims?.length || 0;
  const cuadroNameById = useMemo(() => {
    const m: Record<string, string> = {};
    (cuadros ?? []).forEach((c) => {
      m[c.id] = `${c.codigo} — ${c.nombre}`;
    });
    return m;
  }, [cuadros]);

  const cuadroCodigoById = useMemo(() => {
    const m: Record<string, string> = {};
    (cuadros ?? []).forEach((c) => {
      m[c.id] = c.codigo;
    });
    return m;
  }, [cuadros]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      borrador: 'bg-muted text-muted-foreground',
      pendiente: 'bg-warning/10 text-warning',
      aprobado: 'bg-success/10 text-success',
      cerrado: 'bg-info/10 text-info',
    };
    return styles[estado] || styles.borrador;
  };

  const totalToneladas = requirements?.reduce((acc, r) => acc + (r.total_toneladas || 0), 0) || 0;
  const totalUSD = requirements?.reduce((acc, r) => acc + (r.total_usd || 0), 0) || 0;

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Requerimientos Mensuales" subtitle="Ingreso de requerimiento mensual por Mes/Año y Cuadro" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar requerimientos: {error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header
        title="Requerimientos Mensuales"
        subtitle="Ingreso de requerimiento mensual por Mes/Año y Cuadro"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Requerimientos</p>
                  <p className="text-2xl font-bold">{requirements?.length || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Toneladas</p>
                  <p className="text-2xl font-bold">{totalToneladas} t</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monto Total USD</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalUSD)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">PIMs Generados</p>
                  <p className="text-2xl font-bold">{totalPIMsGenerated}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold">Cuadros de Importación</CardTitle>
                <Button size="sm" className="gradient-primary" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))
                  ) : (
                    (requirements || []).map((req) => (
                      <button
                        key={req.id}
                        onClick={() => setSelectedRequirement(req)}
                        className={cn(
                          'w-full p-4 text-left transition-colors hover:bg-muted/50 flex items-center justify-between',
                          selectedRequirement?.id === req.id && 'bg-muted'
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium">{req.mes}</p>
                            <Badge className={getStatusBadge(req.estado)}>{req.estado}</Badge>
                            <Badge
                              variant="outline"
                              className={isCuadroPorUnidad(cuadroCodigoById[req.cuadro_id]) ? 'border-blue-500 text-blue-700' : 'border-amber-500 text-amber-700'}
                            >
                              {isCuadroPorUnidad(cuadroCodigoById[req.cuadro_id]) ? 'UN' : 'TON'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cuadroNameById[req.cuadro_id] ?? req.cuadro_id} • {req.total_toneladas || 0} t
                          </p>
                          <p className="text-sm font-medium text-primary mt-1">
                            {formatCurrency(req.total_usd || 0)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedRequirement ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg font-semibold">
                        Requerimiento {selectedRequirement.mes}
                      </CardTitle>
                      <Badge
                        variant={isCuadroPorUnidad(cuadroCodigoById[selectedRequirement.cuadro_id]) ? 'default' : 'secondary'}
                        className={isCuadroPorUnidad(cuadroCodigoById[selectedRequirement.cuadro_id]) ? 'bg-blue-600' : 'bg-amber-600'}
                      >
                        {isCuadroPorUnidad(cuadroCodigoById[selectedRequirement.cuadro_id]) ? 'En UNIDADES' : 'En TONELADAS'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cuadroNameById[selectedRequirement.cuadro_id] ?? selectedRequirement.cuadro_id}
                      {selectedRequirement.fecha_creacion &&
                        ` • Creado el ${new Intl.DateTimeFormat('es-PE', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(selectedRequirement.fecha_creacion))}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(selectedRequirement)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" className="gradient-accent">
                      Generar PIM
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const esPorUnidad = isCuadroPorUnidad(cuadroCodigoById[selectedRequirement.cuadro_id]);
                    return (
                      <>
                        <div className={cn(
                          'grid grid-cols-4 gap-4 p-4 rounded-lg border-2 mb-6',
                          esPorUnidad ? 'bg-blue-500/10 border-blue-500/30' : 'bg-amber-500/10 border-amber-500/30'
                        )}>
                          <div>
                            <p className="text-sm text-muted-foreground">Total USD</p>
                            <p className="text-xl font-bold">{formatCurrency(selectedRequirement.total_usd || 0)}</p>
                          </div>
                          {esPorUnidad ? (
                            <div>
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Unidades</p>
                              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">—</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Toneladas</p>
                              <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{selectedRequirement.total_toneladas || 0} t</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground">Total Kilos</p>
                            <p className="text-xl font-bold">{(selectedRequirement.total_kilos || 0).toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">PIMs</p>
                            <p className="text-xl font-bold">{countPIMsForRequirement(selectedRequirement.id)}</p>
                          </div>
                        </div>
                        {!esPorUnidad && (
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-lg border border-success/30 bg-success/5">
                              <p className="text-sm text-muted-foreground">Kilos Disponibles</p>
                              <p className="text-xl font-bold text-success">{(selectedRequirement.kilos_disponibles || 0).toLocaleString()} kg</p>
                            </div>
                            <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                              <p className="text-sm text-muted-foreground">Kilos Consumidos</p>
                              <p className="text-xl font-bold text-warning">{(selectedRequirement.kilos_consumidos || 0).toLocaleString()} kg</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {selectedRequirement.observaciones && (
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-sm font-medium mb-2">Observaciones</p>
                      <p className="text-sm text-muted-foreground">{selectedRequirement.observaciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Selecciona un requerimiento o crea uno nuevo</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={formOpen !== null} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-6xl flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b bg-muted/30">
            <DialogTitle>
              {formOpen === 'edit' ? 'Editar Requerimiento Mensual' : 'Nuevo Requerimiento Mensual'}
            </DialogTitle>
            <DialogDescription>
              {formOpen === 'edit'
                ? 'Modifique las líneas y guarde los cambios.'
                : 'Registre el requerimiento por Mes/Año y Cuadro. Un solo requerimiento por Mes/Año + Cuadro.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {formOpen && (
            <RequirementEntryForm
              mes={formMes}
              cuadroId={formCuadroId}
              lines={formLines}
              cuadros={cuadros}
              products={products}
              filteredProducts={filteredProducts}
              existingRequirementId={existingByMesCuadro?.id ?? null}
              onMesChange={setFormMes}
              onCuadroChange={setFormCuadroId}
              onLinesChange={setFormLines}
              onGoToExisting={goToExisting}
              onCreate={handleCreate}
              onUpdate={formOpen === 'edit' ? handleUpdate : undefined}
              onCancel={closeForm}
              isCreating={createMutation.isPending}
              isUpdating={updateMutation.isPending}
              validationErrors={validationErrors}
              mode={formOpen}
            />
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
