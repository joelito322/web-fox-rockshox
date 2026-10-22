// Disposable account; screenshots only. No save, catalogue or role mutations.
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { readProjectEnvironment } from './lib/environment.mjs';
const env=readProjectEnvironment();const admin=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const out='entregables/04_Presentacion/recursos';let browser,id;
const result={purpose:'Capturas reales lateral y perspectiva para la presentación; sin guardar montajes',cleanup:false};
try{
 const email=`slides-${randomUUID()}@example.invalid`,password=randomBytes(30).toString('base64url');
 const a=await admin.auth.admin.createUser({email,password,email_confirm:true});if(a.error)throw Error('No se pudo crear cuenta temporal');id=a.data.user.id;
 browser=await chromium.launch();const p=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2,reducedMotion:'reduce'});p.setDefaultTimeout(35000);
 await p.goto('https://atlasmtb.netlify.app/entrar');await p.getByLabel('Correo electrónico').fill(email);await p.getByLabel('Contraseña',{exact:true}).fill(password);await p.getByRole('button',{name:'Entrar',exact:true}).click();await expect(p).toHaveURL(/mis-bicicletas/);
 await p.goto('https://atlasmtb.netlify.app/bicicletas');await p.locator('.preset-card').first().getByRole('link',{name:/Personalizar/}).click();await expect(p.locator('.slot-complete')).toHaveCount(23,{timeout:60000});await p.locator('canvas').first().waitFor({timeout:60000});
 const ready=()=>p.locator('canvas').first().evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
 await p.getByRole('button',{name:'Lateral',exact:true}).click();await ready();await p.locator('canvas').first().screenshot({path:out+'/montaje-lateral.png'});
 await p.getByRole('button',{name:'Restablecer',exact:true}).click();await ready();await p.locator('canvas').first().screenshot({path:out+'/montaje-perspectiva.png'});result.captures=2;console.log('Dos vistas capturadas');
}catch(e){result.failure=e.message;process.exitCode=1;console.log(e.message);}
finally{if(browser)await browser.close();if(id){const d=await admin.auth.admin.deleteUser(id);result.cleanup=!d.error;}else result.cleanup=true;writeFileSync(out+'/validacion-vistas.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({cleanup:result.cleanup,captures:result.captures??0}));}
