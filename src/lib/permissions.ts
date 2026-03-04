import type { UserRole } from '@/types/comex';

export type PIMAction =
  | 'view_pim'
  | 'toggle_checklist'
  | 'upload_document'
  | 'delete_document'
  | 'add_note'
  | 'advance_stage'
  | 'return_stage'
  | 'split_pim'
  | 'edit_pim'
  | 'delete_pim'
  | 'create_nc'
  | 'resolve_nc'
  | 'assign_stage'
  | 'send_email'
  | 'validate_bank_account'
  | 'request_signature';

const JEFE_ACTIONS: PIMAction[] = [
  'view_pim',
  'toggle_checklist',
  'upload_document',
  'delete_document',
  'add_note',
  'advance_stage',
  'return_stage',
  'split_pim',
  'edit_pim',
  'create_nc',
  'resolve_nc',
  'assign_stage',
  'send_email',
  'validate_bank_account',
  'request_signature',
];

const ANALISTA_ACTIONS: PIMAction[] = [
  'view_pim',
  'toggle_checklist',
  'upload_document',
  'add_note',
  'complete_subprocess',
  'send_email',
];

const ALL_ACTIONS: PIMAction[] = [...JEFE_ACTIONS, 'delete_pim'];

const GERENTE_ACTIONS: PIMAction[] = [
  ...JEFE_ACTIONS,
  'delete_pim',
];

const ROLE_PERMISSIONS: Record<UserRole, PIMAction[]> = {
  admin: ALL_ACTIONS,
  manager: ALL_ACTIONS,
  gerente: GERENTE_ACTIONS,
  jefe_comex: JEFE_ACTIONS,
  jefe_finanzas: JEFE_ACTIONS,
  analista_comex: ANALISTA_ACTIONS,
  analista_finanzas: ANALISTA_ACTIONS,
  viewer: ['view_pim'],
};

export function canDo(role: UserRole | undefined, action: PIMAction): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function canDoAny(role: UserRole | undefined, actions: PIMAction[]): boolean {
  if (!role) return false;
  return actions.some((a) => canDo(role, a));
}
