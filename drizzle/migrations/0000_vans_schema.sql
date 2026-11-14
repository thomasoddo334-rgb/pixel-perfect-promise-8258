CREATE TABLE public.allowed_emails (
  email text PRIMARY KEY
);
GRANT ALL ON public.allowed_emails TO service_role;
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO public.allowed_emails (email) VALUES
  ('thomasoddo3@gmail.com'),
  ('mmmargotouvrard@gmail.com');

CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails
    WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;
REVOKE ALL ON FUNCTION public.is_allowed_user() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_allowed_user() TO authenticated;

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  marque text NOT NULL DEFAULT '',
  modele text NOT NULL DEFAULT '',
  plaque text NOT NULL DEFAULT '',
  annee integer,
  kilometrage integer,
  motorisation text NOT NULL DEFAULT '',
  boite text,
  carburant text,
  places integer,
  couchages integer,
  prix integer,
  equipements text[] NOT NULL DEFAULT '{}',
  wof boolean NOT NULL DEFAULT false,
  disponibilite text NOT NULL DEFAULT 'Disponible',
  remarque text NOT NULL DEFAULT '',
  publication text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_by_name text
);
GRANT SELECT, INSERT, UPDATE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users read vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed users insert vehicles" ON public.vehicles
  FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed users update vehicles" ON public.vehicles
  FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

CREATE INDEX vehicles_updated_at_idx ON public.vehicles (updated_at);

CREATE POLICY "Allowed users read van photos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'van-photos' AND public.is_allowed_user());
CREATE POLICY "Allowed users upload van photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'van-photos' AND public.is_allowed_user());
CREATE POLICY "Allowed users update van photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'van-photos' AND public.is_allowed_user());
CREATE POLICY "Allowed users delete van photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'van-photos' AND public.is_allowed_user());