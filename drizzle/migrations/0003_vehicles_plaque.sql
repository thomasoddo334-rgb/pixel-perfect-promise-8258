ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS plaque text NOT NULL DEFAULT '';
