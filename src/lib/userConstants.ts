import type { UserRole, Department } from '@/types/comex';

export const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'manager', label: 'Manager' },
  { value: 'jefe_comex', label: 'Jefe Comex' },
  { value: 'analista_comex', label: 'Analista Comex' },
  { value: 'jefe_finanzas', label: 'Jefe Finanzas' },
  { value: 'analista_finanzas', label: 'Analista Finanzas' },
  { value: 'viewer', label: 'Visualizador' },
];

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'comex', label: 'Comercio Exterior' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'sistemas', label: 'Sistemas' },
];

export const MODULES: { value: string; label: string }[] = [
  { value: 'comex', label: 'Comercio Exterior' },
  { value: 'work-orders', label: 'Órdenes de Trabajo' },
  { value: 'production', label: 'Producción' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'analytics', label: 'Analítica' },
  { value: 'logistics', label: 'Logística' },
];

export function getRoleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function getDepartmentLabel(dept: string): string {
  return DEPARTMENTS.find((d) => d.value === dept)?.label ?? dept;
}
