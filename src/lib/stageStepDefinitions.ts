import type { Department } from "@/types/comex";

// --- Types ---

export interface StageStepDef {
  key: string;
  order: number;
  name: string;
  description: string;
  requiredDepartment?: Department[];
  requiredDocuments?: string[];
  isConditional?: boolean;
}

// --- Step definitions for Stage 1: Revisión de Contrato ---

export const REVISION_CONTRATO_STEPS: StageStepDef[] = [
  {
    key: "documentos_iniciales",
    order: 1,
    name: "Documentos Iniciales",
    description: "Carga de contrato revisado y cierre de compras revisado",
    requiredDepartment: ["comex"],
    requiredDocuments: ["contrato", "cierre_compra"],
  },
  {
    key: "declaracion_nc",
    order: 2,
    name: "Declaración de No Conformidad",
    description: "Definición obligatoria del estado de conformidad",
    requiredDepartment: ["comex"],
  },
  {
    key: "subsanacion_nc",
    order: 3,
    name: "Subsanación de No Conformidad",
    description: "El área asignada gestiona y corrige la observación",
    isConditional: true,
  },
  {
    key: "revision_comex",
    order: 4,
    name: "Revisión COMEX",
    description: "COMEX revisa la subsanación y acepta o rechaza",
    requiredDepartment: ["comex"],
    isConditional: true,
  },
  {
    key: "contrato_firmado",
    order: 5,
    name: "Contrato Firmado y Enviado a Proveedor",
    description: "Carga del contrato firmado y enviado al proveedor",
    requiredDepartment: ["comex"],
    requiredDocuments: ["contrato_firmado"],
  },
  {
    key: "validacion_cuenta_bancaria",
    order: 6,
    name: "Validación de Cuenta Bancaria",
    description: "Validación o selección de cuenta bancaria del proveedor",
    requiredDepartment: ["comex"],
  },
  {
    key: "aprobacion_gerencia",
    order: 7,
    name: "Aprobación Gerencia",
    description: "Aprobación final de la cuenta bancaria por Gerencia",
    requiredDepartment: ["gerencia"],
  },
  {
    key: "cierre_proceso",
    order: 8,
    name: "Cierre del Proceso",
    description: "COMEX cierra el primer proceso",
    requiredDepartment: ["comex"],
  },
];

// --- Step definitions for Stage 2: Gestión Financiera de Pago ---

export const GESTION_PAGO_STEPS: StageStepDef[] = [
  {
    key: "encabezado_antecedentes",
    order: 1,
    name: "Encabezado / Antecedentes",
    description: "Información consolidada del PIM y documentos disponibles para descarga",
    requiredDepartment: ["finanzas"],
  },
  {
    key: "revision_financiera",
    order: 2,
    name: "Revisión Financiera",
    description: "Revisión de la documentación financiera — conforme o con observaciones",
    requiredDepartment: ["finanzas"],
  },
  {
    key: "declaracion_nc_fin",
    order: 3,
    name: "Declaración de NC",
    description: "Creación de No Conformidad con detalle de la observación",
    requiredDepartment: ["finanzas"],
    isConditional: true,
  },
  {
    key: "subsanacion_nc_fin",
    order: 4,
    name: "Subsanación de NC",
    description: "El área asignada corrige la observación detectada",
    isConditional: true,
  },
  {
    key: "revision_finanzas",
    order: 5,
    name: "Revisión Finanzas",
    description: "Finanzas revisa la subsanación y acepta o rechaza",
    requiredDepartment: ["finanzas"],
    isConditional: true,
  },
  {
    key: "registro_banco_tasa",
    order: 6,
    name: "Registro Banco y Tasa",
    description: "Registro del banco seleccionado y la tasa de cambio acordada",
    requiredDepartment: ["finanzas"],
  },
  {
    key: "solicitud_firma",
    order: 7,
    name: "Solicitud de Firma",
    description: "Gestión de la firma del contrato y carga del documento firmado",
    requiredDepartment: ["finanzas"],
    requiredDocuments: ["contrato_firmado"],
  },
  {
    key: "recepcion_swift",
    order: 8,
    name: "Recepción de Swift",
    description: "Recepción y registro del comprobante Swift del banco",
    requiredDepartment: ["finanzas"],
    requiredDocuments: ["swift"],
  },
  {
    key: "gestion_comex",
    order: 9,
    name: "Gestión COMEX",
    description: "Envío del Swift al proveedor y gestión de su respuesta",
    requiredDepartment: ["comex"],
  },
  {
    key: "cierre_proceso",
    order: 10,
    name: "Cierre del Proceso",
    description: "Finanzas cierra el proceso y avanza a la siguiente etapa",
    requiredDepartment: ["finanzas"],
  },
];

// --- Step definitions for Stage 3: Documentación e Internación ---

export const DOCUMENTACION_INTERNACION_STEPS: StageStepDef[] = [
  {
    key: "recepcion_docs_digitales",
    order: 1,
    name: "Recepción de Documentación Digital",
    description: "COMEX recibe y carga BL, factura comercial y packing list del proveedor",
    requiredDepartment: ["comex"],
    requiredDocuments: ["factura", "bl", "packing_list"],
  },
  {
    key: "registro_dhl",
    order: 2,
    name: "Registro de Seguimiento DHL",
    description: "COMEX ingresa el código de seguimiento DHL para documentos físicos",
    requiredDepartment: ["comex"],
  },
  {
    key: "seguimiento_docs_fisicos",
    order: 3,
    name: "Seguimiento de Recepción de Docs Físicos",
    description: "Finanzas confirma la recepción de documentos físicos vía DHL o manual",
    requiredDepartment: ["finanzas"],
  },
  {
    key: "revision_documental",
    order: 4,
    name: "Revisión Documental",
    description: "Revisión de documentos recibidos: conforme o levantar discrepancia",
    requiredDepartment: ["comex", "finanzas"],
  },
  {
    key: "declaracion_discrepancia",
    order: 5,
    name: "Declaración de Discrepancia",
    description: "Creación de NC por discrepancia documental detectada",
    isConditional: true,
  },
  {
    key: "subsanacion_discrepancia",
    order: 6,
    name: "Subsanación de Discrepancia",
    description: "Resolución de la discrepancia documental detectada",
    isConditional: true,
  },
  {
    key: "retiro_docs_banco",
    order: 7,
    name: "Retiro de Documentos desde Banco",
    description: "Finanzas gestiona el retiro de documentos del banco y los envía a COMEX",
    requiredDepartment: ["finanzas"],
  },
  {
    key: "preparacion_set_documental",
    order: 8,
    name: "Preparación de Set Documental",
    description: "COMEX prepara el set de documentos para el agente de aduanas",
    requiredDepartment: ["comex"],
  },
  {
    key: "solicitud_pago_internacion",
    order: 9,
    name: "Solicitud de Pago de Internación",
    description: "COMEX carga documentos de internación y registra el monto a pagar",
    requiredDepartment: ["comex"],
  },
  {
    key: "gestion_pago_internacion",
    order: 10,
    name: "Gestión de Pago por Finanzas",
    description: "Finanzas revisa, ejecuta pago y sube comprobante de pago",
    requiredDepartment: ["finanzas"],
    requiredDocuments: ["comprobante_pago"],
  },
  {
    key: "confirmacion_comex",
    order: 11,
    name: "Confirmación Final por COMEX",
    description: "COMEX confirma recepción de comprobante y envío al agente de aduanas",
    requiredDepartment: ["comex"],
  },
  {
    key: "cierre_proceso",
    order: 12,
    name: "Cierre del Proceso",
    description: "COMEX cierra el proceso de documentación e internación",
    requiredDepartment: ["comex"],
  },
];

// --- Helpers ---

/** Get step definitions for a stage key */
export function getStageSteps(stageKey: string): StageStepDef[] {
  if (stageKey === "revision_contrato") return REVISION_CONTRATO_STEPS;
  if (stageKey === "gestion_pago") return GESTION_PAGO_STEPS;
  if (stageKey === "documentacion_internacion") return DOCUMENTACION_INTERNACION_STEPS;
  return [];
}

/** Get a specific step definition */
export function getStepDef(stageKey: string, stepKey: string): StageStepDef | undefined {
  return getStageSteps(stageKey).find((s) => s.key === stepKey);
}

/** Check if a step is conditional (can be skipped) */
export function isStepConditional(stageKey: string, stepKey: string): boolean {
  const step = getStepDef(stageKey, stepKey);
  return step?.isConditional ?? false;
}
