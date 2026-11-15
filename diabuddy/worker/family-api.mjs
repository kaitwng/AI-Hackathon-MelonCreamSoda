import {authenticateSupabase} from './supabase-auth.mjs';
const familyJSON=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
/* This read-only route deliberately uses the caller's JWT, not the service key.
 * Supabase RLS must be deployed and verified before storing real family data. */
export async function handleFamily(request,env,fetcher=fetch){
 const path=new URL(request.url).pathname;if(!path.startsWith('/api/family/'))return null;
 if(path!=='/api/family/children')return familyJSON({error:'not_found'},404);
 if(request.method!=='GET')return familyJSON({error:'method_not_allowed'},405);
 const auth=await authenticateSupabase(request,env,fetcher);if(auth.error)return familyJSON({error:auth.error},auth.status);
 const url=new URL('/rest/v1/db_children',env.SUPABASE_URL);url.searchParams.set('select','id,nickname,created_at');url.searchParams.set('order','created_at.asc');
 let response;try{response=await fetcher(url,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:request.headers.get('Authorization'),Accept:'application/json'}})}catch{return familyJSON({error:'family_service_unavailable'},503)}
 if(!response.ok)return familyJSON({error:'family_service_unavailable'},503);
 let children;try{children=await response.json()}catch{return familyJSON({error:'family_service_unavailable'},503)}
 if(!Array.isArray(children))return familyJSON({error:'family_service_unavailable'},503);
 return familyJSON({children:children.map(({id,nickname,created_at})=>({id,nickname,created_at}))});
}
