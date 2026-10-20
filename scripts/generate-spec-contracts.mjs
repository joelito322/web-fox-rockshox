import { existsSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { specificationSchemas } from "../src/features/catalog/model/specifications.ts";
// A new immutable migration is generated deliberately, never rewritten after application.
const destination = process.argv[2];
if (
  !destination ||
  existsSync(destination) ||
  !/^supabase\/migrations\/\d+_[a-z_]+\.sql$/.test(destination)
)
  throw new Error("Provide a new migration path");
const cases = Object.entries(specificationSchemas)
  .map(
    ([key, schema]) =>
      ` when '${key}' then $schema$${JSON.stringify(z.toJSONSchema(schema, { target: "draft-7" }))}$schema$::json`,
  )
  .join("\n");
writeFileSync(
  destination,
  `-- Generated from specificationSchemas; see scripts/generate-spec-contracts.mjs.\n-- JSON Schema remains inside the application schema; no extra catalogue tables.\ncreate extension if not exists pg_jsonschema with schema extensions;\ncreate or replace function iam.validate_specs(p_category text,p_specs jsonb) returns void language plpgsql immutable set search_path='' as $$\ndeclare contract json;begin\n if p_specs is null or pg_column_size(p_specs)>32768 then raise exception 'invalid_specs' using errcode='22023';end if;\n contract=case p_category\n${cases}\n else null end;\n if contract is null or not extensions.jsonb_matches_schema(contract,p_specs) then raise exception 'invalid_category_specifications' using errcode='22023';end if;\n if p_category='cassette' and p_specs->'sprocket_teeth' is not null and p_specs->'sprocket_teeth'<>'null'::jsonb then\n  if exists(select 1 from (select value::numeric n,lag(value::numeric)over(order by ordinality) previous from jsonb_array_elements_text(p_specs->'sprocket_teeth') with ordinality) t where n<=previous) then raise exception 'invalid_sprocket_sequence' using errcode='22023';end if;\n end if;\nend$$;\nrevoke all on function iam.validate_specs(text,jsonb) from public,anon,authenticated;\n`,
);
