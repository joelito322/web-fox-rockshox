import { useMemo, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as T from "three";
import source from "../../supabase/catalog/cockpit-reviewed.json";
import existing from "../../supabase/catalog/visual-v7-reviewed.json";
import examples from "../../supabase/catalog/visual-v7-examples.json";
import { parseCatalogImport } from "../../src/features/catalog/model/ingestion";
import { choose, slotCategories, type Configuration, type Slot, type VariantMap } from "../../src/features/configurator/model";
import { assemblyV2, resolveAssembly } from "../../src/features/configurator/model/assemblyV2";
import { buildCockpit, isCockpitProfile } from "../../src/features/configurator/scene/generators/v8/cockpit";
const catalog = parseCatalogImport(source), old = parseCatalogImport(existing);
const variants: VariantMap = {};
for (const c of [old, catalog]) for (const variant of c.variants) {
  const component = c.components.find(row => row.id === variant.component_id)!;
  variants[variant.id] = { ...variant, component: { ...component, brands: c.brands.find(row => row.id === component.brand_id)! },
    visual_assets: c.assets.find(row => row.id === variant.visual_asset_id)! };
}
function Camera({view,id}:{view:string;id:string}) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const directions: Record<string, number[]> = { perspective:[1,0.8,1.3], front:[1,0,0], side:[0,0,1], top:[0,1,0.0001] };
    const size = (window as any).atlasCockpitReview?.size ?? [0.1,0.1,0.1];
    const radius = Math.hypot(...size) / 2;
    const distance = radius / Math.sin(35 * Math.PI / 360) * 1.2;
    camera.position.fromArray(directions[view]).normalize().multiplyScalar(distance);
    camera.near = 0.001; camera.far = 100; camera.updateProjectionMatrix();
    camera.lookAt(0,0,0); invalidate();
  }, [view, id, camera, invalidate]);
  return null;
}
function Model({id}:{id:string}) {
  const selected = variants[id];
  const slot = Object.entries(slotCategories).find(([, category]) => category === selected.component.category)![0] as Slot;
  const parts = useMemo(() => {
    const base = {schemaVersion:1,name:"Cockpit",items:examples.presets[0].items} as Configuration;
    const configuration = choose(base,slot,selected);
    const a = { ...assemblyV2(configuration,variants), ...resolveAssembly(configuration,variants) };
    const profile = selected.visual_assets!.manifest.parameters.profile_key;
    if (!isCockpitProfile(profile)) throw new Error("missing profile");
    const finish = selected.allowed_finishes.options.find(row=>row.id===selected.allowed_finishes.default_finish_id)!;
    return buildCockpit(profile, selected, a, finish.material.color);
  }, [id]);
  const center = useMemo(() => {
    const box = new T.Box3();
    for (const part of parts) {part.geometry.computeBoundingBox();box.union(part.geometry.boundingBox!);}
    const size = box.getSize(new T.Vector3());
    (window as any).atlasCockpitReview = { model:selected.component.slug, size:size.toArray(), triangles:parts.reduce((sum,part)=>sum+part.geometry.getAttribute("position").count/3,0) };
    return box.getCenter(new T.Vector3()).negate().toArray();
  },[parts]);
  useEffect(()=>()=>parts.forEach(part=>part.geometry.dispose()),[parts]);
  return <group position={center}>{parts.map((part,i)=><mesh key={i} geometry={part.geometry}>
    <meshStandardMaterial color={part.color} roughness={part.roughness} metalness={part.metalness} side={2}/>
  </mesh>)}</group>;
}
function Review(){
  const [id,setId]=useState(catalog.variants.find(v=>catalog.components.find(c=>c.id===v.component_id)!.slug===new URLSearchParams(location.search).get("model"))?.id??catalog.variants[0].id);
  const [view,setView]=useState("perspective");
  return <><header><select aria-label="Modelo" value={id} onChange={e=>setId(e.target.value)}>{catalog.variants.map(v=><option key={v.id} value={v.id}>{variants[v.id].component.name}</option>)}</select>
  <select aria-label="Vista" value={view} onChange={e=>setView(e.target.value)}>{["perspective","front","side","top"].map(value=><option key={value}>{value}</option>)}</select>
  <output>Recurso v8 · Aproximación exterior documentada</output></header><Canvas frameloop="demand" camera={{position:[1,0.8,1.3],fov:35}}>
    <color attach="background" args={["#e8e9e1"]}/><ambientLight intensity={1.6}/><directionalLight position={[2,4,3]} intensity={3}/><directionalLight position={[-3,1,-2]} intensity={2}/>
    <Camera view={view} id={id}/><Model key={id} id={id}/><OrbitControls makeDefault/>
  </Canvas></>;
}
createRoot(document.getElementById("root")!).render(<Review/>);
