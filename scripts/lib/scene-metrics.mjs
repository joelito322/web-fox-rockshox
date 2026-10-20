// Runs inside an isolated review browser. Counts submitted geometry, including shadow passes.
export function installSceneMetrics() {
  const proof = {
    frame: 0, triangles: 0, maxTriangles: 0, calls: 0, maxCalls: 0,
    firstDrawMs: null, firstCompleteFrameMs: null, frames: [],
  };
  window.atlasSceneProof = proof;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = callback => raf(time => {
    if (proof.frame !== time) {
      proof.maxTriangles = Math.max(proof.maxTriangles, proof.triangles);
      proof.maxCalls = Math.max(proof.maxCalls, proof.calls);
      if (proof.triangles > 0) {
        proof.frames.push(proof.frame);
        if (proof.firstCompleteFrameMs === null) proof.firstCompleteFrameMs = time;
      }
      proof.frame = time;
      proof.triangles = 0;
      proof.calls = 0;
    }
    callback(time);
  });
  for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
    const original = WebGL2RenderingContext.prototype[name];
    WebGL2RenderingContext.prototype[name] = function(...args) {
      const elements = name.includes('Elements');
      const count = args[elements ? 1 : 2];
      const instances = name.endsWith('Instanced') ? args[elements ? 4 : 3] : 1;
      const triangles = args[0] === this.TRIANGLES ? count / 3
        : args[0] === this.TRIANGLE_STRIP ? Math.max(0, count - 2) : 0;
      proof.triangles += triangles * instances;
      proof.calls++;
      if (proof.firstDrawMs === null) proof.firstDrawMs = performance.now();
      return original.apply(this, args);
    };
  }
}
