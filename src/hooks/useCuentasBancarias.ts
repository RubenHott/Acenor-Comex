import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function generateId() {
  return crypto.randomUUID();
}

// --- Types ---

export interface CuentaBancaria {
  id: string;
  proveedor_id: string;
  banco: string;
  numero_cuenta: string;
  tipo_cuenta: string | null;
  swift_code: string | null;
  aba_routing: string | null;
  iban: string | null;
  moneda: string;
  pais_banco: string | null;
  titular: string | null;
  validada: boolean;
  validada_por: string | null;
  fecha_validacion: string | null;
  activa: boolean;
  aprobada_gerencia: boolean;
  aprobada_gerencia_por: string | null;
  fecha_aprobacion_gerencia: string | null;
  created_at: string;
  updated_at: string;
}

/** Check if a bank account validation is still valid (< 6 months old) */
export function isCuentaVigente(cuenta: CuentaBancaria): boolean {
  if (!cuenta.validada || !cuenta.fecha_validacion) return false;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return new Date(cuenta.fecha_validacion) > sixMonthsAgo;
}

// --- Queries ---

/** All bank accounts for a supplier */
export function useCuentasBancarias(proveedorId?: string) {
  return useQuery({
    queryKey: ['cuentas-bancarias', proveedorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .select('*')
        .eq('proveedor_id', proveedorId!)
        .eq('activa', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CuentaBancaria[];
    },
    enabled: !!proveedorId,
  });
}

/** Active and validated account */
export function useCuentaBancariaActiva(proveedorId?: string) {
  return useQuery({
    queryKey: ['cuenta-bancaria-activa', proveedorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .select('*')
        .eq('proveedor_id', proveedorId!)
        .eq('activa', true)
        .eq('validada', true)
        .order('fecha_validacion', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CuentaBancaria | null;
    },
    enabled: !!proveedorId,
  });
}

// --- Mutations ---

/** Create a new bank account */
export function useCreateCuentaBancaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proveedorId,
      banco,
      numeroCuenta,
      tipoCuenta,
      swiftCode,
      abaRouting,
      iban,
      moneda,
      paisBanco,
      titular,
    }: {
      proveedorId: string;
      banco: string;
      numeroCuenta: string;
      tipoCuenta?: string;
      swiftCode?: string;
      abaRouting?: string;
      iban?: string;
      moneda?: string;
      paisBanco?: string;
      titular?: string;
    }) => {
      const { data, error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .insert({
          id: generateId(),
          proveedor_id: proveedorId,
          banco,
          numero_cuenta: numeroCuenta,
          tipo_cuenta: tipoCuenta || null,
          swift_code: swiftCode || null,
          aba_routing: abaRouting || null,
          iban: iban || null,
          moneda: moneda || 'USD',
          pais_banco: paisBanco || null,
          titular: titular || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CuentaBancaria;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-bancarias', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-activa', vars.proveedorId] });
    },
  });
}

/** Validate a bank account */
export function useValidarCuentaBancaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cuentaId,
      proveedorId,
      validadaPor,
    }: {
      cuentaId: string;
      proveedorId: string;
      validadaPor: string;
    }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .update({
          validada: true,
          validada_por: validadaPor,
          fecha_validacion: now,
          updated_at: now,
        })
        .eq('id', cuentaId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-bancarias', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-activa', vars.proveedorId] });
    },
  });
}

/** Update bank account */
export function useUpdateCuentaBancaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cuentaId,
      proveedorId,
      updates,
    }: {
      cuentaId: string;
      proveedorId: string;
      updates: Partial<Pick<CuentaBancaria,
        'banco' | 'numero_cuenta' | 'tipo_cuenta' | 'swift_code' |
        'aba_routing' | 'iban' | 'moneda' | 'pais_banco' | 'titular'
      >>;
    }) => {
      const { error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', cuentaId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-bancarias', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-activa', vars.proveedorId] });
    },
  });
}

/** Deactivate a bank account */
export function useDeactivateCuentaBancaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cuentaId,
      proveedorId,
    }: {
      cuentaId: string;
      proveedorId: string;
    }) => {
      const { error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .update({ activa: false, updated_at: new Date().toISOString() })
        .eq('id', cuentaId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-bancarias', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-activa', vars.proveedorId] });
    },
  });
}

/** Get an active, validated, and currently valid (< 6 months) bank account */
export function useCuentaBancariaVigente(proveedorId?: string) {
  return useQuery({
    queryKey: ['cuenta-bancaria-vigente', proveedorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .select('*')
        .eq('proveedor_id', proveedorId!)
        .eq('activa', true)
        .eq('validada', true)
        .order('fecha_validacion', { ascending: false });
      if (error) throw error;

      // Filter by 6-month validity
      const cuentas = (data || []) as CuentaBancaria[];
      return cuentas.find((c) => isCuentaVigente(c)) || null;
    },
    enabled: !!proveedorId,
  });
}

/** Gerencia approves a bank account */
export function useApproveByGerencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cuentaId,
      proveedorId,
      aprobadaPor,
      pimId,
      userName,
    }: {
      cuentaId: string;
      proveedorId: string;
      aprobadaPor: string;
      pimId?: string;
      userName?: string;
    }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .update({
          aprobada_gerencia: true,
          aprobada_gerencia_por: aprobadaPor,
          fecha_aprobacion_gerencia: now,
          updated_at: now,
        })
        .eq('id', cuentaId);
      if (error) throw error;

      // Log activity
      if (pimId) {
        await supabase.from('pim_activity_log').insert({
          id: generateId(),
          pim_id: pimId,
          stage_key: 'revision_contrato',
          tipo: 'bank_approved',
          descripcion: `Cuenta bancaria aprobada por Gerencia`,
          usuario: userName || 'Gerencia',
          usuario_id: aprobadaPor,
          metadata: { cuenta_id: cuentaId },
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-bancarias', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-activa', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-vigente', vars.proveedorId] });
      if (vars.pimId) {
        queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId] });
        queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId] });
        queryClient.invalidateQueries({ queryKey: ['can-advance', vars.pimId] });
        queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      }
    },
  });
}

/** Gerencia rejects a bank account */
export function useRejectByGerencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cuentaId,
      proveedorId,
      rechazadaPor,
      motivo,
      pimId,
      userName,
    }: {
      cuentaId: string;
      proveedorId: string;
      rechazadaPor: string;
      motivo: string;
      pimId?: string;
      userName?: string;
    }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('cuentas_bancarias_proveedor')
        .update({
          aprobada_gerencia: false,
          updated_at: now,
        })
        .eq('id', cuentaId);
      if (error) throw error;

      if (pimId) {
        await supabase.from('pim_activity_log').insert({
          id: generateId(),
          pim_id: pimId,
          stage_key: 'revision_contrato',
          tipo: 'bank_rejected',
          descripcion: `Cuenta bancaria rechazada por Gerencia: ${motivo}`,
          usuario: userName || 'Gerencia',
          usuario_id: rechazadaPor,
          metadata: { cuenta_id: cuentaId, motivo },
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-bancarias', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-activa', vars.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuenta-bancaria-vigente', vars.proveedorId] });
      if (vars.pimId) {
        queryClient.invalidateQueries({ queryKey: ['stage-steps', vars.pimId] });
        queryClient.invalidateQueries({ queryKey: ['current-step', vars.pimId] });
        queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
      }
    },
  });
}
