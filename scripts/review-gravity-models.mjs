// Internal offline-source review; no Cloud writes. Product build excludes this fixture.
import { chromium } from '@playwright/test';
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs';
const source=JSON.parse(readFileSync('supabase/catalog/gravity-reviewed.json','utf8'));
const dir='/tmp/atlas-gravity-review';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],results=[];
try {
 const page=await browser.newPage({viewport:{width:1000,height:760}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto((process.env.ATLAS_BASE_URL??'http://127.0.0.1:5174')+'/tests/fixtures/gravity-review.html');
 await page.waitForFunction(()=>!!window.atlasGravityReady);
 for(const component of source.components) {
  const variant=source.variants.find(v=>v.component_id===component.id);
  await page.getByLabel('Modelo',{exact:true}).selectOption(variant.id);
  await page.waitForFunction(id=>window.atlasGravityReady?.id===id,variant.id);
  const data=await page.evaluate(()=>window.atlasGravityReady);
  if(!data.size.every(n=>Number.isFinite(n)&&n>0)||!data.children)throw Error('Empty gravity resource');
  for(const view of ['side','opposite','front','top','diagonal']){
   await page.getByLabel('Vista',{exact:true}).selectOption(view);await page.waitForTimeout(120);
   await page.screenshot({path:`${dir}/${component.slug}-${view}.png`});
  }
  results.push(data);
 }
 if(errors.length)throw Error(errors.join('\n'));
 writeFileSync(`${dir}/results.json`,JSON.stringify({models:results.length,captures:results.length*5,results,errors},null,2));
 console.log(JSON.stringify({models:results.length,captures:results.length*5,errors}));
}finally{await browser.close();}
