ALTER TABLE public.vehicles ADD COLUMN server_updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX vehicles_server_updated_at_idx ON public.vehicles (server_updated_at);

CREATE OR REPLACE FUNCTION public.set_vehicle_server_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.server_updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicles_server_updated_at
BEFORE INSERT OR UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_vehicle_server_updated_at();