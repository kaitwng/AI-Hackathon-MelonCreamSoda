/* Verify every user token with Supabase Auth. Never trust client role metadata. */
export async function authenticateSupabase(request,env,fetcher=fetch){
  if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return {error:'auth_not_configured',status:503};
  let origin;try{origin=new URL(env.SUPABASE_URL)}catch{return {error:'auth_not_configured',status:503}}
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)return {error:'auth_not_configured',status:503};
  const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.get('Authorization')||'');if(!match)return {error:'unauthenticated',status:401};
  let res;try{res=await fetcher(new URL('/auth/v1/user',origin),{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${match[1]}`}})}catch{return {error:'auth_unavailable',status:503}}
  if(res.status===401||res.status===403)return {error:'unauthenticated',status:401};
  if(!res.ok)return {error:'auth_unavailable',status:503};
  let user;try{user=await res.json()}catch{return {error:'auth_unavailable',status:503}}
  if(!user||typeof user.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id))return {error:'auth_unavailable',status:503};
  return {userId:user.id};
}
