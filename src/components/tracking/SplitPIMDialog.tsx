import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Scissors, Package } from 'lucide-react';
import { usePIMItems } from '@/hooks/usePIMItems';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pimId: string;
  pimCodigo: string;
  onSplit: (itemIds: string[]) => void;
  isSplitting?: boolean;
}

export function SplitPIMDialog({ open, onOpenChange, pimId, pimCodigo, onSplit, isSplitting }: Props) {
  const { data: items } = usePIMItems(open ? pimId : undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSplit = () => {
    if (selectedIds.size === 0 || selectedIds.size === (items?.length || 0)) return;
    onSplit(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const canSplit = selectedIds.size > 0 && selectedIds.size < (items?.length || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Dividir PIM {pimCodigo}
          </DialogTitle>
          <DialogDescription>
            Selecciona los items que se moverán al nuevo PIM ({pimCodigo}-B).
            Debe quedar al menos 1 item en cada PIM.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {(items || []).map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => toggle(item.id)}
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
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          {selectedIds.size} de {items?.length || 0} items seleccionados para el nuevo PIM
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSplit} disabled={!canSplit || isSplitting}>
            {isSplitting ? 'Dividiendo...' : `Dividir PIM`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
