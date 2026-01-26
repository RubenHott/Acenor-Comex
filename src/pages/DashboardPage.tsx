import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPIMsTable } from '@/components/dashboard/RecentPIMsTable';
import { SLAIndicator } from '@/components/dashboard/SLAIndicator';
import { usePIMs, usePIMStats } from '@/hooks/usePIMs';
import { useSLAStats } from '@/hooks/useSLAData';
import {
  Ship,
  AlertTriangle,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// Status labels and colors for chart
const statusLabels: Record<string, string> = {
  creado: 'Creado',
  en_negociacion: 'En Negociación',
  contrato_pendiente: 'Contrato Pendiente',
  contrato_validado: 'Contrato Validado',
  en_produccion: 'En Producción',
  en_transito: 'En Tránsito',
  en_aduana: 'En Aduana',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
};

const statusColors: Record<string, string> = {
  creado: 'hsl(var(--muted-foreground))',
  en_negociacion: 'hsl(var(--info))',
  contrato_pendiente: 'hsl(var(--warning))',
  contrato_validado: 'hsl(var(--chart-5))',
  en_produccion: 'hsl(var(--accent))',
  en_transito: 'hsl(var(--success))',
  en_aduana: 'hsl(var(--primary))',
  entregado: 'hsl(var(--chart-4))',
  cerrado: 'hsl(var(--muted))',
};

export default function DashboardPage() {
  const { data: pims, isLoading: isLoadingPims } = usePIMs();
  const { data: stats, isLoading: isLoadingStats } = usePIMStats();
  const { data: slaStats, isLoading: isLoadingSLA } = useSLAStats();

  // Calculate status distribution from real data
  const statusDistribution = useMemo(() => {
    if (!pims || pims.length === 0) return [];
    
    const counts = pims.reduce((acc, pim) => {
      acc[pim.estado] = (acc[pim.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([status, value]) => ({
      name: statusLabels[status] || status,
      value,
      color: statusColors[status] || 'hsl(var(--muted))',
    }));
  }, [pims]);

  // Calculate monthly data from PIMs
  const monthlyData = useMemo(() => {
    if (!pims || pims.length === 0) return [];
    
    const monthCounts: Record<string, { pims: number; toneladas: number }> = {};
    
    pims.forEach(pim => {
      if (pim.fecha_creacion) {
        const date = new Date(pim.fecha_creacion);
        const monthKey = date.toLocaleDateString('es-PE', { month: 'short' });
        
        if (!monthCounts[monthKey]) {
          monthCounts[monthKey] = { pims: 0, toneladas: 0 };
        }
        monthCounts[monthKey].pims += 1;
        monthCounts[monthKey].toneladas += pim.total_toneladas || 0;
      }
    });
    
    return Object.entries(monthCounts)
      .slice(-4) // Last 4 months
      .map(([month, data]) => ({
        month,
        pims: data.pims,
        toneladas: Math.round(data.toneladas),
      }));
  }, [pims]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get the PIM with critical state
  const criticalPIM = pims?.find(p => 
    p.estado === 'en_negociacion' || p.estado === 'contrato_pendiente'
  );

  if (isLoadingStats) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Dashboard" subtitle="Vista general del sistema COMEX" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header title="Dashboard" subtitle="Vista general del sistema COMEX" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="PIMs Activos"
            value={stats?.pimsActivos || 0}
            subtitle={`${stats?.totalPIMs || 0} totales`}
            icon={Ship}
            variant="primary"
            trend={{ value: 25, isPositive: true }}
          />
          <StatCard
            title="Alertas SLA"
            value={stats?.alertasSLA || 0}
            subtitle="Requieren atención"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Monto en Tránsito"
            value={formatCurrency(stats?.montoTotalUSD || 0)}
            icon={DollarSign}
            variant="accent"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Toneladas del Mes"
            value={`${stats?.toneladasMes || 0} t`}
            icon={Package}
            variant="success"
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Alert Banner */}
        {criticalPIM && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">PIM Pendiente: {criticalPIM.codigo}</p>
              <p className="text-sm text-muted-foreground">
                {criticalPIM.descripcion}
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
              Ver detalles
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PIMs Table */}
          <div className="lg:col-span-2">
            <RecentPIMsTable />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                {statusDistribution.length > 0 ? (
                  <>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {statusDistribution.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">{item.name}</span>
                          <span className="text-xs font-medium ml-auto">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    No hay datos de PIMs
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Tendencia Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="pims"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name="PIMs"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    No hay datos mensuales
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SLA Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-info" />
                  SLA Global
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingSLA ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : slaStats ? (
                  <>
                    <SLAIndicator
                      label="Negociación"
                      diasEstimados={slaStats.negociacion.estimados}
                      diasReales={slaStats.negociacion.reales ?? undefined}
                      alerta={slaStats.negociacion.alerta}
                    />
                    <SLAIndicator
                      label="Contratos"
                      diasEstimados={slaStats.contrato.estimados}
                      diasReales={slaStats.contrato.reales ?? undefined}
                      alerta={slaStats.contrato.alerta}
                    />
                    <SLAIndicator
                      label="Tránsito Promedio"
                      diasEstimados={slaStats.transito.estimados}
                      diasReales={slaStats.transito.reales ?? undefined}
                      alerta={slaStats.transito.alerta}
                    />
                  </>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    No hay datos de SLA
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
