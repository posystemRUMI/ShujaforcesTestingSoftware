import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const response=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return response(405,{error:'POST required'});
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 let createdId:string|null=null;let changedAccount:{id:string;email:string;metadata:Record<string,unknown>}|null=null;
 try{
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');if(!token)return response(401,{error:'Authentication required'});
  const {data:auth,error:authError}=await admin.auth.getUser(token);if(authError||!auth.user)return response(401,{error:'Invalid session'});
  const {data:staff}=await admin.from('profiles').select('role,status').eq('id',auth.user.id).single();
  if(staff?.role!=='ADMIN'||staff.status!=='ACTIVE')return response(403,{error:'Active administrator required'});
  const body=await req.json();const input=body.input;
  if(!input||typeof input.email!=='string')return response(400,{error:'Faculty form data required'});
  const email=input.email.trim().toLowerCase();let uid:string;
  if(body.teacherId){
   const {data:teacher,error}=await admin.from('teachers').select('profile_id').eq('id',body.teacherId).single();if(error||!teacher)throw Error('Faculty record not found');
   uid=teacher.profile_id;const {data:old,error:readError}=await admin.auth.admin.getUserById(uid);if(readError||!old.user)throw Error('Linked faculty Auth account not found');
   const {error:updateError}=await admin.auth.admin.updateUserById(uid,{email,email_confirm:true,user_metadata:{...old.user.user_metadata,display_name:input.fullName}});if(updateError)throw updateError;
   changedAccount={id:uid,email:old.user.email!,metadata:old.user.user_metadata};
  }else{
   if(typeof input.password!=='string'||input.password.length<6)return response(400,{error:'Login password must contain at least 6 characters'});
   const {data:user,error}=await admin.auth.admin.createUser({email,password:input.password,email_confirm:true,user_metadata:{display_name:input.fullName,role:'TEACHER'}});if(error||!user.user)throw Error(error?.message||'Account creation failed');
   uid=user.user.id;createdId=uid;
  }
  const {password:unusedPassword,...fields}=input;
  const {data:result,error}=await admin.rpc('portal_save_faculty',{p_teacher_id:body.teacherId||null,p_auth_user_id:uid,p_creator_id:auth.user.id,p_input:{...fields,email}});if(error)throw error;
  createdId=null;changedAccount=null;return response(200,result);
 }catch(error){
  if(createdId){const {error:cleanup}=await admin.auth.admin.deleteUser(createdId);if(cleanup)console.error('Faculty Auth cleanup failed');}
  if(changedAccount){const {error:cleanup}=await admin.auth.admin.updateUserById(changedAccount.id,{email:changedAccount.email,email_confirm:true,user_metadata:changedAccount.metadata});if(cleanup)console.error('Faculty Auth restoration failed');}
  return response(400,{error:error instanceof Error?error.message:(error as {message?:string})?.message||'Faculty save failed'});
 }
});
