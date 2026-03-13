import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Building } from 'lucide-react';
import { usePIMDocuments, DOCUMENT_TYPES } from '@/hooks/usePIMDocuments';
import { TRACKING_STAGES } from '@/lib/trackingChecklists';

interface Props {
  pimId: string;
  pimCodigo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDocTypeLabel(tipo: string): string {
  return DOCUMENT_TYPES.find((d) => d.value === tipo)?.label || tipo;
}

export function PIMDocumentsSummaryDialog({ pimId, pimCodigo, open, onOpenChange }: Props) {
  // Only fetch when dialog is open (lazy loading)
  const { data: allDocs, isLoading } = usePIMDocuments(open ? pimId : undefined);

  // Group by stage_key
  const docsByStage = (allDocs || []).reduce<Record<string, typeof allDocs>>((acc, doc) => {
    const key = doc.stage_key || 'sin_etapa';
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(doc);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos — {pimCodigo}
            {allDocs && (
              <Badge variant="secondary" className="text-xs ml-1">
                {allDocs.length} documento{allDocs.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : !allDocs || allDocs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No se han subido documentos para este PIM.
          </div>
        ) : (
          <div className="space-y-5 py-2">
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
      </DialogContent>
    </Dialog>
  );
}
