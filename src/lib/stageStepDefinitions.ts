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
    name: "Contrato Firmado",
    description: "Carga del contrato firmado",
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

// --- Helpers ---

/** Get step definitions for a stage key */
export function getStageSteps(stageKey: string): StageStepDef[] {
  if (stageKey === "revision_contrato") return REVISION_CONTRATO_STEPS;
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
