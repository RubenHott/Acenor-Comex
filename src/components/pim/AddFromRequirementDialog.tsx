import { useState, useMemo, useCallback } from 'react';
import { useRequirementsWithItems } from '@/hooks/useRequirements';
import { useCuadros } from '@/hooks/useCuadros';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, Package } from 'lucide-react';
import type { EditableItem } from './PIMEditItemsTable';

interface AddFromRequirementDialogProps {
  existingProductIds: string[]; // producto_ids already in the PIM
  onItemsSelected: (items: EditableItem[]) => void;
}

export function AddFromRequirementDialog({
  existingProductIds,
  onItemsSelected,
}: AddFromRequirementDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: requirements, isLoading } = useRequirementsWithItems();
  const { data: cuadros } = useCuadros();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const cuadroById = useMemo(() => {
    const m: Record<string, { codigo: string; nombre: string }> = {};
    (cuadros ?? []).forEach((c) => {
      m[c.id] = { codigo: c.codigo, nombre: c.nombre };
    });
    return m;
  }, [cuadros]);

  // Available items from requirements with remaining kilos
  const availableItems = useMemo(() => {
    if (!requirements) return [];
    const items: Array<{
      id: string;
      reqId: string;
      reqMes: string;
      cuadroCodigo: string;
      producto_id: string;
      codigo_producto: string;
      descripcion: string;
      unidad: string;
      kilos_disponibles: number;
      precio_unitario_usd: number | null;
    }> = [];

    requirements.forEach((req) => {
      if (req.kilos_disponibles <= 0) return;
      const cuadro = cuadroById[req.cuadro_id];
      const reqItems = (req as any).items ?? [];
      reqItems.forEach((item: any) => {
        if (item.kilos_disponibles <= 0) return;
        // Skip items already in PIM
        if (existingProductIds.includes(item.producto_id)) return;
        items.push({
          id: item.id,
          reqId: req.id,
          reqMes: req.mes,
          cuadroCodigo: cuadro?.codigo ?? 'N/A',
          producto_id: item.producto_id,
          codigo_producto: item.codigo_producto,
          descripcion: item.descripcion,
          unidad: item.unidad,
          kilos_disponibles: item.kilos_disponibles,
          precio_unitario_usd: item.precio_unitario_usd,
        });
      });
    });

    return items;
  }, [requirements, cuadroById, existingProductIds]);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handleConfirm = () => {
    const selected = availableItems.filter((i) => selectedItems.has(i.id));
    const newItems: EditableItem[] = selected.map((item) => ({
      id: `new-${crypto.randomUUID()}`,
      producto_id: item.producto_id,
      codigo_producto: item.codigo_producto,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.kilos_disponibles,
      precio_unitario_usd: 0,
      total_usd: 0,
      toneladas: item.unidad === 'KG' ? item.kilos_disponibles / 1000 : item.unidad === 'TON' ? item.kilos_disponibles : 0,
      isNew: true,
    }));
    onItemsSelected(newItems);
    setSelectedItems(new Set());
    setOpen(false);
  };

  const formatQty = (qty: number, unit: string) => {
    if (unit === 'KG') return `${(qty / 1000).toLocaleString('es-PE', { minimumFractionDigits: 2 })} TON`;
    return `${qty.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ${unit}`;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedItems(new Set()); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardList className="h-4 w-4 mr-1" />
          Desde Requerimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Seleccionar Ítems de Requerimientos
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando requerimientos...</p>
          ) : availableItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay ítems disponibles en requerimientos (o ya están en el PIM).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Cuadro</TableHead>
                  <TableHead>Mes</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={selectedItems.has(item.id) ? 'bg-primary/5' : 'cursor-pointer hover:bg-muted/50'}
                    onClick={() => toggleItem(item.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{item.cuadroCodigo}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.reqMes}</TableCell>
                    <TableCell className="font-mono text-sm">{item.codigo_producto}</TableCell>
                    <TableCell>
                      <p className="truncate max-w-[200px] text-sm">{item.descripcion}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatQty(item.kilos_disponibles, item.unidad)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex items-center gap-3 w-full justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} ítem(s) seleccionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={selectedItems.size === 0}>
                Agregar al PIM
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
