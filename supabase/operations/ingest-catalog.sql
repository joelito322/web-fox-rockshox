-- Called inside one transaction by scripts/ingest-catalog.mjs.
-- Sources and IDs are reviewed in supabase/catalog; no implicit replacement of versions.
do $$declare document jsonb;entry jsonb;begin
 select payload into strict document from atlas_catalog_import;
 for entry in select value from jsonb_array_elements(document->'brands') loop
  insert into public.brands select (jsonb_populate_record(null::public.brands,entry)).*
  on conflict(id) do update set name=excluded.name,slug=excluded.slug,region=excluded.region,published=excluded.published;
 end loop;
 for entry in select value from jsonb_array_elements(document->'components') loop
  insert into public.components select(jsonb_populate_record(null::public.components,entry)).*
  on conflict(id) do update set brand_id=excluded.brand_id,name=excluded.name,slug=excluded.slug,category=excluded.category,disciplines=excluded.disciplines,description=excluded.description,technical_notes=excluded.technical_notes,image_key=excluded.image_key,sources=excluded.sources,published=excluded.published;
 end loop;
 for entry in select value from jsonb_array_elements(document->'assets') loop
  insert into public.visual_assets select(jsonb_populate_record(null::public.visual_assets,entry)).*
  on conflict(id) do update set kind=excluded.kind,storage_path=excluded.storage_path,generator_key=excluded.generator_key,manifest=excluded.manifest,reference_notes=excluded.reference_notes,published=excluded.published;
 end loop;
 for entry in select value from jsonb_array_elements(document->'variants') loop
  insert into public.component_variants select(jsonb_populate_record(null::public.component_variants,entry)).*
  on conflict(id) do update set component_id=excluded.component_id,label=excluded.label,model_year=excluded.model_year,generation=excluded.generation,manufacturer_code=excluded.manufacturer_code,image_key=excluded.image_key,sources=excluded.sources,specs_schema_version=excluded.specs_schema_version,specs=excluded.specs,price_reference=excluded.price_reference,allowed_finishes=excluded.allowed_finishes,visual_asset_id=excluded.visual_asset_id,representation=excluded.representation,published=excluded.published,selectable=excluded.selectable;
 end loop;
end$$;
