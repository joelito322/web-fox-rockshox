// Local resource review; no credentials, writes or remote fixture accounts.
import { chromium } from '@playwright/test';
import { installSceneMetrics } from './lib/scene-metrics.mjs';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const root = 'http://127.0.0.1:5174/tests/fixtures/scene-preview.html';
const initial = JSON.parse(readFileSync('supabase/catalog/initial-reviewed.json', 'utf8'));
const extra = JSON.parse(readFileSync('supabase/catalog/suspension-reviewed.json', 'utf8'));
const ids = new Set(initial.components.filter(c => ['ohlins-rxf38-m3', 'rockshox-vivid-coil-ultimate-d1'].includes(c.slug)).map(c => c.id));
const frameReview = process.argv.includes('--frames');
const tyreReview = process.argv.includes('--tyres');
const draftReview = process.argv.includes('--drafts');
const tyres = JSON.parse(readFileSync('supabase/catalog/tyres-reviewed.json', 'utf8'));
const frames = JSON.parse(readFileSync('supabase/catalog/frames-reviewed.json', 'utf8'));
const choices = frameReview ? frames.variants.filter(v => v.selectable) : tyreReview ? tyres.variants : draftReview ? initial.variants.filter(v => !v.published) : [...extra.variants, ...initial.variants.filter(v => ids.has(v.component_id))];
const directory = frameReview ? '/tmp/atlas-frame-review' : tyreReview ? '/tmp/atlas-tyre-review' : draftReview ? '/tmp/atlas-draft-review' : '/tmp/atlas-scene-review';
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const results = [];
try {
 const page = await browser.newPage({viewport: {width: 1280, height: 800}});
 const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.addInitScript(installSceneMetrics);
 for (const v of choices) {
  const start = errors.length;
  const model = frameReview ? frames.components.find(c => c.id === v.component_id) : null;
  const discipline = model?.disciplines.includes('downhill') ? 'downhill' : 'enduro';
  await page.goto(root + '?variant=' + v.id + '&discipline=' + discipline);
  await page.waitForFunction(() => window.atlasSceneProof?.firstDrawMs !== null && !!document.querySelector('canvas'));
  await page.waitForTimeout(150);
  if (errors.length !== start) throw new Error('Scene failed for '+v.label+': '+errors.slice(start).join(', '));
  const metrics = await page.evaluate(() => {
   const p = window.atlasSceneProof;
   return {firstDrawMs: Math.round(p.firstDrawMs), drawnTrianglesIncludingShadows: Math.max(p.maxTriangles,p.triangles), drawCallsIncludingShadows: Math.max(p.maxCalls,p.calls)};
  });
  results.push({variant: v.id, label: v.label, ...metrics});
  if (frameReview) for (const camera of ['lateral', 'perspectiva', 'frontal', 'superior']) {
   await page.getByRole('combobox', {name: 'Cámara de revisión'}).selectOption(camera);
   await page.waitForTimeout(650);
   await page.screenshot({path: directory+'/'+model.slug+'-'+v.specs.size_label.replace(/[^a-z0-9]/gi,'')+'-'+camera+'.png'});
  }
  if (tyreReview || draftReview) await page.screenshot({path: directory+'/'+v.manufacturer_code+'.png'});
  if (['912-01-258', '979-01-209', 'MTBM 2208', 'FS-ZEB-ULT-B1'].includes(v.manufacturer_code)) await page.screenshot({path: directory+'/'+v.manufacturer_code+'.png'});
 }
 writeFileSync(directory+'/results.json',JSON.stringify({context:'Chromium desktop, local Vite, SwiftShader; resource sanity and conservative draw budget, not physical-device performance acceptance', variants:results},null,2)+'\n');
 console.log(JSON.stringify({reviewed:results.length, maxDrawnTrianglesIncludingShadows:Math.max(...results.map(r=>r.drawnTrianglesIncludingShadows)), maxDrawCallsIncludingShadows:Math.max(...results.map(r=>r.drawCallsIncludingShadows)), artifacts: directory}));
} finally { await browser.close(); }
