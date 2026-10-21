import { canonical, type Configuration } from '../configurator/model';
export const previewVersion = 'v1';
export const previewBucket = 'bike-previews';
export const previewWidth = 640;
export const previewHeight = 400;
export const previewLimit = 262144;
export const buildPreviewKey = (user:string,id:string,revision:number) => ['build-preview',user,id,revision,previewVersion] as const;
export function buildPreviewPath(user:string,id:string,revision:number) {
 return `builds/${user}/${id}/${revision}-${previewVersion}.webp`;
}
export async function presetPreviewPath(id:string, configuration:Configuration) {
 const content=canonical({...configuration,name:'Preview'});
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return `presets/${id}/${hash}-${previewVersion}.webp`;
}
