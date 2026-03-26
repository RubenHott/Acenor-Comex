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
  /** Si se define, el paso solo aplica a estas modalidades de pago */
  applicablePaymentModes?: string[];
}

// --- Step definitions for Stage 1: Revisión de Contrato ---

export const REVISION_CONTRATO_STEPS: StageStepDef[] = [
  {
    key: "recepcion_cierre_compra",
    order: 1,
    name: "Recepción de Cierre de Compra",
    description: "Carga del cierre de compra revisado por COMEX",
    requiredDepartment: ["comex"],
    requiredDocuments: ["cierre_compra"],
  },
  {
    key: "recepcion_contrato",
    order: 2,
    name: "Recepción de Contrato",
    description: "Carga del contrato revisado por COMEX",
    requiredDepartment: ["comex"],
    requiredDocuments: ["contrato"],
  },
  {
    key: "declaracion_nc",
    order: 3,
    name: "Declaración de No Conformidad",
    description: "Evaluación de conformidad entre contrato y cierre de compra",
    requiredDepartment: ["comex", "gerencia"],
  },
  {
    key: "subsanacion_nc",
    order: 4,
    name: "Subsanación de No Conformidad",
    description: "El área asignada gestiona y corrige la observación",
    isConditional: true,
  },
  {
    key: "revision_comex",
    order: 5,
    name: "Revisión COMEX",
    description: "COMEX revisa la subsanación y acepta o rechaza",
    requiredDepartment: ["comex"],
    isConditional: true,
  },
  {
    key: "contrato_firmado",
    order: 6,
    name: "Contrato Firmado y Enviado a Proveedor",
    description: "Carga del contrato firmado y enviado al proveedor",
    requiredDepartment: ["comex"],
    requiredDocuments: ["contrato_firmado"],
  },
  {
    key: "validacion_cuenta_bancaria",
    order: 7,
    name: "Validación de Cuenta Bancaria",
    description: "Selección o creación de cuenta bancaria del proveedor",
    requiredDepartment: ["comex"],
  },
  {
    key: "aprobacion_gerencia",
    order: 8,
    name: "Aprobación Gerencia",
    description: "Aprobación final de la cuenta bancaria por Gerencia",
    requiredDepartment: ["gerencia"],
  },
  {
    key: "borrador_carta_credito",
    order: 9,
    name: "Borrador Carta de Crédito",
    description: "Carga del borrador de carta de crédito por COMEX",
    requiredDepartment: ["comex"],
    applicablePaymentModes: ["carta_credito", "mixto"],
  },
  {
    key: "cierre_proceso",
    order: 10,
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
    applicablePaymentModes: ["carta_credito", "mixto"],
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

// --- Step definitions for Stage 3: Seguimiento de Documentación e Internación ---

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
    applicablePaymentModes: ["carta_credito", "mixto"],
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

// --- Step definitions for Stage 4: Recepción y Costeo ---

export const RECEPCION_COSTEO_STEPS: StageStepDef[] = [
  {
    key: "citacion_carga",
    order: 1,
    name: "Citación de Carga",
    description: "COMEX registra la citación de carga recibida del transportista",
    requiredDepartment: ["comex"],
  },
  {
    key: "costeo_productos",
    order: 2,
    name: "Costeo de Productos",
    description: "COMEX realiza el costeo de productos en sistema",
    requiredDepartment: ["comex"],
  },
  {
    key: "validacion_costeo",
    order: 3,
    name: "Validación de Costeo",
    description: "Finanzas revisa y valida el costeo: conforme o con observaciones",
    requiredDepartment: ["finanzas"],
  },
  {
    key: "declaracion_nc_costeo",
    order: 4,
    name: "Declaración de NC Costeo",
    description: "Finanzas declara la no conformidad detectada en el costeo",
    requiredDepartment: ["finanzas"],
    isConditional: true,
  },
  {
    key: "subsanacion_nc_costeo",
    order: 5,
    name: "Subsanación de NC Costeo",
    description: "COMEX corrige las observaciones del costeo",
    requiredDepartment: ["comex"],
    isConditional: true,
  },
  {
    key: "revision_finanzas_costeo",
    order: 6,
    name: "Revisión Finanzas (Costeo)",
    description: "Finanzas revisa la subsanación y acepta o rechaza",
    requiredDepartment: ["finanzas"],
    isConditional: true,
  },
  {
    key: "recepcion_sistema",
    order: 7,
    name: "Recepción en Sistema",
    description: "COMEX realiza la recepción de productos en sistema",
    requiredDepartment: ["comex"],
  },
  {
    key: "cierre_proceso",
    order: 8,
    name: "Cierre del Proceso",
    description: "COMEX cierra el proceso de recepción y costeo",
    requiredDepartment: ["comex"],
  },
];

// --- Helpers ---

/** Get step definitions for a stage key */
export function getStageSteps(stageKey: string): StageStepDef[] {
  if (stageKey === "revision_contrato") return REVISION_CONTRATO_STEPS;
  if (stageKey === "gestion_pago") return GESTION_PAGO_STEPS;
  if (stageKey === "documentacion_internacion") return DOCUMENTACION_INTERNACION_STEPS;
  if (stageKey === "recepcion_costeo") return RECEPCION_COSTEO_STEPS;
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

/** Return step keys that should be skipped based on payment modality */
export function getStepsToSkipByPaymentMode(stageKey: string, modalidadPago: string): string[] {
  return getStageSteps(stageKey)
    .filter((s) => s.applicablePaymentModes && !s.applicablePaymentModes.includes(modalidadPago))
    .map((s) => s.key);
}

const PAYMENT_MODE_LABELS: Record<string, string> = {
  carta_credito: "Carta de Crédito",
  pago_contado: "Pago al Contado",
  anticipo: "Anticipo",
  mixto: "Mixto",
};

export function getPaymentModeLabel(mode: string): string {
  return PAYMENT_MODE_LABELS[mode] || mode;
}
