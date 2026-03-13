import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  FileText,
  Download,
  Calendar,
  Building,
  Package,
  Trophy,
} from 'lucide-react';
import { usePIMDocuments, DOCUMENT_TYPES } from '@/hooks/usePIMDocuments';
import { TRACKING_STAGES } from '@/lib/trackingChecklists';
import type { TrackingStage } from '@/hooks/usePIMTracking';

interface Props {
  pimId: string;
  pim: any;
  stages: TrackingStage[];
}

function getDocTypeLabel(tipo: string): string {
  const found = DOCUMENT_TYPES.find((d) => d.value === tipo);
  return found?.label || tipo;
}

function getStageLabel(stageKey: string): string {
  const stage = TRACKING_STAGES.find((s) => s.key === stageKey);
  return stage?.name || stageKey;
}

export function PIMCompletedSummary({ pimId, pim, stages }: Props) {
  const { data: allDocs } = usePIMDocuments(pimId);

  // Group documents by stage_key
  const docsByStage = (allDocs || []).reduce<Record<string, typeof allDocs>>((acc, doc) => {
    const key = doc.stage_key || 'sin_etapa';
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(doc);
    return acc;
  }, {});

  // Get the last stage completion date
  const lastStage = stages
    .filter((s) => s.status === 'completado' && s.fecha_fin)
    .sort((a, b) => new Date(b.fecha_fin!).getTime() - new Date(a.fecha_fin!).getTime())[0];

  const fechaCierre = lastStage?.fecha_fin
    ? new Date(lastStage.fecha_fin).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-2 border-green-500/30 bg-green-50/50">
        <CardContent className="py-6 px-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Trophy className="h-7 w-7 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-green-800">PIM Completado</h2>
              <p className="text-sm text-green-700">
                Todos los procesos han sido completados exitosamente.
                {fechaCierre && <> Cerrado el {fechaCierre}.</>}
              </p>
            </div>
            <Badge className="bg-green-600 text-white text-xs px-3 py-1">Cerrado</Badge>
          </div>

          {/* PIM Info */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Codigo</span>
              <span className="font-medium">{pim.codigo}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Proveedor</span>
              <span className="font-medium">{pim.proveedor || '—'}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Modalidad</span>
              <span className="font-medium">
                {pim.modalidad_pago === 'carta_credito'
                  ? 'Carta de Credito'
                  : pim.modalidad_pago === 'pago_contado'
                    ? 'Pago Contado'
                    : pim.modalidad_pago === 'anticipo'
                      ? 'Anticipo'
                      : pim.modalidad_pago || '—'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Descripcion</span>
              <span className="font-medium">{pim.descripcion || '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Resumen de Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TRACKING_STAGES.map((def, idx) => {
              const stageData = stages.find((s) => s.stage_key === def.key);
              const Icon = def.icon;
              return (
                <div
                  key={def.key}
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 border border-green-200/50"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: def.color }} />
                      <span className="text-sm font-medium">
                        Proceso {idx + 1}: {def.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                      {stageData?.fecha_inicio && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Inicio: {new Date(stageData.fecha_inicio).toLocaleDateString('es-CL')}
                        </span>
                      )}
                      {stageData?.fecha_fin && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Cierre: {new Date(stageData.fecha_fin).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                    Completado
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos del PIM
            {allDocs && (
              <Badge variant="secondary" className="text-xs ml-1">
                {allDocs.length} documento{allDocs.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!allDocs || allDocs.length === 0) ? (
            <p className="text-sm text-muted-foreground">No se encontraron documentos.</p>
          ) : (
            <div className="space-y-5">
              {TRACKING_STAGES.map((def) => {
                const stageDocs = docsByStage[def.key];
                if (!stageDocs || stageDocs.length === 0) return null;

                return (
                  <div key={def.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <def.icon className="h-4 w-4" style={{ color: def.color }} />
                      <h4 className="text-sm font-semibold">{def.name}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {stageDocs.length}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {stageDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {getDocTypeLabel(doc.tipo)}
                              </Badge>
                              <span className="truncate">{doc.nombre}</span>
                              {doc.version > 1 && (
                                <span className="text-[10px] text-muted-foreground">v{doc.version}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {doc.subido_por}
                              {doc.fecha_subida && (
                                <> — {new Date(doc.fecha_subida).toLocaleDateString('es-CL')}</>
                              )}
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 shrink-0"
                            title="Descargar"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Documents without stage */}
              {docsByStage['sin_etapa'] && docsByStage['sin_etapa'].length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    Otros documentos
                  </h4>
                  <div className="space-y-1.5">
                    {docsByStage['sin_etapa'].map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {getDocTypeLabel(doc.tipo)}
                            </Badge>
                            <span className="truncate">{doc.nombre}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {doc.subido_por}
                            {doc.fecha_subida && (
                              <> — {new Date(doc.fecha_subida).toLocaleDateString('es-CL')}</>
                            )}
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 shrink-0"
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
