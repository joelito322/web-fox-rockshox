import { test,expect } from '@playwright/test';
import { installSceneMetrics } from '../../scripts/lib/scene-metrics.mjs';
test('reference review loads all parts, preserves overlay framing and supports 3D',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(installSceneMetrics);
  await page.goto('/tests/fixtures/reference-review.html');
  await page.waitForFunction(()=>(window as any).atlasSceneProof?.firstDrawMs!=null);
  for(const label of ['Cuadro','Horquilla','Amortiguador','Conjunto']){
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.getByRole('button',{name:'Superposición',exact:true}).click();
    const stage=page.getByRole('region',{name:'Comparación de siluetas'});
    const image=stage.locator('img');
    await expect(image).toBeVisible();
    await expect(image).toHaveJSProperty('complete',true);
    expect(await image.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
    const ratio=await stage.evaluate(el=>el.clientWidth/el.clientHeight);
    const imageRatio=await image.evaluate((el:HTMLImageElement)=>el.naturalWidth/el.naturalHeight);
    expect(Math.abs(ratio-imageRatio)).toBeLessThan(.02);
    await page.getByRole('slider').fill('0.25');
    await expect(page.locator('output')).toHaveText('25%');
    await page.getByRole('button',{name:'3D',exact:true}).click();
    await expect(page.getByRole('button',{name:'Modelo',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(stage.locator('canvas')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.waitForFunction(()=>Math.max((window as any).atlasSceneProof?.triangles??0,(window as any).atlasSceneProof?.maxTriangles??0)>75000);
  await page.screenshot({path:test.info().outputPath('reference-set.png')});
  expect(errors).toEqual([]);
});
