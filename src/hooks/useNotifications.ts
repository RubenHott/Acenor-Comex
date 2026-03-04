import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  destinatario_id: string;
  pim_id: string | null;
  leido: boolean;
  prioridad: string;
  fecha_creacion: string;
  created_at: string | null;
  updated_at: string | null;
}

// Fetch notifications for a user
export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ['notificaciones', userId],
    queryFn: async () => {
      let query = supabase
        .from('notificaciones')
        .select('*')
        .order('fecha_creacion', { ascending: false })
        .limit(20);

      if (userId) {
        query = query.eq('destinatario_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Notification[];
    },
  });
}

// Get unread count
export function useUnreadNotificationsCount(userId?: string) {
  return useQuery({
    queryKey: ['notificaciones', 'unread-count', userId],
    queryFn: async () => {
      let query = supabase
        .from('notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('leido', false);

      if (userId) {
        query = query.eq('destinatario_id', userId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true, updated_at: new Date().toISOString() })
        .eq('destinatario_id', userId)
        .eq('leido', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
}

/** Create a notification for a specific user */
export function useCreateNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      destinatarioId,
      pimId,
      tipo,
      titulo,
      mensaje,
      prioridad = 'normal',
    }: {
      destinatarioId: string;
      pimId?: string;
      tipo: string;
      titulo: string;
      mensaje: string;
      prioridad?: string;
    }) => {
      const { error } = await supabase.from('notificaciones').insert({
        id: crypto.randomUUID(),
        destinatario_id: destinatarioId,
        pim_id: pimId || null,
        tipo,
        titulo,
        mensaje,
        leido: false,
        prioridad,
        fecha_creacion: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
}

/** Create notifications for all active users in a department */
export function useNotifyDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      department,
      pimId,
      tipo,
      titulo,
      mensaje,
      prioridad = 'normal',
    }: {
      department: string;
      pimId?: string;
      tipo: string;
      titulo: string;
      mensaje: string;
      prioridad?: string;
    }) => {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('department', department)
        .eq('active', true);

      if (!users || users.length === 0) return;

      const now = new Date().toISOString();
      const notifications = users.map((u) => ({
        id: crypto.randomUUID(),
        destinatario_id: u.id,
        pim_id: pimId || null,
        tipo,
        titulo,
        mensaje,
        leido: false,
        prioridad,
        fecha_creacion: now,
      }));

      const { error } = await supabase.from('notificaciones').insert(notifications);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
}

/** Subscribe to realtime notification inserts for a user */
export function useNotificacionesRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `destinatario_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
