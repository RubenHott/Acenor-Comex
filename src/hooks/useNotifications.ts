import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type Notification = Tables<'notificaciones'>;

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
      return data;
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
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
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
        .update({ leido: true })
        .eq('destinatario_id', userId)
        .eq('leido', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
}
