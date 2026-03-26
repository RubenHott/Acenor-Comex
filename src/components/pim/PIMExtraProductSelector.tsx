import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { useActiveMolinos } from '@/hooks/useMolinos';
import { isCuadroPorUnidad, isCuadroPorKilo, isAlambreSoldadura } from '@/lib/cuadrosUnidad';
import type { Product } from '@/hooks/useProducts';

export interface PIMExtraItem {
  tempId: string;
  productoId: string;
  codigoProducto: string;
  descripcion: string;
  unidad: string;
  cuadro: string | null;
  cantidad: number;
  precioUnitarioUsd: number;
  totalUsd: number;
  molinoId?: string | null;
  pesoProducto?: number | null;
  cantidadBultos?: number | null;
  piezasPorBulto?: number | null;
}

interface PIMExtraProductSelectorProps {
  extraItems: PIMExtraItem[];
  onExtraItemsChange: (items: PIMExtraItem[]) => void;
  /** Molino por defecto del PIM */
  molinoId?: string;
}

/** Display quantity for products. Raw is ALWAYS in kg for weight cuadros. */
function toDisplayExtra(cuadro: string | null, rawUnit: string, rawQty: number) {
  if (isCuadroPorUnidad(cuadro ?? '')) return { displayUnit: rawUnit, displayQty: rawQty };
  if (isCuadroPorKilo(cuadro ?? '')) return { displayUnit: 'kg', displayQty: rawQty };
  return { displayUnit: 't', displayQty: rawQty / 1000 };
}

function fromDisplayExtra(cuadro: string | null, _rawUnit: string, displayQty: number) {
  if (isCuadroPorUnidad(cuadro ?? '')) return displayQty;
  if (isCuadroPorKilo(cuadro ?? '')) return displayQty; // already in kg
  return displayQty * 1000;
}

/** Convert display price to raw storage price (per KG or per UND). */
function displayPriceToRawPrice(cuadro: string | null, _rawUnit: string, displayPrice: number): number {
  if (isCuadroPorUnidad(cuadro ?? '')) return displayPrice;
  if (isCuadroPorKilo(cuadro ?? '')) return displayPrice; // already per kg
  return displayPrice / 1000;
}

/** Convert raw storage price to display price. */
function rawPriceToDisplayPrice(cuadro: string | null, _rawUnit: string, rawPrice: number): number {
  if (isCuadroPorUnidad(cuadro ?? '')) return rawPrice;
  if (isCuadroPorKilo(cuadro ?? '')) return rawPrice; // already per kg
  return rawPrice * 1000;
}

export function PIMExtraProductSelector({
  extraItems,
  onExtraItemsChange,
  molinoId,
}: PIMExtraProductSelectorProps) {
  const { data: products, isLoading } = useProducts();
  const { data: molinos = [] } = useActiveMolinos();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = (products ?? []).filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q)
    );
  }).slice(0, 20);

  const addProduct = useCallback(
    (product: Product) => {
      const exists = extraItems.some((i) => i.productoId === product.id);
      if (exists) {
        setSearchOpen(false);
        return;
      }

      // Default quantity: 1 UND, 1 kg for kilo cuadros, or 1 TON (=1000 kg) for ton cuadros
      const defaultCantidad = isCuadroPorUnidad(product.cuadro) ? 1 : isCuadroPorKilo(product.cuadro) ? 1 : 1000;

      const newItem: PIMExtraItem = {
        tempId: crypto.randomUUID(),
        productoId: product.id,
        codigoProducto: product.codigo,
        descripcion: product.descripcion,
        unidad: product.unidad,
        cuadro: product.cuadro,
        cantidad: defaultCantidad,
        precioUnitarioUsd: 0,
        totalUsd: 0,
        molinoId: molinoId || null,
        pesoProducto: product.peso ?? null,
      };

      onExtraItemsChange([...extraItems, newItem]);
      setSearchOpen(false);
      setSearchQuery('');
    },
    [extraItems, onExtraItemsChange, molinoId]
  );

  /** Update display quantity → store raw quantity; recalculate totalUsd keeping display price constant */
  const updateQuantity = useCallback(
    (tempId: string, displayQty: number) => {
      onExtraItemsChange(
        extraItems.map((item) => {
          if (item.tempId !== tempId) return item;
          const rawQty = fromDisplayExtra(item.cuadro, item.unidad, displayQty);
          const cantidad = Math.max(0, rawQty);
          // Keep display price constant, recalculate total
          const currentDisplayPrice = rawPriceToDisplayPrice(item.cuadro, item.unidad, item.precioUnitarioUsd);
          const newDisplayQty = toDisplayExtra(item.cuadro, item.unidad, cantidad).displayQty;
          const totalUsd = currentDisplayPrice * newDisplayQty;
          return { ...item, cantidad, totalUsd };
        })
      );
    },
    [extraItems, onExtraItemsChange]
  );

  /** User enters display price (per TON or per UND); we derive totalUsd and raw precioUnitarioUsd */
  const updatePrecioUnitario = useCallback(
    (tempId: string, displayPrice: number) => {
      onExtraItemsChange(
        extraItems.map((item) => {
          if (item.tempId !== tempId) return item;
          const price = Math.max(0, displayPrice);
          const rawPrice = displayPriceToRawPrice(item.cuadro, item.unidad, price);
          const { displayQty } = toDisplayExtra(item.cuadro, item.unidad, item.cantidad);
          const totalUsd = price * displayQty;
          return { ...item, precioUnitarioUsd: rawPrice, totalUsd };
        })
      );
    },
    [extraItems, onExtraItemsChange]
  );

  const removeItem = useCallback(
    (tempId: string) => {
      onExtraItemsChange(extraItems.filter((i) => i.tempId !== tempId));
    },
    [extraItems, onExtraItemsChange]
  );

  const updateMolino = useCallback(
    (tempId: string, value: string) => {
      const storeNull = value === '__sin_asignar__' || value === molinoId;
      onExtraItemsChange(
        extraItems.map((i) => {
          if (i.tempId !== tempId) return i;
          return { ...i, molinoId: storeNull ? null : value };
        })
      );
    },
    [extraItems, onExtraItemsChange, molinoId]
  );

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(n);

  const formatNumber = (n: number, decimals = 2) =>
    new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);

  const totalUsd = extraItems.reduce((sum, i) => sum + i.totalUsd, 0);

  const totalToneladas = extraItems.reduce((sum, i) => {
    if (isCuadroPorUnidad(i.cuadro ?? '') || isCuadroPorKilo(i.cuadro ?? '')) return sum;
    return sum + i.cantidad / 1000;
  }, 0);

  const totalKilos = extraItems.reduce((sum, i) => {
    if (!isCuadroPorKilo(i.cuadro ?? '')) return sum;
    return sum + i.cantidad;
  }, 0);

  const totalUnidades = extraItems.reduce((sum, i) => {
    if (!isCuadroPorUnidad(i.cuadro ?? '')) return sum;
    return sum + i.cantidad;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Productos Adicionales</Label>
          <Badge variant="outline" className="text-xs">
            No consumen saldo de requerimiento
          </Badge>
        </div>

        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Agregar Producto
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
                  {isLoading ? 'Cargando...' : 'No se encontraron productos'}
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

      {extraItems.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No hay productos adicionales</p>
          <p className="text-xs">Use el botón "Agregar Producto" para incluir items fuera del requerimiento</p>
        </div>
      ) : (
        <>
          {(() => {
            const showRollos = extraItems.some((i) => isAlambreSoldadura(i.codigoProducto));
            return (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  {showRollos && (
                    <TableHead className="text-right">Rollos</TableHead>
                  )}
                  <TableHead className="text-right">Precio / Unidad</TableHead>
                  <TableHead className="text-right">Total USD</TableHead>
                  <TableHead className="text-center">Bultos</TableHead>
                  <TableHead className="text-center">Pzas/Bulto</TableHead>
                  <TableHead className="text-center">Total Uds.</TableHead>
                  <TableHead>Fábrica/Molino</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extraItems.map((item) => {
                  const { displayUnit, displayQty } = toDisplayExtra(
                    item.cuadro,
                    item.unidad,
                    item.cantidad
                  );
                  const displayPrice = rawPriceToDisplayPrice(item.cuadro, item.unidad, item.precioUnitarioUsd);
                  const pesoRollo = item.pesoProducto;
                  const rollos = (isAlambreSoldadura(item.codigoProducto) && pesoRollo && pesoRollo > 0)
                    ? Math.round(item.cantidad / pesoRollo)
                    : null;

                  return (
                    <TableRow key={item.tempId}>
                      <TableCell className="font-mono text-sm">
                        {item.codigoProducto}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate text-sm">{item.descripcion}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {displayUnit}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={displayQty}
                          onChange={(e) =>
                            updateQuantity(item.tempId, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 text-center"
                        />
                      </TableCell>
                      {showRollos && (
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {rollos != null ? rollos : '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={displayPrice}
                          onChange={(e) =>
                            updatePrecioUnitario(item.tempId, parseFloat(e.target.value) || 0)
                          }
                          className="w-32 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(item.totalUsd)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={item.cantidadBultos ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            onExtraItemsChange(extraItems.map((ei) => ei.tempId === item.tempId ? { ...ei, cantidadBultos: val } : ei));
                          }}
                          className="w-20 text-center"
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={item.piezasPorBulto ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            onExtraItemsChange(extraItems.map((ei) => ei.tempId === item.tempId ? { ...ei, piezasPorBulto: val } : ei));
                          }}
                          className="w-20 text-center"
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {item.cantidadBultos && item.piezasPorBulto
                          ? (item.cantidadBultos * item.piezasPorBulto).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.molinoId ?? (molinoId || '__sin_asignar__')}
                          onValueChange={(v) => updateMolino(item.tempId, v)}
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
                          onClick={() => removeItem(item.tempId)}
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
            );
          })()}

          <div className="flex justify-end">
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-accent/50 min-w-[300px]">
              {totalToneladas > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Toneladas Extras</Label>
                  <p className="text-lg font-bold">{formatNumber(totalToneladas)} t</p>
                </div>
              )}
              {totalKilos > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Kilos Extras</Label>
                  <p className="text-lg font-bold">{formatNumber(totalKilos, 0)} kg</p>
                </div>
              )}
              {totalUnidades > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Unidades Extras</Label>
                  <p className="text-lg font-bold">{formatNumber(totalUnidades, 0)}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Total Extras USD</Label>
                <p className="text-lg font-bold text-accent-foreground">
                  {formatCurrency(totalUsd)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
