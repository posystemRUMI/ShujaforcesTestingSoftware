import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={ 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type' };
const response=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
serve(async(req:Request)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 if(req.method!=='POST') return response(405,{error:'POST required'});
 let createdUserId:string|null=null;
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 try {
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
  if(!token) return response(401,{error:'Authentication required'});
  const {data:auth,error:authError}=await admin.auth.getUser(token);
  if(authError||!auth.user) return response(401,{error:'Invalid authenticated session'});
  const {data:staff,error:staffError}=await admin.from('profiles').select('role,status').eq('id',auth.user.id).single();
  if(staffError||!staff||!['ADMIN','TEACHER'].includes(staff.role)||staff.status!=='ACTIVE') return response(403,{error:'Active staff authorization required'});
  const body=await req.json();
  for(const field of ['email','fullName','fatherName','cnic','phone','targetForceId','targetCourseId','rollNumber','education']) {
   if(typeof body[field]!=='string'||!body[field].trim()) return response(400,{error:`${field} is required`});
  }
  if(typeof body.password!=='string'||body.password.length<6) return response(400,{error:'Password must contain at least 6 characters'});
  const total=Number(body.courseFeeAmount??0),paid=Number(body.initialPaymentAmount??0);
  if(!Number.isFinite(total)||!Number.isFinite(paid)||total<0||paid<0||paid>total) return response(400,{error:'Invalid registration fee or initial payment'});
  const {data:course,error:courseError}=await admin.from('courses').select('force_id,status').eq('id',body.targetCourseId).single();
  if(courseError||course?.status!=='ACTIVE'||course.force_id!==body.targetForceId) return response(400,{error:'Invalid force/course selection'});
  const {data:user,error:createError}=await admin.auth.admin.createUser({email:body.email.trim().toLowerCase(),password:body.password,email_confirm:true,user_metadata:{display_name:body.fullName.trim(),role:'STUDENT'}});
  if(createError||!user.user) return response(400,{error:createError?.message||'Authentication account creation failed'});
  createdUserId=user.user.id;
  const {password:unusedPassword,...input}=body;
  const {data:result,error:registrationError}=await admin.rpc('portal_register_student',{p_auth_user_id:createdUserId,p_creator_id:auth.user.id,p_input:{...input,courseFeeAmount:total,initialPaymentAmount:paid}});
  if(registrationError) throw new Error(registrationError.message);
  createdUserId=null;
  return response(200,result);
 } catch(error) {
  if(createdUserId) {
   const {error:cleanupError}=await admin.auth.admin.deleteUser(createdUserId);
   if(cleanupError) console.error('Registration auth cleanup failed',cleanupError.message);
  }
  return response(400,{error:error instanceof Error?error.message:'Registration failed'});
 }
});
