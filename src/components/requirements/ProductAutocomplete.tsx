import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Product } from '@/hooks/useProducts';

interface ProductAutocompleteProps {
  products: Product[] | undefined;
  value: Product | null;
  onSelect: (product: Product | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showCuadroInfo?: boolean;
}

/** Deriva "Materia Prima" o "Producto Terminado" desde categoria del maestro */
export function productTipoFromCategoria(categoria: string | null): string {
  if (!categoria) return 'Producto Terminado';
  const c = categoria.toLowerCase();
  if (c.includes('mp') || c.includes('materia') || c.includes('materia prima')) return 'Materia Prima';
  return 'Producto Terminado';
}

export function ProductAutocomplete({
  products,
  value,
  onSelect,
  placeholder = 'Buscar código o descripción...',
  disabled,
  className,
  showCuadroInfo = false,
}: ProductAutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  const displayValue = value ? `${value.codigo} — ${value.descripcion}` : '';
  const productCount = products?.length ?? 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Código o descripción..." />
          <div className="px-3 py-2 text-xs text-muted-foreground border-b">
            {productCount} producto{productCount !== 1 ? 's' : ''} disponible{productCount !== 1 ? 's' : ''}
          </div>
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {(products ?? []).map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.codigo} ${p.descripcion}`}
                  onSelect={() => {
                    onSelect(p);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 flex-shrink-0',
                      value?.id === p.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono">{p.codigo}</span>
                      {showCuadroInfo && p.cuadro && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {p.cuadro}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{p.descripcion}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
