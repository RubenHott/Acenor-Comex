// COMEX Application Types

export type UserRole = 'admin' | 'manager' | 'jefe_comex' | 'analista_comex' |
  'jefe_finanzas' | 'analista_finanzas' | 'gerente' | 'viewer';

export type Department = 'comex' | 'finanzas' | 'gerencia' | 'sistemas';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  avatar?: string;
  modules: string[];
  createdAt: Date;
}

export interface Product {
  id: string;
  codigo: string;
  descripcion: string;
  categoria: string;
  subCategoria: string;
  origen: 'Fabricación' | 'Compra Local' | 'Importación';
  codEstadistico: string;
  codBaseMP?: string;
  pesoCompra?: number;
  espesor?: number;
  ancho?: number;
  peso?: number;
  cuadro: string;
  linea: string;
  unidad: string;
  clasificacion: string;
  tipoABC: 'A' | 'B' | 'C';
  ultimoPrecioUSD?: number;
  ultimaFechaImportacion?: Date;
}

export interface Supplier {
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

export interface ImportPrice {
  id: string;
  productoId: string;
  proveedorId: string;
  precioUSD: number;
  precioTonelada: number;
  fechaCotizacion: Date;
  vigente: boolean;
  notas?: string;
}

export interface MonthlyRequirement {
  id: string;
  mes: string; // YYYY-MM
  cuadroId: string;
  productos: RequirementItem[];
  estado: 'borrador' | 'pendiente' | 'aprobado' | 'cerrado';
  totalToneladas: number;
  totalUSD: number;
  fechaCreacion: Date;
  fechaAprobacion?: Date;
  creadoPor: string;
}

export interface RequirementItem {
  id: string;
  productoId: string;
  codigoProducto: string;
  descripcion: string;
  cantidadRequerida: number;
  unidad: string;
  toneladas: number;
  precioUnitarioUSD: number;
  totalUSD: number;
  ultimaImportacion?: {
    fecha: Date;
    precio: number;
    pim: string;
  };
}

export interface PIM {
  id: string;
  codigo: string;
  descripcion: string;
  estado: PIMStatus;
  tipo: 'principal' | 'sub-pim';
  pimPadreId?: string;
  requerimientoId: string;
  proveedorId: string;
  fabricaId?: string;
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

export type PIMStatus = 
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

export type PaymentModality = 
  | 'carta_credito'
  | 'anticipo'
  | 'pago_contado'
  | 'credito';

export interface PIMItem {
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

export interface Partiality {
  id: string;
  numero: number;
  cantidad: number;
  fechaEstimada: Date;
  fechaReal?: Date;
  estado: 'pendiente' | 'en_transito' | 'recibido';
}

export interface SLAData {
  tiempoNegociacion: SLAMetric;
  tiempoContrato: SLAMetric;
  tiempoAperturaPago: SLAMetric;
  tiempoProduccion: SLAMetric;
  tiempoTransito: SLAMetric;
  tiempoAduana: SLAMetric;
  tiempoTotal: SLAMetric;
}

export interface SLAMetric {
  diasEstimados: number;
  diasReales?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  alerta: 'verde' | 'amarillo' | 'rojo';
}

export interface Contract {
  id: string;
  pimId: string;
  numeroContrato: string;
  proveedorId: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  estado: 'pendiente_validacion' | 'validado' | 'rechazado' | 'modificacion';
  montoTotalUSD: number;
  terminosPago: string;
  incoterm: string;
  puertoDestino: string;
  observaciones?: string;
  documentoUrl?: string;
  validaciones: ContractValidation[];
}

export interface ContractValidation {
  id: string;
  campo: string;
  valorCierre: string;
  valorContrato: string;
  coincide: boolean;
  observacion?: string;
}

export interface Notification {
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

export interface DashboardStats {
  totalPIMs: number;
  pimsActivos: number;
  pimsPendientes: number;
  alertasSLA: number;
  montoTotalUSD: number;
  toneladasMes: number;
}
