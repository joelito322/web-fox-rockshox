// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe,it,expect } from 'vitest';
import * as T from 'three';
import source from '../../supabase/catalog/gravity-reviewed.json';
import profiles from './frame-profiles.json';
import { parseCatalogImport } from '../../src/features/catalog/model/ingestion';
const captures=JSON.parse(readFileSync('models/catalog-v9/uploads.json','utf8')) as {variant_id:string;asset_id:string;file:string;sha256:string;bytes:number}[];
const readGlb=(file:string)=>{const bytes=readFileSync('models/catalog-v9/exports/'+file);expect(bytes.readUInt32LE(0)).toBe(0x46546c67);expect(bytes.readUInt32LE(4)).toBe(2);expect(bytes.readUInt32LE(8)).toBe(bytes.length);const size=bytes.readUInt32LE(12);return {bytes,json:JSON.parse(bytes.subarray(20,20+size).toString()),binary:bytes.subarray(28+size)};};
describe('gravity model expansion',()=>{
 it('adds eleven specific models and 26 choices without reusing old model/variant/resource identities',()=>{
  const parsed=parseCatalogImport(source);expect(parsed.components).toHaveLength(11);expect(parsed.variants).toHaveLength(26);
  const old=['initial-reviewed','braking-reviewed','suspension-reviewed','frames-reviewed','tyres-reviewed','visual-v3-reviewed','visual-v4-reviewed','visual-v5-reviewed','visual-v6-reviewed','visual-v7-reviewed','cockpit-reviewed'].map(f=>JSON.parse(readFileSync(`supabase/catalog/${f}.json`,'utf8')));
  for(const key of ['components','variants','assets'] as const){const previous=new Set(old.flatMap(x=>x[key].map((r:any)=>r.id)));for(const row of parsed[key])expect(previous.has(row.id)).toBe(false);}
  for(const c of parsed.components.filter(c=>c.category==='frame'))expect(parsed.variants.filter(v=>v.component_id===c.id).map(v=>v.specs.size_label)).toEqual(['M','L']);
 });
 it('rejects procedural fallbacks, mismatched categories and missing mounting anchors',()=>{
  for(const mode of ['procedural','category','anchor']){
   const bad=structuredClone(source),asset=bad.assets[0];
   if(mode==='procedural'){asset.kind='procedural';asset.generator_key='atlas-bike-v5';}
   if(mode==='category')asset.manifest.parameters.mount_space='fork';
   if(mode==='anchor')delete (asset.manifest.anchors as any).rear_axle;
   expect(()=>parseCatalogImport(bad)).toThrow();
  }
 });
 it('keeps historical identification and unknown geometry honest, with bounded suspension variants',()=>{
  const furious=source.components.find(c=>c.slug==='commencal-furious-v3-2021')!;
  for(const v of source.variants.filter(v=>v.component_id===furious.id)){expect(v.model_year).toBe(2021);expect(v.generation).toContain('Archivo');expect(v.specs).not.toHaveProperty('geometry');}
  const tues=source.components.find(c=>c.slug==='yt-tues-mk4-carbon')!;expect(source.variants.filter(v=>v.component_id===tues.id).map(v=>[v.specs.size_label,v.specs.wheel_rear])).toEqual([['M','27.5'],['L','29']]);
  const ohlins=source.components.find(c=>c.slug==='ohlins-dh38-m2')!;expect(new Set(source.variants.filter(v=>v.component_id===ohlins.id).map(v=>v.specs.spring_type))).toEqual(new Set(['air','coil']));
  const bomber=source.components.find(c=>c.slug==='marzocchi-bomber-58')!;expect(bomber.technical_notes).toContain('203 mm');expect(bomber.technical_notes).toContain('200 mm');
 });
 it('registers documented frame dimensions and physical eye spacing independently of decorative geometry',()=>{
  const data=parseCatalogImport(source);
  for(const v of data.variants){const a=data.assets.find(a=>a.id===v.visual_asset_id)!.manifest.anchors;
   if('size_label' in v.specs){
    const g=v.specs.geometry as Record<string,number>|undefined;
    if(g){expect(a.head_tube.position[0]).toBeCloseTo(g.reach_mm/1000,6);expect(a.head_tube.position[1]).toBeCloseTo(g.stack_mm/1000,6);expect(Math.hypot(...a.rear_axle.position)).toBeCloseTo(g.chainstay_mm/1000,6);}
    const fit=v.specs.shock_fit as {eye_to_eye_mm?:number}|undefined;
    if(fit?.eye_to_eye_mm)expect(new T.Vector3(...a.shock_upper.position).distanceTo(new T.Vector3(...a.shock_lower.position))).toBeCloseTo(fit.eye_to_eye_mm/1000,6);
   }else{expect(a.upper_crown.position[1]).toBeGreaterThan(.1);expect(a.axle.position[1]).toBeLessThan(-.55);if(v.specs.axle_to_crown_mm)expect(a.axle.position[1]).toBeCloseTo(-Number(v.specs.axle_to_crown_mm)/1000,6);}
  }
 });
 it('retains the explicit V10 upper/lower rear-member connections and asymmetric idlers',()=>{
  const profile=profiles['santa-cruz-v10-8-my27'];
  const roots=profile.links.flat();
  for(const member of profile.members.filter(m=>m.paired))expect(roots).toContainEqual(member.path.at(-1));
  expect(profile.members.find(m=>m.name==='lower_link_support')).toBeDefined();
  const assets=parseCatalogImport(source).assets.filter(a=>a.manifest.parameters.mount_space==='frame');
  for(const a of assets)expect(Boolean(a.manifest.anchors.chain_idler)).toBe(a.manifest.parameters.profile_key!.startsWith('gt-'));
 });
 it('validates every exported GLB hash, paint target, position and full 3D depth',()=>{
  expect(captures).toHaveLength(26);
  for(const c of captures){const {bytes,json,binary}=readGlb(c.file);expect(bytes.length).toBe(c.bytes);expect(bytes.length).toBeLessThan(2*1024*1024);expect(createHash('sha256').update(bytes).digest('hex')).toBe(c.sha256);
   const asset=source.assets.find(a=>a.id===c.asset_id)!;expect(asset.storage_path).toContain(c.sha256.slice(0,24));
   for(const name of asset.manifest.paintable_nodes)expect(json.nodes.some((n:any)=>n.name===name)).toBe(true);
   const box=new T.Box3();let vertices=0, finite=true;
   for(const mesh of json.meshes)for(const primitive of mesh.primitives){const accessor=json.accessors[primitive.attributes.POSITION],view=json.bufferViews[accessor.bufferView];expect(accessor.componentType).toBe(5126);expect(accessor.type).toBe('VEC3');const start=(view.byteOffset??0)+(accessor.byteOffset??0),stride=view.byteStride??12;
    for(let i=0;i<accessor.count;i++){const p=[0,1,2].map(j=>binary.readFloatLE(start+i*stride+j*4));finite &&= p.every(Number.isFinite);box.expandByPoint(new T.Vector3(...p));}vertices+=accessor.count;
   }
   expect(finite).toBe(true);expect(vertices).toBeGreaterThan(1000);expect(box.getSize(new T.Vector3()).z).toBeGreaterThan(.1);
  }
 });
});
