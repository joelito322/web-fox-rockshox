// Prepare new immutable GLB captures locally; --apply additionally uploads exact hashed files.
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { parseCatalogImport } from '../src/features/catalog/model/ingestion.ts';
import { readProjectEnvironment } from './lib/environment.mjs';
const file = 'supabase/catalog/gravity-reviewed.json';
const source = parseCatalogImport(JSON.parse(readFileSync(file,'utf8')));
const out = 'models/catalog-v9/exports';mkdirSync(out,{recursive:true});
const historyFile = 'models/catalog-v9/uploads.json';
const previous = existsSync(historyFile) ? JSON.parse(readFileSync(historyFile,'utf8')) : [];
const browser = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const captures = [];
try {
 const page = await browser.newPage();
 await page.goto((process.env.ATLAS_BASE_URL??'http://127.0.0.1:5174')+'/tests/fixtures/gravity-review.html');
 await page.waitForFunction(()=>typeof window.atlasExportGravity==='function');
 for (const variant of source.variants) {
  const component=source.components.find(c=>c.id===variant.component_id), asset=source.assets.find(a=>a.id===variant.visual_asset_id);
  const exported=await page.evaluate(id=>window.atlasExportGravity(id),variant.id);
  const bytes=Buffer.from(exported.data,'base64'),hash=createHash('sha256').update(bytes).digest('hex');
  const prior=previous.find(row=>row.variant_id===variant.id);
  if(prior?.published_at && prior.sha256!==hash) throw Error('Published v9 geometry is immutable; create a new capture/version.');
  const name=`${component.slug}--${variant.id.slice(0,8)}.glb`;
  writeFileSync(`${out}/${name}`,bytes);
  asset.storage_path=`catalog/v9/${component.slug}/${hash.slice(0,24)}.glb`;
  asset.manifest.anchors=exported.anchors;asset.manifest.paintable_nodes=exported.paintable_nodes;
  captures.push({variant_id:variant.id,asset_id:asset.id,file:name,storage_path:asset.storage_path,bytes:bytes.length,sha256:hash,...(prior?.published_at?{published_at:prior.published_at}:{})});
 }
} finally {await browser.close();}
parseCatalogImport(source);writeFileSync(file,JSON.stringify(source,null,2)+'\n');
writeFileSync(historyFile,JSON.stringify(captures,null,2)+'\n');
if(process.argv.includes('--apply')) {
 const env=readProjectEnvironment(), client=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 for(const capture of captures) {
  const bytes=readFileSync(`${out}/${capture.file}`);
  const {error}=await client.storage.from('models').upload(capture.storage_path,bytes,{contentType:'model/gltf-binary',cacheControl:'31536000',upsert:false});
  if(error && !['409','400'].includes(String(error.statusCode))) throw Error('GLB upload failed; publication not executed.');
  const {data}=client.storage.from('models').getPublicUrl(capture.storage_path);
  const response=await fetch(data.publicUrl);if(!response.ok)throw Error('Public GLB read failed.');
  const downloaded=Buffer.from(await response.arrayBuffer());
  if(createHash('sha256').update(downloaded).digest('hex')!==capture.sha256)throw Error('Immutable Storage hash mismatch.');
  capture.published_at ??=new Date().toISOString();
 }
 writeFileSync(historyFile,JSON.stringify(captures,null,2)+'\n');
}
console.log(JSON.stringify({models:source.components.length,captures:captures.length,uniqueFiles:new Set(captures.map(c=>c.sha256)).size,bytes:captures.reduce((sum,c)=>sum+c.bytes,0),cloudUploaded:process.argv.includes('--apply')}));
