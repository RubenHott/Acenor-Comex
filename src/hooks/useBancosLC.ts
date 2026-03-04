import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// --- Types ---

export interface BancoLC {
  id: string;
  nombre: string;
  pais: string | null;
  swift_code: string | null;
  activo: boolean;
  created_at: string;
}

export interface CotizacionLC {
  id: string;
  pim_id: string;
  banco_id: string;
  tasa: number;
  monto_usd: number | null;
  seleccionado: boolean;
  cotizacion_url: string | null;
  observaciones: string | null;
  created_at: string;
  created_by: string | null;
  // Joined
  banco?: BancoLC;
}

// --- Queries ---

/** List all active banks */
export function useBancosLC() {
  return useQuery({
    queryKey: ['bancos-lc'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bancos_carta_credito')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as BancoLC[];
    },
  });
}

/** List LC quotations for a PIM */
export function useCotizacionesLC(pimId?: string) {
  return useQuery({
    queryKey: ['cotizaciones-lc', pimId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotizaciones_lc')
        .select('*, banco:bancos_carta_credito(*)')
        .eq('pim_id', pimId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CotizacionLC[];
    },
    enabled: !!pimId,
  });
}

/** Check if a PIM has a selected bank (for gate validation) */
export function useHasSelectedBank(pimId?: string) {
  return useQuery({
    queryKey: ['cotizaciones-lc-selected', pimId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotizaciones_lc')
        .select('id')
        .eq('pim_id', pimId!)
        .eq('seleccionado', true)
        .limit(1);
      if (error) throw error;
      return (data || []).length > 0;
    },
    enabled: !!pimId,
  });
}

// --- Mutations ---

/** Create a new bank in the catalog */
export function useCreateBancoLC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nombre,
      pais,
      swiftCode,
    }: {
      nombre: string;
      pais?: string;
      swiftCode?: string;
    }) => {
      const { data, error } = await supabase
        .from('bancos_carta_credito')
        .insert({
          nombre,
          pais: pais || null,
          swift_code: swiftCode || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as BancoLC;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos-lc'] });
    },
  });
}

/** Create a new LC quotation */
export function useCreateCotizacionLC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pimId,
      bancoId,
      tasa,
      montoUsd,
      cotizacionUrl,
      observaciones,
      createdBy,
    }: {
      pimId: string;
      bancoId: string;
      tasa: number;
      montoUsd?: number;
      cotizacionUrl?: string;
      observaciones?: string;
      createdBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('cotizaciones_lc')
        .insert({
          pim_id: pimId,
          banco_id: bancoId,
          tasa,
          monto_usd: montoUsd || null,
          cotizacion_url: cotizacionUrl || null,
          observaciones: observaciones || null,
          created_by: createdBy || null,
        })
        .select('*, banco:bancos_carta_credito(*)')
        .single();
      if (error) throw error;
      return data as CotizacionLC;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-lc', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-lc-selected', vars.pimId] });
    },
  });
}

/** Select a bank as the winner for a PIM */
export function useSeleccionarBancoLC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cotizacionId,
      pimId,
    }: {
      cotizacionId: string;
      pimId: string;
    }) => {
      // First, unselect all for this PIM
      const { error: resetError } = await supabase
        .from('cotizaciones_lc')
        .update({ seleccionado: false })
        .eq('pim_id', pimId);
      if (resetError) throw resetError;

      // Then select the winner
      const { error } = await supabase
        .from('cotizaciones_lc')
        .update({ seleccionado: true })
        .eq('id', cotizacionId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-lc', vars.pimId] });
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-lc-selected', vars.pimId] });
    },
  });
}
