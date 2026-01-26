import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkOrders, useWorkOrderStats } from '@/hooks/useWorkOrders';

const getStatusBadge = (estado: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pendiente: { variant: 'secondary', label: 'Pendiente' },
    en_progreso: { variant: 'default', label: 'En Progreso' },
    completada: { variant: 'outline', label: 'Completada' },
    cancelada: { variant: 'destructive', label: 'Cancelada' },
  };
  const config = variants[estado] || variants.pendiente;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function WorkOrdersDashboardPage() {
  const { data: orders, isLoading: isLoadingOrders } = useWorkOrders();
  const { data: stats, isLoading: isLoadingStats } = useWorkOrderStats();

  const recentOrders = (orders || []).slice(0, 4);

  const statCards = [
    { title: 'Total OTs', value: stats?.total || 0, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'En Progreso', value: stats?.enProgreso || 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { title: 'Completadas', value: stats?.completadas || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10' },
    { title: 'Urgentes', value: stats?.urgentes || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Resumen general del estado de las OTs</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to="/work-orders/create"><Plus className="w-4 h-4 mr-2" />Nueva OT</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.bg}`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Órdenes Recientes</CardTitle>
          <Button variant="ghost" asChild><Link to="/work-orders/orders">Ver todas</Link></Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoadingOrders ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
            ) : (
              recentOrders.map((order) => (
                <Link key={order.id} to={`/work-orders/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{order.codigo}</span>
                      {getStatusBadge(order.estado)}
                    </div>
                    <p className="font-medium text-foreground mt-1">{order.titulo}</p>
                    <p className="text-sm text-muted-foreground">{order.area}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">{order.tecnico_asignado || 'Sin asignar'}</div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
