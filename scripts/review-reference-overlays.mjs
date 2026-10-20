// Internal, locally served frame-to-reference comparisons. No catalog mutation.
import {chromium} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const rows=Object.entries(JSON.parse(readFileSync('models/catalog-v5/exports/report.json','utf8')));
const frames=rows.filter(([,r],i)=>r.category==='frame'&&rows.findIndex(([,x])=>x.model===r.model)===i);
const output='/tmp/atlas-v5-overlays';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const [id,row] of frames){
  const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5174/tests/fixtures/catalog-mesh-review.html');
  await page.getByRole('combobox',{name:'Modelo'}).selectOption(id);
  await page.getByRole('button',{name:'Superposición',exact:true}).click();
  await page.waitForFunction(()=>{const image=document.querySelector('img');return image?.complete&&image.naturalWidth>0});
  await page.waitForTimeout(500);
  await page.screenshot({path:`${output}/${row.model}.png`});
  await page.getByRole('button',{name:'3D',exact:true}).click();
  await page.waitForTimeout(250);
  if(errors.length)throw Error(row.model+': '+errors.join('; '));
  results.push({model:row.model,registeredOverlay:true,depthReviewAvailable:true});await page.close();
 }
 writeFileSync(output+'/results.json',JSON.stringify(results,null,2)+'\n');
 console.log(`Reviewed ${results.length} registered frame overlays and 3D switches.`);
}finally{await browser.close()}
