import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { canDo } from '@/lib/permissions';
import type { UserRole } from '@/types/comex';

// --- Types ---

export type NCTipo =
  | 'discrepancia_contrato'
  | 'discrepancia_monto'
  | 'discrepancia_documentos'
  | 'discrepancia_lc'
  | 'error_datos_bancarios'
  | 'problema_calidad'
  | 'problema_cantidad'
  | 'problema_costeo'
  | 'otro';

export type NCEstado = 'abierta' | 'en_revision' | 'resuelta' | 'cerrada';
export type NCPrioridad = 'baja' | 'media' | 'alta' | 'critica';

export interface NoConformidad {
  id: string;
  pim_id: string;
  stage_key: string;
  subproceso_key: string | null;
  codigo: string;
  tipo: NCTipo;
  descripcion: string;
  estado: NCEstado;
  prioridad: NCPrioridad;
  departamento_asignado: string | null;
  asignado_a: string | null;
  creado_por: string;
  resuelto_por: string | null;
  fecha_creacion: string;
  fecha_limite: string | null;
  fecha_resolucion: string | null;
  resolucion: string | null;
  evidencia_url: string | null;
  metadata: Record<string, unknown> | null;
}

export type NCIteracionTipo = 'observacion' | 'correccion_proveedor' | 'respuesta_interna';

export interface NCIteracion {
  id: string;
  nc_id: string;
  numero_iteracion: number;
  tipo: NCIteracionTipo;
  descripcion: string;
  adjuntos: { nombre: string; url: string; subido_por: string }[] | null;
  creado_por: string;
  creado_por_nombre: string | null;
  email_enviado: boolean;
  email_destinatarios: { email: string; tipo: string }[] | null;
  created_at: string;
}

export const NC_ITERACION_TIPOS: { value: NCIteracionTipo; label: string }[] = [
  { value: 'observacion', label: 'Observacion interna' },
  { value: 'correccion_proveedor', label: 'Correccion de proveedor' },
  { value: 'respuesta_interna', label: 'Respuesta interna' },
];

export const NC_TIPOS: { value: NCTipo; label: string }[] = [
  { value: 'discrepancia_contrato', label: 'Discrepancia en Contrato' },
  { value: 'discrepancia_monto', label: 'Discrepancia en Monto' },
  { value: 'discrepancia_documentos', label: 'Discrepancia en Documentos' },
  { value: 'discrepancia_lc', label: 'Discrepancia en Carta de Crédito' },
  { value: 'error_datos_bancarios', label: 'Error en Datos Bancarios' },
  { value: 'problema_calidad', label: 'Problema de Calidad' },
  { value: 'problema_cantidad', label: 'Problema de Cantidad' },
  { value: 'problema_costeo', label: 'Problema de Costeo' },
  { value: 'otro', label: 'Otro' },
];

export const NC_PRIORIDADES: { value: NCPrioridad; label: string; color: string }[] = [
  { value: 'baja', label: 'Baja', color: '#6B7280' },
  { value: 'media', label: 'Media', color: '#F59E0B' },
  { value: 'alta', label: 'Alta', color: '#EF4444' },
  { value: 'critica', label: 'Crítica', color: '#DC2626' },
];

export const NC_ESTADOS: { value: NCEstado; label: string; color: string }[] = [
  { value: 'abierta', label: 'Abierta', color: '#EF4444' },
  { value: 'en_revision', label: 'En Revisión', color: '#F59E0B' },
  { value: 'resuelta', label: 'Resuelta', color: '#10B981' },
  { value: 'cerrada', label: 'Cerrada', color: '#6B7280' },
];

function generateId() {
  return crypto.randomUUID();
}

// --- Queries ---

/** All NCs for a PIM */
export function useNCsByPIM(pimId?: string) {
  return useQuery({
    queryKey: ['no-conformidades', pimId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('no_conformidades')
        .select('*')
        .eq('pim_id', pimId!)
        .order('fecha_creacion', { ascending: false });
      if (error) throw error;
      return data as NoConformidad[];
    },
    enabled: !!pimId,
  });
}

/** NCs for a specific stage */
export function useNCsByStage(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['no-conformidades', pimId, stageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('no_conformidades')
        .select('*')
        .eq('pim_id', pimId!)
        .eq('stage_key', stageKey!)
        .order('fecha_creacion', { ascending: false });
      if (error) throw error;
      return data as NoConformidad[];
    },
    enabled: !!pimId && !!stageKey,
  });
}

/** Count of open NCs for a stage (for gate validation) */
export function useOpenNCCount(pimId?: string, stageKey?: string) {
  return useQuery({
    queryKey: ['nc-open-count', pimId, stageKey],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('no_conformidades')
        .select('id', { count: 'exact', head: true })
        .eq('pim_id', pimId!)
        .eq('stage_key', stageKey!)
        .in('estado', ['abierta', 'en_revision']);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!pimId && !!stageKey,
  });
}

/** NC iterations (correction cycles) */
export function useNCIterations(ncId?: string) {
  return useQuery({
    queryKey: ['nc-iterations', ncId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nc_iteraciones')
        .select('*')
        .eq('nc_id', ncId!)
        .order('numero_iteracion', { ascending: true });
      if (error) throw error;
      return data as NCIteracion[];
    },
    enabled: !!ncId,
  });
}

// --- Mutations ---

/** Add iteration to NC */
export function useAddNCIteration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ncId,
      pimId,
      stageKey,
      ncCodigo,
      tipo,
      descripcion,
      adjuntos,
      creadoPor,
      creadoPorNombre,
    }: {
      ncId: string;
      pimId: string;
      stageKey: string;
      ncCodigo: string;
      tipo: NCIteracionTipo;
      descripcion: string;
      adjuntos?: { nombre: string; url: string; subido_por: string }[];
      creadoPor: string;
      creadoPorNombre: string;
    }) => {
      // Get next iteration number
      const { count } = await supabase
        .from('nc_iteraciones')
        .select('id', { count: 'exact', head: true })
        .eq('nc_id', ncId);

      const nextNum = (count || 0) + 1;

      const { data, error } = await supabase
        .from('nc_iteraciones')
        .insert({
          id: generateId(),
          nc_id: ncId,
          numero_iteracion: nextNum,
          tipo,
          descripcion,
          adjuntos: adjuntos || null,
          creado_por: creadoPor,
          creado_por_nombre: creadoPorNombre,
        })
        .select()
        .single();
      if (error) throw error;

      const tipoLabel = NC_ITERACION_TIPOS.find((t) => t.value === tipo)?.label || tipo;
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'nc_iteration',
        descripcion: `NC ${ncCodigo}: ${tipoLabel} (iteracion #${nextNum})`,
        usuario: creadoPorNombre,
        usuario_id: creadoPor,
        metadata: { nc_id: ncId, nc_codigo: ncCodigo, iteration_num: nextNum, iteration_tipo: tipo },
      });

      return data as NCIteracion;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['nc-iterations', vars.ncId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}

/** Reopen a resolved NC (proveedor sent insufficient correction) */
export function useReopenNC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ncId,
      pimId,
      stageKey,
      ncCodigo,
      motivo,
      usuario,
      usuarioId,
      subprocesoKey,
    }: {
      ncId: string;
      pimId: string;
      stageKey: string;
      ncCodigo: string;
      motivo: string;
      usuario: string;
      usuarioId: string;
    }) => {
      const { error } = await supabase
        .from('no_conformidades')
        .update({
          estado: 'abierta' as NCEstado,
          resolucion: null,
          resuelto_por: null,
          fecha_resolucion: null,
        })
        .eq('id', ncId);
      if (error) throw error;

      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'nc_status_change',
        descripcion: `NC ${ncCodigo} reabierta: ${motivo}`,
        usuario,
        usuario_id: usuarioId,
        metadata: { nc_id: ncId, motivo, reopen: true },
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['no-conformidades', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['nc-open-count', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

/** Create a new NC */
export function useCreateNC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      stageKey,
      tipo,
      descripcion,
      prioridad,
      departamentoAsignado,
      asignadoA,
      fechaLimite,
      creadoPor,
      creadoPorNombre,
      userRole,
    }: {
      pimId: string;
      stageKey: string;
      tipo: NCTipo;
      descripcion: string;
      prioridad: NCPrioridad;
      departamentoAsignado?: string;
      asignadoA?: string;
      fechaLimite?: string;
      creadoPor: string;
      creadoPorNombre: string;
      userRole?: UserRole;
    }) => {
      if (userRole && !canDo(userRole, 'create_nc')) {
        throw new Error('No tienes permiso para crear no conformidades');
      }

      const ncId = generateId();

      const { data, error } = await supabase
        .from('no_conformidades')
        .insert({
          id: ncId,
          pim_id: pimId,
          stage_key: stageKey,
          subproceso_key: null,
          tipo,
          descripcion,
          prioridad,
          departamento_asignado: departamentoAsignado || null,
          asignado_a: asignadoA || null,
          fecha_limite: fechaLimite || null,
          creado_por: creadoPor,
        })
        .select()
        .single();
      if (error) throw error;

      // Log activity
      const tipoLabel = NC_TIPOS.find((t) => t.value === tipo)?.label || tipo;
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'nc_created',
        descripcion: `No conformidad creada: ${data.codigo} - ${tipoLabel}`,
        usuario: creadoPorNombre,
        usuario_id: creadoPor,
        metadata: { nc_id: ncId, nc_codigo: data.codigo, nc_tipo: tipo, prioridad },
      });

      // --- Create in-app notifications for assigned department ---
      if (departamentoAsignado) {
        const { data: pimData } = await supabase.from('pims').select('codigo').eq('id', pimId).single();
        const { data: deptUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('department', departamentoAsignado)
          .eq('active', true);

        if (deptUsers && deptUsers.length > 0) {
          const notifNow = new Date().toISOString();
          await supabase.from('notificaciones').insert(
            deptUsers.map((u) => ({
              id: generateId(),
              destinatario_id: u.id,
              pim_id: pimId,
              tipo: 'nc_created',
              titulo: `NC ${data.codigo} — ${pimData?.codigo || pimId}`,
              mensaje: `Se creo una no conformidad (${tipoLabel}) en su area. ${descripcion.slice(0, 100)}`,
              leido: false,
              prioridad: prioridad === 'critica' || prioridad === 'alta' ? 'alta' : 'normal',
              fecha_creacion: notifNow,
            }))
          );
        }
      }

      return data as NoConformidad;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['no-conformidades', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['nc-open-count', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
}

/** Update NC status (transitions) */
export function useUpdateNCStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ncId,
      pimId,
      stageKey,
      nuevoEstado,
      usuario,
      usuarioId,
      ncCodigo,
    }: {
      ncId: string;
      pimId: string;
      stageKey: string;
      nuevoEstado: NCEstado;
      usuario: string;
      usuarioId: string;
      ncCodigo: string;
    }) => {
      const updates: Record<string, unknown> = { estado: nuevoEstado };

      const { error } = await supabase
        .from('no_conformidades')
        .update(updates)
        .eq('id', ncId);
      if (error) throw error;

      const estadoLabel = NC_ESTADOS.find((e) => e.value === nuevoEstado)?.label || nuevoEstado;
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'nc_status_change',
        descripcion: `NC ${ncCodigo} cambiada a "${estadoLabel}"`,
        usuario,
        usuario_id: usuarioId,
        metadata: { nc_id: ncId, nuevo_estado: nuevoEstado },
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['no-conformidades', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['nc-open-count', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

/** Resolve NC with resolution text and optional evidence */
export function useResolveNC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ncId,
      pimId,
      stageKey,
      resolucion,
      evidenciaUrl,
      usuario,
      usuarioId,
      ncCodigo,
      subprocesoKey,
    }: {
      ncId: string;
      pimId: string;
      stageKey: string;
      resolucion: string;
      evidenciaUrl?: string;
      usuario: string;
      usuarioId: string;
      ncCodigo: string;
    }) => {
      const { error } = await supabase
        .from('no_conformidades')
        .update({
          estado: 'resuelta' as NCEstado,
          resolucion,
          resuelto_por: usuarioId,
          fecha_resolucion: new Date().toISOString(),
          evidencia_url: evidenciaUrl || null,
        })
        .eq('id', ncId);
      if (error) throw error;

      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey,
        tipo: 'nc_resolved',
        descripcion: `NC ${ncCodigo} resuelta: ${resolucion}`,
        usuario,
        usuario_id: usuarioId,
        metadata: { nc_id: ncId, resolucion },
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['no-conformidades', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['nc-open-count', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
    },
  });
}

/** Fetch users by department (for NC assignment) */
export function useUsersByDepartment(department?: string) {
  return useQuery({
    queryKey: ['users-by-dept', department],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, email, role, department')
        .eq('department', department!)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!department,
  });
}
