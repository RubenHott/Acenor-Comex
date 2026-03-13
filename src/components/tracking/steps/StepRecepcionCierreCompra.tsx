import { FileUp } from 'lucide-react';
import { useStepBase, type StepBaseProps } from '@/hooks/useStepBase';
import { RequiredDocumentsPanel } from '../RequiredDocumentsPanel';

const REQUIRED_DOCS = ['cierre_compra'] as const;

export function StepRecepcionCierreCompra(props: StepBaseProps) {
  const { step, pimId, stageKey, pim, userName } = props;
  const {
    showCompletedView,
    allDocsUploaded,
    CompletedHeader,
    EditModeBanner,
    CompleteButton,
  } = useStepBase(props, {
    stepKey: 'recepcion_cierre_compra',
    stepName: 'Recepción de Cierre de Compra',
    successMessage: 'Paso completado: Cierre de compra recibido',
    requiredDocTypes: [...REQUIRED_DOCS],
  });

  if (showCompletedView) {
    return (
      <div className="space-y-3">
        <CompletedHeader>Cierre de compra cargado correctamente</CompletedHeader>
        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Recepción de Cierre de Compra"
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
        stageName="Recepción de Cierre de Compra"
        requiredDocTypes={[...REQUIRED_DOCS]}
        usuario={userName}
        pimCodigo={pim.codigo}
        readOnly={false}
      />
      {allDocsUploaded && !step.completado_en && <CompleteButton />}
      {!allDocsUploaded && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <FileUp className="h-3.5 w-3.5" />
          Suba el cierre de compra para continuar
        </div>
      )}
    </div>
  );
}
