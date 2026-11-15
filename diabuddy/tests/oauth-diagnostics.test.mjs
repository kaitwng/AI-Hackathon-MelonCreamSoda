import assert from 'node:assert/strict';
import {handleDexcom} from '../worker/oauth.mjs';
const origin='https://diabuddy-arcade-review.delicatecurio4.chatgpt.site',sensitive='NEVER_LOG_PRIVATE_VALUE';
class Bucket{objects=new Map;rejectSessions=false;corruptSessions=false;async get(k){const x=this.objects.get(k);if(!x)return null;return{etag:x.etag,json:async()=>this.corruptSessions&&k.includes('/session/')?{v:1,iv:'broken',data:'broken'}:JSON.parse(x.body)}}async put(k,body,opt={}){if(this.rejectSessions&&k.includes('/session/'))throw Error(sensitive);if(opt.onlyIf?.etagMatches&&this.objects.get(k)?.etag!==opt.onlyIf.etagMatches)return null;const x={body,etag:crypto.randomUUID()};this.objects.set(k,x);return x}async delete(k){this.objects.delete(k)}}
const bucket=new Bucket,env={DEXCOM_APP_ORIGIN:origin,DEXCOM_CLIENT_ID:sensitive,DEXCOM_CLIENT_SECRET:sensitive,DEXCOM_SESSION_KEY:'c'.repeat(64),BUCKET:bucket};let jar={},logs=[],sentCodes=[],mode='success';
const req=(p,identity=true)=>new Request(origin+p,{headers:{...(identity?{'oai-authenticated-user-id':'private-test-identity'}:{}),cookie:Object.entries(jar).map(([k,v])=>k+'='+v).join('; ')}});
const capture=r=>r.headers.getSetCookie().forEach(c=>{const [k,v]=c.split(';')[0].split('=');jar[k]=v});
const realFetch=globalThis.fetch,realInfo=console.info,realError=console.error;
try{
 console.info=console.error=x=>logs.push(JSON.parse(x));
 globalThis.fetch=async(url,opt)=>{assert.equal(url,'https://sandbox-api.dexcom.com/v3/oauth2/token');assert.equal(opt.body.get('redirect_uri'),origin+'/api/auth/dexcom/callback');return mode==='invalid_client'?Response.json({error:'invalid_client',error_description:sensitive},{status:401}):Response.json({access_token:sensitive+'-access',refresh_token:sensitive+'-refresh',expires_in:7200})};
 async function begin(){const r=await handleDexcom(req('/api/auth/dexcom/login'),env);assert.equal(r.status,303);capture(r);const s=new URL(r.headers.get('Location')).searchParams.get('state');sentCodes.push(s);return s}
 async function callback(state,identity=true){const r=await handleDexcom(req('/api/auth/dexcom/callback?state='+state+'&code='+sensitive,identity),env);return {response:r,outcome:new URL(r.headers.get('Location'),origin).searchParams.get('dexcom')}}
 let state=await begin(),r=await callback(state,false);assert.equal(r.outcome,'sign_in_required');assert(logs.some(x=>x.event==='missing_session'));
 r=await callback('a'.repeat(64));assert.equal(r.outcome,'state_error');assert(logs.some(x=>x.event==='oauth_state_mismatch'));
 mode='invalid_client';r=await callback(state);assert.equal(r.outcome,'token_exchange_failed');assert(logs.some(x=>x.event==='token_exchange_failed'&&x.upstreamStatus===401&&x.providerError==='invalid_client'));
 mode='success';bucket.rejectSessions=true;state=await begin();r=await callback(state);assert.equal(r.outcome,'token_storage_failed');assert(logs.some(x=>x.event==='token_storage_failed'&&x.stage==='token_storage'));assert(!r.response.headers.getSetCookie().some(x=>x.startsWith('__Host-sugarpet-dexcom=')));
 bucket.rejectSessions=false;state=await begin();r=await callback(state);assert.equal(r.outcome,'connected');capture(r.response);assert(logs.some(x=>x.event==='token_storage_succeeded'&&x.storageVerified));
 bucket.corruptSessions=true;const status=await handleDexcom(req('/api/dexcom/status'),env);assert.equal(status.status,503);assert(logs.some(x=>x.event==='connection_status_failed'));
 bucket.corruptSessions=false;
 const RealResponse=globalThis.Response;globalThis.Response=new Proxy(RealResponse,{construct(target,args){const r=Reflect.construct(target,args);if(args[1]?.headers?.Location==='/?dexcom=connected')r.headers.append=()=>{throw Error(sensitive)};return r}});
 try{state=await begin();r=await callback(state);assert.equal(r.outcome,'callback_redirect_failed');assert(logs.some(x=>x.event==='callback_redirect_failed'&&x.stage==='callback_redirect'));}finally{globalThis.Response=RealResponse;}
 const serialized=JSON.stringify(logs);assert(!serialized.includes(sensitive));assert(!serialized.includes(env.DEXCOM_SESSION_KEY));assert(!serialized.includes('private-test-identity'));for(const state of sentCodes)assert(!serialized.includes(state));assert(!serialized.includes('error_description'));assert(logs.some(x=>x.event==='callback_received'&&x.hasCode&&x.hasStateCookie&&x.hasIdentity));
}finally{globalThis.fetch=realFetch;console.info=realInfo;console.error=realError;}
console.log('PASS: callback failures identify missing identity, state, token rejection, storage, redirect and status stages; log output excludes private payloads, identifiers, cookies and secrets.');
