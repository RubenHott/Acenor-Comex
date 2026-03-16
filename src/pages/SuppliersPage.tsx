import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Plus, 
  Building2,
  MapPin,
  Mail,
  Phone,
  MoreHorizontal,
  Globe,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: suppliers, isLoading, error } = useSuppliers();

  const filteredSuppliers = (suppliers || []).filter(supplier =>
    supplier.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.pais.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (tipo: string | null) => {
    switch (tipo) {
      case 'Fabricante': return 'bg-success/10 text-success border-success/30';
      case 'Trader': return 'bg-info/10 text-info border-info/30';
      case 'Distribuidor': return 'bg-warning/10 text-warning border-warning/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Proveedores" subtitle="Gestión de proveedores y fábricas" />
        <div className="p-4 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar proveedores: {error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header 
        title="Proveedores" 
        subtitle="Gestión de proveedores y fábricas" 
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{supplier.codigo}</p>
                        <h3 className="font-semibold">{supplier.nombre}</h3>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver PIMs</DropdownMenuItem>
                        <DropdownMenuItem>Historial de precios</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getTypeColor(supplier.tipo_proveedor)}>
                        {supplier.tipo_proveedor || 'N/A'}
                      </Badge>
                      {supplier.activo ? (
                        <Badge className="bg-success/10 text-success border-0">Activo</Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-0">Inactivo</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{supplier.ciudad ? `${supplier.ciudad}, ` : ''}{supplier.pais}</span>
                      </div>
                      {supplier.contacto && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4 flex-shrink-0" />
                          <span>{supplier.contacto}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <a href={`mailto:${supplier.email}`} className="hover:text-primary truncate">
                            {supplier.email}
                          </a>
                        </div>
                      )}
                      {supplier.telefono && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{supplier.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {supplier.created_at && `Desde ${new Intl.DateTimeFormat('es-PE', {
                        month: 'short',
                        year: 'numeric',
                      }).format(new Date(supplier.created_at))}`}
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver PIMs →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!isLoading && filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron proveedores</p>
          </div>
        )}
      </div>
    </div>
  );
}
