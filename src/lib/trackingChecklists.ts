import {
  FileSearch,
  PenTool,
  CreditCard,
  Ship,
  Truck,
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

// --- 6 Stages based on BPMN ---

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
    key: "firma_contrato",
    name: "Firma de Contrato",
    icon: PenTool,
    color: "#8B5CF6",
    description: "Firma por Gerencia y envio al proveedor",
    departments: ["comex", "gerencia"],
    primaryDepartment: "comex",
    checklist: [
      { id: "fc1", text: "Contrato enviado a Gerencia para firma", critical: true, department: "comex" },
      { id: "fc2", text: "Contrato firmado por Gerencia", critical: true, department: "gerencia" },
      { id: "fc3", text: "Contrato firmado enviado al proveedor", critical: true, department: "comex" },
      { id: "fc4", text: "Confirmacion de recepcion por proveedor", critical: false, department: "comex" },
    ],
    requiredDocuments: ["contrato"],
    ncBlocks: true,
    slaDefaultDays: 3,
  },
  {
    key: "gestion_financiera",
    name: "Gestion Financiera",
    icon: CreditCard,
    color: "#F59E0B",
    description: "Pago, carta de credito o anticipo segun modalidad",
    departments: ["finanzas", "gerencia"],
    primaryDepartment: "finanzas",
    checklist: [
      // Common
      { id: "gf1", text: "Modalidad de pago confirmada", critical: true, department: "finanzas" },

      // Carta de Credito
      {
        id: "gf_lc1",
        text: "Solicitud de L/C preparada (Excel con datos)",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc2",
        text: "Documentacion enviada a Tesoreria",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc3",
        text: "Cotizaciones bancarias recibidas",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc4",
        text: "Cuadro comparativo elaborado y banco seleccionado",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc5",
        text: "Documentos bancarios llenados",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc6",
        text: "Firmas de Gerencia obtenidas en docs bancarios",
        critical: true,
        department: "gerencia",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc7",
        text: "Banco valida L/C y genera SWIFT",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc8",
        text: "SWIFT recibido por COMEX",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },

      // Pago al Contado
      {
        id: "gf_pc1",
        text: "Entrada PIM creada y montos revisados vs contrato",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc2",
        text: "Archivo TXT de pago generado",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc3",
        text: "TXT cargado en plataforma bancaria",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc4",
        text: "Detalle enviado a Gerencia para autorizacion",
        critical: true,
        department: "gerencia",
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc5",
        text: "Pago autorizado y ejecutado",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },

      // Anticipo + Saldo
      {
        id: "gf_ant1",
        text: "Anticipo: monto calculado segun % contrato",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },
      {
        id: "gf_ant2",
        text: "Anticipo: pago ejecutado y SWIFT/comprobante recibido",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },
      {
        id: "gf_ant3",
        text: "Saldo: monto restante calculado",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },
      {
        id: "gf_ant4",
        text: "Saldo: pago ejecutado",
        critical: true,
        department: "finanzas",
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },

      // Common final
      { id: "gf_end", text: "Confirmacion de pago/SWIFT recibida por proveedor", critical: false, department: "finanzas" },
    ],
    requiredDocuments: ["swift"], // dynamically overridden for pago_contado
    ncBlocks: true,
    slaDefaultDays: 10,
  },
  {
    key: "documentacion_embarque",
    name: "Documentacion de Embarque",
    icon: Ship,
    color: "#3B82F6",
    description: "Recepcion, consolidacion y envio de documentos de embarque",
    departments: ["comex"],
    primaryDepartment: "comex",
    checklist: [
      { id: "de1", text: "Proveedor envio copia digital de docs de embarque", critical: true, department: "comex" },
      { id: "de2", text: "Numero de tracking de courier recibido", critical: false, department: "comex" },
      { id: "de3", text: "Documentacion consolidada vs contrato", critical: true, department: "comex" },
      {
        id: "de4",
        text: "Set de documentos enviado al banco",
        critical: true,
        department: "comex",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "de5",
        text: "Banco revisa documentos sin observaciones",
        critical: true,
        department: "comex",
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      { id: "de6", text: "Sin discrepancias documentales (o enmienda gestionada)", critical: true, department: "comex" },
    ],
    requiredDocuments: ["factura", "bl", "packing_list"],
    ncBlocks: true,
    slaDefaultDays: 15,
  },
  {
    key: "internacion_aduana",
    name: "Internacion y Aduana",
    icon: Truck,
    color: "#EC4899",
    description: "Retiro de documentos, pago de internacion, liberacion de carga",
    departments: ["comex", "finanzas"],
    primaryDepartment: "comex",
    checklist: [
      { id: "ia1", text: "Documentacion en banco nacional para retiro", critical: true, department: "comex" },
      { id: "ia2", text: "Solicitud de retiro enviada a agente de aduanas", critical: true, department: "comex" },
      { id: "ia3", text: "Solicitud de pago de internacion enviada a Finanzas", critical: true, department: "comex" },
      { id: "ia4", text: "Pago de internacion realizado por Finanzas", critical: true, department: "finanzas" },
      { id: "ia5", text: "Comprobante de pago enviado al agente de aduanas", critical: true, department: "comex" },
      { id: "ia6", text: "Alzamiento validado y firmado", critical: false, department: "comex" },
      { id: "ia7", text: "Documentos retirados del banco", critical: true, department: "finanzas" },
      { id: "ia8", text: "Carga liberada y en transito a bodega", critical: true, department: "comex" },
    ],
    requiredDocuments: ["comprobante_pago", "dus"],
    ncBlocks: true,
    slaDefaultDays: 7,
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
  // Special case: gestion_financiera depends on payment modality
  if (stageKey === "gestion_financiera") {
    if (modalidadPago === "carta_credito") return ["swift"];
    return ["comprobante_pago"];
  }
  return stage.requiredDocuments;
}

export function getAllChecklistItems(): {
  stageKey: string;
  items: ChecklistItemDef[];
}[] {
  return TRACKING_STAGES.map((s) => ({ stageKey: s.key, items: s.checklist }));
}
