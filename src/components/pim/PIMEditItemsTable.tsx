import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/hooks/useProducts';
import { AddFromRequirementDialog } from './AddFromRequirementDialog';

export interface EditableItem {
  id: string;
  producto_id?: string;
  codigo_producto: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario_usd: number;
  total_usd: number;
  toneladas: number;
  isNew?: boolean; // marks items added during edit
}

interface PIMEditItemsTableProps {
  items: EditableItem[];
  onItemsChange: (items: EditableItem[]) => void;
  removedItemIds: string[];
  onRemovedItemIdsChange: (ids: string[]) => void;
}

function toDisplayUnit(rawUnit: string, rawQty: number): { unit: string; qty: number } {
  if (rawUnit === 'KG') return { unit: 'TON', qty: rawQty / 1000 };
  return { unit: rawUnit, qty: rawQty };
}

function fromDisplayQty(rawUnit: string, displayQty: number): number {
  if (rawUnit === 'KG') return displayQty * 1000;
  return displayQty;
}

export function PIMEditItemsTable({ items, onItemsChange, removedItemIds, onRemovedItemIdsChange }: PIMEditItemsTableProps) {
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = (products ?? [])
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      return p.codigo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q);
    })
    .filter((p) => !items.some((i) => i.producto_id === p.id || i.codigo_producto === p.codigo))
    .slice(0, 20);

  const addProduct = useCallback(
    (product: Product) => {
      const newItem: EditableItem = {
        id: `new-${crypto.randomUUID()}`,
        producto_id: product.id,
        codigo_producto: product.codigo,
        descripcion: product.descripcion,
        unidad: product.unidad,
        cantidad: product.unidad === 'KG' ? 1000 : 1,
        precio_unitario_usd: 0,
        total_usd: 0,
        toneladas: product.unidad === 'KG' ? 1 : product.unidad === 'TON' ? 1 : 0,
        isNew: true,
      };
      onItemsChange([...items, newItem]);
      setSearchOpen(false);
      setSearchQuery('');
    },
    [items, onItemsChange]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      // If it's an existing DB item (not new), track it for deletion
      if (!itemId.startsWith('new-')) {
        onRemovedItemIdsChange([...removedItemIds, itemId]);
      }
      onItemsChange(items.filter((i) => i.id !== itemId));
    },
    [items, onItemsChange, removedItemIds, onRemovedItemIdsChange]
  );

  const updateItem = useCallback(
    (id: string, field: 'displayQty' | 'total_usd', value: number) => {
      onItemsChange(
        items.map((item) => {
          if (item.id !== id) return item;

          if (field === 'displayQty') {
            const rawQty = fromDisplayQty(item.unidad, value);
            const precio = rawQty > 0 ? item.total_usd / rawQty : 0;
            const toneladas = item.unidad === 'KG' ? rawQty / 1000 : item.unidad === 'TON' ? rawQty : 0;
            return { ...item, cantidad: rawQty, precio_unitario_usd: precio, toneladas };
          }

          const total = Math.max(0, value);
          const precio = item.cantidad > 0 ? total / item.cantidad : 0;
          return { ...item, total_usd: total, precio_unitario_usd: precio };
        })
      );
    },
    [items, onItemsChange]
  );

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-4">
      {/* Add product buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">
            {items.length} producto(s) en este PIM
          </Label>
        </div>
        <div className="flex gap-2">
          <AddFromRequirementDialog
            existingProductIds={items.map((i) => i.producto_id).filter(Boolean) as string[]}
            onItemsSelected={(newItems) => onItemsChange([...items, ...newItems])}
          />
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Producto Adicional
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="end">
            <Command>
              <CommandInput
                placeholder="Buscar por código o descripción..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoadingProducts ? 'Cargando...' : 'No se encontraron productos'}
                </CommandEmpty>
                <CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.codigo}
                      onSelect={() => addProduct(product)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{product.codigo}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {product.descripcion}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No hay ítems. Use "Agregar Producto" para incluir materiales.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Total USD</TableHead>
                <TableHead className="text-right">Precio / Unidad</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const { unit: displayUnit, qty: displayQty } = toDisplayUnit(item.unidad, item.cantidad);
                const calcUnitPrice = displayQty > 0 ? item.total_usd / displayQty : 0;

                return (
                  <TableRow key={item.id} className={item.isNew ? 'bg-accent/30' : ''}>
                    <TableCell className="font-mono text-sm">
                      {item.codigo_producto}
                      {item.isNew && (
                        <Badge variant="secondary" className="ml-2 text-xs">Nuevo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="truncate text-sm">{item.descripcion}</p>
                        <Badge variant="outline" className="text-xs mt-1">{displayUnit}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={displayQty}
                        onChange={(e) => updateItem(item.id, 'displayQty', parseFloat(e.target.value) || 0)}
                        className="w-28 text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.total_usd}
                        onChange={(e) => updateItem(item.id, 'total_usd', parseFloat(e.target.value) || 0)}
                        className="w-32 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {calcUnitPrice > 0 ? `${formatCurrency(calcUnitPrice)} / ${displayUnit}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
