import type { UserRole, Department } from '@/types/comex';
import { getStepDef } from './stageStepDefinitions';

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
  | 'request_signature'
  | 'complete_step';

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
  'delete_pim',
  'create_nc',
  'resolve_nc',
  'assign_stage',
  'send_email',
  'validate_bank_account',
  'request_signature',
  'complete_step',
];

const ANALISTA_ACTIONS: PIMAction[] = [
  'view_pim',
  'toggle_checklist',
  'upload_document',
  'add_note',
  'send_email',
  'complete_step',
];

const ALL_ACTIONS: PIMAction[] = [...JEFE_ACTIONS];

const GERENTE_ACTIONS: PIMAction[] = [...JEFE_ACTIONS];

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

// ---------------------------------------------------------------------------
// Step-level authorization (role + department)
// ---------------------------------------------------------------------------

/** Roles that bypass department restrictions */
const ADMIN_ROLES: UserRole[] = ['admin', 'manager', 'gerente'];

/**
 * Check whether a user can complete a specific tracking step.
 *
 * Admin / manager / gerente → always true (bypass).
 * Others → must have `complete_step` permission AND their department must
 * be listed in the step's `requiredDepartment` array.
 */
export function canCompleteStep(
  userRole: UserRole | undefined,
  userDepartment: string | undefined,
  stageKey: string,
  stepKey: string,
): boolean {
  if (!userRole) return false;
  if (ADMIN_ROLES.includes(userRole)) return true;
  if (!canDo(userRole, 'complete_step')) return false;

  // If no department info → deny (safety default)
  if (!userDepartment) return false;

  const stepDef = getStepDef(stageKey, stepKey);
  // If step defines no department restriction → anyone with complete_step can do it
  if (!stepDef?.requiredDepartment || stepDef.requiredDepartment.length === 0) return true;

  return stepDef.requiredDepartment.includes(userDepartment as Department);
}

/**
 * Human-readable label for the departments required by a step.
 * Returns e.g. "FINANZAS" or "COMEX / GERENCIA".
 */
export function getStepDepartmentLabel(stageKey: string, stepKey: string): string {
  const stepDef = getStepDef(stageKey, stepKey);
  if (!stepDef?.requiredDepartment || stepDef.requiredDepartment.length === 0) return '';
  return stepDef.requiredDepartment.map((d) => d.toUpperCase()).join(' / ');
}
