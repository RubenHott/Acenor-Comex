import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Filter, Download, Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const { data: products, isLoading, error } = useProducts();

  const categories = [...new Set(products?.map(p => p.categoria) || [])];

  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = 
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value?: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Productos" subtitle="Catálogo de productos y materias primas" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar productos: {error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header title="Productos" subtitle="Catálogo de productos y materias primas" />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className="text-center">Tipo ABC</TableHead>
                <TableHead className="text-right">Último Precio</TableHead>
                <TableHead>Última Import.</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="table-row-hover">
                    <TableCell className="font-mono text-sm font-medium">{product.codigo}</TableCell>
                    <TableCell className="max-w-[250px]">
                      <p className="truncate">{product.descripcion}</p>
                      {product.cod_base_mp && (
                        <p className="text-xs text-muted-foreground">MP: {product.cod_base_mp}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{product.categoria}</p>
                        <p className="text-xs text-muted-foreground">{product.sub_categoria}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          product.origen === 'Importación'
                            ? 'border-info/50 text-info bg-info/10'
                            : product.origen === 'Fabricación'
                            ? 'border-success/50 text-success bg-success/10'
                            : 'border-muted-foreground/50'
                        )}
                      >
                        {product.origen || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                          product.tipo_abc === 'A'
                            ? 'bg-success/10 text-success'
                            : product.tipo_abc === 'B'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {product.tipo_abc || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.ultimo_precio_usd)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(product.ultima_fecha_importacion)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoading && filteredProducts.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredProducts.length} de {products?.length || 0} productos
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
