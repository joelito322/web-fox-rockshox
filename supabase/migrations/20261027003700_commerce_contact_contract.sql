-- Closed contact/address contracts: reject malformed snapshots before persistence.
create or replace function public._sales_contact(p_contact jsonb,p_delivery text,p_address jsonb) returns void language plpgsql set search_path='' as $$
declare contact_value text;
begin
 if p_delivery is null or p_delivery not in ('pickup','shipping') or jsonb_typeof(p_contact) is distinct from 'object' or pg_column_size(p_contact)>8192 then raise exception 'sales_contact_required' using errcode='22023';end if;
 if p_contact-array['name','contact']<>'{}'::jsonb or jsonb_typeof(p_contact->'name') is distinct from 'string' or jsonb_typeof(p_contact->'contact') is distinct from 'string'
 or length(btrim(p_contact->>'name')) not between 2 and 150 or length(btrim(p_contact->>'contact')) not between 5 and 200 then raise exception 'sales_contact_required' using errcode='22023';end if;
 contact_value=btrim(p_contact->>'contact');
 if contact_value !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' and not (contact_value ~ '^[+]?[0-9 ()-]+$' and length(regexp_replace(contact_value,'[^0-9]','','g')) between 9 and 15) then raise exception 'sales_contact_required' using errcode='22023';end if;
 if jsonb_typeof(p_address) is distinct from 'object' or pg_column_size(p_address)>8192 then raise exception 'sales_address_required' using errcode='22023';end if;
 if p_delivery='pickup' then
  if p_address<>'{}'::jsonb then raise exception 'sales_address_required' using errcode='22023';end if;
 else
  if p_address-array['address','city','region']<>'{}'::jsonb or jsonb_typeof(p_address->'address') is distinct from 'string' or jsonb_typeof(p_address->'city') is distinct from 'string' or jsonb_typeof(p_address->'region') is distinct from 'string'
   or length(btrim(p_address->>'address')) not between 5 and 300 or length(btrim(p_address->>'city')) not between 2 and 100 or length(btrim(p_address->>'region')) not between 2 and 100 then raise exception 'sales_address_required' using errcode='22023';end if;
 end if;
end$$;
