-- Read-only public catalogue: only vans marked "pret" or "publie", never internal notes.
create or replace function public.get_public_vehicles()
returns table (
  id uuid,
  reference text,
  marque text,
  modele text,
  plaque text,
  annee integer,
  kilometrage integer,
  motorisation text,
  boite text,
  carburant text,
  places integer,
  couchages integer,
  prix numeric,
  equipements text[],
  wof boolean,
  disponibilite text,
  publication text,
  photos jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, v.reference, v.marque, v.modele, v.plaque, v.annee::integer, v.kilometrage::integer, v.motorisation,
         v.boite, v.carburant, v.places::integer, v.couchages::integer, v.prix::numeric, v.equipements, v.wof,
         v.disponibilite, v.publication, v.photos, v.updated_at::timestamptz
  from public.vehicles v
  where v.deleted = false
    and v.publication in ('pret', 'publie')
$$;

revoke all on function public.get_public_vehicles() from public;
grant execute on function public.get_public_vehicles() to anon, authenticated, service_role;

create or replace function public.is_public_van_photo(_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vehicles v
    where v.id::text = split_part(_name, '/', 1)
      and v.deleted = false
      and v.publication in ('pret', 'publie')
      and v.photos @> jsonb_build_array(
        jsonb_build_object('id', regexp_replace(split_part(_name, '/', 2), '\.jpg$', ''))
      )
  )
$$;

revoke all on function public.is_public_van_photo(text) from public;
grant execute on function public.is_public_van_photo(text) to anon, authenticated, service_role;

create policy "Visitors view photos of public vans"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'van-photos' and public.is_public_van_photo(name));