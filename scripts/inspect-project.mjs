import { spawnSync } from "node:child_process";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const env = readProjectEnvironment();
const result = spawnSync("psql", ["-X", "-t", "-A", "-v", "ON_ERROR_STOP=1"], {
  encoding: "utf8",
  env: postgresEnvironment(env),
  input: `begin read only;
select jsonb_build_object('businessTables',(select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'),'iamTables',(select count(*) from information_schema.tables where table_schema='iam' and table_type='BASE TABLE'),'migrations',(select count(*) from supabase_migrations.schema_migrations),'models',(select count(*) from public.components),'publishedModels',(select count(*) from public.components where published),'publishedPresets',(select count(*) from public.bike_presets where published),'draftPresets',(select count(*) from public.bike_presets where not published),'publishedVariants',(select count(*) from public.component_variants where published),'draftVariants',(select count(*) from public.component_variants where not published),'selectablePublishedVariants',(select count(*) from public.component_variants where published and selectable),'retiredPublishedVariants',(select count(*) from public.component_variants where published and not selectable),'approvedAdministrator',coalesce((select jsonb_build_object('confirmed',u.email_confirmed_at is not null,'role',r.key,'permissions',(select count(*) from iam.role_permissions where role_id=r.id)) from auth.users u join iam.user_roles ur on ur.user_id=u.id join iam.roles r on r.id=ur.role_id where lower(u.email)='admin@atlas.mtb'),'null'::jsonb));
rollback;`,
});
if (result.status !== 0) {
  console.error("Read-only project inspection failed");
  process.exit(result.status ?? 1);
}
console.log(result.stdout.trim());
const ref = new URL(env.SUPABASE_URL).hostname.split(".")[0],
  response = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/config/auth`,
    {
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(15000),
    },
  );
if (response.ok) {
  const config = await response.json();
  console.log(
    JSON.stringify({
      auth: {
        siteUrl: config.site_url,
        callbacks: config.uri_allow_list,
        emailConfirmationRequired: !config.mailer_autoconfirm,
        customSmtpConfigured: !!config.smtp_host,
        confirmationTokenHash:
          config.mailer_templates_confirmation_content?.includes("TokenHash") ??
          false,
        recoveryTokenHash:
          config.mailer_templates_recovery_content?.includes("TokenHash") ??
          false,
        inviteTokenHash:
          config.mailer_templates_invite_content?.includes("TokenHash") ??
          false,
      },
    }),
  );
} else console.log("Auth configuration read status:", response.status);
