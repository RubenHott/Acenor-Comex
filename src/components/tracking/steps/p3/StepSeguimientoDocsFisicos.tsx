import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Package, Pencil, Clock, Truck, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
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

const DHL_URL = (code: string) =>
  `https://www.dhl.com/cl-es/home/tracking/tracking-express.html?submit=1&tracking-id=${code}`;

const DESTINATIONS = [
  { key: 'tracking_planta', label: 'Planta', checkLabel: 'Documentos Planta recibidos' },
  { key: 'tracking_cerrillos', label: 'Cerrillos', checkLabel: 'Documentos Cerrillos recibidos' },
  { key: 'tracking_banco', label: 'Banco', checkLabel: 'Documentos Banco recibidos' },
] as const;

type DestKey = (typeof DESTINATIONS)[number]['key'];

export function StepSeguimientoDocsFisicos({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [received, setReceived] = useState<Record<string, boolean>>({});
  const [observaciones, setObservaciones] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const isFinanzas = userDepartment === 'finanzas' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  // Get tracking codes from pim or from the previous step datos
  const trackingCodes: Record<DestKey, string> = {
    tracking_planta: pim?.tracking_planta || '',
    tracking_cerrillos: pim?.tracking_cerrillos || '',
    tracking_banco: pim?.tracking_banco || '',
  };

  // Only destinations that have a tracking code
  const activeDests = DESTINATIONS.filter((d) => trackingCodes[d.key]);

  if (step.status === 'completado' && !isEditing) {
    const datos = step.datos as any;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Documentos fisicos recibidos</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>

        {/* Show confirmed destinations */}
        {DESTINATIONS.map((dest) => {
          const code = trackingCodes[dest.key];
          const wasReceived = datos?.[`recibido_${dest.key}`];
          if (!code && !wasReceived) return null;
          return (
            <div key={dest.key} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              {wasReceived ? (
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <Truck className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="text-xs font-medium text-muted-foreground">{dest.label}:</span>
              {code && <span className="text-sm font-medium font-mono">{code}</span>}
              {code && (
                <a
                  href={DHL_URL(code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  DHL
                </a>
              )}
            </div>
          );
        })}

        {datos?.observaciones && (
          <div className="p-2 bg-muted rounded-lg text-sm text-muted-foreground">
            <span className="text-xs font-medium">Observaciones:</span>
            <p>{datos.observaciones}</p>
          </div>
        )}
        {datos?.fecha_recepcion && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Recibido: {new Date(datos.fecha_recepcion).toLocaleDateString('es-CL')}
          </div>
        )}
      </div>
    );
  }

  // All applicable destinations must be marked as received to complete
  const allReceived = activeDests.length > 0
    ? activeDests.every((d) => received[d.key])
    : true; // If no tracking codes, can complete directly

  const handleComplete = async () => {
    const datos: Record<string, any> = {
      recibido: true,
      observaciones: observaciones.trim() || undefined,
      fecha_recepcion: new Date().toISOString(),
    };
    // Save per-destination receipt status
    for (const dest of DESTINATIONS) {
      if (trackingCodes[dest.key]) {
        datos[`recibido_${dest.key}`] = received[dest.key] || false;
      }
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'seguimiento_docs_fisicos',
        stepName: 'Seguimiento Docs Fisicos',
        userId,
        userName,
        datos,
      },
      {
        onSuccess: () => {
          toast.success('Recepcion de documentos fisicos confirmada.');
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const toggleReceived = (key: string) => {
    setReceived((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Modo edicion (Admin)</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Show all tracking codes with DHL links */}
      {activeDests.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Codigos de seguimiento DHL:</p>
          {activeDests.map((dest) => (
            <div key={dest.key} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-muted-foreground">{dest.label}:</span>
              <span className="text-sm font-medium font-mono">{trackingCodes[dest.key]}</span>
              <a
                href={DHL_URL(trackingCodes[dest.key])}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                DHL
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay codigos de seguimiento DHL registrados.</p>
      )}

      {isFinanzas ? (
        <>
          {/* Per-destination receipt checkboxes */}
          {activeDests.length > 0 && (
            <div className="space-y-2 p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-800">Confirmar recepcion por destino:</p>
              {activeDests.map((dest) => (
                <div key={dest.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`recv-${dest.key}`}
                    checked={received[dest.key] || false}
                    onCheckedChange={() => toggleReceived(dest.key)}
                  />
                  <label
                    htmlFor={`recv-${dest.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {dest.checkLabel}
                  </label>
                </div>
              ))}
            </div>
          )}

          <div>
            <Label className="text-xs">Observaciones (opcional)</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder="Notas sobre la recepcion de documentos fisicos..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeStep.isPending || !allReceived}
            >
              <Package className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Confirmando...' : 'Confirmar Recepcion de Documentos Fisicos'}
            </Button>
          </div>
        </>
      ) : (
        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que Finanzas confirme la recepcion de los documentos fisicos.
        </div>
      )}
    </div>
  );
}
