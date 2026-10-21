import { test,expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const source=JSON.parse(readFileSync('supabase/catalog/gravity-reviewed.json','utf8')) as {
 components:{id:string;slug:string;name:string;category:string}[];
 variants:{id:string;component_id:string;label:string;generation:string;specs:{wheel_front?:string;wheel_format?:string}}[];
};
const examples=JSON.parse(readFileSync('supabase/catalog/visual-v7-examples.json','utf8')) as {presets:{id:string;slug:string}[]};
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
test('all new models expose images, variants and generation in the public catalogue',async({page})=>{
 test.setTimeout(120000);
 for(const component of source.components){
  await page.goto(`/componentes?category=${component.category}&q=${encodeURIComponent(component.name)}`);
  const card=page.locator('.product-card').filter({hasText:component.name});await expect(card).toHaveCount(1);
  await expect.poll(()=>card.locator('img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await card.click();const detail=page.getByRole('dialog',{name:'Detalle de la pieza'});await expect(detail).toContainText(component.name);
  await expect(detail).toContainText(source.variants.find(v=>v.component_id===component.id)!.generation);
 }
});
test('all 26 published GLBs decode materials, paint targets, mounts and volume',async({page})=>{
 test.setTimeout(120000);await page.goto('/tests/fixtures/gravity-review.html');await page.waitForFunction(()=>typeof(window as any).atlasInspectAllGravity==='function');
 const results=await page.evaluate(()=>(window as any).atlasInspectAllGravity());expect(results).toHaveLength(26);
 for(const row of results){expect(row.meshes).toBeGreaterThan(0);expect(row.paint).toBe(true);expect(row.anchors).toBe(true);expect(row.size.every((n:number)=>Number.isFinite(n)&&n>0)).toBe(true);}
});
const frames=source.components.filter(c=>c.category==='frame');
for(const [i,frame]of frames.entries())test(`${frame.slug} mounts new suspension, saves and reopens exact references`,async({page})=>{
 test.skip(!process.env.ATLAS_TEST_EMAIL,'Run validate-configurator-performance.mjs desktop gravity');test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/entrar');await page.getByLabel('Correo electrónico').fill(process.env.ATLAS_TEST_EMAIL!);await page.getByLabel('Contraseña',{exact:true}).fill(process.env.ATLAS_TEST_PASSWORD!);await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/mis-bicicletas/);
 const frameVariant=source.variants.find(v=>v.component_id===frame.id)!;
 const preset=examples.presets.find(p=>p.slug.includes(frame.slug.includes('capra')||frame.slug.includes('force-')?'meta':'supreme'))!;
 await page.goto(`/configurador?preset=${preset.id}&variant=${frameVariant.id}`);await expect(page.locator('.viewer canvas')).toBeVisible();await expect(page.locator('.slot-complete')).toHaveCount(23);
 const forkSlug=['rockshox-boxxer-ultimate-d2','rockshox-boxxer-select-d2','ohlins-dh38-m2','marzocchi-bomber-58'][i%4];
 const fork=source.components.find(c=>c.slug===forkSlug)!;
 const forkVariant=source.variants.find(v=>v.component_id===fork.id&&v.specs.wheel_format===frameVariant.specs.wheel_front)??source.variants.find(v=>v.component_id===fork.id)!;
 await page.locator('.slot-nav').getByRole('button',{name:'Horquilla',exact:true}).click();await page.getByLabel('Buscar alternativa',{exact:true}).fill(fork.name);
 const option=page.locator('.piece-options > button').filter({hasText:fork.name}).filter({hasText:forkVariant.label});await expect(option).toBeVisible();await option.click();await expect(page.locator('.selected-piece h2')).toHaveText(fork.name);
 const name=`Gravity ${i} ${Date.now()}`;await page.getByLabel('Nombre del montaje').fill(name);await page.getByRole('button',{name:'Guardar',exact:true}).click();await expect(page.locator('.save-status')).toHaveText('Guardado');
 await page.locator('.editor-toolbar').getByRole('link',{name:'Mis bicicletas',exact:true}).click();const card=page.locator('.preset-card').filter({hasText:name});await expect(card).toBeVisible();await expect(card.locator('.bike-preview')).toHaveAttribute('data-preview-state','ready');
 await expect.poll(()=>card.locator('img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBe(640);await card.getByRole('link',{name:'Continuar',exact:false}).click();await expect(page.getByLabel('Nombre del montaje')).toHaveValue(name);
 const saved=page.waitForResponse(response=>{const u=new URL(response.url());return u.pathname.endsWith('/rest/v1/builds')&&u.searchParams.get('select')?.includes('build_items(slot')===true;});
 await page.reload();const response=await saved;expect(response.ok()).toBe(true);const rows=await response.json();const stored=Array.isArray(rows)?rows[0]:rows;expect(stored.build_items.map((item:{variant_id:string})=>item.variant_id)).toEqual(expect.arrayContaining([frameVariant.id,forkVariant.id]));
 await expect(page.locator('.viewer canvas')).toBeVisible();await expect(page.locator('.slot-complete')).toHaveCount(23);await expect(page.getByText('Vista 3D no disponible',{exact:true})).toHaveCount(0);expect(errors).toEqual([]);
});
