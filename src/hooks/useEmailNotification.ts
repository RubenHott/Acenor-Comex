import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EmailPayload } from '@/lib/emailTriggers';

function generateId() {
  return crypto.randomUUID();
}

interface SendEmailVars {
  payload: EmailPayload;
  pimId: string;
  stageKey?: string;
  usuario: string;
  usuarioId?: string;
}

/**
 * Hook to send email notifications via the send-notification-email Edge Function.
 * Automatically logs the email in pim_activity_log.
 */
export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, pimId, stageKey, usuario, usuarioId }: SendEmailVars) => {
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: payload.to,
          subject: payload.subject,
          htmlBody: payload.htmlBody,
          pimId: payload.pimId || pimId,
          ncId: payload.ncId,
          subprocessKey: payload.subprocessKey,
        },
      });

      if (error) {
        console.error('Email send error:', error);
        // Don't throw — email failure shouldn't block workflow
        await supabase.from('pim_activity_log').insert({
          id: generateId(),
          pim_id: pimId,
          stage_key: stageKey || null,
          tipo: 'email_sent',
          descripcion: `Error enviando email: ${payload.subject} → ${error.message}`,
          usuario,
          usuario_id: usuarioId || null,
          metadata: {
            email_to: payload.to,
            email_subject: payload.subject,
            error: error.message,
            success: false,
          },
        });
        return { success: false, error: error.message };
      }

      // Log success
      await supabase.from('pim_activity_log').insert({
        id: generateId(),
        pim_id: pimId,
        stage_key: stageKey || null,
        tipo: 'email_sent',
        descripcion: `Email enviado: ${payload.subject} → ${payload.to.join(', ')}`,
        usuario,
        usuario_id: usuarioId || null,
        metadata: {
          email_to: payload.to,
          email_subject: payload.subject,
          message_id: data?.messageId,
          success: true,
        },
      });

      return { success: true, messageId: data?.messageId };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['activity-log', vars.pimId] });
    },
  });
}
