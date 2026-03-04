import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle, XCircle, Send, Clock, AlertTriangle,
  RefreshCw, FileText, User, Calendar, Upload,
} from 'lucide-react';
import { useCompleteStep, useUpdateStepData, type StageStep } from '@/hooks/useStageSteps';
import { useCreateNC, useResolveNC, useNCsByStage, NC_TIPOS, NC_PRIORIDADES, useUsersByDepartment } from '@/hooks/useNoConformidades';
import { usePIMDocuments } from '@/hooks/usePIMDocuments';
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

type GestionEstado = 'pendiente_envio' | 'enviado_proveedor' | 'en_resolucion';

interface Iteracion {
  tipo: 'envio' | 'objecion' | 'resolucion' | 'reenvio' | 'aceptacion';
  fecha: string;
  descripcion: string;
  usuario?: string;
}

const DEPARTMENTS = [
  { value: 'comex', label: 'COMEX' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'gerencia', label: 'Gerencia' },
];

export function StepGestionComex({ step, pimId, stageKey, pim, userId, userName, userRole, userDepartment }: Props) {
  const [showObjecionForm, setShowObjecionForm] = useState(false);
  const [ncTipo, setNcTipo] = useState('');
  const [ncDescripcion, setNcDescripcion] = useState('');
  const [ncPrioridad, setNcPrioridad] = useState('media');
  const [ncDepartamento, setNcDepartamento] = useState('');
  const [ncAsignadoA, setNcAsignadoA] = useState('');
  const [resolucion, setResolucion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const completeStep = useCompleteStep();
  const updateStepData = useUpdateStepData();
  const createNC = useCreateNC();
  const resolveNC = useResolveNC();
  const { data: ncs } = useNCsByStage(pimId, stageKey);
  const { data: documents } = usePIMDocuments(pimId);
  const { data: deptUsers } = useUsersByDepartment(ncDepartamento || undefined);

  const datos = step.datos as any;
  const estado: GestionEstado = datos?.estado || 'pendiente_envio';
  const iteraciones: Iteracion[] = datos?.iteraciones || [];
  const ncActiva = datos?.nc_activa_id ? ncs?.find((n) => n.id === datos.nc_activa_id) : null;
  const swiftDoc = documents?.find((d: any) => d.tipo === 'swift');

  const isComex = userDepartment === 'comex' || userRole === 'admin' || userRole === 'manager';

  // Completed state
  if (step.status === 'completado') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span>Proveedor aceptó el Swift</span>
        </div>

        {iteraciones.length > 0 && (
          <Card>
            <CardContent className="py-3 px-4">
              <h5 className="text-sm font-semibold mb-2">Historial de gestión</h5>
              <div className="space-y-1.5">
                {iteraciones.map((it, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs border-b last:border-0 pb-1.5">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(it.fecha).toLocaleDateString('es-CL')}
                    </span>
                    <span className={
                      it.tipo === 'aceptacion' ? 'text-green-700' :
                      it.tipo === 'objecion' ? 'text-red-700' :
                      'text-gray-700'
                    }>
                      {it.descripcion}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // --- State machine logic ---

  const addIteracion = (tipo: Iteracion['tipo'], descripcion: string) => {
    return [...iteraciones, { tipo, fecha: new Date().toISOString(), descripcion, usuario: userName }];
  };

  // State 1: Pendiente de envío
  const handleConfirmEnvio = () => {
    const newIteraciones = addIteracion('envio', `Swift enviado al proveedor por ${userName}`);
    updateStepData.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        datos: { estado: 'enviado_proveedor', iteraciones: newIteraciones, fecha_envio: new Date().toISOString() },
      },
      {
        onSuccess: () => toast.success('Envío confirmado. Esperando respuesta del proveedor.'),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // State 2: Proveedor acepta
  const handleProveedorAcepta = () => {
    const newIteraciones = addIteracion('aceptacion', `Proveedor aceptó el Swift`);
    completeStep.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        stepKey: 'gestion_comex',
        stepName: 'Gestión COMEX',
        userId,
        userName,
        datos: { estado: 'completado', iteraciones: newIteraciones, resultado: 'aceptado' },
      },
      {
        onSuccess: () => toast.success('Proveedor aceptó. Continúa con el cierre del proceso.'),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // State 2: Proveedor objeta → create NC
  const handleProveedorObjeta = () => {
    if (!ncTipo || !ncDescripcion.trim() || !ncDepartamento || !ncAsignadoA) {
      toast.error('Complete todos los campos de la objeción');
      return;
    }

    createNC.mutate(
      {
        pimId,
        stageKey,
        tipo: ncTipo as any,
        descripcion: `Objeción del proveedor: ${ncDescripcion}`,
        prioridad: ncPrioridad as any,
        departamentoAsignado: ncDepartamento,
        asignadoA: ncAsignadoA,
        creadoPor: userId,
        creadoPorNombre: userName,
        userRole,
      },
      {
        onSuccess: (nc) => {
          const newIteraciones = addIteracion('objecion', `Proveedor objetó: ${ncDescripcion.slice(0, 80)}. NC ${nc.codigo} creada.`);
          updateStepData.mutate(
            {
              stepId: step.id,
              pimId,
              stageKey,
              datos: { estado: 'en_resolucion', iteraciones: newIteraciones, nc_activa_id: nc.id },
            },
            {
              onSuccess: () => {
                toast.info(`NC ${nc.codigo} creada. El área asignada debe subsanar.`);
                setShowObjecionForm(false);
                setNcDescripcion('');
                setNcTipo('');
                setNcDepartamento('');
                setNcAsignadoA('');
              },
            }
          );
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // State 3: Submit resolution for active NC
  const handleSubmitResolucion = async () => {
    if (!ncActiva || !resolucion.trim()) {
      toast.error('Ingrese la descripción de la corrección');
      return;
    }

    let evidenciaUrl: string | undefined;

    if (selectedFile) {
      setUploading(true);
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${pimId}/${stageKey}/nc-gestion-${crypto.randomUUID()}.${fileExt}`;
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

    resolveNC.mutate(
      {
        ncId: ncActiva.id,
        pimId,
        stageKey,
        resolucion,
        evidenciaUrl,
        usuario: userName,
        usuarioId: userId,
        ncCodigo: ncActiva.codigo,
      },
      {
        onSuccess: () => {
          const newIteraciones = addIteracion('resolucion', `NC ${ncActiva.codigo} resuelta: ${resolucion.slice(0, 80)}`);
          updateStepData.mutate({
            stepId: step.id,
            pimId,
            stageKey,
            datos: { ...datos, iteraciones: newIteraciones, nc_activa_id: null },
          });
          toast.success('NC resuelta. Puede re-enviar al proveedor.');
          setResolucion('');
          setSelectedFile(null);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // State 3: Re-send to provider after resolution
  const handleReenviar = () => {
    const newIteraciones = addIteracion('reenvio', `Swift re-enviado al proveedor por ${userName}`);
    updateStepData.mutate(
      {
        stepId: step.id,
        pimId,
        stageKey,
        datos: { estado: 'enviado_proveedor', iteraciones: newIteraciones, nc_activa_id: null },
      },
      {
        onSuccess: () => toast.success('Re-envío confirmado. Esperando nueva respuesta del proveedor.'),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // --- Render ---

  return (
    <div className="space-y-4">
      {/* Historial */}
      {iteraciones.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4">
            <h5 className="text-xs font-semibold mb-2 text-muted-foreground">Historial</h5>
            <div className="space-y-1">
              {iteraciones.map((it, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {new Date(it.fecha).toLocaleDateString('es-CL')}
                  </span>
                  <span className={
                    it.tipo === 'aceptacion' ? 'text-green-700' :
                    it.tipo === 'objecion' ? 'text-red-700' :
                    it.tipo === 'envio' || it.tipo === 'reenvio' ? 'text-blue-700' :
                    'text-gray-700'
                  }>
                    {it.descripcion}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* State 1: Pendiente de envío */}
      {estado === 'pendiente_envio' && (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
            <p className="text-sm mb-3">El Swift está disponible. Confirme el envío al proveedor.</p>
            {swiftDoc && (
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <a
                  href={swiftDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver/Descargar Swift
                </a>
              </div>
            )}
            {isComex && (
              <Button
                size="sm"
                onClick={handleConfirmEnvio}
                disabled={updateStepData.isPending}
              >
                <Send className="h-4 w-4 mr-1" />
                {updateStepData.isPending ? 'Confirmando...' : 'Confirmar Envío al Proveedor'}
              </Button>
            )}
            {!isComex && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Solo COMEX puede confirmar el envío.
              </div>
            )}
          </div>
        </div>
      )}

      {/* State 2: Enviado, esperando respuesta */}
      {estado === 'enviado_proveedor' && (
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">Swift enviado al proveedor. Esperando respuesta.</p>
            </div>

            {isComex && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleProveedorAcepta} disabled={completeStep.isPending}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Proveedor Acepta
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowObjecionForm(true)}
                  disabled={createNC.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Proveedor Objeta
                </Button>
              </div>
            )}
            {!isComex && (
              <div className="text-sm text-muted-foreground">
                Esperando que COMEX registre la respuesta del proveedor.
              </div>
            )}
          </div>

          {/* Objecion form */}
          {showObjecionForm && (
            <div className="space-y-3 p-4 bg-red-50/50 border border-red-200 rounded-lg">
              <h5 className="text-sm font-semibold text-red-800">Registrar Objeción del Proveedor</h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo de objeción *</Label>
                  <Select value={ncTipo} onValueChange={setNcTipo}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {NC_TIPOS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prioridad</Label>
                  <Select value={ncPrioridad} onValueChange={setNcPrioridad}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NC_PRIORIDADES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Descripción de la objeción *</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  placeholder="Detalle la objeción del proveedor..."
                  value={ncDescripcion}
                  onChange={(e) => setNcDescripcion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Área responsable *</Label>
                  <Select value={ncDepartamento} onValueChange={(v) => { setNcDepartamento(v); setNcAsignadoA(''); }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione área..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Persona responsable *</Label>
                  <Select value={ncAsignadoA} onValueChange={setNcAsignadoA} disabled={!ncDepartamento}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={ncDepartamento ? 'Seleccione persona...' : 'Seleccione área primero'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(deptUsers || []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowObjecionForm(false)}>Cancelar</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleProveedorObjeta}
                  disabled={createNC.isPending}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {createNC.isPending ? 'Creando NC...' : 'Registrar Objeción'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* State 3: En resolución de objeción */}
      {estado === 'en_resolucion' && (
        <div className="space-y-3">
          {/* Active NC info */}
          {ncActiva && (
            <Card className="bg-yellow-50/50 border-yellow-200">
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">NC activa: {ncActiva.codigo}</span>
                  <Badge variant="outline" className="text-xs">{ncActiva.estado}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{ncActiva.descripcion}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Área: {ncActiva.departamento_asignado}</span>
                </div>

                {ncActiva.resolucion && (
                  <div className="text-sm mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Corrección:</span>
                    <p className="text-green-700">{ncActiva.resolucion}</p>
                  </div>
                )}
                {ncActiva.evidencia_url && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <a href={ncActiva.evidencia_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Ver archivo
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resolution form if NC is open and user is assigned area */}
          {ncActiva && ['abierta', 'en_revision'].includes(ncActiva.estado) && (
            <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
              <h5 className="text-sm font-semibold text-blue-800">Subsanar Objeción</h5>

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
                <Label className="text-xs">Descripción de la corrección *</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  placeholder="Describa la corrección realizada..."
                  value={resolucion}
                  onChange={(e) => setResolucion(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitResolucion}
                  disabled={resolveNC.isPending || uploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {uploading ? 'Subiendo...' : resolveNC.isPending ? 'Enviando...' : 'Enviar Corrección'}
                </Button>
              </div>
            </div>
          )}

          {/* Re-send button if NC resolved */}
          {(!ncActiva || ncActiva.estado === 'resuelta' || ncActiva.estado === 'cerrada') && isComex && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
              <p className="text-sm mb-3">La objeción ha sido resuelta. Puede re-enviar al proveedor.</p>
              <Button
                size="sm"
                onClick={handleReenviar}
                disabled={updateStepData.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {updateStepData.isPending ? 'Confirmando...' : 'Re-enviar al Proveedor'}
              </Button>
            </div>
          )}

          {!isComex && (!ncActiva || ['resuelta', 'cerrada'].includes(ncActiva?.estado || '')) && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Esperando que COMEX re-envíe al proveedor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
