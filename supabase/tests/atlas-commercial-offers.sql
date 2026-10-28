-- Current ATLAS physical offers; all changes and identities roll back.
begin;
do $$declare actor uuid=gen_random_uuid();begin
 insert into auth.users(id,email,email_confirmed_at) values(actor,'validation-atlas-prices-'||actor||'@example.invalid',now());
 update iam.user_roles set role_id=(select id from iam.roles where key='admin') where user_id=actor;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
end$$;
create temporary table atlas_test_offers as select o.*,l.variant_id,l.finish_id from public.store_offers o join public.store_offer_variants l on l.offer_id=o.id where o.sku like 'ATLAS-%';
grant select on atlas_test_offers to authenticated;
do $$begin if exists(select 1 from atlas_test_offers where public._sales_identity(variant_id,'not-a-finish') is not null) then raise exception 'Invalid finish became sellable';end if;end$$;
set local role authenticated;
do $$declare reviewed record; offers jsonb; choices jsonb; count_offers integer=0; before_revision integer; data jsonb; old_cents bigint; after_offer record;begin
 choices=public.sales_admin_choices('ATLAS');
 if jsonb_array_length(choices)<>6 then raise exception 'ATLAS choices must expose six current variants';end if;
 for reviewed in select * from atlas_test_offers loop
  count_offers=count_offers+1;
  offers=public.sales_offers(null,array[reviewed.variant_id]);
  if jsonb_array_length(offers)<>1 or offers->0->>'offer_id'<>reviewed.id::text or (offers->0->>'unit_cents')::bigint<>reviewed.base_price_cents then raise exception 'ATLAS public price mismatch';end if;
  data=jsonb_build_object('id',reviewed.id,'sku',reviewed.sku,'label',reviewed.label,'unit_of_sale',reviewed.unit_of_sale,'base_price_cents',reviewed.base_price_cents+100,'stock_total',reviewed.stock_total+1,'active',true,'item_condition',reviewed.item_condition,'choices',jsonb_build_array(jsonb_build_object('variant_id',reviewed.variant_id,'finish_id',reviewed.finish_id)));
  perform public.sales_save_offer(data,reviewed.revision);
 end loop;
 if count_offers<>6 then raise exception 'Expected six ATLAS offer links';end if;
 raise notice 'Six ATLAS offers: prices readable, administrator price/stock edits authorized, invalid finishes rejected';
end$$;
rollback;
