export type WorkOrderStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
export type WorkOrderPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type WorkOrderType = 'correctivo' | 'preventivo' | 'mejora';

export interface WorkOrder {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  estado: WorkOrderStatus;
  prioridad: WorkOrderPriority;
  tipoTrabajo: WorkOrderType;
  area: string;
  equipoId?: string;
  tecnicoAsignado?: string;
  solicitante: string;
  fechaCreacion: Date;
  fechaInicio?: Date;
  fechaFin?: Date;
  fechaLimite: Date;
  observaciones?: string;
}
