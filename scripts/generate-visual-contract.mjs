import { existsSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { manifestSchema } from "../src/features/catalog/model/visual.ts";
const destination = process.argv[2];
if (
  !/^supabase\/migrations\/\d+_[a-z_]+\.sql$/.test(destination ?? "") ||
  existsSync(destination)
)
  throw new Error("Provide a new migration path");
const contract = JSON.stringify(
  z.toJSONSchema(manifestSchema, { target: "draft-7" }),
);
writeFileSync(
  destination,
  `-- Generated from manifestSchema; never rewrite an applied migration.
create function iam.valid_visual_manifest(value jsonb) returns boolean language sql immutable set search_path='' as $function$
select value is not null and extensions.jsonb_matches_schema($schema$${contract}$schema$::json,value);
$function$;
revoke all on function iam.valid_visual_manifest(jsonb) from public,anon,authenticated;
alter table public.visual_assets add constraint visual_manifest_contract check(iam.valid_visual_manifest(manifest));
`,
);
