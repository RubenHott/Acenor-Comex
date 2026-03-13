import { FileUp } from 'lucide-react';
import { useStepBase, type StepBaseProps } from '@/hooks/useStepBase';
import { RequiredDocumentsPanel } from '../RequiredDocumentsPanel';

const REQUIRED_DOCS = ['contrato'] as const;

export function StepRecepcionContrato(props: StepBaseProps) {
  const { step, pimId, stageKey, pim, userName } = props;
  const {
    showCompletedView,
    allDocsUploaded,
    CompletedHeader,
    EditModeBanner,
    CompleteButton,
  } = useStepBase(props, {
    stepKey: 'recepcion_contrato',
    stepName: 'Recepción de Contrato',
    successMessage: 'Paso completado: Contrato recibido',
    requiredDocTypes: [...REQUIRED_DOCS],
  });

  if (showCompletedView) {
    return (
      <div className="space-y-3">
        <CompletedHeader>Contrato cargado correctamente</CompletedHeader>
        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Recepción de Contrato"
          requiredDocTypes={[...REQUIRED_DOCS]}
          usuario={userName}
          pimCodigo={pim.codigo}
          readOnly={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EditModeBanner />
      <RequiredDocumentsPanel
        pimId={pimId}
        stageKey={stageKey}
        stageName="Recepción de Contrato"
        requiredDocTypes={[...REQUIRED_DOCS]}
        usuario={userName}
        pimCodigo={pim.codigo}
        readOnly={false}
      />
      {allDocsUploaded && !step.completado_en && <CompleteButton />}
      {!allDocsUploaded && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <FileUp className="h-3.5 w-3.5" />
          Suba el contrato para continuar
        </div>
      )}
    </div>
  );
}
