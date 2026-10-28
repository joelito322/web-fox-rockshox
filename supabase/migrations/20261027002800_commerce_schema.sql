-- Commercial identities remain independent of immutable visual revisions.
create table public.store_offers (
 id uuid primary key default gen_random_uuid(), sku text not null unique check(length(sku) between 1 and 100),
 component_id uuid not null references public.components on delete restrict,
 label text not null check(length(btrim(label)) between 1 and 250), commercial_identity jsonb not null check(jsonb_typeof(commercial_identity)='object' and pg_column_size(commercial_identity)<8192),
 unit_of_sale text not null check(unit_of_sale in ('unit','pair','set')), base_price_cents bigint not null check(base_price_cents between 1 and 100000000),
 currency text not null default 'PEN' check(currency='PEN'), stock_total integer not null check(stock_total between 0 and 1000000),
 active boolean not null default false, revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users on delete set null
);
create table public.store_offer_variants (
 variant_id uuid not null references public.component_variants on delete restrict, finish_id text not null,
 offer_id uuid not null references public.store_offers on delete restrict, primary key(variant_id,finish_id)
);
create index on public.store_offer_variants(offer_id);
create index on public.store_offers(component_id,active,id);
create table public.promotions (
 id uuid primary key default gen_random_uuid(), name text not null check(length(btrim(name)) between 1 and 150),
 discount_type text not null check(discount_type in ('percentage','fixed')), percentage_bps integer, fixed_discount_cents bigint, currency text,
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at), active boolean not null default false,
 revision integer not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users on delete set null,
 check((discount_type='percentage' and percentage_bps between 1 and 9999 and percentage_bps is not null and fixed_discount_cents is null and currency is null)
 or (discount_type='fixed' and percentage_bps is null and fixed_discount_cents between 1 and 99999999 and fixed_discount_cents is not null and currency='PEN' and currency is not null))
);
create table public.promotion_offers (
 promotion_id uuid not null references public.promotions on delete restrict, offer_id uuid not null references public.store_offers on delete restrict,
 primary key(promotion_id,offer_id)
);
create index on public.promotion_offers(offer_id);
create table public.carts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users on delete cascade,
 revision integer not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cart_items (
 cart_id uuid not null references public.carts on delete cascade, offer_id uuid not null references public.store_offers on delete restrict,
 quantity integer not null check(quantity between 1 and 99), updated_at timestamptz not null default now(), primary key(cart_id,offer_id)
);
create table public.sales_quotes (
 id uuid primary key, user_id uuid not null references auth.users on delete restrict, series_id uuid not null,
 version integer not null check(version>0), request_hash text not null, status text not null default 'requested' check(status in ('requested','quoted','rejected','superseded','consumed')),
 revision integer not null default 1 check(revision>0), source_build_id uuid references public.builds on delete set null,
 selection_snapshot jsonb not null check(jsonb_typeof(selection_snapshot)='array' and pg_column_size(selection_snapshot)<131072), selection_hash text not null,
 assembly_requested boolean not null, technical_review text not null check(technical_review in ('not_required','pending','approved','rejected')),
 review_notes text check(length(review_notes)<=4000), reviewed_by uuid references auth.users on delete set null, reviewed_at timestamptz,
 currency text not null default 'PEN' check(currency='PEN'), merchandise_snapshot jsonb not null,
 assembly_fee_cents bigint check(assembly_fee_cents between 0 and 100000000), delivery_method text not null check(delivery_method in ('pickup','shipping')),
 delivery_snapshot jsonb not null check(jsonb_typeof(delivery_snapshot)='object' and pg_column_size(delivery_snapshot)<8192),
 contact_snapshot jsonb not null check(jsonb_typeof(contact_snapshot)='object' and pg_column_size(contact_snapshot)<8192),
 delivery_fee_cents bigint check(delivery_fee_cents between 0 and 100000000), expires_at timestamptz, quoted_by uuid references auth.users on delete set null, quoted_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(series_id,version),
 check(status not in ('quoted','consumed') or (assembly_fee_cents is not null and delivery_fee_cents is not null and expires_at is not null and quoted_at is not null and (not assembly_requested or technical_review='approved')))
);
create unique index sales_quotes_one_quoted on public.sales_quotes(series_id) where status='quoted';
create index on public.sales_quotes(user_id,created_at,id);
create table public.orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete restrict,
 quote_id uuid unique references public.sales_quotes on delete restrict, status text not null default 'pending' check(status in ('pending','confirmed','preparing','ready','delivered','cancelled','expired')),
 mode text not null default 'demo' check(mode='demo'), currency text not null default 'PEN' check(currency='PEN'),
 assembly_fee_cents bigint not null check(assembly_fee_cents between 0 and 100000000), delivery_fee_cents bigint not null check(delivery_fee_cents between 0 and 100000000),
 total_cents bigint not null check(total_cents between 1 and 1000000000000), delivery_method text not null check(delivery_method in ('pickup','shipping')),
 delivery_snapshot jsonb not null, contact_snapshot jsonb not null, accepted_summary_hash text not null,
 reservation_expires_at timestamptz not null, idempotency_key uuid not null, request_hash text not null,
 revision integer not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 confirmed_at timestamptz, cancelled_at timestamptz, cancellation_reason text check(length(cancellation_reason)<=2000), unique(user_id,idempotency_key)
);
create index on public.orders(user_id,created_at,id);
create index on public.orders(status,reservation_expires_at) where status='pending';
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete restrict,
 offer_id uuid not null references public.store_offers on delete restrict, quantity integer not null check(quantity between 1 and 99),
 sku_snapshot text not null, label_snapshot text not null, finish_snapshot text not null, unit_of_sale_snapshot text not null, commercial_identity_snapshot jsonb not null,
 base_unit_price_cents bigint not null check(base_unit_price_cents between 1 and 100000000), unit_discount_cents bigint not null check(unit_discount_cents>=0 and unit_discount_cents<base_unit_price_cents),
 promotion_id uuid references public.promotions on delete restrict, promotion_snapshot jsonb, unique(order_id,offer_id)
);
create index on public.order_items(offer_id,order_id);
create table public.payment_attempts (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete restrict,
 method text not null check(method in ('yape_demo','transfer_demo','card_demo')), status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
 amount_cents bigint not null check(amount_cents>0), currency text not null check(currency='PEN'), idempotency_key uuid not null,
 created_at timestamptz not null default now(), resolved_at timestamptz, unique(order_id,idempotency_key)
);
create unique index payment_attempts_one_success on public.payment_attempts(order_id) where status='approved';
create index on public.payment_attempts(order_id,created_at,id);
create table public.order_events (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete restrict,
 event_type text not null, actor_id uuid references auth.users on delete set null, actor_kind text not null check(actor_kind in ('customer','staff','system')),
 from_status text, to_status text, reason text, created_at timestamptz not null default now()
);
create index on public.order_events(order_id,created_at,id);
-- All data access is via projections/transactional RPCs. No direct REST DML.
do $$declare t text;begin
 foreach t in array array['store_offers','store_offer_variants','promotions','promotion_offers','carts','cart_items','sales_quotes','orders','order_items','payment_attempts','order_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end$$;
insert into iam.permissions(code,name,description,area) values
 ('sales.offers.manage','Gestionar ofertas','Editar precios y stock de demostración','Ventas'),
 ('sales.promotions.manage','Gestionar promociones','Editar campañas y sus productos','Ventas'),
 ('sales.quotes.manage','Gestionar cotizaciones','Revisar armado y cotizar entrega','Ventas'),
 ('sales.orders.manage','Gestionar pedidos','Atender y cancelar pedidos de demostración','Ventas');
insert into iam.role_permissions(role_id,permission_code) select r.id,p.code from iam.roles r cross join iam.permissions p where r.key='admin' and p.area='Ventas';

create function public.sales_policy() returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('mode','demo','currency','PEN','reservation_minutes',coalesce(nullif(current_setting('app.sales.reservation_minutes',true),''),'30')::integer,
 'quote_hours',coalesce(nullif(current_setting('app.sales.quote_hours',true),''),'48')::integer,'pickup_fee_cents',0,'max_quantity',99)
$$;
revoke all on function public.sales_policy() from public;
grant execute on function public.sales_policy() to anon,authenticated;
create function public._sales_account() returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users u join iam.user_roles ur on ur.user_id=u.id join iam.roles r on r.id=ur.role_id where u.id=auth.uid() and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<clock_timestamp()) and r.active) then
 raise exception 'sales_account_disabled' using errcode='42501';end if;return auth.uid();
end$$;
revoke all on function public._sales_account() from public,anon,authenticated;
create function public._sales_identity(p_variant uuid,p_finish text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('component_id',v.component_id,'category',c.category,'generation',v.generation,'year',v.model_year,'finish',f->>'label','finish_id',p_finish,'measures',
  (select coalesce(jsonb_object_agg(k,val),'{}'::jsonb) from jsonb_each(v.specs) x(k,val) where k in ('size_label','wheel_front','wheel_rear','wheel_format','wheel_bsd_mm','travel_mm','eye_to_eye_mm','stroke_mm','offset_mm','rotor_diameter_mm','commercial_size','etrto','speed_count','shell_standard','spindle_standard','length_mm','width_mm','clamp_diameter_mm','axle_standard','spring_type','piston_count','rise_mm','steerer_standard','freehub_standard','actuation','associated_shifter','axle_diameter_mm','axle_width_mm','backsweep_deg','bar_clamp_diameter_mm','bb_shell','bb_shell_fit','bead_type','body_material','brake_mount','cage','caliper_model','casing','chain_system','chainline_mm','chainring','compound','connector','construction','crank_length_mm','crown_type','cup_type','damping_system','derailleur_mount','diameter_mm','direct_mount_interface','ecosystem','erd_mm','fluid','fork_layout','headset_standard','hose','inner_width_mm','insertion_mm','lever_model','link_count','material','max_sprocket_teeth','min_sprocket_teeth','mount_standard','mount_type','nominal_speed_count','outer_width_mm','pedal_type','platform_length_mm','platform_thickness_mm','platform_width_mm','position','profile_height_mm','rail_interface','rear_axle_standard','rear_travel_mm','reservoir','rise_mm','rotor_mount','rotor_thickness_mm','seat_clamp_diameter_mm','seatpost_diameter_mm','shell_width_mm','shock_fit','spindle_material','spoke_hole_count','sprocket_teeth','stanchion_diameter_mm','steerer_diameter_mm','suspension_type','thread_standard','tire_width_mm','tpi','tubeless','upsweep_deg')))
 from public.component_variants v join public.components c on c.id=v.component_id cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f
 where v.id=p_variant and f->>'id'=p_finish and v.representation<>'generic'
$$;
revoke all on function public._sales_identity(uuid,text) from public,anon,authenticated;
create function public._sales_link_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare identity jsonb; offer public.store_offers;
begin
 select * into strict offer from public.store_offers where id=new.offer_id;
 identity=public._sales_identity(new.variant_id,new.finish_id);
 if identity is null or identity is distinct from offer.commercial_identity then raise exception 'sales_identity_mismatch' using errcode='22023';end if;
 return new;
end$$;
revoke all on function public._sales_link_guard() from public,anon,authenticated;
create trigger sales_link_guard before insert or update on public.store_offer_variants for each row execute function public._sales_link_guard();
create function public._sales_catalog_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.store_offer_variants l join public.store_offers o on o.id=l.offer_id where l.variant_id=new.id and public._sales_identity(new.id,l.finish_id) is distinct from o.commercial_identity) then raise exception 'sales_identity_in_use' using errcode='22023';end if;return new;
end$$;
revoke all on function public._sales_catalog_guard() from public,anon,authenticated;
create trigger sales_catalog_guard after update on public.component_variants for each row execute function public._sales_catalog_guard();
