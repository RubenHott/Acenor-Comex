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
}

// --- 6 Stages based on BPMN ---

export const TRACKING_STAGES: StageDef[] = [
  {
    key: "revision_contrato",
    name: "Revisión de Contrato",
    icon: FileSearch,
    color: "#6366F1",
    description: "Revisión, comparación y validación del contrato vs cierre de compra",
    departments: ["comex"],
    primaryDepartment: "comex",
    checklist: [
      { id: "rc1", text: "Contrato recibido del proveedor", critical: true },
      { id: "rc2", text: "Comparado contra Cierre de Compra", critical: true },
      { id: "rc3", text: "Nombre y datos del proveedor verificados", critical: true },
      { id: "rc4", text: "Tipo, calidad, cantidad y precio validados", critical: true },
      { id: "rc5", text: "Incoterms y puerto de embarque/destino confirmados", critical: true },
      { id: "rc6", text: "Condiciones de pago validadas", critical: true },
      { id: "rc7", text: "Fechas de embarque y tolerancias confirmadas", critical: true },
      { id: "rc8", text: "Requisitos documentales definidos", critical: false },
      { id: "rc9", text: "Cláusulas legales y de garantía revisadas", critical: false },
      {
        id: "rc10",
        text: "Datos bancarios verificados (doble check si nuevo proveedor)",
        critical: true,
      },
    ],
    requiredDocuments: ["contrato", "cierre_compra"],
    ncBlocks: true,
    slaDefaultDays: 5,
  },
  {
    key: "firma_contrato",
    name: "Firma de Contrato",
    icon: PenTool,
    color: "#8B5CF6",
    description: "Firma por Gerencia y envío al proveedor",
    departments: ["comex", "gerencia"],
    primaryDepartment: "comex",
    checklist: [
      { id: "fc1", text: "Contrato enviado a Gerencia para firma", critical: true },
      { id: "fc2", text: "Contrato firmado por Gerencia", critical: true },
      { id: "fc3", text: "Contrato firmado enviado al proveedor", critical: true },
      { id: "fc4", text: "Confirmación de recepción por proveedor", critical: false },
    ],
    requiredDocuments: ["contrato"],
    ncBlocks: true,
    slaDefaultDays: 3,
  },
  {
    key: "gestion_financiera",
    name: "Gestión Financiera",
    icon: CreditCard,
    color: "#F59E0B",
    description: "Pago, carta de crédito o anticipo según modalidad",
    departments: ["comex", "finanzas", "gerencia"],
    primaryDepartment: "comex",
    checklist: [
      // Common
      { id: "gf1", text: "Modalidad de pago confirmada", critical: true },

      // Carta de Crédito
      {
        id: "gf_lc1",
        text: "Solicitud de L/C preparada (Excel con datos)",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc2",
        text: "Documentación enviada a Tesorería",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc3",
        text: "Cotizaciones bancarias recibidas",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc4",
        text: "Cuadro comparativo elaborado y banco seleccionado",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc5",
        text: "Documentos bancarios llenados",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc6",
        text: "Firmas de Gerencia obtenidas en docs bancarios",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc7",
        text: "Banco valida L/C y genera SWIFT",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "gf_lc8",
        text: "SWIFT recibido por COMEX",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },

      // Pago al Contado
      {
        id: "gf_pc1",
        text: "Entrada PIM creada y montos revisados vs contrato",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc2",
        text: "Archivo TXT de pago generado",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc3",
        text: "TXT cargado en plataforma bancaria",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc4",
        text: "Detalle enviado a Gerencia para autorización",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },
      {
        id: "gf_pc5",
        text: "Pago autorizado y ejecutado",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["pago_contado"] },
      },

      // Anticipo + Saldo
      {
        id: "gf_ant1",
        text: "Anticipo: monto calculado según % contrato",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },
      {
        id: "gf_ant2",
        text: "Anticipo: pago ejecutado y SWIFT/comprobante recibido",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },
      {
        id: "gf_ant3",
        text: "Saldo: monto restante calculado",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },
      {
        id: "gf_ant4",
        text: "Saldo: pago ejecutado",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["anticipo"] },
      },

      // Common final
      { id: "gf_end", text: "Confirmación de pago/SWIFT recibida por proveedor", critical: false },
    ],
    requiredDocuments: ["swift"], // dynamically overridden for pago_contado
    ncBlocks: true,
    slaDefaultDays: 10,
  },
  {
    key: "documentacion_embarque",
    name: "Documentación de Embarque",
    icon: Ship,
    color: "#3B82F6",
    description: "Recepción, consolidación y envío de documentos de embarque",
    departments: ["comex"],
    primaryDepartment: "comex",
    checklist: [
      { id: "de1", text: "Proveedor envió copia digital de docs de embarque", critical: true },
      { id: "de2", text: "Número de tracking de courier recibido", critical: false },
      { id: "de3", text: "Documentación consolidada vs contrato", critical: true },
      {
        id: "de4",
        text: "Set de documentos enviado al banco",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      {
        id: "de5",
        text: "Banco revisa documentos sin observaciones",
        critical: true,
        conditionalOn: { field: "modalidad_pago", values: ["carta_credito"] },
      },
      { id: "de6", text: "Sin discrepancias documentales (o enmienda gestionada)", critical: true },
    ],
    requiredDocuments: ["factura", "bl", "packing_list"],
    ncBlocks: true,
    slaDefaultDays: 15,
  },
  {
    key: "internacion_aduana",
    name: "Internación y Aduana",
    icon: Truck,
    color: "#EC4899",
    description: "Retiro de documentos, pago de internación, liberación de carga",
    departments: ["comex", "finanzas"],
    primaryDepartment: "comex",
    checklist: [
      { id: "ia1", text: "Documentación en banco nacional para retiro", critical: true },
      { id: "ia2", text: "Solicitud de retiro enviada a agente de aduanas", critical: true },
      { id: "ia3", text: "Solicitud de pago de internación enviada a Finanzas", critical: true },
      { id: "ia4", text: "Pago de internación realizado por Finanzas", critical: true },
      { id: "ia5", text: "Comprobante de pago enviado al agente de aduanas", critical: true },
      { id: "ia6", text: "Alzamiento validado y firmado", critical: false },
      { id: "ia7", text: "Documentos retirados del banco", critical: true },
      { id: "ia8", text: "Carga liberada y en tránsito a bodega", critical: true },
    ],
    requiredDocuments: ["comprobante_pago", "dus"],
    ncBlocks: true,
    slaDefaultDays: 7,
  },
  {
    key: "recepcion_costeo",
    name: "Recepción y Costeo",
    icon: CheckCircle,
    color: "#10B981",
    description: "Recepción en bodega, costeo, validación y cierre",
    departments: ["comex", "finanzas", "gerencia"],
    primaryDepartment: "comex",
    checklist: [
      { id: "rx1", text: "Mercancía recibida en bodega", critical: true },
      { id: "rx2", text: "Costeo de productos realizado", critical: true },
      { id: "rx3", text: "Cantidades y valores validados contra documentos", critical: true },
      { id: "rx4", text: "Costeo aprobado por Gerencia/Finanzas", critical: true },
      { id: "rx5", text: "Recepción ingresada al sistema (ERP)", critical: true },
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
