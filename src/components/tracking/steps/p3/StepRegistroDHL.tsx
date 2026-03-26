import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Truck, Pencil, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { supabase } from '@/integrations/supabase/client';
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
  { key: 'tracking_planta', label: 'Planta' },
  { key: 'tracking_cerrillos', label: 'Cerrillos' },
  { key: 'tracking_banco', label: 'Banco' },
] as const;

type DestKey = (typeof DESTINATIONS)[number]['key'];

export function StepRegistroDHL({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [codes, setCodes] = useState<Record<DestKey, string>>({
    tracking_planta: '',
    tracking_cerrillos: '',
    tracking_banco: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const completeStep = useCompleteStep();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';

  if (step.status === 'completado' && !isEditing) {
    const datos = step.datos as any;
    const planta = datos?.tracking_planta || pim?.tracking_planta || '';
    const cerrillos = datos?.tracking_cerrillos || pim?.tracking_cerrillos || '';
    const banco = datos?.tracking_banco || pim?.tracking_banco || '';

    const filled = DESTINATIONS.filter(
      (d) => (d.key === 'tracking_planta' ? planta : d.key === 'tracking_cerrillos' ? cerrillos : banco)
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Codigos DHL registrados</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>
        {filled.length === 0 && (
          <p className="text-sm text-muted-foreground">No se registraron codigos de seguimiento.</p>
        )}
        {[
          { label: 'Planta', code: planta },
          { label: 'Cerrillos', code: cerrillos },
          { label: 'Banco', code: banco },
        ]
          .filter((r) => r.code)
          .map((r) => (
            <div key={r.label} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Truck className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{r.label}:</span>
              <span className="text-sm font-medium font-mono">{r.code}</span>
              <a
                href={DHL_URL(r.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver en DHL
              </a>
            </div>
          ))}
      </div>
    );
  }

  const handleComplete = async () => {
    const trimmed = {
      tracking_planta: codes.tracking_planta.trim() || null,
      tracking_cerrillos: codes.tracking_cerrillos.trim() || null,
      tracking_banco: codes.tracking_banco.trim() || null,
    };

    try {
      const { error } = await supabase
        .from('pims')
        .update({
          tracking_planta: trimmed.tracking_planta,
          tracking_cerrillos: trimmed.tracking_cerrillos,
          tracking_banco: trimmed.tracking_banco,
        })
        .eq('id', pimId);

      if (error) throw error;
    } catch (err: any) {
      toast.error(`Error al guardar codigos DHL: ${err.message}`);
      return;
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'registro_dhl',
        stepName: 'Registro DHL',
        userId,
        userName,
        datos: {
          tracking_planta: trimmed.tracking_planta,
          tracking_cerrillos: trimmed.tracking_cerrillos,
          tracking_banco: trimmed.tracking_banco,
        },
      },
      {
        onSuccess: () => {
          toast.success('Codigos DHL registrados correctamente.');
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const updateCode = (key: DestKey, value: string) => {
    setCodes((prev) => ({ ...prev, [key]: value }));
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

      {isComex ? (
        <>
          <p className="text-sm text-muted-foreground">
            Ingrese los codigos de seguimiento DHL para cada destino. Todos son opcionales.
          </p>

          <div className="space-y-3">
            {DESTINATIONS.map((dest) => (
              <div key={dest.key} className="space-y-1">
                <Label className="text-xs font-medium">{dest.label}</Label>
                <div className="flex gap-2">
                  <Input
                    value={codes[dest.key]}
                    onChange={(e) => updateCode(dest.key, e.target.value)}
                    placeholder={`Codigo DHL ${dest.label} (opcional)`}
                    className="flex-1"
                  />
                  {codes[dest.key].trim() && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={DHL_URL(codes[dest.key].trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeStep.isPending}
            >
              <Truck className="h-4 w-4 mr-1" />
              {completeStep.isPending ? 'Registrando...' : 'Registrar Codigos DHL'}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Esperando que COMEX registre los codigos de seguimiento DHL.
        </div>
      )}
    </div>
  );
}
