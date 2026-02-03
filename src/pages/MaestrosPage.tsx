import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Database, Trash2, Upload } from 'lucide-react';
import { useCuadrosAll, useCreateCuadro, useDeleteCuadro } from '@/hooks/useCuadros';
import { useProducts, useCreateProduct, useDeleteProduct, useBulkInsertProducts } from '@/hooks/useProducts';
import type { ProductInsert } from '@/hooks/useProducts';
import { useSuppliers, useCreateSupplier, useDeleteSupplier, useBulkInsertSuppliers } from '@/hooks/useSuppliers';
import type { SupplierInsert } from '@/hooks/useSuppliers';
import { parseFile, type ParsedRow } from '@/lib/parseCsvExcel';
import { toast } from 'sonner';
import { TableStructureCard } from '@/components/maestros/TableStructureCard';
import { cuadrosColumns, productosColumns, proveedoresColumns } from '@/components/maestros/tableSchemas';

type MasterTab = 'cuadros' | 'productos' | 'proveedores';

export default function MaestrosPage() {
  const [activeTab, setActiveTab] = useState<MasterTab>('cuadros');
  const [deleteTarget, setDeleteTarget] = useState<{ type: MasterTab; id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: cuadros, isLoading: loadingCuadros } = useCuadrosAll();
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();

  const createCuadro = useCreateCuadro();
  const deleteCuadro = useDeleteCuadro();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const bulkProducts = useBulkInsertProducts();
  const createSupplier = useCreateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const bulkSuppliers = useBulkInsertSuppliers();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'cuadros') await deleteCuadro.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === 'productos') await deleteProduct.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === 'proveedores') await deleteSupplier.mutateAsync(deleteTarget.id);
      toast.success('Registro eliminado');
    } catch (e) {
      toast.error((e as Error).message);
    }
    setDeleteTarget(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        toast.warning('El archivo no tiene filas de datos (primera fila = encabezados).');
        return;
      }
      if (activeTab === 'cuadros') {
        const toInsert = rows.map((r) => ({
          codigo: String(r.codigo ?? r.Codigo ?? '').trim(),
          nombre: String(r.nombre ?? r.Nombre ?? '').trim(),
          descripcion: (r.descripcion ?? r.Descripcion ?? null) != null ? String(r.descripcion ?? r.Descripcion).trim() : null,
          activo: true,
        })).filter((r) => r.codigo && r.nombre);
        if (toInsert.length === 0) {
          toast.warning('No hay filas válidas (codigo, nombre obligatorios).');
          return;
        }
        for (const row of toInsert) {
          await createCuadro.mutateAsync(row);
        }
        toast.success(`${toInsert.length} cuadro(s) cargado(s). Los ID se generaron automáticamente.`);
      }
      if (activeTab === 'productos') {
        const toInsert = rows.map((r) => mapRowToProduct(r)).filter((p) => p.codigo && p.descripcion && p.categoria && p.unidad) as Omit<ProductInsert, 'id'>[];
        if (toInsert.length === 0) {
          toast.warning('Faltan columnas obligatorias: codigo, descripcion, categoria, unidad.');
          return;
        }
        await bulkProducts.mutateAsync(toInsert);
        toast.success(`${toInsert.length} producto(s) cargado(s). Los ID se generaron automáticamente.`);
      }
      if (activeTab === 'proveedores') {
        const toInsert = rows.map((r) => mapRowToSupplier(r)).filter((p) => p.codigo && p.nombre && p.pais) as Omit<SupplierInsert, 'id'>[];
        if (toInsert.length === 0) {
          toast.warning('Faltan columnas obligatorias: codigo, nombre, pais.');
          return;
        }
        await bulkSuppliers.mutateAsync(toInsert);
        toast.success(`${toInsert.length} proveedor(es) cargado(s). Los ID se generaron automáticamente.`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const formatValue = (val: unknown): string => {
    if (val == null || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Sí' : 'No';
    if (typeof val === 'number') return val.toLocaleString('es-PE');
    return String(val);
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header
        title="Maestros"
        subtitle="Gestione las tablas maestras: cuadros de importación, productos y proveedores."
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tablas maestras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MasterTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cuadros">Cuadros de importación</TabsTrigger>
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
              </TabsList>

              {/* CUADROS TAB */}
              <TabsContent value="cuadros" className="mt-4 space-y-4">
                <TableStructureCard
                  tableName="cuadros_importacion"
                  columns={cuadrosColumns}
                  templateFilename="plantilla_cuadros.csv"
                />

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={createCuadro.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar CSV / Excel
                  </Button>
                  <Badge variant="secondary">
                    {cuadros?.length ?? 0} registros
                  </Badge>
                </div>

                {loadingCuadros ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="border rounded-md overflow-auto max-h-[50vh]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Activo</TableHead>
                          <TableHead>Creado</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(cuadros ?? []).map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono font-medium">{c.codigo}</TableCell>
                            <TableCell>{c.nombre}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">{formatValue(c.descripcion)}</TableCell>
                            <TableCell>{c.activo ? <Badge variant="default">Sí</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString('es-PE') : '—'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ type: 'cuadros', id: c.id, name: c.nombre })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(cuadros ?? []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                              No hay cuadros. Use la plantilla para cargar datos masivamente.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* PRODUCTOS TAB */}
              <TabsContent value="productos" className="mt-4 space-y-4">
                <TableStructureCard
                  tableName="productos"
                  columns={productosColumns}
                  templateFilename="plantilla_productos.csv"
                />

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={bulkProducts.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar CSV / Excel
                  </Button>
                  <Badge variant="secondary">
                    {products?.length ?? 0} registros
                  </Badge>
                </div>

                {loadingProducts ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="border rounded-md overflow-auto max-h-[50vh]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="sticky left-0 bg-muted/50 z-10">Código</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Sub-Cat</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead>Cuadro</TableHead>
                          <TableHead>Línea</TableHead>
                          <TableHead>Clasificación</TableHead>
                          <TableHead>ABC</TableHead>
                          <TableHead>Cód. Est.</TableHead>
                          <TableHead>Cód. Base MP</TableHead>
                          <TableHead>Espesor</TableHead>
                          <TableHead>Ancho</TableHead>
                          <TableHead>Peso</TableHead>
                          <TableHead>Peso Compra</TableHead>
                          <TableHead>Últ. Precio USD</TableHead>
                          <TableHead>Últ. Fecha Imp.</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(products ?? []).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="sticky left-0 bg-background font-mono font-medium z-10">{p.codigo}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{p.descripcion}</TableCell>
                            <TableCell>{p.categoria}</TableCell>
                            <TableCell>{p.unidad}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.sub_categoria)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.origen)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.cuadro)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.linea)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.clasificacion)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.tipo_abc)}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">{formatValue(p.cod_estadistico)}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">{formatValue(p.cod_base_mp)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.espesor)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.ancho)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.peso)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(p.peso_compra)}</TableCell>
                            <TableCell className="text-muted-foreground">{p.ultimo_precio_usd != null ? `$${p.ultimo_precio_usd.toLocaleString('es-PE')}` : '—'}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{p.ultima_fecha_importacion ? new Date(p.ultima_fecha_importacion).toLocaleDateString('es-PE') : '—'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ type: 'productos', id: p.id, name: p.codigo })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(products ?? []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={19} className="text-center text-muted-foreground py-12">
                              No hay productos. Use la plantilla para cargar datos masivamente.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* PROVEEDORES TAB */}
              <TabsContent value="proveedores" className="mt-4 space-y-4">
                <TableStructureCard
                  tableName="proveedores"
                  columns={proveedoresColumns}
                  templateFilename="plantilla_proveedores.csv"
                />

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={bulkSuppliers.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar CSV / Excel
                  </Button>
                  <Badge variant="secondary">
                    {suppliers?.length ?? 0} registros
                  </Badge>
                </div>

                {loadingSuppliers ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="border rounded-md overflow-auto max-h-[50vh]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="sticky left-0 bg-muted/50 z-10">Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>País</TableHead>
                          <TableHead>Ciudad</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Activo</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(suppliers ?? []).map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="sticky left-0 bg-background font-mono font-medium z-10">{s.codigo}</TableCell>
                            <TableCell>{s.nombre}</TableCell>
                            <TableCell>{s.pais}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(s.ciudad)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(s.contacto)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(s.email)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(s.telefono)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatValue(s.tipo_proveedor)}</TableCell>
                            <TableCell>{s.activo ? <Badge variant="default">Sí</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ type: 'proveedores', id: s.id, name: s.nombre })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(suppliers ?? []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                              No hay proveedores. Use la plantilla para cargar datos masivamente.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deleteTarget?.name}&quot;. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function mapRowToProduct(r: ParsedRow): Record<string, unknown> {
  const str = (key: string, ...alt: string[]) => {
    const v = r[key] ?? alt.map((a) => r[a]).find((x) => x != null);
    return v != null ? String(v).trim() : '';
  };
  const num = (key: string) => {
    const v = r[key];
    if (v == null || v === '') return null;
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  };
  const dateStr = (key: string) => {
    const v = r[key];
    if (v == null || v === '') return null;
    if (typeof v === 'number') return new Date((v as number) * 86400 * 1000).toISOString().slice(0, 10);
    return String(v).trim() || null;
  };
  return {
    codigo: str('codigo', 'Codigo'),
    descripcion: str('descripcion', 'Descripcion'),
    categoria: str('categoria', 'Categoria') || 'General',
    unidad: str('unidad', 'Unidad') || 'TON',
    cuadro: str('cuadro', 'Cuadro') || null,
    ultimo_precio_usd: num('ultimo_precio_usd') ?? num('ultimo_precio') ?? null,
    ultima_fecha_importacion: dateStr('ultima_fecha_importacion') ?? dateStr('ultima_fecha') ?? null,
    sub_categoria: str('sub_categoria', 'sub_categoria') || null,
    linea: str('linea', 'Linea') || null,
    origen: str('origen', 'Origen') || null,
    cod_estadistico: str('cod_estadistico', 'cod_estadistico') || null,
    cod_base_mp: str('cod_base_mp', 'cod_base_mp') || null,
    tipo_abc: str('tipo_abc', 'tipo_abc') || null,
    clasificacion: str('clasificacion', 'Clasificacion') || null,
    espesor: num('espesor') ?? null,
    ancho: num('ancho') ?? null,
    peso: num('peso') ?? null,
    peso_compra: num('peso_compra') ?? null,
  };
}

function mapRowToSupplier(r: ParsedRow): Record<string, unknown> {
  const str = (key: string, ...alt: string[]) => {
    const v = r[key] ?? alt.map((a) => r[a]).find((x) => x != null);
    return v != null ? String(v).trim() : '';
  };
  return {
    codigo: str('codigo', 'Codigo'),
    nombre: str('nombre', 'Nombre'),
    pais: str('pais', 'Pais'),
    ciudad: str('ciudad', 'Ciudad') || null,
    contacto: str('contacto', 'Contacto') || null,
    email: str('email', 'Email') || null,
    telefono: str('telefono', 'Telefono') || null,
    tipo_proveedor: str('tipo_proveedor', 'tipo_proveedor') || null,
  };
}
