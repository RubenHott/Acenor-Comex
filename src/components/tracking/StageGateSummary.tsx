import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, AlertTriangle, ShieldCheck, ShieldX } from 'lucide-react';
import { type CanAdvanceResult, type StageBlocker } from '@/hooks/usePIMTracking';
import { cn } from '@/lib/utils';

interface Props {
  canAdvanceResult?: CanAdvanceResult;
  isLoading?: boolean;
  criticalCompleted: number;
  criticalTotal: number;
  docsUploaded: number;
  docsRequired: number;
  missingDocs?: string[];
  openNCs: number;
}

export function StageGateSummary({
  canAdvanceResult,
  isLoading,
  criticalCompleted,
  criticalTotal,
  docsUploaded,
  docsRequired,
  missingDocs = [],
  openNCs,
}: Props) {
  if (isLoading) return null;

  const canAdvance = canAdvanceResult?.canAdvance ?? false;
  const allCriticalDone = criticalCompleted === criticalTotal && criticalTotal > 0;
  const allDocsDone = docsRequired === 0 || docsUploaded >= docsRequired;
  const noOpenNCs = openNCs === 0;

  return (
    <Card className={cn(
      'border-2',
      canAdvance ? 'border-green-500/30 bg-green-50/50' : 'border-destructive/20 bg-destructive/5'
    )}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {canAdvance ? (
              <>
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Listo para avanzar</span>
              </>
            ) : (
              <>
                <ShieldX className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Bloqueado</span>
              </>
            )}
          </div>
          {!canAdvance && canAdvanceResult && (
            <Badge variant="destructive" className="text-xs">
              {canAdvanceResult.blockers.length} problema{canAdvanceResult.blockers.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          {/* Checklist */}
          <div className="flex items-center gap-1.5">
            {allCriticalDone ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span className={allCriticalDone ? 'text-green-700' : 'text-destructive'}>
              Checklist: {criticalCompleted}/{criticalTotal}
            </span>
          </div>

          {/* Documents */}
          <div className="flex items-center gap-1.5">
            {allDocsDone ? (
              <FileText className="h-3.5 w-3.5 text-green-600 shrink-0" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span className={allDocsDone ? 'text-green-700' : 'text-destructive'}>
              Docs: {docsUploaded}/{docsRequired}
            </span>
          </div>

          {/* NCs */}
          <div className="flex items-center gap-1.5">
            {noOpenNCs ? (
              <AlertTriangle className="h-3.5 w-3.5 text-green-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span className={noOpenNCs ? 'text-green-700' : 'text-destructive'}>
              NC: {openNCs} abierta{openNCs !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {missingDocs.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Docs faltantes: {missingDocs.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
