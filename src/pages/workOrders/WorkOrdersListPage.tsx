import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye } from 'lucide-react';
import { mockWorkOrders } from '@/data/workOrdersMock';
import { WorkOrderStatus, WorkOrderPriority } from '@/types/workOrders';

const getStatusBadge = (estado: WorkOrderStatus) => {
  const variants: Record<WorkOrderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pendiente: { variant: 'secondary', label: 'Pendiente' },
    en_progreso: { variant: 'default', label: 'En Progreso' },
    completada: { variant: 'outline', label: 'Completada' },
    cancelada: { variant: 'destructive', label: 'Cancelada' },
  };
  const config = variants[estado];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPriorityBadge = (prioridad: WorkOrderPriority) => {
  const colors: Record<WorkOrderPriority, string> = {
    baja: 'bg-gray-100 text-gray-700',
    media: 'bg-blue-100 text-blue-700',
    alta: 'bg-orange-100 text-orange-700',
    urgente: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[prioridad]}`}>
      {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
    </span>
  );
};

export default function WorkOrdersListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');

  const filteredOrders = mockWorkOrders.filter((order) => {
    const matchesSearch = order.titulo.toLowerCase().includes(search.toLowerCase()) ||
      order.codigo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || order.estado === statusFilter;
    const matchesPriority = priorityFilter === 'todos' || order.prioridad === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Listado completo de órdenes de trabajo</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to="/work-orders/create">
            <Plus className="w-4 h-4 mr-2" />
            Nueva OT
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.codigo}</TableCell>
                  <TableCell className="font-medium">{order.titulo}</TableCell>
                  <TableCell>{getStatusBadge(order.estado)}</TableCell>
                  <TableCell>{getPriorityBadge(order.prioridad)}</TableCell>
                  <TableCell>{order.area}</TableCell>
                  <TableCell>{order.tecnicoAsignado || 'Sin asignar'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/work-orders/orders/${order.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
