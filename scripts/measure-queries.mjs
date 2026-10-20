import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { readProjectEnvironment, postgresEnvironment } from './lib/environment.mjs';
const env = readProjectEnvironment();
const admin = createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let identity;
try {
  const {data,error} = await admin.auth.admin.createUser({email:'atlas-plan-'+randomUUID()+'@example.invalid',email_confirm:true});
  if (error) throw new Error('Could not prepare temporary query identity');
  identity = data.user.id;
  const result = spawnSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','-v',`user_id=${identity}`,'-f','supabase/tests/query-plans.sql'],{env:postgresEnvironment(env),encoding:'utf8'});
  if (result.status !== 0) throw new Error('Read-only query measurement failed');
  const plans = result.stdout.trim().split(/\n(?=\[)/).map(chunk => JSON.parse(chunk)[0]);
  const names = ['public_filtered_catalog','public_fork_facets','public_downhill_families','authenticated_own_builds'];
  if (plans.length !== names.length) throw new Error('Incomplete query measurement');
  const report = plans.map((plan,i)=>({name:names[i],planningMs:plan['Planning Time'],executionMs:plan['Execution Time'],rows:plan.Plan['Actual Rows'],sharedHits:plan.Plan['Shared Hit Blocks']??0,sharedReads:plan.Plan['Shared Read Blocks']??0,plan:plan.Plan}));
  mkdirSync('/tmp/atlas-query-plans',{recursive:true});
  writeFileSync('/tmp/atlas-query-plans/results.json',JSON.stringify({context:'Supabase Cloud, actual RLS roles, current small catalogue; empty own-build list for temporary account. No large-volume or concurrent-load acceptance.',queries:report},null,2)+'\n');
  for (const {plan,...summary} of report) console.log(JSON.stringify(summary));
} catch {
  process.stderr.write('Query plan validation failed; no success reported\n');
  process.exitCode=1;
} finally {
  if (identity) {
    const {error}=await admin.auth.admin.deleteUser(identity);
    if (error) { process.stderr.write('Query identity cleanup needs attention\n');process.exitCode=1; }
    else console.log('Temporary query identity cleaned up');
  }
}
