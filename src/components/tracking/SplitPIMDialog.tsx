import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Scissors, Package, SplitSquareVertical } from 'lucide-react';
import { usePIMItems } from '@/hooks/usePIMItems';
import type { SplitItemConfig } from '@/hooks/usePIMTracking';

interface ItemSplitState {
  mode: 'full' | 'partial';
  cantidad: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pimId: string;
  pimCodigo: string;
  onSplit: (items: SplitItemConfig[]) => void;
  isSplitting?: boolean;
}

export function SplitPIMDialog({ open, onOpenChange, pimId, pimCodigo, onSplit, isSplitting }: Props) {
  const { data: items } = usePIMItems(open ? pimId : undefined);
  const [splitConfig, setSplitConfig] = useState<Map<string, ItemSplitState>>(new Map());

  const toggleItem = (id: string, totalCantidad: number) => {
    setSplitConfig((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, { mode: 'full', cantidad: totalCantidad });
      }
      return next;
    });
  };

  const togglePartialMode = (id: string, totalCantidad: number) => {
    setSplitConfig((prev) => {
      const next = new Map(prev);
      const current = next.get(id);
      if (!current) return next;
      if (current.mode === 'full') {
        next.set(id, { mode: 'partial', cantidad: Math.round(totalCantidad / 2 * 100) / 100 });
      } else {
        next.set(id, { mode: 'full', cantidad: totalCantidad });
      }
      return next;
    });
  };

  const updatePartialQty = (id: string, qty: number) => {
    setSplitConfig((prev) => {
      const next = new Map(prev);
      const current = next.get(id);
      if (!current) return next;
      next.set(id, { ...current, cantidad: qty });
      return next;
    });
  };

  // Validation
  const validation = useMemo(() => {
    if (splitConfig.size === 0) return { canSplit: false, error: '' };

    const allItemsFull =
      splitConfig.size === (items?.length || 0) &&
      Array.from(splitConfig.values()).every((c) => c.mode === 'full');
    if (allItemsFull) return { canSplit: false, error: 'Debe quedar al menos 1 item en el PIM original' };

    for (const [id, config] of splitConfig.entries()) {
      if (config.mode !== 'partial') continue;
      const item = items?.find((i) => i.id === id);
      if (!item) return { canSplit: false, error: 'Item no encontrado' };
      if (!config.cantidad || isNaN(config.cantidad) || config.cantidad <= 0) {
        return { canSplit: false, error: `Cantidad debe ser mayor a 0 para ${item.codigo_producto}` };
      }
      if (config.cantidad >= item.cantidad) {
        return { canSplit: false, error: `Cantidad debe ser menor a ${item.cantidad.toLocaleString()} para ${item.codigo_producto}` };
      }
    }

    return { canSplit: true, error: '' };
  }, [splitConfig, items]);

  // Summary calculations
  const summary = useMemo(() => {
    let movingTon = 0;
    let movingUsd = 0;

    for (const [id, config] of splitConfig.entries()) {
      const item = items?.find((i) => i.id === id);
      if (!item) continue;
      if (config.mode === 'full') {
        movingTon += item.toneladas;
        movingUsd += item.total_usd || 0;
      } else {
        const ratio = (config.cantidad || 0) / item.cantidad;
        movingTon += item.toneladas * ratio;
        movingUsd += (item.total_usd || 0) * ratio;
      }
    }

    const totalTon = items?.reduce((s, i) => s + i.toneladas, 0) || 0;
    const totalUsd = items?.reduce((s, i) => s + (i.total_usd || 0), 0) || 0;

    return {
      movingTon,
      movingUsd,
      remainingTon: totalTon - movingTon,
      remainingUsd: totalUsd - movingUsd,
    };
  }, [splitConfig, items]);

  const handleSplit = () => {
    if (!validation.canSplit) return;

    const result: SplitItemConfig[] = Array.from(splitConfig.entries()).map(
      ([itemId, config]) => ({
        itemId,
        mode: config.mode,
        ...(config.mode === 'partial' ? { cantidad: config.cantidad } : {}),
      })
    );

    onSplit(result);
    setSplitConfig(new Map());
  };

  const isSingleItem = (items?.length || 0) === 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Dividir PIM {pimCodigo}
          </DialogTitle>
          <DialogDescription>
            Selecciona los items a mover al nuevo PIM. Puedes mover items completos o dividir parcialmente la cantidad.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {(items || []).map((item) => {
            const config = splitConfig.get(item.id);
            const isSelected = !!config;
            const isPartial = config?.mode === 'partial';

            return (
              <div key={item.id} className="p-3 rounded-lg hover:bg-muted/50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      if (isSingleItem && !isSelected) {
                        setSplitConfig(new Map([[item.id, { mode: 'partial', cantidad: Math.round(item.cantidad / 2 * 100) / 100 }]]));
                      } else {
                        toggleItem(item.id, item.cantidad);
                      }
                    }}
                  />
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-mono">{item.codigo_producto}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.descripcion}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm">{item.cantidad.toLocaleString()} {item.unidad}</p>
                    <p className="text-xs text-muted-foreground">
                      USD {(item.total_usd || 0).toLocaleString()}
                    </p>
                  </div>
                </label>

                {isSelected && (
                  <div className="ml-10 mt-2 flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={isPartial ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSingleItem) return;
                        togglePartialMode(item.id, item.cantidad);
                      }}
                    >
                      <SplitSquareVertical className="h-3 w-3" />
                      {isPartial ? 'Parcial' : 'Dividir parcialmente'}
                    </Button>

                    {isPartial && (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          className="w-28 h-7 text-sm"
                          value={config!.cantidad}
                          min={0.01}
                          max={item.cantidad - 0.01}
                          step="any"
                          onChange={(e) => updatePartialQty(item.id, parseFloat(e.target.value) || 0)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-muted-foreground">{item.unidad}</span>
                        <span className="text-xs text-muted-foreground">
                          de {item.cantidad.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {splitConfig.size > 0 && (
          <div className="text-sm border-t pt-3 space-y-2">
            <p className="font-medium text-muted-foreground">Resumen de la división:</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 rounded-md bg-muted/50">
                <p className="font-semibold mb-1">PIM Original</p>
                <p>{summary.remainingTon.toLocaleString(undefined, { maximumFractionDigits: 2 })} ton</p>
                <p>USD {summary.remainingUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 rounded-md bg-primary/5 border border-primary/20">
                <p className="font-semibold mb-1">Nuevo PIM</p>
                <p>{summary.movingTon.toLocaleString(undefined, { maximumFractionDigits: 2 })} ton</p>
                <p>USD {summary.movingUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        )}

        {validation.error && (
          <p className="text-xs text-destructive">{validation.error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSplit} disabled={!validation.canSplit || isSplitting}>
            {isSplitting ? 'Dividiendo...' : 'Dividir PIM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
