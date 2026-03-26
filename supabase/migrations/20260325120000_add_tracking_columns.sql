-- Add separate tracking columns for Planta, Cerrillos, Banco destinations
ALTER TABLE pims ADD COLUMN IF NOT EXISTS tracking_planta text;
ALTER TABLE pims ADD COLUMN IF NOT EXISTS tracking_cerrillos text;
ALTER TABLE pims ADD COLUMN IF NOT EXISTS tracking_banco text;
