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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useActiveMolinos } from '@/hooks/useMolinos';
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
  molino_id?: string | null;
  isNew?: boolean; // marks items added during edit
}

interface PIMEditItemsTableProps {
  items: EditableItem[];
  onItemsChange: (items: EditableItem[]) => void;
  removedItemIds: string[];
  onRemovedItemIdsChange: (ids: string[]) => void;
  /** Molino general del PIM; si el ítem no tiene molino_id, se usa este */
  molinoId?: string;
}

/** Weight units: stored in kg internally, displayed in tons. */
const isWeightUnit = (u: string) => { const up = u.toUpperCase(); return up === 'KG' || up === 'TON'; };

function toDisplayUnit(rawUnit: string, rawQty: number): { unit: string; qty: number } {
  if (isWeightUnit(rawUnit)) return { unit: 't', qty: rawQty / 1000 };
  return { unit: rawUnit, qty: rawQty };
}

function fromDisplayQty(rawUnit: string, displayQty: number): number {
  if (isWeightUnit(rawUnit)) return displayQty * 1000;
  return displayQty;
}

/** Convert raw storage price (per KG) to display price (per TON). */
function rawPriceToDisplayPrice(rawUnit: string, rawPrice: number): number {
  if (isWeightUnit(rawUnit)) return rawPrice * 1000;
  return rawPrice;
}

/** Convert display price (per TON) to raw storage price (per KG). */
function displayPriceToRawPrice(rawUnit: string, displayPrice: number): number {
  if (isWeightUnit(rawUnit)) return displayPrice / 1000;
  return displayPrice;
}

export function PIMEditItemsTable({ items, onItemsChange, removedItemIds, onRemovedItemIdsChange, molinoId }: PIMEditItemsTableProps) {
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: molinos = [] } = useActiveMolinos();
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
        cantidad: isWeightUnit(product.unidad) ? 1000 : 1, // 1 TON (=1000 kg) or 1 UND
        precio_unitario_usd: 0,
        total_usd: 0,
        toneladas: isWeightUnit(product.unidad) ? 1 : 0,
        molino_id: molinoId || null,
        isNew: true,
      };
      onItemsChange([...items, newItem]);
      setSearchOpen(false);
      setSearchQuery('');
    },
    [items, onItemsChange, molinoId]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      if (!itemId.startsWith('new-')) {
        onRemovedItemIdsChange([...removedItemIds, itemId]);
      }
      onItemsChange(items.filter((i) => i.id !== itemId));
    },
    [items, onItemsChange, removedItemIds, onRemovedItemIdsChange]
  );

  const updateItem = useCallback(
    (id: string, field: 'displayQty' | 'displayPrice' | 'molino_id', value: number | string | null) => {
      onItemsChange(
        items.map((item) => {
          if (item.id !== id) return item;

          if (field === 'displayQty') {
            const rawQty = fromDisplayQty(item.unidad, value as number);
            const toneladas = isWeightUnit(item.unidad) ? rawQty / 1000 : 0;
            // Keep display price constant, recalculate total
            const currentDisplayPrice = rawPriceToDisplayPrice(item.unidad, item.precio_unitario_usd);
            const newDisplayQty = toDisplayUnit(item.unidad, rawQty).qty;
            const total_usd = currentDisplayPrice * newDisplayQty;
            return { ...item, cantidad: rawQty, total_usd, toneladas };
          }

          if (field === 'displayPrice') {
            const displayPrice = Math.max(0, value as number);
            const rawPrice = displayPriceToRawPrice(item.unidad, displayPrice);
            const { qty: displayQty } = toDisplayUnit(item.unidad, item.cantidad);
            const total_usd = displayPrice * displayQty;
            return { ...item, precio_unitario_usd: rawPrice, total_usd };
          }

          if (field === 'molino_id') {
            return { ...item, molino_id: value === '' || value === null ? null : (value as string) };
          }

          return item;
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
                <TableHead className="text-right">Precio / Unidad</TableHead>
                <TableHead className="text-right">Total USD</TableHead>
                <TableHead>Fábrica/Molino</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const { unit: displayUnit, qty: displayQty } = toDisplayUnit(item.unidad, item.cantidad);
                const displayPrice = rawPriceToDisplayPrice(item.unidad, item.precio_unitario_usd);

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
                        value={displayPrice}
                        onChange={(e) => updateItem(item.id, 'displayPrice', parseFloat(e.target.value) || 0)}
                        className="w-32 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(item.total_usd)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.molino_id ?? (molinoId || '__sin_asignar__')}
                        onValueChange={(v) => {
                          const storeNull = v === '__sin_asignar__' || v === molinoId;
                          updateItem(item.id, 'molino_id', storeNull ? null : v);
                        }}
                      >
                        <SelectTrigger className="h-9 min-w-[140px]">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          {molinoId ? (
                            (() => {
                              const defaultMolino = molinos.find((m) => m.id === molinoId);
                              return (
                                <SelectItem value={molinoId} key={molinoId}>
                                  {defaultMolino
                                    ? `${defaultMolino.codigo} - ${defaultMolino.nombre} (por defecto del PIM)`
                                    : 'Por defecto del PIM'}
                                </SelectItem>
                              );
                            })()
                          ) : (
                            <SelectItem value="__sin_asignar__">Sin asignar</SelectItem>
                          )}
                          {molinos
                            .filter((m) => m.id !== molinoId)
                            .map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.codigo} - {m.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
