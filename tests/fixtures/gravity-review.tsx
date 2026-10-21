import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { disposeVisual } from "../../src/features/configurator/scene/loadGlb";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import source from "../../supabase/catalog/gravity-reviewed.json";
import { gravityGroup } from "../../models/catalog-v9/geometry";

const model = (id: string) => {
 const variant = source.variants.find(v => v.id === id)!;
 const component = source.components.find(c => c.id === variant.component_id)!;
 return { variant, component, ...gravityGroup(component.slug, variant) };
};
(window as any).atlasExportGravity = async (id: string) => {
 const resource = model(id);
 try {
  const binary = await new GLTFExporter().parseAsync(resource.group, { binary: true, onlyVisible: true }) as ArrayBuffer;
  let text = ""; for (const byte of new Uint8Array(binary)) text += String.fromCharCode(byte);
  return { data: btoa(text), anchors: resource.anchors, paintable_nodes: resource.paintable_nodes, bytes: binary.byteLength };
 } finally { resource.group.traverse(node => { if (node instanceof T.Mesh) { node.geometry.dispose(); node.material.dispose(); } }); }
};
(window as any).atlasInspectAllGravity = async () => {
 const results=[];
 for(const asset of source.assets){
  const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/models/${asset.storage_path}`);
  if(!response.ok)throw Error("Published gravity GLB unavailable");
  const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),"");
  const box=new T.Box3().setFromObject(gltf.scene);let meshes=0;
  gltf.scene.traverse(n=>{if(n instanceof T.Mesh)meshes++;});
  const valid=asset.manifest.paintable_nodes.every(name=>!!gltf.scene.getObjectByName(name));
  const anchors=Object.keys(asset.manifest.anchors).every(name=>!!gltf.scene.getObjectByName("mount_"+name));
  results.push({id:asset.id,size:box.getSize(new T.Vector3()).toArray(),meshes,paint:valid,anchors});
  disposeVisual(gltf.scene);
 }
 return results;
};
(window as any).atlasCaptureGravityImage = async (slug: string) => {
 const c=source.components.find(c=>c.slug===slug)!;
 const v=source.variants.find(v=>v.component_id===c.id)!;
 const a=source.assets.find(a=>a.id===v.visual_asset_id)!;
 const url=`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/models/${a.storage_path}`;
 const response=await fetch(url);if(!response.ok)throw Error("GLB unavailable");
 const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),"");
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(1600,1000);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene(),box=new T.Box3().setFromObject(gltf.scene),size=box.getSize(new T.Vector3());
 gltf.scene.position.sub(box.getCenter(new T.Vector3()));scene.add(gltf.scene);scene.add(new T.AmbientLight(0xffffff,2));
 for(const [x,y,z,intensity]of [[2,4,5,3],[-3,1,-2,2]]){const light=new T.DirectionalLight(0xffffff,intensity);light.position.set(x,y,z);scene.add(light);}
 const camera=new T.PerspectiveCamera(34,1.6,.001,100),distance=Math.max(size.y,size.x/1.6)/2/Math.tan(34*Math.PI/360)*1.35;
 camera.position.set(.24,.12,1).normalize().multiplyScalar(distance);camera.lookAt(0,0,0);renderer.render(scene,camera);
 const image=renderer.domElement.toDataURL("image/webp",.9);disposeVisual(gltf.scene);renderer.dispose();renderer.forceContextLoss();return image.split(",")[1];
};
function Camera({ view, size }: { view: string; size: number[] }) {
 const { camera, invalidate } = useThree();
 useEffect(() => {
  const directions: Record<string, number[]> = { diagonal: [1,.55,1.8], side: [0,0,1], opposite:[0,0,-1], front: [1,0,0], top: [0,1,.001] };
  const d = Math.hypot(...size) / 2 / Math.sin(35 * Math.PI / 360) * 1.17;
  camera.position.fromArray(directions[view]).normalize().multiplyScalar(d); camera.near = .001; camera.far = 100; camera.updateProjectionMatrix();camera.lookAt(0,0,0); invalidate();
 }, [view, camera, invalidate, size.join(":")]);return null;
}
function Model({ id, view }: { id: string; view: string }) {
 const resource = useMemo(() => model(id), [id]);
 const box = useMemo(() => new T.Box3().setFromObject(resource.group), [resource]);
 const center = box.getCenter(new T.Vector3()).negate(), size = box.getSize(new T.Vector3()).toArray();
 useEffect(() => {
  (window as any).atlasGravityReady = { id, slug: resource.component.slug, size, children: resource.group.children.length };
  return () => resource.group.traverse(n => { if (n instanceof T.Mesh) { n.geometry.dispose(); n.material.dispose(); } });
 }, [resource]);
 return <><Camera view={view} size={size}/><group position={center.toArray()}><primitive object={resource.group}/></group></>;
}
function Review() {
 const params = new URLSearchParams(location.search);
 const [id,setId] = useState(source.variants.find(v => source.components.find(c=>c.id===v.component_id)!.slug===params.get("model"))?.id ?? source.variants[0].id);
 const [view,setView] = useState(params.get("view") ?? "diagonal");
 return <><header><select aria-label="Modelo" value={id} onChange={e=>setId(e.target.value)}>{source.variants.map(v=><option key={v.id} value={v.id}>{source.components.find(c=>c.id===v.component_id)!.name} · {v.label}</option>)}</select><select aria-label="Vista" value={view} onChange={e=>setView(e.target.value)}>{["side","opposite","front","top","diagonal"].map(v=><option key={v}>{v}</option>)}</select><output>Revisión interna · Aproximación exterior v9</output></header><Canvas frameloop="demand" camera={{fov:35}}><color attach="background" args={["#e8e9e1"]}/><ambientLight intensity={1.5}/><directionalLight position={[2,3,4]} intensity={3}/><directionalLight position={[-2,1,-3]} intensity={2}/><Model id={id} view={view}/><OrbitControls makeDefault/></Canvas></>;
}
createRoot(document.getElementById("root")!).render(<Review/>);
