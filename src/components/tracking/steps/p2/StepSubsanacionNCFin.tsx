import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Upload, Clock, User, FileText, Calendar, Pencil, Plus, X } from 'lucide-react';
import { useCompleteStep, useStageSteps, type StageStep } from '@/hooks/useStageSteps';
import { useNCsByStage, useResolveNC } from '@/hooks/useNoConformidades';
import { usePIMDocuments, useUploadDocument } from '@/hooks/usePIMDocuments';
import { DOCUMENT_TYPES } from '@/services/documentService';
import { toast } from 'sonner';
import type { Department, UserRole } from '@/types/comex';

interface DocEntry {
  docType: string;
  file: File | null;
}

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

export function StepSubsanacionNCFin({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [resolucion, setResolucion] = useState('');
  const [docEntries, setDocEntries] = useState<DocEntry[]>([{ docType: '', file: null }]);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: ncs } = useNCsByStage(pimId, stageKey);
  const { data: allSteps } = useStageSteps(pimId, stageKey);
  const { data: existingDocs } = usePIMDocuments(pimId);
  const resolveNC = useResolveNC();
  const completeStep = useCompleteStep();
  const uploadDoc = useUploadDocument();

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const datos = step.datos as any;
  let ncId = datos?.nc_id;
  if (!ncId && allSteps) {
    const declaracionStep = allSteps.find((s) => s.step_key === 'declaracion_nc_fin');
    ncId = (declaracionStep?.datos as any)?.nc_id;
  }
  const nc = ncId
    ? ncs?.find((n) => n.id === ncId)
    : ncs?.find((n) => ['abierta', 'en_revision'].includes(n.estado));

  const existingDocTypes = existingDocs
    ? [...new Set(existingDocs.map((d: any) => d.tipo))]
    : [];
  const availableDocTypes = DOCUMENT_TYPES.filter(
    (dt) => existingDocTypes.includes(dt.value) || dt.value === 'otro'
  );

  const addDocEntry = () => setDocEntries((prev) => [...prev, { docType: '', file: null }]);
  const removeDocEntry = (idx: number) => setDocEntries((prev) => prev.filter((_, i) => i !== idx));
  const updateDocEntry = (idx: number, field: keyof DocEntry, value: any) => {
    setDocEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Subsanación enviada{nc?.resuelto_por ? ` por ${nc.resuelto_por}` : ''}</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>

        {nc && (
          <Card className="bg-green-50/50 border-green-200">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">NC: {nc.codigo}</span>
                <Badge variant="outline" className="text-xs">{nc.estado}</Badge>
              </div>
              <div className="text-sm">
                <span className="text-xs text-muted-foreground">Descripción original:</span>
                <p className="text-muted-foreground">{nc.descripcion}</p>
              </div>
              {nc.resolucion && (
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">Corrección realizada:</span>
                  <p className="text-green-700">{nc.resolucion}</p>
                </div>
              )}
              {nc.evidencia_url && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <a href={nc.evidencia_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    Ver archivo corregido
                  </a>
                </div>
              )}
              {nc.fecha_resolucion && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(nc.fecha_resolucion).toLocaleDateString('es-CL')}
                  </span>
                  {nc.resuelto_por && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Resuelto por: {nc.resuelto_por}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!nc) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Cargando datos de la no conformidad...
      </div>
    );
  }

  const isAssignedUser = nc.asignado_a === userId;
  const isAssignedDept = nc.departamento_asignado === userDepartment;
  const canResolve = isAssignedUser || isAssignedDept || userRole === 'admin' || userRole === 'manager';

  const handleSubmitSubsanacion = async () => {
    if (!resolucion.trim()) {
      toast.error('Ingrese la descripción de la corrección realizada');
      return;
    }

    // Validate entries that have files
    const validEntries = docEntries.filter((e) => e.file);
    for (const entry of validEntries) {
      if (!entry.docType) {
        toast.error('Seleccione el tipo de documento para cada archivo');
        return;
      }
    }

    if (validEntries.length === 0) {
      toast.error('Debe adjuntar al menos un documento corregido');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    const uploadedTypes: string[] = [];

    try {
      for (const entry of validEntries) {
        const existingDoc = existingDocs?.find((d: any) => d.tipo === entry.docType);
        const versionGroup = existingDoc?.version_group || undefined;
        const nextVersion = existingDoc ? (existingDoc.version || 1) + 1 : 1;

        const result = await uploadDoc.mutateAsync({
          pimId,
          file: entry.file!,
          tipo: entry.docType,
          stageKey,
          observaciones: undefined,
          usuario: userName,
          versionGroup,
          version: nextVersion,
          userRole,
          pimCodigo: pim?.codigo,
        });

        const { data: newDoc } = await import('@/integrations/supabase/client').then(
          (m) => m.supabase.from('pim_documentos').select('url').eq('id', result.docId).single()
        );
        if (newDoc?.url) uploadedUrls.push(newDoc.url);
        uploadedTypes.push(entry.docType);
      }
    } catch (err: any) {
      toast.error(`Error al subir archivo: ${err.message}`);
      setUploading(false);
      return;
    }
    setUploading(false);

    const evidenciaUrl = uploadedUrls[0]; // First URL for NC evidence

    resolveNC.mutate(
      {
        ncId: nc.id,
        pimId,
        stageKey,
        resolucion,
        evidenciaUrl,
        usuario: userName,
        usuarioId: userId,
        ncCodigo: nc.codigo,
      },
      {
        onSuccess: () => {
          completeStep.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              stepKey: 'subsanacion_nc_fin',
              stepName: 'Subsanación de NC',
              userId,
              userName,
              datos: {
                nc_id: nc.id,
                resolucion,
                evidencia_urls: uploadedUrls,
                doc_types: uploadedTypes,
              },
            },
            {
              onSuccess: () => {
                toast.success('Subsanación enviada. Finanzas revisará la corrección.');
                setIsEditing(false);
              },
              onError: (err) => toast.error(err.message),
            }
          );
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Modo edición (Admin)</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      )}

      <Card className="bg-yellow-50/50 border-yellow-200">
        <CardContent className="py-3 px-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">NC: {nc.codigo}</span>
              <Badge variant="outline" className="text-xs">{nc.estado}</Badge>
            </div>
            <p className="text-muted-foreground">{nc.descripcion}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Asignada a: {nc.departamento_asignado}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {canResolve ? (
        <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-semibold text-blue-800">Subsanar No Conformidad</h5>

          {/* Multi-document entries */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Documentos corregidos</Label>
            {docEntries.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-white border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Select value={entry.docType} onValueChange={(v) => updateDocEntry(idx, 'docType', v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Tipo de documento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDocTypes.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="file"
                    onChange={(e) => updateDocEntry(idx, 'file', e.target.files?.[0] || null)}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                {docEntries.length > 1 && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => removeDocEntry(idx)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={addDocEntry}>
              <Plus className="h-3 w-3 mr-1" />
              Agregar otro documento
            </Button>
          </div>

          <div>
            <Label className="text-xs">Descripción de la corrección realizada *</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="Describa cómo fue corregida la no conformidad..."
              value={resolucion}
              onChange={(e) => setResolucion(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmitSubsanacion}
              disabled={resolveNC.isPending || completeStep.isPending || uploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? 'Subiendo archivos...' : resolveNC.isPending ? 'Enviando...' : 'Enviar Subsanación'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando subsanación del área asignada ({nc.departamento_asignado})
        </div>
      )}
    </div>
  );
}
