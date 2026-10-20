import { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as T from 'three';
import trace from '../../models/reference-set/supreme-v5-trace.json';
import './reference-review.css';

const root='/models/reference-set/';
const parts={
  frame:{label:'Cuadro',file:'supreme-v5',image:root+'references/supreme-lateral.jpg',w:1452,h:928,scale:trace.calibration.pixels_per_meter,origin:[555,742]},
  fork:{label:'Horquilla',file:'fox-40-my27',image:'/src/assets/images/catalog/fox-40-my27-black.png',w:640,h:640,scale:650,origin:[320,194]},
  shock:{label:'Amortiguador',file:'bomber-cr-250',image:'/src/assets/images/catalog/marzocchi-bomber-cr.webp',w:311,h:800,scale:2912,origin:[95,36]},
  set:{label:'Conjunto',file:'supreme-v5',image:root+'references/supreme-lateral.jpg',w:1452,h:928,scale:trace.calibration.pixels_per_meter,origin:[555,742]},
} as const;
type Part=keyof typeof parts;
type Mode='reference'|'model'|'overlay';
function Model({file,position=[0,0,0],rotation=[0,0,0]}:{file:string;position?:[number,number,number];rotation?:[number,number,number]}){
  const {scene}=useGLTF(root+'exports/'+file+'.glb');
  return <group position={position} rotation={rotation}><primitive object={scene}/></group>;
}
function Camera({part,spatial}:{part:Part;spatial:boolean}){
  const {camera,invalidate,size}=useThree();
  useEffect(()=>{
    const p=parts[part], c=camera as T.OrthographicCamera;
    const w=p.w/p.scale,h=p.h/p.scale;
    const center=new T.Vector3((p.w/2-p.origin[0])/p.scale,(p.origin[1]-p.h/2)/p.scale,0);
    c.left=-w/2;c.right=w/2;c.top=h/2;c.bottom=-h/2;c.near=.01;c.far=20;c.zoom=part==='set'?.84:1;
    // Fork reference is FRONT, other references are SIDE. Keep these distinct.
    if(part==='fork'){
      center.z=-center.x;center.x=0;
      c.position.copy(center).add(new T.Vector3(spatial?2:3,spatial?1:0,spatial?2:0));
    } else c.position.copy(center).add(new T.Vector3(spatial?1.6:0,spatial?1.1:0,3));
    c.lookAt(center);c.updateProjectionMatrix();invalidate();
  },[camera,part,spatial,size.width,size.height,invalidate]);
  const p=parts[part];
  const center:[number,number,number]=part==='fork'?[0,(p.origin[1]-p.h/2)/p.scale,-(p.w/2-p.origin[0])/p.scale]:[(p.w/2-p.origin[0])/p.scale,(p.origin[1]-p.h/2)/p.scale,0];
  return spatial?<OrbitControls key={part} target={center} enablePan={false} minZoom={.5} maxZoom={3}/>:null;
}
function App(){
  const params=new URLSearchParams(location.search);
  const [part,setPart]=useState<Part>((params.get('part') as Part) in parts?params.get('part') as Part:'frame');
  const [mode,setMode]=useState<Mode>('model');
  const [spatial,setSpatial]=useState(false);
  const [opacity,setOpacity]=useState(.55);
  const p=parts[part];
  const head=trace.landmarks.head_bottom;
  const scale=trace.calibration.pixels_per_meter;
  const headPosition:[number,number,number]=[(head[0]-555)/scale,(742-head[1])/scale,0];
  const upper=trace.landmarks.shock_upper,lower=trace.landmarks.shock_lower;
  const shockPosition:[number,number,number]=[(upper[0]-555)/scale,(742-upper[1])/scale,0];
  const shockAngle=Math.atan2(lower[0]-upper[0],lower[1]-upper[1]);
  return <main>
    <header><a href="/">ATLAS MTB</a><span>REVISIÓN DE FORMA · CANDIDATO</span><h1>La forma, pieza a pieza.</h1><p>SUPREME DH V5 · FOX 40 MY27 · Bomber CR 250 × 75</p></header>
    <nav aria-label="Piezas">{Object.entries(parts).map(([key,p])=><button key={key} aria-pressed={part===key} onClick={()=>{setPart(key as Part);setSpatial(false)}}>{p.label}</button>)}</nav>
    <div className="toolbar"><div>{(['reference','model','overlay'] as const).map((m,i)=><button key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);setSpatial(false)}}>{['Referencia','Modelo','Superposición'][i]}</button>)}</div><div><button aria-pressed={!spatial} onClick={()=>setSpatial(false)}>{part==='fork'?'Frontal':'Lateral'}</button><button aria-pressed={spatial} onClick={()=>{setSpatial(true);setMode('model')}}>3D</button></div></div>
    <section aria-label="Comparación de siluetas" className="stage" style={{aspectRatio:`${p.w}/${p.h}`,width:`min(100%, calc(var(--review-height) * ${p.w/p.h}))`,background:part==='frame'||part==='set'?'#212121':'#e3e3e3'}}>
      {mode!=='model'&&<img alt={`Referencia de ${p.label.toLowerCase()}`} src={p.image} style={{transform:part==='set'?'scale(.84)':undefined}}/>}
      {mode!=='reference'&&<div className="canvas" style={{opacity:mode==='overlay'?opacity:1}}><Canvas key={part} orthographic camera={{position:[0,0,3]}} frameloop="demand" dpr={[1,1.5]} gl={{alpha:true,antialias:true}}><ambientLight intensity={1.7}/><directionalLight position={[1,3,4]} intensity={3}/><directionalLight position={[-2,0,-3]} intensity={2}/><Camera part={part} spatial={spatial}/><Suspense fallback={null}>
        <Model file={p.file}/>
        {part==='set'&&<><Model file="fox-40-my27" position={headPosition} rotation={[0,0,26.7*Math.PI/180]}/><Model file="bomber-cr-250" position={shockPosition} rotation={[0,0,shockAngle]}/></>}
      </Suspense></Canvas></div>}
    </section>
    {mode==='overlay'&&<label className="opacity">Opacidad del modelo <input type="range" min="0" max="1" step=".05" value={opacity} onChange={e=>setOpacity(+e.target.value)}/><output>{Math.round(opacity*100)}%</output></label>}
    <footer>{part==='set'&&<p>La referencia del conjunto corresponde solo al cuadro.</p>}<p>Contornos trazados de referencias reales. La profundidad y los puntos ocultos siguen siendo estimaciones. La horquilla se contrasta de frente; cuadro y amortiguador, de lado.</p><p>Conjunto de revisión: todavía no sustituye los modelos del configurador. <a href="/models/reference-set/README.md">Fuentes y límites</a></p></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
