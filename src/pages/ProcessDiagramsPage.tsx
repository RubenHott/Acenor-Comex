import { Header } from '@/components/layout/Header';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Banknote, ArrowUpFromLine } from 'lucide-react';

// ============================================================
// Diagrams per process, parameterized by payment mode
// ============================================================

function diagramP1(includeLC: boolean): string {
  if (includeLC) {
    return `flowchart TD
    S((Inicio)) --> A["1. Recepcion Cierre de Compra\\nCOMEX"]
    A --> B["2. Recepcion de Contrato\\nCOMEX"]
    B --> C{"3. Declaracion NC\\nCOMEX / Gerencia"}
    C -->|Sin NC| F["6. Contrato Firmado\\nCOMEX"]
    C -->|Con NC| D["4. Subsanacion de NC\\nArea asignada"]
    D --> E{"5. Revision COMEX"}
    E -->|Conforme| F
    E -->|Rechazado| D
    F --> G["7. Validacion Cuenta Bancaria\\nCOMEX"]
    G --> GD{"Cuenta nueva?"}
    GD -->|Si, nueva| H["8. Aprobacion Gerencia\\nGERENCIA"]
    GD -->|No, existente| I["9. Borrador Carta de Credito\\nCOMEX"]
    H --> I
    I --> J["10. Cierre del Proceso\\nCOMEX"]
    J --> Z((Fin P1))
    style A fill:#6366F1,color:#fff
    style B fill:#6366F1,color:#fff
    style F fill:#6366F1,color:#fff
    style G fill:#6366F1,color:#fff
    style J fill:#6366F1,color:#fff
    style H fill:#F59E0B,color:#fff
    style D fill:#FEF3C7,color:#92400E
    style I fill:#93C5FD,color:#1E3A5F`;
  }
  return `flowchart TD
    S((Inicio)) --> A["1. Recepcion Cierre de Compra\\nCOMEX"]
    A --> B["2. Recepcion de Contrato\\nCOMEX"]
    B --> C{"3. Declaracion NC\\nCOMEX / Gerencia"}
    C -->|Sin NC| F["6. Contrato Firmado\\nCOMEX"]
    C -->|Con NC| D["4. Subsanacion de NC\\nArea asignada"]
    D --> E{"5. Revision COMEX"}
    E -->|Conforme| F
    E -->|Rechazado| D
    F --> G["7. Validacion Cuenta Bancaria\\nCOMEX"]
    G --> GD{"Cuenta nueva?"}
    GD -->|Si, nueva| H["8. Aprobacion Gerencia\\nGERENCIA"]
    GD -->|No, existente| J["9. Cierre del Proceso\\nCOMEX"]
    H --> J
    J --> Z((Fin P1))
    style A fill:#6366F1,color:#fff
    style B fill:#6366F1,color:#fff
    style F fill:#6366F1,color:#fff
    style G fill:#6366F1,color:#fff
    style J fill:#6366F1,color:#fff
    style H fill:#F59E0B,color:#fff
    style D fill:#FEF3C7,color:#92400E`;
}

function diagramP2(includeBank: boolean): string {
  if (includeBank) {
    return `flowchart TD
    S((Inicio)) --> A["1. Encabezado / Antecedentes\\nFINANZAS"]
    A --> B{"2. Revision Financiera\\nFINANZAS"}
    B -->|Conforme| F["6. Registro Banco y Tasa\\nFINANZAS"]
    B -->|Con NC| C["3. Declaracion NC\\nFINANZAS"]
    C --> D["4. Subsanacion NC\\nArea asignada"]
    D --> E{"5. Revision Finanzas"}
    E -->|Conforme| F
    E -->|Rechazado| D
    F --> G["7. Solicitud de Firma\\nFINANZAS"]
    G --> H["8. Recepcion de Swift\\nFINANZAS"]
    H --> I["9. Gestion COMEX\\nCOMEX"]
    I --> J["10. Cierre del Proceso\\nFINANZAS"]
    J --> Z((Fin P2))
    style A fill:#8B5CF6,color:#fff
    style G fill:#8B5CF6,color:#fff
    style H fill:#8B5CF6,color:#fff
    style J fill:#8B5CF6,color:#fff
    style I fill:#6366F1,color:#fff
    style D fill:#FEF3C7,color:#92400E
    style F fill:#93C5FD,color:#1E3A5F`;
  }
  return `flowchart TD
    S((Inicio)) --> A["1. Encabezado / Antecedentes\\nFINANZAS"]
    A --> B{"2. Revision Financiera\\nFINANZAS"}
    B -->|Conforme| G["6. Solicitud de Firma\\nFINANZAS"]
    B -->|Con NC| C["3. Declaracion NC\\nFINANZAS"]
    C --> D["4. Subsanacion NC\\nArea asignada"]
    D --> E{"5. Revision Finanzas"}
    E -->|Conforme| G
    E -->|Rechazado| D
    G --> H["7. Recepcion de Swift\\nFINANZAS"]
    H --> I["8. Gestion COMEX\\nCOMEX"]
    I --> J["9. Cierre del Proceso\\nFINANZAS"]
    J --> Z((Fin P2))
    style A fill:#8B5CF6,color:#fff
    style G fill:#8B5CF6,color:#fff
    style H fill:#8B5CF6,color:#fff
    style J fill:#8B5CF6,color:#fff
    style I fill:#6366F1,color:#fff
    style D fill:#FEF3C7,color:#92400E`;
}

function diagramP3(includeRetiro: boolean): string {
  if (includeRetiro) {
    return `flowchart TD
    S((Inicio)) --> A["1. Recepcion Docs Digitales\\nCOMEX"]
    A --> B["2. Registro DHL\\nCOMEX"]
    B --> C["3. Seguimiento Docs Fisicos\\nFINANZAS"]
    C --> D{"4. Revision Documental\\nCOMEX / FINANZAS"}
    D -->|Conforme| H["7. Retiro Docs desde Banco\\nFINANZAS"]
    D -->|Discrepancia| E["5. Declaracion Discrepancia"]
    E --> F["6. Subsanacion Discrepancia"]
    F --> H
    H --> I["8. Preparacion Set Documental\\nCOMEX"]
    I --> J["9. Solicitud Pago Internacion\\nCOMEX"]
    J --> K["10. Gestion Pago Finanzas\\nFINANZAS"]
    K --> L["11. Confirmacion Final\\nCOMEX"]
    L --> M["12. Cierre del Proceso\\nCOMEX"]
    M --> Z((Fin P3))
    style A fill:#6366F1,color:#fff
    style B fill:#6366F1,color:#fff
    style I fill:#6366F1,color:#fff
    style J fill:#6366F1,color:#fff
    style L fill:#6366F1,color:#fff
    style M fill:#6366F1,color:#fff
    style C fill:#8B5CF6,color:#fff
    style K fill:#8B5CF6,color:#fff
    style E fill:#FEF3C7,color:#92400E
    style F fill:#FEF3C7,color:#92400E
    style H fill:#93C5FD,color:#1E3A5F`;
  }
  return `flowchart TD
    S((Inicio)) --> A["1. Recepcion Docs Digitales\\nCOMEX"]
    A --> B["2. Registro DHL\\nCOMEX"]
    B --> C["3. Seguimiento Docs Fisicos\\nFINANZAS"]
    C --> D{"4. Revision Documental\\nCOMEX / FINANZAS"}
    D -->|Conforme| I["7. Preparacion Set Documental\\nCOMEX"]
    D -->|Discrepancia| E["5. Declaracion Discrepancia"]
    E --> F["6. Subsanacion Discrepancia"]
    F --> I
    I --> J["8. Solicitud Pago Internacion\\nCOMEX"]
    J --> K["9. Gestion Pago Finanzas\\nFINANZAS"]
    K --> L["10. Confirmacion Final\\nCOMEX"]
    L --> M["11. Cierre del Proceso\\nCOMEX"]
    M --> Z((Fin P3))
    style A fill:#6366F1,color:#fff
    style B fill:#6366F1,color:#fff
    style I fill:#6366F1,color:#fff
    style J fill:#6366F1,color:#fff
    style L fill:#6366F1,color:#fff
    style M fill:#6366F1,color:#fff
    style C fill:#8B5CF6,color:#fff
    style K fill:#8B5CF6,color:#fff
    style E fill:#FEF3C7,color:#92400E
    style F fill:#FEF3C7,color:#92400E`;
}

const DIAGRAM_P4 = `flowchart TD
    S((Inicio)) --> A["1. Citacion de Carga\\nCOMEX"]
    A --> B["2. Costeo de Productos\\nCOMEX"]
    B --> C{"3. Validacion Costeo\\nFINANZAS"}
    C -->|Conforme| G["7. Recepcion en Sistema\\nCOMEX"]
    C -->|Con NC| D["4. Declaracion NC Costeo\\nFINANZAS"]
    D --> E["5. Subsanacion NC Costeo\\nCOMEX"]
    E --> F{"6. Revision Finanzas"}
    F -->|Conforme| G
    F -->|Rechazado| E
    G --> H["8. Cierre del Proceso\\nCOMEX"]
    H --> Z((PIM Completado))
    style A fill:#6366F1,color:#fff
    style B fill:#6366F1,color:#fff
    style G fill:#6366F1,color:#fff
    style H fill:#6366F1,color:#fff
    style E fill:#FEF3C7,color:#92400E
    style D fill:#8B5CF6,color:#fff`;

// ============================================================
// Tab definitions — one per payment modality
// ============================================================

const PAYMENT_TABS = [
  {
    key: 'carta_credito',
    label: 'Carta de Crédito',
    icon: CreditCard,
    color: '#3B82F6',
    description: 'Flujo completo con apertura de carta de crédito, registro banco/tasa y retiro de documentos desde el banco.',
    steps: '40 pasos (10 + 10 + 12 + 8)',
    includeLC: true,
    includeBank: true,
    includeRetiro: true,
  },
  {
    key: 'pago_contado',
    label: 'Pago al Contado',
    icon: Banknote,
    color: '#10B981',
    description: 'Sin carta de crédito, sin registro banco/tasa, documentos llegan directo del proveedor (sin retiro banco).',
    steps: '37 pasos (9 + 9 + 11 + 8)',
    includeLC: false,
    includeBank: false,
    includeRetiro: false,
  },
  {
    key: 'anticipo',
    label: 'Anticipo + Saldo',
    icon: ArrowUpFromLine,
    color: '#F59E0B',
    description: 'Pago anticipado parcial al proveedor. Sin carta de crédito, sin registro banco/tasa, documentos directo del proveedor.',
    steps: '37 pasos (9 + 9 + 11 + 8)',
    includeLC: false,
    includeBank: false,
    includeRetiro: false,
  },
];

// ============================================================
// Process section titles
// ============================================================

const PROCESS_SECTIONS = [
  { key: 'p1', title: 'Proceso 1 — Revisión de Contrato', color: '#6366F1' },
  { key: 'p2', title: 'Proceso 2 — Gestión Financiera de Pago', color: '#8B5CF6' },
  { key: 'p3', title: 'Proceso 3 — Documentación e Internación', color: '#F59E0B' },
  { key: 'p4', title: 'Proceso 4 — Recepción y Costeo', color: '#10B981' },
];

// ============================================================
// Component
// ============================================================

export default function ProcessDiagramsPage() {
  return (
    <div className="min-h-screen bg-background page-enter">
      <Header
        title="Flujo de Procesos"
        subtitle="Diagramas BPMN de los 4 procesos de importación según modalidad de pago"
      />

      <div className="p-4 md:p-6 space-y-5">
        {/* Legend */}
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">Leyenda de colores</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded" style={{ backgroundColor: '#6366F1' }} />
              <span>COMEX</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded" style={{ backgroundColor: '#8B5CF6' }} />
              <span>Finanzas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded" style={{ backgroundColor: '#F59E0B' }} />
              <span>Gerencia (solo si cuenta bancaria es nueva)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded border" style={{ backgroundColor: '#FEF3C7', borderColor: '#D97706' }} />
              <span>Condicional (NC / Discrepancia)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded" style={{ backgroundColor: '#93C5FD' }} />
              <span>Exclusivo Carta de Crédito</span>
            </div>
          </div>
        </div>

        {/* 3 tabs by payment type */}
        <Tabs defaultValue="carta_credito">
          <TabsList className="w-full justify-start h-auto gap-1 bg-muted/50 p-1">
            {PAYMENT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex items-center gap-2 text-sm data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {PAYMENT_TABS.map((tab) => {
            const diagrams = [
              diagramP1(tab.includeLC),
              diagramP2(tab.includeBank),
              diagramP3(tab.includeRetiro),
              DIAGRAM_P4,
            ];

            return (
              <TabsContent key={tab.key} value={tab.key} className="mt-4 space-y-4">
                {/* Summary card */}
                <div
                  className="rounded-xl border p-4 flex items-start gap-4"
                  style={{ borderColor: `${tab.color}40`, backgroundColor: `${tab.color}08` }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${tab.color}20` }}>
                    <tab.icon className="h-6 w-6" style={{ color: tab.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{tab.label}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{tab.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{tab.steps}</p>
                  </div>
                </div>

                {/* 4 process diagrams stacked */}
                {PROCESS_SECTIONS.map((proc, idx) => (
                  <div key={proc.key} className="rounded-xl border bg-card overflow-hidden">
                    <div
                      className="px-4 py-3 border-b flex items-center gap-2"
                      style={{ backgroundColor: `${proc.color}08` }}
                    >
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: proc.color }} />
                      <h4 className="text-sm font-semibold">{proc.title}</h4>
                    </div>
                    <div className="p-4">
                      <MermaidDiagram
                        key={`${tab.key}-${proc.key}`}
                        code={diagrams[idx]}
                        className="min-h-[250px]"
                      />
                    </div>
                  </div>
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
