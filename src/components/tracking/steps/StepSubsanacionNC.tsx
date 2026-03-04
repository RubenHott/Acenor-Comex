import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Upload, Clock, User } from 'lucide-react';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { useNCsByStage, useResolveNC } from '@/hooks/useNoConformidades';
import { useUploadDocument } from '@/hooks/usePIMDocuments';
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

export function StepSubsanacionNC({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [resolucion, setResolucion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: ncs } = useNCsByStage(pimId, stageKey);
  const resolveNC = useResolveNC();
  const completeStep = useCompleteStep();

  const datos = step.datos as any;
  const ncId = datos?.nc_id;
  const nc = ncs?.find((n) => n.id === ncId);

  if (step.status === 'completado') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" />
        <span>Subsanación enviada{nc?.resuelto_por ? ` por ${nc.resuelto_por}` : ''}</span>
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

    let evidenciaUrl: string | undefined;

    // Upload corrected file if provided
    if (selectedFile) {
      setUploading(true);
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${pimId}/${stageKey}/nc-correccion-${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('pim-documentos')
          .upload(filePath, selectedFile);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from('pim-documentos')
          .getPublicUrl(filePath);
        evidenciaUrl = urlData.publicUrl;
      } catch (err: any) {
        toast.error(`Error al subir archivo: ${err.message}`);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Resolve the NC
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
          // Complete this step
          completeStep.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              stepKey: 'subsanacion_nc',
              stepName: 'Subsanación de No Conformidad',
              userId,
              userName,
              datos: { nc_id: nc.id, resolucion, evidencia_url: evidenciaUrl },
            },
            {
              onSuccess: () => toast.success('Subsanación enviada. COMEX revisará la corrección.'),
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
      {/* NC Summary */}
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

          <div>
            <Label className="text-xs">Archivo corregido</Label>
            <div className="mt-1">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
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
              {uploading ? 'Subiendo archivo...' : resolveNC.isPending ? 'Enviando...' : 'Enviar Subsanación'}
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
