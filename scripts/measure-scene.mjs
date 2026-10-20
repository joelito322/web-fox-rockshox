// Isolated production build of the review fixture; never publish this output as the application.
import { build, preview } from 'vite';
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installSceneMetrics } from './lib/scene-metrics.mjs';
const version=process.argv.find(a=>a.startsWith('--version='))?.split('=')[1]??'v4';
if(!['v4','v5'].includes(version))throw Error('Unsupported measurement version');
const outDir = 'node_modules/.cache/atlas-scene-review';
const directory = `/tmp/atlas-scene-performance-${version}`;
mkdirSync(directory, { recursive: true });
await build({
  logLevel: 'error',
  build: { outDir, emptyOutDir: true, rollupOptions: { input: 'tests/fixtures/scene-preview.html' } },
});
const server = await preview({
  logLevel: 'error', build: { outDir },
  preview: { host: '127.0.0.1', port: 4181, strictPort: true },
});
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const results = [];
try {
  for (const device of (process.argv.includes('--mobile') ? ['mobile'] : ['desktop', 'mobile'])) for (const discipline of ['enduro', 'downhill']) {
    const context = await browser.newContext(device === 'mobile' ? devices['Pixel 7'] : {viewport: {width: 1280, height: 800}});
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(installSceneMetrics);
      const cdp = await context.newCDPSession(page);
      let networkBytes=0;
      cdp.on('Network.loadingFinished',event=>{networkBytes+=event.encodedDataLength??0});
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false, latency: 80, downloadThroughput: 1250000, uploadThroughput: 1250000,
      });
      await page.goto(`http://127.0.0.1:4181/tests/fixtures/scene-preview.html?discipline=${discipline}&generation=${version}`, {waitUntil: 'networkidle'});
      await page.waitForFunction(() => window.atlasSceneProof?.firstCompleteFrameMs !== null);
      const bounds = await page.locator('canvas').boundingBox();
      if (!bounds) throw new Error('Scene missing');
      const started = await page.evaluate(() => performance.now());
      const x = bounds.x + bounds.width * 0.5, y = bounds.y + bounds.height * 0.7;
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let i = 0; i < 300; i++) {
        await page.mouse.move(x + Math.sin(i / 20) * 40, y + Math.cos(i / 23) * 20);
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      const result = await page.evaluate(({started, device, discipline}) => {
        const proof = window.atlasSceneProof;
        const ended = performance.now();
        const frames = proof.frames.filter(time => time >= started && time <= ended);
        const canvas = document.querySelector('canvas');
        const gl = canvas.getContext('webgl2');
        const debug = gl.getExtension('WEBGL_debug_renderer_info');
        const resources = performance.getEntriesByType('resource');
        return {
          device, discipline, viewport: [innerWidth,innerHeight], userAgent: navigator.userAgent,
          renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          firstCompleteFrameMs: Math.round(proof.firstCompleteFrameMs),
          transferredResourceBytes: resources.reduce((sum,r) => sum+r.transferSize,0),
          drawnTrianglesIncludingShadows: Math.max(proof.maxTriangles,proof.triangles),
          drawCallsIncludingShadows: Math.max(proof.maxCalls,proof.calls),
          interactionMs: Math.round(ended-started), renderedFramesDuringInteraction: frames.length,
          observedInteractionFps: Math.round(frames.length*10000/(ended-started))/10,
        };
      }, {started, device, discipline});
      result.networkTransferredBytes=networkBytes;
      // Resource Timing can hide cross-origin Storage sizes without Timing-Allow-Origin. CDP counts those too.
      if (errors.length) throw new Error(errors.join('; '));
      results.push(result);
      await page.screenshot({path: `${directory}/${device}-${discipline}.png`});
      console.log(JSON.stringify(result));
    } finally { await context.close(); }
  }
  writeFileSync(directory+'/results.json', JSON.stringify({
    context: 'Production review fixture; Chromium SwiftShader on this host, Android Pixel 7 viewport emulation (Chromium, not a real phone or a Brave binary), empty cache, 10 Mbps / 80 ms CDP network. No Auth/catalog latency and no physical phone thermal or sustained-GPU acceptance.',
    results,
  },null,2)+'\n');
  console.log('Performance evidence: '+directory);
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
