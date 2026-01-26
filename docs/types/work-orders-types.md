# Tipos Órdenes de Trabajo

**Ubicación**: `src/types/workOrders.ts`

Interfaces y tipos para el módulo de Órdenes de Trabajo.

## Estados

### WorkOrderStatus

```typescript
type WorkOrderStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
```

| Estado | Descripción | Color |
|--------|-------------|-------|
| `pendiente` | OT creada, sin iniciar | 🟡 Amarillo |
| `en_progreso` | OT en ejecución | 🔵 Azul |
| `completada` | OT finalizada | 🟢 Verde |
| `cancelada` | OT cancelada | 🔴 Rojo |

**Flujo de Estados:**

```
           ┌──────────────┐
           │              │
           ▼              │
       pendiente ─────────┤
           │              │
           ▼              │
       en_progreso ───────┤
           │              │
           ▼              ▼
       completada      cancelada
```

---

## Prioridades

### WorkOrderPriority

```typescript
type WorkOrderPriority = 'baja' | 'media' | 'alta' | 'urgente';
```

| Prioridad | Descripción | SLA Sugerido | Color |
|-----------|-------------|--------------|-------|
| `baja` | No urgente, puede esperar | 7 días | ⚪ Gris |
| `media` | Prioridad normal | 3 días | 🔵 Azul |
| `alta` | Requiere atención pronto | 24 horas | 🟠 Naranja |
| `urgente` | Atención inmediata | 4 horas | 🔴 Rojo |

---

## Tipos de Trabajo

### WorkOrderType

```typescript
type WorkOrderType = 'correctivo' | 'preventivo' | 'mejora';
```

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `correctivo` | Reparación de falla | Arreglar motor descompuesto |
| `preventivo` | Mantenimiento programado | Cambio de aceite cada 1000h |
| `mejora` | Optimización | Instalar sensor de temperatura |

---

## Orden de Trabajo

### WorkOrder

```typescript
interface WorkOrder {
  id: string;
  codigo: string;              // Ej: 'OT-2025-001'
  titulo: string;              // Título breve
  descripcion: string;         // Descripción detallada
  estado: WorkOrderStatus;
  prioridad: WorkOrderPriority;
  tipoTrabajo: WorkOrderType;
  area: string;                // Área/departamento
  equipoId?: string;           // ID del equipo/máquina
  tecnicoAsignado?: string;    // ID del técnico
  solicitante: string;         // Quién solicitó la OT
  fechaCreacion: Date;
  fechaInicio?: Date;          // Cuándo se empezó
  fechaFin?: Date;             // Cuándo se completó
  fechaLimite: Date;           // Deadline según SLA
  observaciones?: string;      // Notas adicionales
}
```

---

## Ejemplo de Uso

```typescript
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '@/types/workOrders';

const newWorkOrder: WorkOrder = {
  id: 'wo-001',
  codigo: 'OT-2025-001',
  titulo: 'Reparación compresor línea 1',
  descripcion: 'El compresor presenta ruido anormal y baja presión',
  estado: 'pendiente',
  prioridad: 'alta',
  tipoTrabajo: 'correctivo',
  area: 'Producción',
  equipoId: 'EQ-COMP-001',
  solicitante: 'Juan Pérez',
  fechaCreacion: new Date(),
  fechaLimite: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 horas
};
```

---

## Datos Mock

**Ubicación**: `src/data/workOrdersMock.ts`

```typescript
export const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    codigo: 'OT-2025-001',
    titulo: 'Mantenimiento preventivo prensa hidráulica',
    descripcion: 'Cambio de aceite y revisión de sellos',
    estado: 'en_progreso',
    prioridad: 'media',
    tipoTrabajo: 'preventivo',
    area: 'Producción',
    equipoId: 'EQ-PRH-001',
    tecnicoAsignado: 'Carlos Rodríguez',
    solicitante: 'Sistema',
    fechaCreacion: new Date('2025-01-15'),
    fechaInicio: new Date('2025-01-16'),
    fechaLimite: new Date('2025-01-18'),
  },
  // ... más órdenes
];
```

---

## Futuras Extensiones

### Campos Pendientes de Implementar

```typescript
interface WorkOrder {
  // ... campos actuales ...
  
  // Campos futuros
  repuestos?: {
    id: string;
    nombre: string;
    cantidad: number;
    costo: number;
  }[];
  costoManoObra?: number;
  costoTotal?: number;
  tiempoEstimadoHoras?: number;
  tiempoRealHoras?: number;
  fotosAntes?: string[];
  fotosDespues?: string[];
  firmaCompletado?: string;
  checklist?: {
    item: string;
    completado: boolean;
  }[];
}
```

### Tipos Adicionales Sugeridos

```typescript
// Equipo/Máquina
interface Equipment {
  id: string;
  codigo: string;
  nombre: string;
  area: string;
  fechaInstalacion: Date;
  horasOperacion: number;
  proximoMantenimiento: Date;
}

// Técnico
interface Technician {
  id: string;
  nombre: string;
  especialidad: string;
  disponible: boolean;
}

// Historial de OT
interface WorkOrderHistory {
  id: string;
  workOrderId: string;
  accion: string;
  usuario: string;
  fecha: Date;
  detalles?: string;
}
```
