import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPIMsTable } from '@/components/dashboard/RecentPIMsTable';
import { SLAIndicator } from '@/components/dashboard/SLAIndicator';
import { mockDashboardStats, mockPIMs } from '@/data/mockData';
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

const statusDistribution = [
  { name: 'En Negociación', value: 3, color: 'hsl(var(--info))' },
  { name: 'Contrato', value: 2, color: 'hsl(var(--warning))' },
  { name: 'Producción', value: 4, color: 'hsl(var(--chart-5))' },
  { name: 'Tránsito', value: 3, color: 'hsl(var(--success))' },
  { name: 'Aduana', value: 2, color: 'hsl(var(--accent))' },
];

const monthlyData = [
  { month: 'Oct', pims: 8, toneladas: 320 },
  { month: 'Nov', pims: 12, toneladas: 450 },
  { month: 'Dic', pims: 10, toneladas: 380 },
  { month: 'Ene', pims: 15, toneladas: 520 },
];

export default function DashboardPage() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get the PIM with worst SLA for alert
  const criticalPIM = mockPIMs.find(p => 
    Object.values(p.slaData).some(s => s.alerta === 'rojo')
  );

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header title="Dashboard" subtitle="Vista general del sistema COMEX" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="PIMs Activos"
            value={mockDashboardStats.pimsActivos}
            subtitle={`${mockDashboardStats.totalPIMs} totales`}
            icon={Ship}
            variant="primary"
            trend={{ value: 25, isPositive: true }}
          />
          <StatCard
            title="Alertas SLA"
            value={mockDashboardStats.alertasSLA}
            subtitle="Requieren atención"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Monto en Tránsito"
            value={formatCurrency(mockDashboardStats.montoTotalUSD)}
            icon={DollarSign}
            variant="accent"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Toneladas del Mes"
            value={`${mockDashboardStats.toneladasMes} t`}
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
              <p className="font-medium text-foreground">SLA Crítico: {criticalPIM.codigo}</p>
              <p className="text-sm text-muted-foreground">
                {criticalPIM.descripcion} - Tiempo de negociación excedido
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
                <SLAIndicator
                  label="Negociación"
                  diasEstimados={5}
                  diasReales={4}
                  alerta="verde"
                />
                <SLAIndicator
                  label="Contratos"
                  diasEstimados={3}
                  diasReales={3}
                  alerta="amarillo"
                />
                <SLAIndicator
                  label="Tránsito Promedio"
                  diasEstimados={25}
                  diasReales={23}
                  alerta="verde"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
