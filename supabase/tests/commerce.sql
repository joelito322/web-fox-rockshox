-- Transactional contract regression; every identity and sale is rolled back.
begin;
do $$declare actor uuid=gen_random_uuid(); other uuid=gen_random_uuid(); variant uuid=gen_random_uuid(); choice record;begin
 insert into auth.users(id,email,email_confirmed_at) values(actor,'atlas-commerce-'||actor||'@example.invalid',now()),(other,'atlas-commerce-'||other||'@example.invalid',now());
 update iam.user_roles set role_id=(select id from iam.roles where key='admin') where user_id=actor;
 insert into public.component_variants select (jsonb_populate_record(null::public.component_variants,to_jsonb(v)||jsonb_build_object('id',variant,'generation','ATLAS test '||variant::text))).* from public.component_variants v where v.published and v.selectable and v.representation<>'generic' limit 1;
 select v.id,c.category,f->>'id' finish into strict choice from public.component_variants v join public.components c on c.id=v.component_id cross join lateral jsonb_array_elements(v.allowed_finishes->'options') f where v.id=variant limit 1;
 perform set_config('atlas.sales.aliases',(select jsonb_build_object('current',jsonb_build_array(jsonb_build_object('slot','frame','variantId',a.variant_id,'finishId',a.finish_id,'customColor',null)),'historical',jsonb_build_array(jsonb_build_object('slot','frame','variantId',b.variant_id,'finishId',b.finish_id,'customColor',null)))::text from public.store_offer_variants a join public.store_offer_variants b on b.offer_id=a.offer_id join public.component_variants va on va.id=a.variant_id join public.component_variants vb on vb.id=b.variant_id join public.components c on c.id=va.component_id where va.selectable and not vb.selectable and c.category='frame' limit 1),true);
 perform set_config('atlas.sales.unit',case when choice.category='pedals' then 'pair' when choice.category in ('crankset','rear_derailleur') then 'set' else 'unit' end,true);
 perform set_config('atlas.sales.selection',jsonb_build_array(jsonb_build_object('slot',choice.category,'variantId',choice.id,'finishId',choice.finish,'customColor',null,'technical',jsonb_build_object('name','client forged value')))::text,true);
 perform set_config('atlas.sales.choice',jsonb_build_array(jsonb_build_object('variant_id',choice.id,'finish_id',choice.finish))::text,true);
 perform set_config('atlas.sales.actor',actor::text,true);perform set_config('atlas.sales.other',other::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
end$$;
create function pg_temp.observe_sales_links() returns trigger language plpgsql as $$begin
 perform set_config('atlas.sales.link_writes',(coalesce(nullif(current_setting('atlas.sales.link_writes',true),''),'0')::integer+1)::text,true);return null;
end$$;
create trigger test_observe_sales_links after insert or delete or update on public.store_offer_variants for each row execute function pg_temp.observe_sales_links();
set local role authenticated;
do $$declare id uuid=gen_random_uuid(); data jsonb; cart jsonb; summary jsonb; lines jsonb; order_id uuid; key uuid=gen_random_uuid(); pay_key uuid=gen_random_uuid(); channel text; result jsonb; quote_id uuid=gen_random_uuid(); promo uuid=gen_random_uuid(); contact jsonb='{"name":"Prueba ATLAS","contact":"demo@example.invalid"}';begin
 perform public.sales_save_assembly_tariff((public.sales_policy()->>'service_revision')::integer,15000);
 begin perform public.sales_save_assembly_tariff(0,20000);raise exception 'stale_tariff_write_accepted';exception when sqlstate 'PT409' then null;end;
 data=jsonb_build_object('id',id,'sku','TEST-'||id,'label','Oferta demo transaccional','unit_of_sale',current_setting('atlas.sales.unit'),'base_price_cents',10000,'stock_total',3,'active',true,'item_condition','used','choices',current_setting('atlas.sales.choice')::jsonb);
 perform public.sales_save_offer(data,0);
 perform set_config('atlas.sales.link_writes','0',true);perform public.sales_save_offer(data,1);
 if current_setting('atlas.sales.link_writes')::integer<>0 then raise exception 'price_update_rewrote_visual_aliases';end if;
 if public.sales_convert_selection(current_setting('atlas.sales.aliases')::jsonb->'current')->'lines' is distinct from public.sales_convert_selection(current_setting('atlas.sales.aliases')::jsonb->'historical')->'lines' then raise exception 'historical_revision_duplicated_sku';end if;
 perform public.sales_admin_offers('',0);perform public.sales_admin_choices('');
 begin perform public.sales_save_offer(data||'{"item_condition":"refurbished"}',2);raise exception 'invalid_condition_accepted';exception when invalid_parameter_value then null;end;
 begin perform public.sales_save_offer(data,null);raise exception 'null_offer_revision_accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.sales_save_offer(data,0);raise exception 'stale_offer_revision_accepted';exception when sqlstate 'PT409' then null;end;
 perform public.sales_save_promotion(jsonb_build_object('id',promo,'name','Demo 10%','discount_type','percentage','percentage_bps',1000,'starts_at',clock_timestamp()-interval '1 hour','ends_at',clock_timestamp()+interval '1 day','active',true,'offer_ids',jsonb_build_array(id)),0);
 perform public.sales_promotions();
 cart=public.sales_cart();lines=jsonb_build_array(jsonb_build_object('offer_id',id,'quantity',2));cart=public.sales_save_cart((cart->>'revision')::integer,lines);
 begin perform public.sales_summary(lines,jsonb_build_object('name',123,'contact','demo@example.invalid'),'pickup','{}');raise exception 'numeric_contact_name_accepted';exception when invalid_parameter_value then null;end;
 begin perform public.sales_summary(lines,contact||'{"bank_data":"not accepted"}', 'pickup','{}');raise exception 'extra_contact_fields_accepted';exception when invalid_parameter_value then null;end;
 begin perform public.sales_summary(lines,jsonb_build_object('name','Cliente','contact','invalid'),'pickup','{}');raise exception 'invalid_contact_format_accepted';exception when invalid_parameter_value then null;end;
 summary=public.sales_summary(lines,contact,'pickup','{}');
 if summary->'lines'->0->>'item_condition' is distinct from 'used' then raise exception 'condition_missing_from_summary';end if;
 if (summary->>'total_cents')::bigint<>18000 then raise exception 'incorrect_discount';end if;
 begin perform public.sales_create_order(key,summary->>'hash',lines,contact,'pickup','{}',(cart->>'revision')::integer-1,null);raise exception 'stale_cart_checkout_accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.sales_create_order(key,'tampered',lines,contact,'pickup','{}',(cart->>'revision')::integer,null);raise exception 'tampered_total_accepted';exception when sqlstate 'PT409' then null;end;
 order_id=public.sales_create_order_with_payment(key,summary->>'hash',lines,contact,'pickup','{}',(cart->>'revision')::integer,null,'bbva_demo');
 if public.sales_create_order(key,summary->>'hash',lines,contact,'pickup','{}',(cart->>'revision')::integer,null)<>order_id then raise exception 'retry_created_another_order';end if;
 begin perform public.sales_create_order_with_payment(key,summary->>'hash',lines,contact,'pickup','{}',(cart->>'revision')::integer,null,'bcp_demo');raise exception 'checkout_channel_replay_accepted';exception when sqlstate 'PT409' then null;end;
 result=public.sales_order(order_id);
 if result->>'preferred_payment_method' is distinct from 'bbva_demo' then raise exception 'checkout_channel_not_saved';end if;
 if result->'items'->0->>'item_condition_snapshot' is distinct from 'used' then raise exception 'condition_missing_from_order_snapshot';end if;
 if (result->>'total_cents')::bigint<>18000 or jsonb_array_length(public.sales_cart()->'items')<>0 then raise exception 'checkout_not_atomic';end if;
 begin perform public.sales_save_offer(data||'{"stock_total":1}',2);raise exception 'reserved_stock_reduced';exception when sqlstate 'PT409' then null;end;
 -- Every newly exposed channel persists its identity; rejected simulations never consume stock.
 foreach channel in array array['plin_demo','bcp_demo','interbank_demo','bbva_demo','scotiabank_demo'] loop
  pay_key=gen_random_uuid();
  result=public.sales_pay_demo(order_id,pay_key,channel,'rejected');
  if result->>'status'<>'pending' or not exists(select 1 from jsonb_array_elements(result->'payments') p where p->>'method'=channel and p->>'status'='rejected') then raise exception 'payment_channel_not_preserved';end if;
  perform public.sales_pay_demo(order_id,pay_key,channel,'rejected');
  begin perform public.sales_pay_demo(order_id,pay_key,'card_demo','rejected');raise exception 'payment_channel_replay_accepted';exception when sqlstate 'PT409' then null;end;
 end loop;
 begin perform public.sales_pay_demo(order_id,gen_random_uuid(),'unknown_bank','approved');raise exception 'unknown_payment_channel_accepted';exception when invalid_parameter_value then null;end;
 pay_key=gen_random_uuid();
 result=public.sales_pay_demo(order_id,pay_key,'yape_demo','approved');
 if result->>'status'<>'confirmed' then raise exception 'payment_not_confirmed';end if;
 perform public.sales_pay_demo(order_id,pay_key,'yape_demo','approved');
 result=public.sales_transition(order_id,(result->>'revision')::integer,'cancelled','Cancelación demo');
 if result->>'status'<>'cancelled' then raise exception 'cancel_failed';end if;
 -- Quote persists, reviews with server prices, then checks out independently.
 quote_id=public.sales_request_quote(quote_id,lines,contact,'shipping','{"address":"Calle de prueba 100","city":"Lima","region":"Lima"}',false);
 perform public.sales_quotes(false,0);result=public.sales_quote(quote_id);
 result=public.sales_review_quote(quote_id,(result->>'revision')::integer,'quoted',0,1500,'Envío de demostración');
 summary=public.sales_summary(lines,contact,'shipping','{"address":"Calle de prueba 100","city":"Lima","region":"Lima"}',quote_id);
 order_id=public.sales_create_order(gen_random_uuid(),summary->>'hash',lines,contact,'shipping','{"address":"Calle de prueba 100","city":"Lima","region":"Lima"}',null,quote_id);
 perform public.sales_orders(false,0);perform public.sales_orders(true,0);
 result=public.sales_order(order_id);result=public.sales_transition(order_id,(result->>'revision')::integer,'cancelled','Cerrar prueba de envío');
 -- Typed technical snapshots are rebuilt by the server, never copied from client claims.
 lines=jsonb_build_array(jsonb_build_object('offer_id',id,'quantity',1));
 quote_id=public.sales_request_quote(gen_random_uuid(),lines,contact,'pickup','{}',true,current_setting('atlas.sales.selection')::jsonb);
 result=public.sales_quote(quote_id);
 if (result->>'assembly_fee_cents')::bigint<>15000 or (result->>'assembly_base_fee_cents')::bigint<>15000 then raise exception 'assembly_tariff_not_automatic';end if;
 perform public.sales_save_assembly_tariff((public.sales_policy()->>'service_revision')::integer,18000);
 if (public.sales_quote(quote_id)->>'assembly_fee_cents')::bigint<>15000 then raise exception 'existing_assembly_tariff_changed';end if;
 if result->'selection_snapshot'->0->'technical'->>'name'='client forged value' or result->'selection_snapshot'->0->'technical'->'specs' is null then raise exception 'technical_snapshot_not_authoritative';end if;
 result=public.sales_review_quote(quote_id,(result->>'revision')::integer,'quoted',0,0,'Armado sin coste');
 if not exists(select 1 from jsonb_array_elements(public.sales_quote_notices()->'items') n where n->>'id'=quote_id::text and (n->>'assembly_fee_cents')::bigint=0) then raise exception 'waived_assembly_notice_missing';end if;
 perform set_config('atlas.sales.notice',quote_id::text,true);
 perform public.sales_quote_notices(quote_id,(result->>'revision')::integer);
 if exists(select 1 from jsonb_array_elements(public.sales_quote_notices()->'items') n where n->>'id'=quote_id::text) then raise exception 'notice_ack_not_persistent';end if;
 -- Once quoted, a later catalogue price/promotion change cannot silently change it.
 perform public.sales_save_promotion(jsonb_build_object('id',promo,'name','Demo 10%','discount_type','percentage','percentage_bps',1000,'starts_at',clock_timestamp()-interval '1 hour','ends_at',clock_timestamp()+interval '1 day','active',false,'offer_ids',jsonb_build_array(id)),1);
 summary=public.sales_summary(lines,contact,'pickup','{}',quote_id);
 if (summary->>'total_cents')::bigint<>9000 then raise exception 'quoted_promotion_was_repriced';end if;
 result=public.sales_quote(quote_id);
 perform public.sales_request_quote(gen_random_uuid(),lines,contact,'pickup','{}',true,current_setting('atlas.sales.selection')::jsonb,null,quote_id,(result->>'revision')::integer);
 begin perform public.sales_summary(lines,contact,'pickup','{}',quote_id);raise exception 'superseded_quote_accepted';exception when sqlstate 'PT409' then null;end;

 perform set_config('atlas.sales.order',order_id::text,true);
 raise notice 'PASS offers, revisions, promotions, cart, authoritative prices, atomic order/replay, reserve/payment/cancel and shipping quote';
end$$;
reset role;
do $$begin perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('atlas.sales.other'),'role','authenticated')::text,true);end$$;
set local role authenticated;
do $$begin
 begin perform public.sales_order(current_setting('atlas.sales.order')::uuid);raise exception 'cross_account_order_read';exception when insufficient_privilege then null;end;
 if (public.sales_quote_notices()->>'count')::integer<>0 then raise exception 'cross_account_notices_leaked';end if;
 perform public.sales_quote_notices(current_setting('atlas.sales.notice')::uuid,2);
 begin perform public.sales_save_assembly_tariff((public.sales_policy()->>'service_revision')::integer,0);raise exception 'user_can_manage_tariff';exception when insufficient_privilege then null;end;
 begin perform 1 from public.sales_service_settings;raise exception 'service_settings_read_leaked';exception when insufficient_privilege then null;end;
 begin perform public.sales_admin_offers('',0);raise exception 'user_can_manage_offers';exception when insufficient_privilege then null;end;
 begin perform 1 from public.store_offers;raise exception 'direct_table_read_leaked';exception when insufficient_privilege then null;end;
 perform set_config('request.headers',jsonb_build_object('x-atlas-account',current_setting('atlas.sales.actor'))::text,true);
 begin perform public.sales_cart();raise exception 'originating_account_binding_ignored';exception when insufficient_privilege then null;end;
 perform set_config('request.headers','{}',true);
 raise notice 'PASS account isolation, commercial permissions and direct-table grants';
end$$;
reset role;
rollback;
