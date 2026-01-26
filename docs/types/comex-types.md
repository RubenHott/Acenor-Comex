# Tipos COMEX

**Ubicación**: `src/types/comex.ts`

Interfaces y tipos para el módulo de Comercio Exterior.

## Usuarios y Roles

### UserRole

```typescript
type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';
```

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador | Acceso total a todos los módulos |
| `manager` | Gerente | Aprobaciones y configuración |
| `operator` | Operador | CRUD de datos operativos |
| `viewer` | Visualizador | Solo lectura |

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  modules: string[];   // IDs de módulos permitidos
  createdAt: Date;
}
```

---

## Productos

### Product

```typescript
interface Product {
  id: string;
  codigo: string;              // Código único del producto
  descripcion: string;         // Descripción completa
  categoria: string;           // Ej: 'MATERIA PRIMA', 'GALVA. TABIQUERIA'
  subCategoria: string;        // Ej: 'Flejes Galvanizados', 'Bobinas'
  origen: 'Fabricación' | 'Compra Local' | 'Importación';
  codEstadistico: string;      // Código para estadísticas
  codBaseMP?: string;          // Código base de materia prima
  pesoCompra?: number;         // Peso en unidad de compra
  espesor?: number;            // Espesor en mm
  ancho?: number;              // Ancho en mm
  peso?: number;               // Peso en kg
  cuadro: string;              // Cuadro de importación
  linea: string;               // Línea de producto
  unidad: string;              // Unidad de medida
  clasificacion: string;       // Ej: '80/20'
  tipoABC: 'A' | 'B' | 'C';    // Clasificación ABC
  ultimoPrecioUSD?: number;    // Último precio registrado
  ultimaFechaImportacion?: Date;
}
```

---

## Proveedores

### Supplier

```typescript
interface Supplier {
  id: string;
  codigo: string;
  nombre: string;
  pais: string;
  ciudad?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  tipoProveedor: 'Fabricante' | 'Trader' | 'Distribuidor';
  activo: boolean;
  createdAt: Date;
}
```

---

## Precios

### ImportPrice

```typescript
interface ImportPrice {
  id: string;
  productoId: string;
  proveedorId: string;
  precioUSD: number;
  precioTonelada: number;
  fechaCotizacion: Date;
  vigente: boolean;
  notas?: string;
}
```

---

## Requerimientos

### MonthlyRequirement

```typescript
interface MonthlyRequirement {
  id: string;
  mes: string;                 // Formato: YYYY-MM
  cuadroId: string;            // Cuadro de importación
  productos: RequirementItem[];
  estado: 'borrador' | 'pendiente' | 'aprobado' | 'cerrado';
  totalToneladas: number;
  totalUSD: number;
  fechaCreacion: Date;
  fechaAprobacion?: Date;
  creadoPor: string;
}
```

### RequirementItem

```typescript
interface RequirementItem {
  id: string;
  productoId: string;
  codigoProducto: string;
  descripcion: string;
  cantidadRequerida: number;   // En unidad del producto
  unidad: string;
  toneladas: number;
  precioUnitarioUSD: number;
  totalUSD: number;
  ultimaImportacion?: {
    fecha: Date;
    precio: number;
    pim: string;               // Código del PIM
  };
}
```

---

## PIMs (Procesos de Importación)

### PIM

```typescript
interface PIM {
  id: string;
  codigo: string;              // Ej: 'PIM-2025-001'
  descripcion: string;
  estado: PIMStatus;
  tipo: 'principal' | 'sub-pim';
  pimPadreId?: string;         // Si es sub-pim
  requerimientoId: string;
  proveedorId: string;
  fabricaId?: string;          // Molino/fábrica
  items: PIMItem[];
  totalToneladas: number;
  totalUSD: number;
  fechaCreacion: Date;
  fechaCierre?: Date;
  fechaContrato?: Date;
  numeroContrato?: string;
  modalidadPago: PaymentModality;
  diasCredito?: number;
  porcentajeAnticipo?: number;
  slaData: SLAData;
}
```

### PIMStatus

```typescript
type PIMStatus = 
  | 'creado'
  | 'en_negociacion'
  | 'contrato_pendiente'
  | 'contrato_validado'
  | 'apertura_lc'
  | 'anticipo_pendiente'
  | 'en_produccion'
  | 'en_transito'
  | 'en_puerto'
  | 'en_aduana'
  | 'liberado'
  | 'entregado'
  | 'cerrado';
```

**Flujo de Estados:**

```
creado → en_negociacion → contrato_pendiente → contrato_validado
                                                       ↓
apertura_lc (si carta de crédito) ─────────────────────┤
                                                       ↓
anticipo_pendiente (si anticipo) ──────────────────────┤
                                                       ↓
                                              en_produccion
                                                       ↓
                                                en_transito
                                                       ↓
                                                 en_puerto
                                                       ↓
                                                 en_aduana
                                                       ↓
                                                  liberado
                                                       ↓
                                                 entregado
                                                       ↓
                                                   cerrado
```

### PaymentModality

```typescript
type PaymentModality = 
  | 'carta_credito'    // Carta de crédito
  | 'anticipo'         // Anticipo (30-50% usual)
  | 'pago_contado'     // Pago al contado
  | 'credito';         // Crédito directo
```

### PIMItem

```typescript
interface PIMItem {
  id: string;
  productoId: string;
  codigoProducto: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  toneladas: number;
  precioUnitarioUSD: number;
  totalUSD: number;
  cantidadRecibida?: number;
  parcialidades: Partiality[];
}
```

### Partiality (Parcialidades)

```typescript
interface Partiality {
  id: string;
  numero: number;            // Número de parcialidad
  cantidad: number;
  fechaEstimada: Date;
  fechaReal?: Date;
  estado: 'pendiente' | 'en_transito' | 'recibido';
}
```

---

## SLA (Service Level Agreement)

### SLAData

```typescript
interface SLAData {
  tiempoNegociacion: SLAMetric;
  tiempoContrato: SLAMetric;
  tiempoAperturaPago: SLAMetric;
  tiempoProduccion: SLAMetric;
  tiempoTransito: SLAMetric;
  tiempoAduana: SLAMetric;
  tiempoTotal: SLAMetric;
}
```

### SLAMetric

```typescript
interface SLAMetric {
  diasEstimados: number;
  diasReales?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  alerta: 'verde' | 'amarillo' | 'rojo';
}
```

**Lógica de Alertas:**

| Alerta | Condición |
|--------|-----------|
| 🟢 `verde` | `diasReales <= diasEstimados` |
| 🟡 `amarillo` | `diasReales > diasEstimados && diasReales <= diasEstimados * 1.2` |
| 🔴 `rojo` | `diasReales > diasEstimados * 1.2` |

---

## Contratos

### Contract

```typescript
interface Contract {
  id: string;
  pimId: string;
  numeroContrato: string;
  proveedorId: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  estado: 'pendiente_validacion' | 'validado' | 'rechazado' | 'modificacion';
  montoTotalUSD: number;
  terminosPago: string;
  incoterm: string;            // Ej: 'FOB', 'CIF', 'CFR'
  puertoDestino: string;
  observaciones?: string;
  documentoUrl?: string;
  validaciones: ContractValidation[];
}
```

### ContractValidation

```typescript
interface ContractValidation {
  id: string;
  campo: string;               // Nombre del campo validado
  valorCierre: string;         // Valor del cierre comercial
  valorContrato: string;       // Valor en el contrato
  coincide: boolean;           // Si los valores coinciden
  observacion?: string;
}
```

---

## Notificaciones

### Notification

```typescript
interface Notification {
  id: string;
  tipo: 'alerta_sla' | 'contrato' | 'pago' | 'embarque' | 'general';
  titulo: string;
  mensaje: string;
  destinatarioId: string;
  pimId?: string;
  leido: boolean;
  fechaCreacion: Date;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
}
```

---

## Dashboard

### DashboardStats

```typescript
interface DashboardStats {
  totalPIMs: number;
  pimsActivos: number;
  pimsPendientes: number;
  alertasSLA: number;
  montoTotalUSD: number;
  toneladasMes: number;
}
```
