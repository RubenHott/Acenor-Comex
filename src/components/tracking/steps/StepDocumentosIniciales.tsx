import { FileUp } from 'lucide-react';
import { useStepBase, type StepBaseProps } from '@/hooks/useStepBase';
import { RequiredDocumentsPanel } from '../RequiredDocumentsPanel';

const REQUIRED_DOCS = ['contrato', 'cierre_compra'] as const;

export function StepDocumentosIniciales(props: StepBaseProps) {
  const { step, pimId, stageKey, pim, userName } = props;
  const {
    showCompletedView,
    allDocsUploaded,
    missingDocs,
    CompletedHeader,
    EditModeBanner,
    CompleteButton,
  } = useStepBase(props, {
    stepKey: 'documentos_iniciales',
    stepName: 'Documentos Iniciales',
    successMessage: 'Paso 1 completado: Documentos iniciales',
    requiredDocTypes: [...REQUIRED_DOCS],
  });

  if (showCompletedView) {
    return (
      <div className="space-y-3">
        <CompletedHeader>Documentos iniciales cargados correctamente</CompletedHeader>
        <RequiredDocumentsPanel
          pimId={pimId}
          stageKey={stageKey}
          stageName="Documentos Iniciales"
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
        stageName="Documentos Iniciales"
        requiredDocTypes={[...REQUIRED_DOCS]}
        usuario={userName}
        pimCodigo={pim.codigo}
        readOnly={false}
      />
      {allDocsUploaded && !step.completado_en && <CompleteButton />}
      {!allDocsUploaded && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <FileUp className="h-3.5 w-3.5" />
          Faltan documentos: {missingDocs.join(', ')}
        </div>
      )}
    </div>
  );
}
