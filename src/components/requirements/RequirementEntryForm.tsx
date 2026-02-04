import * as React from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductAutocomplete, productTipoFromCategoria } from './ProductAutocomplete';
import type { Product } from '@/hooks/useProducts';
import type { Cuadro } from '@/hooks/useCuadros';
import type { RequirementLinePayload } from '@/hooks/useRequirements';
import { isCuadroPorUnidad } from '@/lib/cuadrosUnidad';
import { Badge } from '@/components/ui/badge';

export interface RequirementLine {
  tempId: string;
  product: Product | null;
  cantidadRequerida: number;
}

interface RequirementEntryFormProps {
  mes: string;
  cuadroId: string;
  lines: RequirementLine[];
  cuadros: Cuadro[] | undefined;
  products: Product[] | undefined;
  filteredProducts: Product[] | undefined;
  existingRequirementId: string | null;
  onMesChange: (mes: string) => void;
  onCuadroChange: (cuadroId: string) => void;
  onLinesChange: (lines: RequirementLine[]) => void;
  onGoToExisting: () => void;
  onCreate: () => void;
  onUpdate?: () => void;
  onCancel: () => void;
  isCreating: boolean;
  isUpdating: boolean;
  validationErrors: string[];
  mode: 'create' | 'edit';
}

function consolidateLines(lines: RequirementLine[]): RequirementLine[] {
  const byProductId = new Map<string, RequirementLine>();
  for (const line of lines) {
    if (!line.product) continue;
    const existing = byProductId.get(line.product.id);
    if (existing) {
      existing.cantidadRequerida += line.cantidadRequerida;
    } else {
      byProductId.set(line.product.id, { ...line, cantidadRequerida: line.cantidadRequerida });
    }
  }
  return Array.from(byProductId.values()).map((l, i) => ({
    ...l,
    tempId: l.tempId || `consolidated-${i}`,
  }));
}

export function buildLinePayloads(lines: RequirementLine[]): RequirementLinePayload[] {
  const consolidated = consolidateLines(lines);
  return consolidated
    .filter((l) => l.product && l.cantidadRequerida > 0)
    .map((l) => {
      const p = l.product!;
      const precio = p.ultimo_precio_usd ?? 0;
      const totalUsd = l.cantidadRequerida * precio;
      return {
        producto_id: p.id,
        codigo_producto: p.codigo,
        descripcion: p.descripcion,
        cantidad_requerida: l.cantidadRequerida,
        unidad: p.unidad,
        tipo_material: productTipoFromCategoria(p.categoria),
        precio_unitario_usd: p.ultimo_precio_usd ?? null,
        total_usd: totalUsd,
      };
    });
}

export function RequirementEntryForm({
  mes,
  cuadroId,
  lines,
  cuadros,
  products,
  filteredProducts,
  existingRequirementId,
  onMesChange,
  onCuadroChange,
  onLinesChange,
  onGoToExisting,
  onCreate,
  onUpdate,
  onCancel,
  isCreating,
  isUpdating,
  validationErrors,
  mode,
}: RequirementEntryFormProps) {
  const availableProducts = cuadroId ? (filteredProducts ?? []) : (products ?? []);
  const selectedCuadro = cuadros?.find((c) => c.id === cuadroId);
  const esPorUnidad = isCuadroPorUnidad(selectedCuadro?.codigo);

  const addLine = () => {
    onLinesChange([
      ...lines,
      { tempId: crypto.randomUUID(), product: null, cantidadRequerida: 0 },
    ]);
  };

  const removeLine = (tempId: string) => {
    onLinesChange(lines.filter((l) => l.tempId !== tempId));
  };

  const updateLine = (tempId: string, updates: Partial<RequirementLine>) => {
    onLinesChange(
      lines.map((l) => (l.tempId === tempId ? { ...l, ...updates } : l))
    );
  };

  const handleProductSelect = (tempId: string, product: Product | null) => {
    updateLine(tempId, { product, cantidadRequerida: product ? 1 : 0 });
  };

  const handleCantidadChange = (tempId: string, value: string) => {
    const n = parseFloat(value);
    updateLine(tempId, { cantidadRequerida: isNaN(n) ? 0 : n });
  };

  const consolidated = consolidateLines(lines);
  const totalUsd = consolidated.reduce((sum, l) => {
    if (!l.product) return sum;
    const precio = l.product.ultimo_precio_usd ?? 0;
    return sum + l.cantidadRequerida * precio;
  }, 0);
  const totalTon = consolidated
    .filter((l) => l.product?.unidad === 'TON')
    .reduce((sum, l) => sum + l.cantidadRequerida, 0);
  const totalUn = consolidated
    .filter((l) => l.product?.unidad === 'UN')
    .reduce((sum, l) => sum + l.cantidadRequerida, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  const formatDate = (dateStr: string | null) =>
    dateStr ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr)) : '—';

  const isEdit = mode === 'edit';
  const showExistingAlert = mode === 'create' && !!existingRequirementId;
  const busy = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Encabezado: Mes/Año + Cuadro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mes">Mes / Año</Label>
          <Input
            id="mes"
            type="month"
            value={mes}
            onChange={(e) => onMesChange(e.target.value)}
            disabled={isEdit}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Cuadro de importación</Label>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={cuadroId} onValueChange={onCuadroChange} disabled={isEdit}>
              <SelectTrigger className="flex-1 min-w-[200px]">
                <SelectValue placeholder="Seleccionar cuadro" />
              </SelectTrigger>
              <SelectContent>
                {(cuadros ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} — {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCuadro && (
              <Badge
                variant={esPorUnidad ? 'default' : 'secondary'}
                className={esPorUnidad ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700 text-white'}
              >
                {esPorUnidad ? 'En UNIDADES' : 'En TONELADAS'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Si ya existe requerimiento para Mes+Cuadro (solo en modo crear) */}
      {showExistingAlert && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ya existe un requerimiento para este Mes/Año y Cuadro.{' '}
            <Button type="button" variant="link" className="p-0 h-auto" onClick={onGoToExisting}>
              Ir al existente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Validaciones */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {validationErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabla de líneas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Detalle de productos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={busy}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar línea
          </Button>
        </div>
        <div className="border rounded-md overflow-auto max-h-[min(45vh,400px)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[200px] whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur z-10">Código producto</TableHead>
                <TableHead className="min-w-[140px] sticky top-0 bg-muted/80 backdrop-blur z-10">Descripción</TableHead>
                <TableHead className="w-[110px] whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur z-10">Tipo</TableHead>
                <TableHead className="w-[70px] whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur z-10">Unidad</TableHead>
                <TableHead className="w-[95px] whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur z-10">Últ. precio</TableHead>
                <TableHead className="w-[95px] whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur z-10">Últ. fecha imp.</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur z-10">Cantidad</TableHead>
                <TableHead className="w-[95px] whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur z-10">Subtotal USD</TableHead>
                <TableHead className="w-[52px] sticky top-0 bg-muted/80 backdrop-blur z-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Agregue al menos una línea con código y cantidad.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow key={line.tempId}>
                    <TableCell>
                      <ProductAutocomplete
                        products={availableProducts}
                        value={line.product}
                        onSelect={(p) => handleProductSelect(line.tempId, p)}
                        disabled={busy}
                        className="min-w-[200px]"
                        showCuadroInfo={!cuadroId}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {line.product?.descripcion ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {line.product ? productTipoFromCategoria(line.product.categoria) : '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {line.product?.unidad ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {line.product != null
                        ? line.product.ultimo_precio_usd != null
                          ? formatCurrency(line.product.ultimo_precio_usd)
                          : 'Sin precio'
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {line.product?.ultima_fecha_importacion
                        ? formatDate(line.product.ultima_fecha_importacion)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={line.cantidadRequerida || ''}
                        onChange={(e) => handleCantidadChange(line.tempId, e.target.value)}
                        disabled={busy}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {line.product && line.cantidadRequerida > 0
                        ? formatCurrency(
                            line.cantidadRequerida * (line.product.ultimo_precio_usd ?? 0)
                          )
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeLine(line.tempId)}
                        disabled={busy}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Totales: destacar según cuadro en UN o TON */}
      <div className={cn(
        'flex flex-wrap gap-6 p-4 rounded-lg border-2',
        esPorUnidad ? 'bg-blue-500/10 border-blue-500/30' : 'bg-amber-500/10 border-amber-500/30'
      )}>
        <div className="order-2">
          <p className="text-sm text-muted-foreground">Total USD estimado</p>
          <p className="text-xl font-bold">{formatCurrency(totalUsd)}</p>
        </div>
        {esPorUnidad ? (
          <>
            <div className="order-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total UNIDADES</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalUn.toLocaleString('es-PE')} UN</p>
            </div>
            <div className="order-3">
              <p className="text-sm text-muted-foreground">Total TON (referencia)</p>
              <p className="text-lg font-semibold text-muted-foreground">{totalTon.toLocaleString('es-PE')} TON</p>
            </div>
          </>
        ) : (
          <>
            <div className="order-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Total TONELADAS</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totalTon.toLocaleString('es-PE')} TON</p>
            </div>
            <div className="order-3">
              <p className="text-sm text-muted-foreground">Total UN (referencia)</p>
              <p className="text-lg font-semibold text-muted-foreground">{totalUn.toLocaleString('es-PE')} UN</p>
            </div>
          </>
        )}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        {isEdit && onUpdate ? (
          <Button type="button" onClick={onUpdate} disabled={busy}>
            {isUpdating ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onCreate}
            disabled={busy || !!existingRequirementId}
          >
            {isCreating ? 'Guardando...' : 'Guardar requerimiento'}
          </Button>
        )}
      </div>
    </div>
  );
}
