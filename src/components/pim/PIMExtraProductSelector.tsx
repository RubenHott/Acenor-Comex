import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import type { Product } from '@/hooks/useProducts';

export interface PIMExtraItem {
  tempId: string;
  productoId: string;
  codigoProducto: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitarioUsd: number;
  totalUsd: number;
}

interface PIMExtraProductSelectorProps {
  extraItems: PIMExtraItem[];
  onExtraItemsChange: (items: PIMExtraItem[]) => void;
}

export function PIMExtraProductSelector({
  extraItems,
  onExtraItemsChange,
}: PIMExtraProductSelectorProps) {
  const { data: products, isLoading } = useProducts();
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

      const newItem: PIMExtraItem = {
        tempId: crypto.randomUUID(),
        productoId: product.id,
        codigoProducto: product.codigo,
        descripcion: product.descripcion,
        unidad: product.unidad,
        cantidad: 1,
        precioUnitarioUsd: product.ultimo_precio_usd ?? 0,
        totalUsd: product.ultimo_precio_usd ?? 0,
      };

      onExtraItemsChange([...extraItems, newItem]);
      setSearchOpen(false);
      setSearchQuery('');
    },
    [extraItems, onExtraItemsChange]
  );

  const updateItem = useCallback(
    (tempId: string, field: 'cantidad' | 'precioUnitarioUsd', value: number) => {
      onExtraItemsChange(
        extraItems.map((item) => {
          if (item.tempId !== tempId) return item;
          const updated = { ...item, [field]: value };
          updated.totalUsd = updated.cantidad * updated.precioUnitarioUsd;
          return updated;
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

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(n);

  const totalUsd = extraItems.reduce((sum, i) => sum + i.totalUsd, 0);

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
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio USD</TableHead>
                  <TableHead className="text-right">Total USD</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extraItems.map((item) => (
                  <TableRow key={item.tempId}>
                    <TableCell className="font-mono text-sm">
                      {item.codigoProducto}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="truncate text-sm">{item.descripcion}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.unidad}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={item.cantidad}
                        onChange={(e) =>
                          updateItem(item.tempId, 'cantidad', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.precioUnitarioUsd}
                        onChange={(e) =>
                          updateItem(item.tempId, 'precioUnitarioUsd', parseFloat(e.target.value) || 0)
                        }
                        className="w-28 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.totalUsd)}
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
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="p-3 rounded-lg bg-accent/50 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">Total Extras USD</Label>
              <p className="text-lg font-bold text-accent-foreground">
                {formatCurrency(totalUsd)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
