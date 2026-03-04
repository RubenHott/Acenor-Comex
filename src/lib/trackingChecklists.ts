import {
  FileSearch,
  PenTool,
  Ship,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import type { Department } from "@/types/comex";

// --- Types ---

export type DocumentType =
  | "contrato"
  | "cierre_compra"
  | "contrato_firmado"
  | "factura"
  | "bl"
  | "packing_list"
  | "swift"
  | "comprobante_pago"
  | "certificado_calidad"
  | "certificado_origen"
  | "enmienda"
  | "costeo"
  | "acta_recepcion"
  | "dus"
  | "alzamiento"
  | "otro";

export interface ChecklistItemDef {
  id: string;
  text: string;
  critical: boolean;
  /** Department responsible for this checklist item */
  department?: Department;
  /** Only show this item when PIM has this payment modality */
  conditionalOn?: {
    field: "modalidad_pago";
    values: string[];
  };
}

export interface StageDef {
  key: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  departments: Department[];
  primaryDepartment: Department;
  checklist: ChecklistItemDef[];
  requiredDocuments: DocumentType[];
  ncBlocks: boolean;
  slaDefaultDays: number;
  /** If true, this stage uses a step-based flow instead of a checklist */
  useStepFlow?: boolean;
}

// --- 4 Stages based on BPMN ---

export const TRACKING_STAGES: StageDef[] = [
  {
    key: "revision_contrato",
    name: "Revision de Contrato",
    icon: FileSearch,
    color: "#6366F1",
    description: "Revision, comparacion y validacion del contrato vs cierre de compra",
    departments: ["comex", "gerencia"],
    primaryDepartment: "comex",
    checklist: [],
    requiredDocuments: ["contrato", "cierre_compra", "contrato_firmado"],
    ncBlocks: true,
    slaDefaultDays: 5,
    useStepFlow: true,
  },
  {
    key: "gestion_pago",
    name: "Gestión Financiera de Pago",
    icon: PenTool,
    color: "#8B5CF6",
    description: "Revisión financiera, registro bancario, firma, Swift y gestión con proveedor",
    departments: ["finanzas", "comex"],
    primaryDepartment: "finanzas",
    checklist: [],
    requiredDocuments: ["contrato_firmado", "swift"],
    ncBlocks: true,
    slaDefaultDays: 10,
    useStepFlow: true,
  },
  {
    key: "documentacion_internacion",
    name: "Seguimiento de Documentación e Internación",
    icon: Ship,
    color: "#F59E0B",
    description: "Documentación digital/física, discrepancias, retiro banco, internación y pago",
    departments: ["comex", "finanzas"],
    primaryDepartment: "comex",
    checklist: [],
    requiredDocuments: ["factura", "bl", "packing_list", "comprobante_pago"],
    ncBlocks: true,
    slaDefaultDays: 20,
    useStepFlow: true,
  },
  {
    key: "recepcion_costeo",
    name: "Recepcion y Costeo",
    icon: CheckCircle,
    color: "#10B981",
    description: "Recepcion en bodega, costeo, validacion y cierre",
    departments: ["comex", "finanzas", "gerencia"],
    primaryDepartment: "comex",
    checklist: [
      { id: "rx1", text: "Mercancia recibida en bodega", critical: true, department: "comex" },
      { id: "rx2", text: "Costeo de productos realizado", critical: true, department: "finanzas" },
      { id: "rx3", text: "Cantidades y valores validados contra documentos", critical: true, department: "finanzas" },
      { id: "rx4", text: "Costeo aprobado por Gerencia/Finanzas", critical: true, department: "gerencia" },
      { id: "rx5", text: "Recepcion ingresada al sistema (ERP)", critical: true, department: "comex" },
    ],
    requiredDocuments: ["costeo", "acta_recepcion"],
    ncBlocks: true,
    slaDefaultDays: 5,
  },
];

// --- Helper functions ---

export function getStageByKey(key: string): StageDef | undefined {
  return TRACKING_STAGES.find((s) => s.key === key);
}

/** Return checklist items filtered by payment modality */
export function getFilteredChecklist(
  stageKey: string,
  modalidadPago: string
): ChecklistItemDef[] {
  const stage = getStageByKey(stageKey);
  if (!stage) return [];
  return stage.checklist.filter((item) => {
    if (!item.conditionalOn) return true;
    return item.conditionalOn.values.includes(modalidadPago);
  });
}

/** Return checklist items filtered by payment modality AND department */
export function getFilteredChecklistByDept(
  stageKey: string,
  modalidadPago: string,
  department?: string
): ChecklistItemDef[] {
  const items = getFilteredChecklist(stageKey, modalidadPago);
  if (!department) return items;
  return items.filter((item) => !item.department || item.department === department);
}

/** Return required documents for a stage, considering payment modality */
export function getRequiredDocuments(
  stageKey: string,
  modalidadPago: string
): DocumentType[] {
  const stage = getStageByKey(stageKey);
  if (!stage) return [];
  return stage.requiredDocuments;
}

export function getAllChecklistItems(): {
  stageKey: string;
  items: ChecklistItemDef[];
}[] {
  return TRACKING_STAGES.map((s) => ({ stageKey: s.key, items: s.checklist }));
}
