import { useAuth } from '@/contexts/AuthContext';
import { canDo, type PIMAction } from '@/lib/permissions';
import type { UserRole } from '@/types/comex';

export function useCanDo(action: PIMAction): boolean {
  const { user } = useAuth();
  return canDo(user?.role, action);
}

export function usePIMPermissions() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  return {
    canToggleChecklist: canDo(role, 'toggle_checklist'),
    canUploadDocument: canDo(role, 'upload_document'),
    canDeleteDocument: canDo(role, 'delete_document'),
    canAddNote: canDo(role, 'add_note'),
    canAdvanceStage: canDo(role, 'advance_stage'),
    canReturnStage: canDo(role, 'return_stage'),
    canSplitPIM: canDo(role, 'split_pim'),
    canEditPIM: canDo(role, 'edit_pim'),
    canDeletePIM: canDo(role, 'delete_pim'),
    canCreateNC: canDo(role, 'create_nc'),
    canResolveNC: canDo(role, 'resolve_nc'),
    canAssignStage: canDo(role, 'assign_stage'),
    canSendEmail: canDo(role, 'send_email'),
    canValidateBankAccount: canDo(role, 'validate_bank_account'),
    canRequestSignature: canDo(role, 'request_signature'),
  };
}
