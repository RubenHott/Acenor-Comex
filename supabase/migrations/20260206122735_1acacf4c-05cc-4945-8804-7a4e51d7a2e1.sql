-- Allow updating pim_items
CREATE POLICY "Permitir actualización de pim_items"
ON public.pim_items
FOR UPDATE
USING (true);