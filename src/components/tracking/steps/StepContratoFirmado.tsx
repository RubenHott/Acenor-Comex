import { FileUp } from 'lucide-react';
import { useStepBase, type StepBaseProps } from '@/hooks/useStepBase';
import { RequiredDocumentsPanel } from '../RequiredDocumentsPanel';

const REQUIRED_DOCS = ['contrato_firmado'] as const;

export function StepContratoFirmado(props: StepBaseProps) {
  const { step, pimId, stageKey, pim, userName } = props;
  const {
    showCompletedView,
    allDocsUploaded,
    CompletedHeader,
    EditModeBanner,
    CompleteButton,
  } = useStepBase(props, {
    stepKey: 'contrato_firmado',
    stepName: 'Contrato Firmado y Enviado a Proveedor',
    successMessage: 'Paso completado: Contrato firmado y enviado a proveedor',
    requiredDocTypes: [...REQUIRED_DOCS],
  });

  if (showCompletedView) {
    return (
      <div className="space-y-3">
        <CompletedHeader>Contrato firmado y enviado a proveedor cargado correctamente</CompletedHeader>
        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Contrato Firmado y Enviado a Proveedor"
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
        stageName="Contrato Firmado y Enviado a Proveedor"
        requiredDocTypes={[...REQUIRED_DOCS]}
        usuario={userName}
        pimCodigo={pim.codigo}
        readOnly={false}
      />
      {allDocsUploaded && !step.completado_en && <CompleteButton />}
      {!allDocsUploaded && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <FileUp className="h-3.5 w-3.5" />
          Suba el contrato firmado para continuar
        </div>
      )}
    </div>
  );
}
