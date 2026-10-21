// Precompute the live published compositions; no privileged key enters the browser.
import {chromium} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {readProjectEnvironment} from './lib/environment.mjs';
const e=readProjectEnvironment(),client=createClient(e.SUPABASE_URL,e.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const {data,error}=await client.from('bike_presets').select('id,name').eq('published',true).eq('selectable',true);
if(error)throw Error('Cannot read current published presets');
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:800,height:600}});
 await page.goto('http://127.0.0.1:5174/tests/fixtures/thumbnail-capture.html');
 await page.waitForFunction(()=>typeof window.atlasCapturePreset==='function');
 for(const preset of data){
  const result=await page.evaluate(id=>window.atlasCapturePreset(id),preset.id);
  if(!result.image)throw Error('Published composition produced no image');
  if(process.argv.includes('--apply')){
   const {error}=await client.storage.from('bike-previews').upload(result.path,Buffer.from(result.image.data,'base64'),{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
   if(error&&!/already exists|duplicate/i.test(error.message))throw Error('Preview upload failed');
  }
  console.log(JSON.stringify({id:preset.id,bytes:result.image.bytes,uploaded:process.argv.includes('--apply')}));
 }
}finally{await browser.close()}
