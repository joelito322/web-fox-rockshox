// Synthetic three-vertex GLB for delivery tests; never part of the commercial inventory.
export function visualTriangle(): Uint8Array<ArrayBuffer> {
  const document = {
    asset: { version: "2.0", generator: "ATLAS synthetic delivery test" },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "validation_triangle" }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.4, 0.5, 0.3, 1], metallicFactor: 0, roughnessFactor: 0.7 }, doubleSided: true }],
    buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [0.1, 0.1, 0] }],
  };
  const json = new TextEncoder().encode(JSON.stringify(document));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const buffer = new ArrayBuffer(12 + 8 + jsonLength + 8 + 36);
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(32, 20, 20 + jsonLength);
  bytes.set(json, 20);
  const binaryOffset = 20 + jsonLength;
  view.setUint32(binaryOffset, 36, true);
  view.setUint32(binaryOffset + 4, 0x004e4942, true);
  [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0].forEach((value, i) => view.setFloat32(binaryOffset + 8 + i * 4, value, true));
  return bytes;
}
