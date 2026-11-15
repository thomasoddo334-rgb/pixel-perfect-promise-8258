ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP FUNCTION IF EXISTS public.get_public_vehicles();
CREATE FUNCTION public.get_public_vehicles()
RETURNS TABLE(id uuid, reference text, marque text, modele text, annee integer, kilometrage integer, motorisation text, boite text, carburant text, places integer, couchages integer, prix numeric, equipements text[], wof boolean, disponibilite text, publication text, photos jsonb, videos jsonb, updated_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select v.id, v.reference, v.marque, v.modele, v.annee::integer, v.kilometrage::integer, v.motorisation,
         v.boite, v.carburant, v.places::integer, v.couchages::integer, v.prix::numeric, v.equipements, v.wof,
         v.disponibilite, v.publication, v.photos, coalesce(v.videos, '[]'::jsonb), v.updated_at::timestamptz
  from public.vehicles v
  where v.deleted = false
    and v.publication in ('pret', 'publie')
$function$;
REVOKE ALL ON FUNCTION public.get_public_vehicles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vehicles() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_public_van_video(_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.vehicles v
    where v.id::text = split_part(_name, '/', 1)
      and v.deleted = false
      and v.publication in ('pret', 'publie')
      and v.videos @> jsonb_build_array(
        jsonb_build_object('id', split_part(split_part(_name, '/', 2), '.', 1))
      )
  )
$function$;
REVOKE ALL ON FUNCTION public.is_public_van_video(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_van_video(text) TO anon, authenticated, service_role;

CREATE POLICY "Allowed users read van videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'van-videos' AND public.is_allowed_user());
CREATE POLICY "Allowed users upload van videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'van-videos' AND public.is_allowed_user());
CREATE POLICY "Allowed users update van videos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'van-videos' AND public.is_allowed_user());
CREATE POLICY "Allowed users delete van videos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'van-videos' AND public.is_allowed_user());
CREATE POLICY "Visitors view videos of public vans" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'van-videos' AND public.is_public_van_video(name));