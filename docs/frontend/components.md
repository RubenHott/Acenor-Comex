# Componentes Reutilizables

Documentación de los componentes custom del sistema organizados por categoría.

## Componentes de Layout

### ComexSidebar

**Ubicación**: `src/components/layout/ComexSidebar.tsx`

Sidebar de navegación para el módulo COMEX con soporte para colapsar.

```typescript
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}
```

**Características**:
- Estado colapsado/expandido
- Badges para notificaciones
- Secciones: Principal, Catálogos, Sistema
- Información del usuario
- Botón para volver a módulos

**Uso**:
```tsx
import { ComexSidebar } from '@/components/layout/ComexSidebar';

<ComexSidebar />
```

### WorkOrdersSidebar

**Ubicación**: `src/components/layout/WorkOrdersSidebar.tsx`

Sidebar de navegación para el módulo de Órdenes de Trabajo.

**Características**:
- Misma estructura que ComexSidebar
- Items específicos para OTs

### Header

**Ubicación**: `src/components/layout/Header.tsx`

Encabezado con búsqueda y notificaciones.

**Props**:
```typescript
interface HeaderProps {
  title?: string;
  subtitle?: string;
}
```

---

## Componentes de Dashboard

### StatCard

**Ubicación**: `src/components/dashboard/StatCard.tsx`

Tarjeta de estadísticas con variantes de color y tendencia.

**Props**:
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
}
```

**Variantes**:
| Variante | Fondo | Uso |
|----------|-------|-----|
| `default` | Card background | Estadísticas neutras |
| `primary` | Primary/5 | Métricas principales |
| `accent` | Accent/10 | Destacados |
| `success` | Success/10 | Logros positivos |
| `warning` | Warning/10 | Alertas |

**Ejemplo**:
```tsx
import { StatCard } from '@/components/dashboard/StatCard';
import { Ship } from 'lucide-react';

<StatCard
  title="PIMs Activos"
  value={15}
  subtitle="3 con alertas SLA"
  icon={Ship}
  variant="primary"
  trend={{ value: 12, isPositive: true }}
/>
```

### PIMStatusBadge

**Ubicación**: `src/components/dashboard/PIMStatusBadge.tsx`

Badge que muestra el estado de un PIM con colores semánticos.

**Props**:
```typescript
interface PIMStatusBadgeProps {
  status: PIMStatus;
}
```

**Estados y Colores**:
| Estado | Color | Descripción |
|--------|-------|-------------|
| `creado` | Gris | PIM recién creado |
| `en_negociacion` | Azul | En proceso de negociación |
| `contrato_pendiente` | Amarillo | Esperando contrato |
| `contrato_validado` | Verde | Contrato aprobado |
| `apertura_lc` | Azul | Abriendo carta de crédito |
| `anticipo_pendiente` | Amarillo | Esperando anticipo |
| `en_produccion` | Azul | En fabricación |
| `en_transito` | Púrpura | En camino |
| `en_puerto` | Naranja | Llegó al puerto |
| `en_aduana` | Amarillo | En proceso aduanero |
| `liberado` | Verde | Liberado de aduana |
| `entregado` | Verde | Entregado al cliente |
| `cerrado` | Gris | PIM finalizado |

**Ejemplo**:
```tsx
import { PIMStatusBadge } from '@/components/dashboard/PIMStatusBadge';

<PIMStatusBadge status="en_produccion" />
```

### SLAIndicator

**Ubicación**: `src/components/dashboard/SLAIndicator.tsx`

Indicador visual del cumplimiento de SLA.

**Props**:
```typescript
interface SLAIndicatorProps {
  alert: 'verde' | 'amarillo' | 'rojo';
  daysEstimated: number;
  daysReal?: number;
  label?: string;
}
```

**Colores**:
| Alerta | Color | Significado |
|--------|-------|-------------|
| `verde` | Success | Dentro del tiempo |
| `amarillo` | Warning | Cerca del límite |
| `rojo` | Destructive | Excedido |

**Ejemplo**:
```tsx
import { SLAIndicator } from '@/components/dashboard/SLAIndicator';

<SLAIndicator
  alert="verde"
  daysEstimated={30}
  daysReal={25}
  label="Producción"
/>
```

### RecentPIMsTable

**Ubicación**: `src/components/dashboard/RecentPIMsTable.tsx`

Tabla de PIMs recientes con acciones.

**Props**:
```typescript
interface RecentPIMsTableProps {
  pims: PIM[];
  limit?: number;
}
```

---

## Componentes de Work Orders

### PriorityBadge

**Ubicación**: `src/components/workOrders/PriorityBadge.tsx`

Badge de prioridad de orden de trabajo.

**Props**:
```typescript
interface PriorityBadgeProps {
  priority: WorkOrderPriority;
}
```

**Prioridades**:
| Prioridad | Color | Icono |
|-----------|-------|-------|
| `baja` | Gris | - |
| `media` | Azul | - |
| `alta` | Naranja | ⚠️ |
| `urgente` | Rojo | 🔴 |

### WorkOrderStatusBadge

**Ubicación**: `src/components/workOrders/WorkOrderStatusBadge.tsx`

Badge de estado de orden de trabajo.

**Props**:
```typescript
interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
}
```

**Estados**:
| Estado | Color | Descripción |
|--------|-------|-------------|
| `pendiente` | Amarillo | Sin iniciar |
| `en_progreso` | Azul | En ejecución |
| `completada` | Verde | Finalizada |
| `cancelada` | Rojo | Cancelada |

---

## Componente NavLink

**Ubicación**: `src/components/NavLink.tsx`

Wrapper de NavLink de React Router con estilos consistentes.

---

## Patrones de Uso

### Importación de Componentes

```tsx
// Componentes de dashboard
import { StatCard } from '@/components/dashboard/StatCard';
import { PIMStatusBadge } from '@/components/dashboard/PIMStatusBadge';
import { SLAIndicator } from '@/components/dashboard/SLAIndicator';

// Componentes de layout
import { ComexSidebar } from '@/components/layout/ComexSidebar';
import { Header } from '@/components/layout/Header';

// Componentes de work orders
import { PriorityBadge } from '@/components/workOrders/PriorityBadge';
import { WorkOrderStatusBadge } from '@/components/workOrders/WorkOrderStatusBadge';
```

### Composición de Página

```tsx
function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <Header title="Dashboard" subtitle="Resumen del módulo" />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={15} icon={Package} variant="primary" />
        <StatCard title="Activos" value={8} icon={Clock} variant="accent" />
        <StatCard title="Alertas" value={2} icon={AlertTriangle} variant="warning" />
        <StatCard title="Completados" value={12} icon={CheckCircle} variant="success" />
      </div>
      
      <RecentPIMsTable pims={pims} limit={5} />
    </div>
  );
}
```

### Uso con Datos

```tsx
import { mockPIMs } from '@/data/mockData';

function PIMsList() {
  return (
    <Table>
      <TableBody>
        {mockPIMs.map(pim => (
          <TableRow key={pim.id}>
            <TableCell>{pim.codigo}</TableCell>
            <TableCell>
              <PIMStatusBadge status={pim.estado} />
            </TableCell>
            <TableCell>
              <SLAIndicator
                alert={pim.slaData.tiempoTotal.alerta}
                daysEstimated={pim.slaData.tiempoTotal.diasEstimados}
                daysReal={pim.slaData.tiempoTotal.diasReales}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```
