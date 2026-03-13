import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPIMs,
  fetchPIM,
  fetchPIMsWithItems,
  createPIM as createPIMService,
  updatePIM as updatePIMService,
  deletePIM as deletePIMService,
} from '@/services/pimService';

// Re-export types from the service layer
export type { PIM, PIMInsert, PIMUpdate } from '@/services/pimService';

// Fetch all PIMs
export function usePIMs() {
  return useQuery({
    queryKey: ['pims'],
    queryFn: fetchPIMs,
  });
}

// Fetch single PIM
export function usePIM(id: string | undefined) {
  return useQuery({
    queryKey: ['pims', id],
    queryFn: () => fetchPIM(id!),
    enabled: !!id,
  });
}

// Fetch PIMs with items
export function usePIMsWithItems() {
  return useQuery({
    queryKey: ['pims', 'with-items'],
    queryFn: fetchPIMsWithItems,
  });
}

// Create PIM
export function useCreatePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPIMService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
    },
  });
}

// Update PIM
export function useUpdatePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: import('@/services/pimService').PIMUpdate }) =>
      updatePIMService(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['pims', variables.id] });
    },
  });
}

// Delete PIM (and its items)
export function useDeletePIM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePIMService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pims'] });
      queryClient.invalidateQueries({ queryKey: ['requerimientos'] });
    },
  });
}
