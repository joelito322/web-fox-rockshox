import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const sql = `select json_build_object(
 'tables',(select count(*) from pg_tables where schemaname in ('public','iam')),
 'migrations',(select count(*) from supabase_migrations.schema_migrations),
 'models',(select count(*) from public.components),
 'variants',(select count(*) from public.component_variants),
 'resources',(select count(*) from public.visual_assets),
 'presets',(select count(*) from public.bike_presets),
 'offers',(select count(*) from public.store_offers),
 'links',(select count(*) from public.store_offer_variants),
 'demo_stock_rows',(select count(*) from public.store_offers where stock_total=12),
 'commercial_permissions',(select count(*) from iam.permissions where area='Ventas'),
 'unprotected_commercial_tables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('store_offers','store_offer_variants','promotions','promotion_offers','carts','cart_items','sales_quotes','orders','order_items','payment_attempts','order_events') and not c.relrowsecurity),
 'fixture_accounts',(select count(*) from auth.users where email like 'validation-%@example.invalid' or email like 'atlas-commerce-%@example.invalid'),
 'fixture_offers',(select count(*) from public.store_offers where sku like 'BROWSER-validation-%' or sku like 'RACE-%'),
 'fixture_models',(select count(*) from public.components c join public.brands b on b.id=c.brand_id where b.slug like 'validation-%' or c.slug like 'validation-%'),
 'fixture_resources',(select count(*) from public.visual_assets where reference_notes like 'validation-%'),
 'non_demo_orders',(select count(*) from public.orders where mode<>'demo')
);`;
const result = spawnSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1"], {
  env: postgresEnvironment(readProjectEnvironment()),
  input: sql,
  encoding: "utf8",
  timeout: 60000,
});
if (result.status !== 0) throw new Error("Commerce state query failed");
const state = JSON.parse(result.stdout.trim());
mkdirSync("models/local/validation/commerce", { recursive: true });
writeFileSync(
  "models/local/validation/commerce/state.json",
  JSON.stringify({ checked_at: new Date().toISOString(), ...state }, null, 2) +
    "\n",
);
console.log(JSON.stringify(state));
if (
  state.tables !== 23 ||
  state.commercial_permissions !== 4 ||
  state.unprotected_commercial_tables !== 0 ||
  state.fixture_accounts !== 0 ||
  state.fixture_offers !== 0 ||
  state.fixture_models !== 0 ||
  state.fixture_resources !== 0 ||
  state.non_demo_orders !== 0
)
  throw new Error(
    "Commerce state or fixture cleanup differs from the expected contract",
  );
