import {render,screen,cleanup}from'@testing-library/react';
import{afterEach,describe,it,expect}from'vitest';
import source from '../../../supabase/catalog/gravity-reviewed.json';
import{parseCatalogImport}from'./model/ingestion';
import{VariantInformation}from'./VariantInformation';
const catalog=parseCatalogImport(source);
const component=(slug:string)=>({...catalog.components.find(c=>c.slug===slug)!,brands:{id:'brand',name:'COMMENCAL',slug:'commencal'}});
afterEach(cleanup);
describe('catalogue generation identity',()=>{
 it('shows a historical generation explicitly without repeating its year',()=>{
  const c=component('commencal-furious-v3-2021'),v={...catalog.variants.find(v=>v.component_id===c.id)!,visual_assets:null};render(<VariantInformation component={c} variant={v}/>);
  expect(screen.getByText('Generación')).toBeInTheDocument();expect(screen.getByText('Furious V3 · 2021 · Archivo')).toBeInTheDocument();expect(screen.queryByText('Año',{exact:true})).not.toBeInTheDocument();
 });
 it('keeps MY year concise but exposes a year when generation does not identify it',()=>{
  const c=component('santa-cruz-v10-8-my27'),v={...catalog.variants.find(v=>v.component_id===c.id)!,visual_assets:null};const{rerender}=render(<VariantInformation component={c} variant={v}/>);
  expect(screen.queryByText('Año',{exact:true})).not.toBeInTheDocument();
  rerender(<VariantInformation component={c} variant={{...v,generation:'V10.8'}}/>);expect(screen.getByText('Año',{exact:true})).toBeInTheDocument();expect(screen.getByText('2027',{exact:true})).toBeInTheDocument();
 });
});
