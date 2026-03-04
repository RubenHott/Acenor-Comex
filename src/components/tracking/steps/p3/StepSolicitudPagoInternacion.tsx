import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, DollarSign, Pencil, Clock, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCompleteStep, type StageStep } from '@/hooks/useStageSteps';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Department, UserRole } from '@/types/comex';

function generateId() { return crypto.randomUUID(); }

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

const MONTO_REGEX = /^\d+([,]\d{1,2})?$/;

export function StepSolicitudPagoInternacion({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('CLP');
  const [descripcion, setDescripcion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const completeStep = useCompleteStep();

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const datos = step.datos as any;

  const handleMontoChange = (value: string) => {
    // Only allow digits and comma
    const filtered = value.replace(/[^0-9,]/g, '');
    // Only allow one comma
    const parts = filtered.split(',');
    if (parts.length > 2) return;
    // Max 2 decimals after comma
    if (parts.length === 2 && parts[1].length > 2) return;
    setMonto(filtered);
  };

  if (step.status === 'completado' && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Solicitud de pago enviada</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Modificar
            </Button>
          )}
        </div>

        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="py-3 px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Monto:</span>
                <strong>${datos?.monto_internacion || 'N/A'} {datos?.moneda || ''}</strong>
              </div>
              {datos?.descripcion && (
                <div className="col-span-full text-sm text-muted-foreground">
                  <span className="font-medium">Descripción:</span> {datos.descripcion}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleComplete = async () => {
    if (!monto.trim()) {
      toast.error('Ingrese el monto de internación');
      return;
    }
    if (!MONTO_REGEX.test(monto)) {
      toast.error('Formato de monto inválido. Use formato: 1500000,50 (coma para decimales, máximo 2 decimales)');
      return;
    }

    // Upload file if selected
    if (selectedFile) {
      setUploading(true);
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${pimId}/${stageKey}/internacion-${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('pim-documentos')
          .upload(filePath, selectedFile);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from('pim-documentos')
          .getPublicUrl(filePath);

        // Save to pim_documentos table
        await supabase.from('pim_documentos').insert({
          id: generateId(),
          pim_id: pimId,
          tipo: 'documento_internacion',
          nombre: selectedFile.name,
          url: urlData.publicUrl,
          subido_por: userName,
          version: 1,
        });
      } catch (err: any) {
        toast.error(`Error al subir archivo: ${err.message}`);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Notify Finanzas users
    try {
      const { data: finanzasUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('department', 'finanzas')
        .eq('active', true);

      if (finanzasUsers && finanzasUsers.length > 0) {
        const now = new Date().toISOString();
        await supabase.from('notificaciones').insert(
          finanzasUsers.map((u) => ({
            id: generateId(),
            destinatario_id: u.id,
            pim_id: pimId,
            tipo: 'sistema',
            titulo: `Solicitud de pago internación — PIM ${pim?.codigo}`,
            mensaje: `COMEX solicita pago de internación por $${monto} ${moneda}.`,
            leido: false,
            prioridad: 'alta',
            fecha_creacion: now,
          }))
        );
      }
    } catch (err) {
      console.error('Error sending notifications:', err);
    }

    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'solicitud_pago_internacion',
        stepName: 'Solicitud Pago Internación',
        userId,
        userName,
        datos: {
          monto_internacion: monto,
          moneda,
          descripcion: descripcion.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Solicitud de pago enviada. Finanzas ha sido notificado.');
          setIsEditing(false);
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

      {isComex ? (
        <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <h5 className="text-sm font-semibold text-blue-800">Solicitud de Pago de Internación</h5>
          </div>

          <div>
            <Label className="text-xs">Documentos de internación (opcional)</Label>
            <div className="mt-1">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Monto de internación *</Label>
              <Input
                className="mt-1"
                type="text"
                inputMode="decimal"
                value={monto}
                onChange={(e) => handleMontoChange(e.target.value)}
                placeholder="Ej: 1500000,50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Use coma para decimales (máx. 2)
              </p>
            </div>

            <div>
              <Label className="text-xs">Moneda *</Label>
              <Select value={moneda} onValueChange={setMoneda}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Descripción (opcional)</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="Descripción de la solicitud de pago..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeStep.isPending || uploading}
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Subiendo...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {completeStep.isPending ? 'Enviando...' : 'Enviar Solicitud a Finanzas'}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Esperando que COMEX registre la solicitud de pago de internación.
        </div>
      )}
    </div>
  );
}
