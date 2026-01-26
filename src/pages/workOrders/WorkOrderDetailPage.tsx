import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, MapPin, Wrench } from 'lucide-react';
import { mockWorkOrders } from '@/data/workOrdersMock';
import { WorkOrderStatus, WorkOrderPriority } from '@/types/workOrders';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getStatusBadge = (estado: WorkOrderStatus) => {
  const variants: Record<WorkOrderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pendiente: { variant: 'secondary', label: 'Pendiente' },
    en_progreso: { variant: 'default', label: 'En Progreso' },
    completada: { variant: 'outline', label: 'Completada' },
    cancelada: { variant: 'destructive', label: 'Cancelada' },
  };
  const config = variants[estado];
  return <Badge variant={config.variant} className="text-sm">{config.label}</Badge>;
};

const getPriorityBadge = (prioridad: WorkOrderPriority) => {
  const colors: Record<WorkOrderPriority, string> = {
    baja: 'bg-gray-100 text-gray-700',
    media: 'bg-blue-100 text-blue-700',
    alta: 'bg-orange-100 text-orange-700',
    urgente: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-3 py-1 rounded text-sm font-medium ${colors[prioridad]}`}>
      {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
    </span>
  );
};

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const order = mockWorkOrders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Orden de trabajo no encontrada</p>
            <Button asChild className="mt-4">
              <Link to="/work-orders/orders">Volver al listado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/work-orders/orders">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-muted-foreground">{order.codigo}</span>
            {getStatusBadge(order.estado)}
            {getPriorityBadge(order.prioridad)}
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1">{order.titulo}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{order.descripcion}</p>
              {order.observaciones && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Observaciones:</p>
                  <p className="text-sm text-foreground">{order.observaciones}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creación</p>
                    <p className="font-medium">{format(order.fechaCreacion, 'dd MMM yyyy', { locale: es })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha Límite</p>
                    <p className="font-medium">{format(order.fechaLimite, 'dd MMM yyyy', { locale: es })}</p>
                  </div>
                </div>
                {order.fechaInicio && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inicio</p>
                      <p className="font-medium">{format(order.fechaInicio, 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                  </div>
                )}
                {order.fechaFin && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Finalización</p>
                      <p className="font-medium">{format(order.fechaFin, 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Área</p>
                  <p className="font-medium">{order.area}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Trabajo</p>
                  <p className="font-medium capitalize">{order.tipoTrabajo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Solicitante</p>
                  <p className="font-medium">{order.solicitante}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Técnico Asignado</p>
                  <p className="font-medium">{order.tecnicoAsignado || 'Sin asignar'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
