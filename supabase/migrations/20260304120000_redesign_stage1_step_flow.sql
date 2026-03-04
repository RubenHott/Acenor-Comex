-- =============================================
-- Redesign Stage 1: Step-based flow
-- =============================================

-- 1. New table: pim_stage_steps (sub-steps per stage)
CREATE TABLE IF NOT EXISTS pim_stage_steps (
  id text PRIMARY KEY,
  pim_id text NOT NULL REFERENCES pims(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  step_key text NOT NULL,
  step_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pendiente',
  completado_por text,
  completado_por_nombre text,
  completado_en timestamptz,
  datos jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(pim_id, stage_key, step_key)
);

ALTER TABLE pim_stage_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pim_stage_steps_select" ON pim_stage_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "pim_stage_steps_insert" ON pim_stage_steps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "pim_stage_steps_update" ON pim_stage_steps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "pim_stage_steps_delete" ON pim_stage_steps FOR DELETE TO authenticated USING (true);

-- 2. New columns on cuentas_bancarias_proveedor for Gerencia approval
ALTER TABLE cuentas_bancarias_proveedor ADD COLUMN IF NOT EXISTS aprobada_gerencia boolean DEFAULT false;
ALTER TABLE cuentas_bancarias_proveedor ADD COLUMN IF NOT EXISTS aprobada_gerencia_por text;
ALTER TABLE cuentas_bancarias_proveedor ADD COLUMN IF NOT EXISTS fecha_aprobacion_gerencia timestamptz;
