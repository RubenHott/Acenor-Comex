import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Clock, SkipForward, Lock } from 'lucide-react';
import { useStageSteps, useInitializeSteps, type StageStep } from '@/hooks/useStageSteps';
import { getStageSteps, type StageStepDef } from '@/lib/stageStepDefinitions';
import { StepDocumentosIniciales } from './steps/StepDocumentosIniciales';
import { StepDeclaracionNC } from './steps/StepDeclaracionNC';
import { StepSubsanacionNC } from './steps/StepSubsanacionNC';
import { StepRevisionComex } from './steps/StepRevisionComex';
import { StepContratoFirmado } from './steps/StepContratoFirmado';
import { StepValidacionBancaria } from './steps/StepValidacionBancaria';
import { StepAprobacionGerencia } from './steps/StepAprobacionGerencia';
import { StepCierreProceso } from './steps/StepCierreProceso';
// Process 2: Gestión Financiera de Pago
import { StepEncabezadoAntecedentes } from './steps/p2/StepEncabezadoAntecedentes';
import { StepRevisionFinanciera } from './steps/p2/StepRevisionFinanciera';
import { StepDeclaracionNCFin } from './steps/p2/StepDeclaracionNCFin';
import { StepSubsanacionNCFin } from './steps/p2/StepSubsanacionNCFin';
import { StepRevisionFinanzas } from './steps/p2/StepRevisionFinanzas';
import { StepRegistroBancoTasa } from './steps/p2/StepRegistroBancoTasa';
import { StepSolicitudFirma } from './steps/p2/StepSolicitudFirma';
import { StepRecepcionSwift } from './steps/p2/StepRecepcionSwift';
import { StepGestionComex } from './steps/p2/StepGestionComex';
// Process 3: Documentación e Internación
import { StepRecepcionDocsDigitales } from './steps/p3/StepRecepcionDocsDigitales';
import { StepRegistroDHL } from './steps/p3/StepRegistroDHL';
import { StepSeguimientoDocsFisicos } from './steps/p3/StepSeguimientoDocsFisicos';
import { StepRevisionDocumental } from './steps/p3/StepRevisionDocumental';
import { StepDeclaracionDiscrepancia } from './steps/p3/StepDeclaracionDiscrepancia';
import { StepSubsanacionDiscrepancia } from './steps/p3/StepSubsanacionDiscrepancia';
import { StepRetiroDocsBanco } from './steps/p3/StepRetiroDocsBanco';
import { StepPreparacionSetDocumental } from './steps/p3/StepPreparacionSetDocumental';
import { StepSolicitudPagoInternacion } from './steps/p3/StepSolicitudPagoInternacion';
import { StepGestionPagoInternacion } from './steps/p3/StepGestionPagoInternacion';
import { StepConfirmacionComex } from './steps/p3/StepConfirmacionComex';
import type { Department, UserRole } from '@/types/comex';

interface StageStepFlowProps {
  pimId: string;
  stageKey: string;
  pim: any;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  userDepartment?: Department;
}

const stepStatusConfig = {
  completado: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completado' },
  en_progreso: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'En progreso' },
  pendiente: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Pendiente' },
  saltado: { icon: SkipForward, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Saltado' },
};

function StepStatusIcon({ status }: { status: string }) {
  const config = stepStatusConfig[status as keyof typeof stepStatusConfig] || stepStatusConfig.pendiente;
  const Icon = config.icon;
  return <Icon className={cn('h-5 w-5', config.color)} />;
}

export function StageStepFlow({
  pimId,
  stageKey,
  pim,
  userId,
  userName,
  userRole,
  userDepartment,
}: StageStepFlowProps) {
  const { data: steps, isLoading } = useStageSteps(pimId, stageKey);
  const initSteps = useInitializeSteps();
  const stepDefs = getStageSteps(stageKey);

  // Auto-initialize steps if none exist
  useEffect(() => {
    if (steps && steps.length === 0 && !initSteps.isPending) {
      initSteps.mutate({ pimId, stageKey, userId, userName });
    }
  }, [steps, pimId, stageKey]);

  if (isLoading || !steps || steps.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Inicializando flujo de pasos...
        </CardContent>
      </Card>
    );
  }

  // Exclude cierre_proceso from progress count — it auto-completes when advancing
  const trackableSteps = steps.filter((s) => s.step_key !== 'cierre_proceso');
  const completedCount = trackableSteps.filter((s) => s.status === 'completado' || s.status === 'saltado').length;
  const totalSteps = trackableSteps.length;
  const activeStep = steps.find((s) => s.status === 'en_progreso');

  const stepProps = {
    pimId,
    stageKey,
    pim,
    userId: userId || '',
    userName: userName || '',
    userRole,
    userDepartment,
  };

  function renderStepContent(step: StageStep, def: StageStepDef) {
    if (step.status === 'pendiente') {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          <Lock className="h-4 w-4" />
          <span>Complete el paso anterior para desbloquear</span>
        </div>
      );
    }

    if (step.status === 'saltado') {
      return (
        <div className="text-sm text-muted-foreground italic py-2">
          Paso saltado — {(step.datos as any)?.motivo || 'Sin no conformidad'}
        </div>
      );
    }

    switch (step.step_key) {
      case 'documentos_iniciales':
        return <StepDocumentosIniciales step={step} {...stepProps} />;
      case 'declaracion_nc':
        return <StepDeclaracionNC step={step} {...stepProps} />;
      case 'subsanacion_nc':
        return <StepSubsanacionNC step={step} {...stepProps} />;
      case 'revision_comex':
        return <StepRevisionComex step={step} {...stepProps} />;
      case 'contrato_firmado':
        return <StepContratoFirmado step={step} {...stepProps} />;
      case 'validacion_cuenta_bancaria':
        return <StepValidacionBancaria step={step} {...stepProps} />;
      case 'aprobacion_gerencia':
        return <StepAprobacionGerencia step={step} {...stepProps} />;
      case 'cierre_proceso':
        return <StepCierreProceso step={step} {...stepProps} />;
      // Process 2: Gestión Financiera de Pago
      case 'encabezado_antecedentes':
        return <StepEncabezadoAntecedentes step={step} {...stepProps} />;
      case 'revision_financiera':
        return <StepRevisionFinanciera step={step} {...stepProps} />;
      case 'declaracion_nc_fin':
        return <StepDeclaracionNCFin step={step} {...stepProps} />;
      case 'subsanacion_nc_fin':
        return <StepSubsanacionNCFin step={step} {...stepProps} />;
      case 'revision_finanzas':
        return <StepRevisionFinanzas step={step} {...stepProps} />;
      case 'registro_banco_tasa':
        return <StepRegistroBancoTasa step={step} {...stepProps} />;
      case 'solicitud_firma':
        return <StepSolicitudFirma step={step} {...stepProps} />;
      case 'recepcion_swift':
        return <StepRecepcionSwift step={step} {...stepProps} />;
      case 'gestion_comex':
        return <StepGestionComex step={step} {...stepProps} />;
      // Process 3: Documentación e Internación
      case 'recepcion_docs_digitales':
        return <StepRecepcionDocsDigitales step={step} {...stepProps} />;
      case 'registro_dhl':
        return <StepRegistroDHL step={step} {...stepProps} />;
      case 'seguimiento_docs_fisicos':
        return <StepSeguimientoDocsFisicos step={step} {...stepProps} />;
      case 'revision_documental':
        return <StepRevisionDocumental step={step} {...stepProps} />;
      case 'declaracion_discrepancia':
        return <StepDeclaracionDiscrepancia step={step} {...stepProps} />;
      case 'subsanacion_discrepancia':
        return <StepSubsanacionDiscrepancia step={step} {...stepProps} />;
      case 'retiro_docs_banco':
        return <StepRetiroDocsBanco step={step} {...stepProps} />;
      case 'preparacion_set_documental':
        return <StepPreparacionSetDocumental step={step} {...stepProps} />;
      case 'solicitud_pago_internacion':
        return <StepSolicitudPagoInternacion step={step} {...stepProps} />;
      case 'gestion_pago_internacion':
        return <StepGestionPagoInternacion step={step} {...stepProps} />;
      case 'confirmacion_comex':
        return <StepConfirmacionComex step={step} {...stepProps} />;
      default:
        return <div className="text-sm text-muted-foreground">Paso no implementado</div>;
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <Card className={cn(
        'border-2',
        completedCount === totalSteps
          ? 'border-green-500/30 bg-green-50/50'
          : 'border-blue-500/20 bg-blue-50/30'
      )}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Progreso: {completedCount} de {totalSteps} pasos completados
            </span>
            <div className="h-2 w-40 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(completedCount / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps list */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const def = stepDefs.find((d) => d.key === step.step_key);
          if (!def) return null;

          const isActive = step.status === 'en_progreso';
          const config = stepStatusConfig[step.status as keyof typeof stepStatusConfig] || stepStatusConfig.pendiente;

          return (
            <Card
              key={step.id}
              className={cn(
                'transition-all',
                isActive && 'ring-2 ring-blue-500/50 shadow-md',
                step.status === 'saltado' && 'opacity-60',
                step.status === 'pendiente' && 'opacity-50',
              )}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  {/* Step number and status */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', config.bg)}>
                      {step.status === 'completado' || step.status === 'saltado' ? (
                        <StepStatusIcon status={step.status} />
                      ) : (
                        <span className={config.color}>{idx + 1}</span>
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={cn(
                        'w-0.5 h-4',
                        step.status === 'completado' || step.status === 'saltado' ? 'bg-green-300' : 'bg-gray-200'
                      )} />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        'text-sm font-semibold',
                        isActive ? 'text-blue-700' : step.status === 'completado' ? 'text-green-700' : 'text-gray-600'
                      )}>
                        {def.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', config.color)}
                      >
                        {config.label}
                      </Badge>
                      {step.completado_en && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(step.completado_en).toLocaleDateString('es-CL')}
                          {step.completado_por_nombre && ` — ${step.completado_por_nombre}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{def.description}</p>

                    {/* Step-specific content */}
                    {(isActive || step.status === 'completado' || step.status === 'saltado') && (
                      <div className={cn(
                        step.status === 'completado' && 'border-t pt-2 mt-2'
                      )}>
                        {renderStepContent(step, def)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
