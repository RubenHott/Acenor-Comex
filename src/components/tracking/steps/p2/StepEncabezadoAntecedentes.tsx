import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, FileText, Building, Package, Download, DollarSign, Pencil } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { usePIMDocuments } from '@/hooks/usePIMDocuments';
import { usePIMItems } from '@/hooks/usePIMItems';
import { useCuentaBancariaVigente } from '@/hooks/useCuentasBancarias';
import { toast } from 'sonner';
import type { Department, UserRole } from '@/types/comex';

interface Props {
  step: StageStep;
  pimId: string;
  stageKey: string;
  pim: any;
  userId: string;
  userName: string;
  userRole?: UserRole;
  userDepartment?: Department;
}

export function StepEncabezadoAntecedentes({ step, pimId, stageKey, pim, userId, userName, userRole }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();
  const { data: documents } = usePIMDocuments(pimId);
  const { data: items } = usePIMItems(pimId);
  const proveedorId = pim?.proveedor_id;
  const { data: cuentaVigente } = useCuentaBancariaVigente(proveedorId);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const infoCard = (
    <div className="space-y-4">
      {/* PIM Info */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="py-3 px-4">
          <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            Información del PIM
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Código:</span>{' '}
              {pim?.codigo_correlativo ? (
                <>
                  <strong>{pim.codigo_correlativo}</strong>{' '}
                  <span className="text-xs text-muted-foreground">({pim?.codigo || 'N/A'})</span>
                </>
              ) : (
                <strong>{pim?.codigo || 'N/A'}</strong>
              )}
            </div>
            <div><span className="text-muted-foreground">Proveedor:</span> {pim?.proveedor_nombre || 'N/A'}</div>
            <div><span className="text-muted-foreground">Modalidad de pago:</span> {pim?.modalidad_pago || 'N/A'}</div>
            <div><span className="text-muted-foreground">Estado:</span> {pim?.estado || 'N/A'}</div>
            {pim?.monto_total_usd && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">Monto USD:</span> <strong>${Number(pim.monto_total_usd).toLocaleString('es-CL')}</strong>
              </div>
            )}
            {pim?.toneladas && (
              <div><span className="text-muted-foreground">Toneladas:</span> {Number(pim.toneladas).toLocaleString('es-CL')}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items/Products */}
      {items && items.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4">
            <h5 className="text-sm font-semibold mb-2">Productos ({items.length})</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-1.5 pr-4">Producto</th>
                    <th className="text-right py-1.5 pr-4">Cantidad</th>
                    <th className="text-right py-1.5 pr-4">Precio Unit.</th>
                    <th className="text-right py-1.5">Total USD</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-4">{item.producto_nombre || item.descripcion || 'N/A'}</td>
                      <td className="text-right py-1.5 pr-4">{item.cantidad?.toLocaleString('es-CL') || '-'}</td>
                      <td className="text-right py-1.5 pr-4">{item.precio_unitario_usd ? `$${Number(item.precio_unitario_usd).toLocaleString('es-CL')}` : '-'}</td>
                      <td className="text-right py-1.5">{item.total_usd ? `$${Number(item.total_usd).toLocaleString('es-CL')}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents — separated into current (latest version per type) and replaced (older/NC versions) */}
      {documents && documents.length > 0 && (() => {
        // Group by tipo, keep latest version per type as "vigente"
        const byType: Record<string, any[]> = {};
        for (const doc of documents) {
          if (!byType[doc.tipo]) byType[doc.tipo] = [];
          byType[doc.tipo].push(doc);
        }

        const vigentes: any[] = [];
        const reemplazados: any[] = [];

        for (const tipo of Object.keys(byType)) {
          const sorted = byType[tipo].sort((a: any, b: any) => (b.version || 1) - (a.version || 1));
          vigentes.push(sorted[0]); // latest version
          for (let i = 1; i < sorted.length; i++) {
            reemplazados.push(sorted[i]);
          }
        }

        return (
          <>
            {vigentes.length > 0 && (
              <Card>
                <CardContent className="py-3 px-4">
                  <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos Vigentes ({vigentes.length})
                  </h5>
                  <div className="space-y-1.5">
                    {vigentes.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          <span>{doc.nombre || doc.tipo}</span>
                          <Badge variant="outline" className="text-[10px]">{doc.tipo}</Badge>
                          {doc.version > 1 && <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200" variant="outline">v{doc.version} — Corregido</Badge>}
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Download className="h-3 w-3" />
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reemplazados.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="py-3 px-4">
                  <h5 className="text-sm font-semibold mb-2 flex items-center gap-2 text-orange-700">
                    <FileText className="h-4 w-4" />
                    Documentos Reemplazados por NC ({reemplazados.length})
                  </h5>
                  <div className="space-y-1.5">
                    {reemplazados.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0 opacity-60">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-orange-400" />
                          <span className="line-through">{doc.nombre || doc.tipo}</span>
                          <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">{doc.tipo}</Badge>
                          {doc.version && <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-500">v{doc.version}</Badge>}
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-orange-500 hover:underline">
                          <Download className="h-3 w-3" />
                          Ver original
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        );
      })()}

      {/* Bank Account */}
      {cuentaVigente && (
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="py-3 px-4">
            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Building className="h-4 w-4 text-green-600" />
              Cuenta Bancaria del Proveedor
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
              <div><span className="text-muted-foreground">Banco:</span> {cuentaVigente.banco}</div>
              <div><span className="text-muted-foreground">Cuenta:</span> {cuentaVigente.numero_cuenta}</div>
              <div><span className="text-muted-foreground">Moneda:</span> {cuentaVigente.moneda}</div>
              {cuentaVigente.swift_code && <div><span className="text-muted-foreground">SWIFT:</span> {cuentaVigente.swift_code}</div>}
              {cuentaVigente.iban && <div><span className="text-muted-foreground">IBAN:</span> {cuentaVigente.iban}</div>}
              {cuentaVigente.titular && <div><span className="text-muted-foreground">Titular:</span> {cuentaVigente.titular}</div>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Antecedentes revisados por Finanzas</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        {infoCard}
      </div>
    );
  }

  const handleComplete = () => {
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'encabezado_antecedentes',
        stepName: 'Encabezado / Antecedentes',
        userId,
        userName,
      },
      {
        onSuccess: () => {
          toast.success('Antecedentes revisados. Continúa con la revisión financiera.');
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Modo edición (Admin)</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {infoCard}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleComplete}
          disabled={completeStep.isPending}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {completeStep.isPending ? 'Completando...' : 'Enterado / Continuar'}
        </Button>
      </div>
    </div>
  );
}
