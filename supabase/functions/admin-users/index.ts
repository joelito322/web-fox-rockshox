import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const origins=(Deno.env.get('ALLOWED_ORIGINS')??'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://127.0.0.1:4180,https://atlasmtb.netlify.app').split(',').map(s=>s.trim())
Deno.serve(async(request:Request)=>{
 const origin=request.headers.get('origin')??''
 const headers:Record<string,string>={'Content-Type':'application/json','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'}
 if(origins.includes(origin))headers['Access-Control-Allow-Origin']=origin
 const respond=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers})
 if(origin&&!origins.includes(origin))return respond(403,{code:'origin_not_allowed'})
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(request.method!=='POST')return respond(405,{code:'method_not_allowed'})
 if(Number(request.headers.get('content-length')??0)>8192)return respond(413,{code:'request_too_large'})
 const bearer=request.headers.get('authorization')
 if(!bearer?.startsWith('Bearer '))return respond(401,{code:'authentication_required'})
 const url=Deno.env.get('SUPABASE_URL')!
 const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}})
 const {data:identity,error:identityError}=await client.auth.getUser(bearer.slice(7))
 if(identityError||!identity.user)return respond(401,{code:'authentication_required'})
 try{
  const text=await request.text();if(text.length>8192)return respond(413,{code:'request_too_large'})
  const input=JSON.parse(text)
  if(input.action==='list'){
   const {data,error}=await client.rpc('admin_list_users',{p_search:typeof input.search==='string'?input.search:'',p_page:Number.isInteger(input.page)?input.page:0})
   if(error)return respond(error.code==='42501'?403:400,{code:error.code==='42501'?'permission_denied':'invalid_request'})
   return respond(200,data)
  }
  if(input.action==='assign'){
   if(!/^[0-9a-f-]{36}$/i.test(input.userId)||!/^[0-9a-f-]{36}$/i.test(input.roleId)||!Number.isInteger(input.revision))return respond(400,{code:'invalid_request'})
   const {data,error}=await client.rpc('assign_user_role',{p_user_id:input.userId,p_role_id:input.roleId,p_expected_revision:input.revision})
   if(error)return respond(error.code==='42501'?403:error.code==='PT409'?409:400,{code:error.code==='PT409'?'revision_conflict':error.code==='42501'?'permission_denied':'assignment_failed'})
   return respond(200,data)
  }
  if(input.action!=='invite'||typeof input.email!=='string'||input.email.length>254||!/^\S+@\S+\.\S+$/.test(input.email)||!/^[0-9a-f-]{36}$/i.test(input.roleId))return respond(400,{code:'invalid_request'})
  const {error:permissionError}=await client.rpc('check_invitation',{p_role_id:input.roleId})
  if(permissionError)return respond(403,{code:'permission_denied'})
  const {data:existing,error:lookupError}=await client.rpc('admin_list_users',{p_search:input.email,p_page:0})
  if(lookupError)return respond(403,{code:'permission_denied'})
  if(existing.users.some((u:{email:string})=>u.email.toLowerCase()===input.email.toLowerCase()))return respond(409,{code:'account_already_exists'})
  const redirectOrigin=origins.includes(origin)?origin:origins[0]
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data,error}=await admin.auth.admin.inviteUserByEmail(input.email,{redirectTo:`${redirectOrigin}/auth/callback`})
  if(error)return respond(400,{code:'invitation_failed'})
  const userId=data.user.id
  const {data:ownRole,error:roleError}=await client.rpc('admin_list_users',{p_search:input.email,p_page:0})
  const target=ownRole?.users.find((u:{id:string})=>u.id===userId)
  if(roleError||!target)return respond(200,{status:'partial',userId,code:'role_assignment_pending'})
  if(target.role_id===input.roleId)return respond(200,{status:'invited',userId})
  const {error:assignError}=await client.rpc('assign_user_role',{p_user_id:userId,p_role_id:input.roleId,p_expected_revision:target.revision})
  return respond(200,assignError?{status:'partial',userId,code:'role_assignment_pending'}:{status:'invited',userId})
 }catch{return respond(400,{code:'invalid_request'})}
})
