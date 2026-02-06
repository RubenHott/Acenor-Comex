import { FileText, CreditCard, Ship, Truck, CheckCircle, type LucideIcon } from "lucide-react";

export interface ChecklistItemDef {
  id: string;
  text: string;
  critical: boolean;
}

export interface StageDef {
  key: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  checklist: ChecklistItemDef[];
}

export const TRACKING_STAGES: StageDef[] = [
  {
    key: "contrato",
    name: "Contrato",
    icon: FileText,
    color: "#6366F1",
    description: "Revisión, validación y firma",
    checklist: [
      { id: "c1", text: "Contrato recibido del proveedor", critical: true },
      { id: "c2", text: "Datos del proveedor verificados", critical: true },
      { id: "c3", text: "Precios, cantidades e Incoterm validados", critical: true },
      { id: "c4", text: "Condiciones de pago confirmadas", critical: true },
      { id: "c5", text: "Datos bancarios verificados (doble check si es nuevo)", critical: true },
      { id: "c6", text: "Contrato firmado por Gerencia", critical: true },
      { id: "c7", text: "Contrato enviado al proveedor", critical: false },
    ],
  },
  {
    key: "financiero",
    name: "Financiero",
    icon: CreditCard,
    color: "#F59E0B",
    description: "Pago, carta de crédito o anticipo",
    checklist: [
      { id: "f1", text: "Modalidad de pago definida", critical: true },
      { id: "f2", text: "Documentación enviada a Tesorería", critical: true },
      { id: "f3", text: "Cotización bancaria realizada (si aplica L/C)", critical: false },
      { id: "f4", text: "Banco seleccionado y documentos llenados", critical: false },
      { id: "f5", text: "Firmas obtenidas", critical: true },
      { id: "f6", text: "Swift emitido / Pago ejecutado", critical: true },
      { id: "f7", text: "Confirmación de recepción por proveedor", critical: false },
    ],
  },
  {
    key: "embarque",
    name: "Embarque",
    icon: Ship,
    color: "#3B82F6",
    description: "Documentación y despacho",
    checklist: [
      { id: "e1", text: "Proveedor confirma fecha de embarque", critical: true },
      { id: "e2", text: "Documentos de embarque recibidos (Invoice, BL, PL)", critical: true },
      { id: "e3", text: "Montos validados contra contrato", critical: true },
      { id: "e4", text: "Set de documentos armado", critical: false },
      { id: "e5", text: "Documentos enviados a banco (si L/C)", critical: false },
      { id: "e6", text: "Sin discrepancias / Enmienda gestionada", critical: true },
    ],
  },
  {
    key: "internacion",
    name: "Internación",
    icon: Truck,
    color: "#EC4899",
    description: "Aduana, retiro y transporte",
    checklist: [
      { id: "i1", text: "Documentos retirados del banco", critical: true },
      { id: "i2", text: "Agente de aduanas notificado", critical: true },
      { id: "i3", text: "Pago de internación realizado", critical: true },
      { id: "i4", text: "Comprobante enviado al agente", critical: false },
      { id: "i5", text: "Alzamiento firmado (si aplica)", critical: false },
      { id: "i6", text: "Carga liberada y en tránsito a bodega", critical: true },
    ],
  },
  {
    key: "recepcion",
    name: "Recepción",
    icon: CheckCircle,
    color: "#10B981",
    description: "Costeo, validación y cierre",
    checklist: [
      { id: "r1", text: "Mercancía recibida en bodega", critical: true },
      { id: "r2", text: "Costeo de productos realizado", critical: true },
      { id: "r3", text: "Cantidades y valores validados", critical: true },
      { id: "r4", text: "Costeo aprobado por supervisión", critical: true },
      { id: "r5", text: "Recepción ingresada al sistema (ERP)", critical: true },
    ],
  },
];

export function getStageByKey(key: string): StageDef | undefined {
  return TRACKING_STAGES.find((s) => s.key === key);
}

export function getAllChecklistItems(): { stageKey: string; items: ChecklistItemDef[] }[] {
  return TRACKING_STAGES.map((s) => ({ stageKey: s.key, items: s.checklist }));
}
