// Offline bitmap lettering, baked into the new GLB; existing resources remain untouched.
import * as T from 'three';
export function lettering(text: string, color: string, width: number, height: number) {
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;
 const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,1024,192);ctx.fillStyle=color;ctx.font='italic 900 142px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,104,1000);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.08,roughness:.45,metalness:.05,side:T.DoubleSide,depthWrite:false});
 return new T.Mesh(new T.PlaneGeometry(width,height),material);
}
