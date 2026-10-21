// Read-only Cloud diagnosis: current catalogue cardinality and the real Data API RLS roles.
// EXPLAIN ANALYZE executes SELECT statements only; no identities, fixtures or indexes are created.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";

const queries = [
  [
    "catalog_page",
    "anon",
    `select c.id,c.name,v.id variant_id,a.manifest from public.components c join public.brands b on b.id=c.brand_id join public.component_variants v on v.component_id=c.id join public.visual_assets a on a.id=v.visual_asset_id where c.published and b.published and v.published and v.selectable and a.published order by c.name,c.id limit 24`,
  ],
  [
    "fork_filter",
    "anon",
    `select c.id,c.name,v.id variant_id from public.components c join public.component_variants v on v.component_id=c.id where c.category='fork' and c.published and v.published and v.selectable and v.specs->>'wheel_bsd_mm'='622' and v.specs->>'spring_type'='air' order by c.name,c.id limit 24`,
  ],
  ["catalog_facets", "anon", `select public.catalog_facets(null)`],
  ["fork_facets", "anon", `select public.catalog_facets('fork')`],
  [
    "bicycle_families",
    "anon",
    `select public.list_preset_families('',null,'downhill',0)`,
  ],
  [
    "selected_variants",
    "authenticated",
    `select c.id,c.name,v.id variant_id,v.specs,a.manifest from public.components c join public.component_variants v on v.component_id=c.id join public.visual_assets a on a.id=v.visual_asset_id where v.id in(select i.variant_id from public.bike_preset_items i where i.preset_id=(select id from public.bike_presets where published and selectable order by id limit 1))`,
  ],
  [
    "own_builds_with_counts",
    "authenticated",
    `select b.id,b.name,b.revision,(select count(*) from public.build_items i where i.build_id=b.id) as part_count from public.builds b order by b.updated_at desc,b.id limit 24`,
  ],
  [
    "saved_build_items",
    "authenticated",
    `select b.id,b.revision,coalesce((select jsonb_agg(to_jsonb(i)) from public.build_items i where i.build_id=b.id),'[]'::jsonb) items from public.builds b order by b.updated_at desc,b.id limit 1`,
  ],
];
const sql = `begin read only;
select coalesce((select user_id from public.builds order by updated_at desc limit 1),(select id from auth.users where email_confirmed_at is not null order by created_at limit 1))::text as audit_user_id \\gset
select set_config('request.jwt.claims',json_build_object('sub',:'audit_user_id','role','authenticated')::text,true) as claims \\gset
${queries.map(([name, role, query]) => `reset role;set local role ${role};\n\\echo AUDIT:${name}\nexplain(analyze,buffers,format json) ${query};`).join("\n")}
reset role;
\\echo AUDIT:cardinality
select json_build_object('components',(select count(*) from public.components),'variants',(select count(*) from public.component_variants),'assets',(select count(*) from public.visual_assets),'publishedSelectableVariants',(select count(*) from public.component_variants where published and selectable),'presets',(select count(*) from public.bike_presets),'builds',(select count(*) from public.builds));
\\echo AUDIT:historical
select coalesce(json_agg(t),'[]'::json) from(select calls,round(mean_exec_time::numeric,3) mean_ms,case when query like '%"get_my_access"%' then 'access' when query like '%"catalog_facets"%' then 'facets' when query like '%"list_preset_families"%' then 'families' when query like '%"public"."components"%' then 'catalog' when query like '%"public"."builds"%' then 'builds' end kind from extensions.pg_stat_statements where query like 'WITH pgrst_source AS (%' and query not like '%"save_%' and (query like '%"get_my_access"%' or query like '%"catalog_facets"%' or query like '%"list_preset_families"%' or query like '%"public"."components"%' or query like '%"public"."builds"%') order by total_exec_time desc limit 15)t;
rollback;`;
const environment = readProjectEnvironment();
const result = spawnSync("psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"], {
  env: postgresEnvironment(environment),
  input: sql,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
if (result.status !== 0) {
  console.error("Read-only Cloud query audit failed; no success reported.");
  process.exit(1);
}
const sections = new Map(
  result.stdout
    .trim()
    .split(/AUDIT:/)
    .filter(Boolean)
    .map((section) => {
      const line = section.indexOf("\n");
      return [section.slice(0, line), JSON.parse(section.slice(line + 1))];
    }),
);
const measurements = queries.map(([name, role]) => {
  const p = sections.get(name)[0];
  return {
    name,
    role,
    planningMs: p["Planning Time"],
    executionMs: p["Execution Time"],
    rows: p.Plan["Actual Rows"],
    sharedHits: p.Plan["Shared Hit Blocks"] ?? 0,
    sharedReads: p.Plan["Shared Read Blocks"] ?? 0,
    plan: p.Plan,
  };
});
const projection = readFileSync("src/features/catalog/api.ts", "utf8").match(
  /export const catalogProjection =\s*"([^"]+)"/,
)?.[1];
if (!projection)
  throw new Error(
    "Catalogue projection could not be read; update audit for the current API contract.",
  );
const api = [];
for (const category of [null, "fork"]) {
  const url = new URL(environment.SUPABASE_URL + "/rest/v1/components");
  url.search = new URLSearchParams({
    select: projection,
    published: "eq.true",
    "component_variants.published": "eq.true",
    "component_variants.selectable": "eq.true",
    order: "name.asc,id.asc",
    limit: "24",
    ...(category ? { category: "eq." + category } : {}),
  });
  for (let iteration = 1; iteration <= 3; iteration++) {
    const started = performance.now();
    const response = await fetch(url, {
      headers: {
        apikey: environment.SUPABASE_PUBLISHABLE_KEY,
        Prefer: "count=exact",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error("Read-only catalogue API measurement failed.");
    const body = await response.text();
    const milliseconds = Math.round(performance.now() - started);
    const data = JSON.parse(body);
    api.push({
      query: category ? "fork_catalog" : "all_catalog",
      iteration,
      milliseconds,
      bytes: Buffer.byteLength(body),
      models: data.length,
      variants: data.reduce((sum, c) => sum + c.component_variants.length, 0),
    });
  }
}
const report = {
  api,
  measuredAt: new Date().toISOString(),
  scope:
    "Read-only current Cloud data under anon/authenticated RLS. Existing build owner selected server-side; no IDs or credentials emitted. Joined catalogue plans are representative SQL, not exact PostgREST pagination plans. Historical pg_stat_statements averages include prior validation traffic; not a controlled benchmark or a large-volume acceptance.",
  cardinality: sections.get("cardinality"),
  historical: sections.get("historical"),
  measurements,
};
mkdirSync("/tmp/atlas-query-audit", { recursive: true });
writeFileSync(
  "/tmp/atlas-query-audit/results.json",
  JSON.stringify(report, null, 2) + "\n",
);
for (const { plan, ...summary } of measurements)
  console.log(JSON.stringify(summary));
console.log(
  JSON.stringify({
    cardinality: report.cardinality,
    historical: report.historical,
  }),
);
for (const summary of api) console.log(JSON.stringify(summary));
console.log("Full plans: /tmp/atlas-query-audit/results.json");
