// Dexcom v3 sandbox only. Secrets and tokens never enter asset responses.
export const ORIGIN='https://mellow-pixel-companion.delicatecurio4.chatgpt.site';
export const REDIRECT=ORIGIN+'/api/auth/dexcom/callback';
// One exact trusted origin per deployment. Never derive trust from request/forwarded headers.
const TRUSTED_ORIGINS=new Set([ORIGIN,'https://diabuddy-arcade-review.delicatecurio4.chatgpt.site']);
export function deploymentOrigin(env){const origin=env.DEXCOM_APP_ORIGIN===undefined?ORIGIN:env.DEXCOM_APP_ORIGIN;return TRUSTED_ORIGINS.has(origin)?origin:null}
const API='https://sandbox-api.dexcom.com',MAX_SESSION=7*86400000,STALE=15*60000;
const enc=new TextEncoder(),dec=new TextDecoder();
const hex=b=>[...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const hash=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
class Fault extends Error {constructor(code,status=400,details={}){super(code);this.code=code;this.status=status;this.details=details}}
const providerErrors=new Set(['invalid_client','invalid_grant','invalid_request','unauthorized_client','unsupported_grant_type','invalid_scope','access_denied','server_error','temporarily_unavailable']);
function diagnostic(event,stage,fields={}){
 const record={component:'dexcom_oauth',event,stage};
 for(const key of ['hasCode','hasOAuthError','hasState','hasStateCookie','hasIdentity','stateValidated','storageVerified','hasSessionCookie','connected','networkFailure'])if(typeof fields[key]==='boolean')record[key]=fields[key];
 for(const key of ['httpStatus','upstreamStatus'])if(Number.isInteger(fields[key]))record[key]=fields[key];
 if(providerErrors.has(fields.providerError))record.providerError=fields.providerError;
 if(['invalid_origin','sign_in_required','invalid_oauth_state','invalid_oauth_code','setup_required','token_storage_failed','token_exchange_failed','invalid_provider_response','connection_unavailable','reconnect_required','provider_unavailable'].includes(fields.reason))record.reason=fields.reason;
 if(['OperationError','DataError','TypeError','SyntaxError'].includes(fields.errorName))record.errorName=fields.errorName;
 try{console[event.endsWith('_failed')||event==='oauth_state_mismatch'||event==='missing_session'?'error':'info'](JSON.stringify(record))}catch{}
}
function failureEvent(stage,code){if(code==='sign_in_required')return'missing_session';if(code==='invalid_oauth_state')return'oauth_state_mismatch';if(stage==='token_exchange')return'token_exchange_failed';if(['state_load','state_claim','previous_session','token_storage'].includes(stage))return'token_storage_failed';if(stage==='connection_status')return'connection_status_failed';return'callback_redirect_failed'}
function callbackResult(code,stage){if(code==='sign_in_required')return'sign_in_required';if(code==='invalid_oauth_state')return'state_error';if(code==='setup_required')return'setup_required';if(code==='invalid_origin')return'invalid_origin';if(stage==='token_exchange')return'token_exchange_failed';if(['state_load','state_claim','previous_session','token_storage'].includes(stage))return'token_storage_failed';return'callback_redirect_failed'}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const cookie=(name,value,age)=>`${name}=${value}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;
const cookies=req=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(p=>p.trim().split('=')));
const sidCookie='__Host-sugarpet-dexcom',stateCookie='__Host-sugarpet-dexcom-state';
function redirect(result,headers={}){return new Response(null,{status:303,headers:{Location:'/?dexcom='+result,'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...headers}})}
export function configurationReport(env){return {build:'dexcom-origin-config-2',origin:deploymentOrigin(env),redirectUri:deploymentOrigin(env)?deploymentOrigin(env)+'/api/auth/dexcom/callback':null,checks:{originValid:!!deploymentOrigin(env),clientIdBindingPresent:env.DEXCOM_CLIENT_ID!==undefined,clientIdUsable:typeof env.DEXCOM_CLIENT_ID==='string'&&env.DEXCOM_CLIENT_ID.trim().length>0,clientSecretBindingPresent:env.DEXCOM_CLIENT_SECRET!==undefined,clientSecretUsable:typeof env.DEXCOM_CLIENT_SECRET==='string'&&env.DEXCOM_CLIENT_SECRET.trim().length>0,sessionKeyBindingPresent:env.DEXCOM_SESSION_KEY!==undefined,sessionKeyValid:typeof env.DEXCOM_SESSION_KEY==='string'&&/^[a-f0-9]{64}$/i.test(env.DEXCOM_SESSION_KEY),storageBindingPresent:!!env.BUCKET,storageBindingUsable:!!env.BUCKET&&typeof env.BUCKET.get==='function'&&typeof env.BUCKET.put==='function'&&typeof env.BUCKET.delete==='function'},configured:configured(env),simulated:true}}
function configured(env){return !!(deploymentOrigin(env)&&typeof env.DEXCOM_CLIENT_ID==='string'&&env.DEXCOM_CLIENT_ID.trim()&&typeof env.DEXCOM_CLIENT_SECRET==='string'&&env.DEXCOM_CLIENT_SECRET.trim()&&/^[a-f0-9]{64}$/i.test(env.DEXCOM_SESSION_KEY||'')&&env.BUCKET&&typeof env.BUCKET.get==='function'&&typeof env.BUCKET.put==='function'&&typeof env.BUCKET.delete==='function')}
async function key(env){return crypto.subtle.importKey('raw',Uint8Array.from(env.DEXCOM_SESSION_KEY.match(/../g),n=>parseInt(n,16)),{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function seal(env,path,obj){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(path)},await key(env),enc.encode(JSON.stringify(obj)));return JSON.stringify({v:1,iv:b64(iv),data:b64(data)})}
async function load(env,path){const stored=await env.BUCKET.get(path);if(!stored)return null;const blob=await stored.json();const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(blob.iv),additionalData:enc.encode(path)},await key(env),un64(blob.data));return {value:JSON.parse(dec.decode(clear)),etag:stored.etag}}
async function put(env,path,value,etag){return env.BUCKET.put(path,await seal(env,path,value),{httpMetadata:{contentType:'application/octet-stream'},...(etag?{onlyIf:{etagMatches:etag}}:{})})}
async function identify(req){const user=req.headers.get('oai-authenticated-user-id');if(!user)throw new Fault('sign_in_required',401);return hash(user)}
async function session(req,env,user){const id=cookies(req)[sidCookie];if(!/^[a-f0-9]{64}$/.test(id||''))return null;const path='dexcom/session/'+user+'/'+await hash(id),stored=await load(env,path);if(!stored)return null;if(stored.value.expiresAt<Date.now()){await env.BUCKET.delete(path);return null}return {...stored,path}}
async function provider(path,options={}){try{return await fetch(API+path,{...options,redirect:'error',signal:AbortSignal.timeout(12000)})}catch{throw new Fault('provider_unavailable',503,{networkFailure:true})}}
async function token(env,params){
 const callback=params.grant_type==='authorization_code';
 const response=await provider('/v3/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.DEXCOM_CLIENT_ID,client_secret:env.DEXCOM_CLIENT_SECRET,...params})});
 let data;try{data=await response.json()}catch{throw new Fault('invalid_provider_response',502,{upstreamStatus:response.status})}
 if(!response.ok)throw new Fault(callback?'token_exchange_failed':response.status===400||response.status===401?'reconnect_required':'provider_unavailable',callback?502:response.status===400||response.status===401?401:503,{upstreamStatus:response.status,providerError:providerErrors.has(data?.error)?data.error:undefined});
 if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string'||!Number.isFinite(data.expires_in)||data.expires_in<=0)throw new Fault('invalid_provider_response',502,{upstreamStatus:response.status});
 if(callback)diagnostic('token_exchange_succeeded','token_exchange',{upstreamStatus:response.status});
 return{access:data.access_token,refresh:data.refresh_token,tokenExpiresAt:Date.now()+data.expires_in*1000};
}
async function refresh(env,s){if(s.value.lockUntil>Date.now())throw new Fault('refresh_in_progress',503);const locked={...s.value,lockUntil:Date.now()+30000},lease=await put(env,s.path,locked,s.etag);if(!lease)throw new Fault('refresh_in_progress',503);try{const next={...locked,...await token(env,{grant_type:'refresh_token',refresh_token:locked.refresh}),lockUntil:0};const saved=await put(env,s.path,next,lease.etag);if(!saved)throw new Fault('reconnect_required',401);return{...s,value:next,etag:saved.etag}}catch(e){
// Never replay a possibly consumed refresh token after an uncertain exchange.
await env.BUCKET.delete(s.path);throw e instanceof Fault?e:new Fault('reconnect_required',401)}}
async function dexGet(env,s,path){if(s.value.tokenExpiresAt<Date.now()+60000)s=await refresh(env,s);let response=await provider(path,{headers:{Authorization:'Bearer '+s.value.access}});if(response.status===401){s=await refresh(env,s);response=await provider(path,{headers:{Authorization:'Bearer '+s.value.access}})}if(!response.ok){if(response.status===401||response.status===403){await env.BUCKET.delete(s.path);throw new Fault('reconnect_required',401)}throw new Fault(response.status===429?'rate_limited':'provider_unavailable',503)}let data;try{data=await response.json()}catch{throw new Fault('invalid_provider_response',502)}return {data,session:s}}
export function utc(s){if(typeof s!=='string')return NaN;return Date.parse(/[zZ]$|[+-]\d\d:\d\d$/.test(s)?s:s+'Z')}
export function latestG7(data,now=Date.now()){if(!Array.isArray(data?.records))throw new Fault('invalid_provider_response',502);const rows=data.records.filter(r=>r.transmitterGeneration==='g7'||r.transmitterGenerationVariant==='g7'||r.transmitterGenerationVariant==='g715day').map(r=>({...r,time:utc(r.systemTime)})).filter(r=>Number.isFinite(r.time)&&r.time<=now+60000).sort((a,b)=>b.time-a.time);const r=rows[0];if(!r)return null;const numeric=Number.isFinite(r.value)&&r.unit==='mg/dL'&&r.value>=39&&r.value<=401;const usable=numeric&&!['notComputable','outOfRange','unknown'].includes(r.status);return{value:usable?r.value:null,displayValue:usable?(r.value===39?'LOW':r.value===401?'HIGH':String(r.value)):'Unavailable',unit:'mg/dL',timestamp:new Date(r.time).toISOString(),trend:typeof r.trend==='string'?r.trend:'unknown',status:r.status||null,stale:now-r.time>STALE,future:r.time>now,simulated:true,sensor:'G7'}}
function dateParam(ms){return new Date(ms).toISOString().slice(0,19)}
export async function handleDexcom(req,env){const url=new URL(req.url);if(!url.pathname.startsWith('/api/'))return null;let stage='request_validation';const isCallback=url.pathname==='/api/auth/dexcom/callback';
if(isCallback)diagnostic('callback_received',stage,{hasCode:url.searchParams.has('code'),hasOAuthError:url.searchParams.has('error'),hasState:url.searchParams.has('state'),hasStateCookie:!!cookies(req)[stateCookie],hasIdentity:!!req.headers.get('oai-authenticated-user-id')});
try{
const origin=deploymentOrigin(env);if(!origin||url.origin!==origin)throw new Fault('invalid_origin',403);const redirectUri=origin+'/api/auth/dexcom/callback';
if(url.pathname==='/api/dexcom/configuration'&&req.method==='GET')return json(configurationReport(env));
stage='identity';const user=await identify(req),route=url.pathname;
if(route==='/api/dexcom/status'&&req.method==='GET'){stage='connection_status';if(!configured(env))return json({configured:false,connected:false,simulated:true,message:'Server setup required: Dexcom credentials and secure storage.'});const s=await session(req,env,user);diagnostic('connection_status_checked',stage,{hasSessionCookie:!!cookies(req)[sidCookie],connected:!!s});return json({configured:true,connected:!!s,simulated:true,environment:'sandbox'})}
if(!configured(env))throw new Fault('setup_required',503);
if(route==='/api/auth/dexcom/login'&&req.method==='GET'){
stage='login_request';if(req.headers.get('sec-fetch-site')==='cross-site')throw new Fault('invalid_origin',403);
stage='login_state_storage';const old=cookies(req)[stateCookie];if(/^[a-f0-9]{64}$/.test(old||''))await env.BUCKET.delete('dexcom/state/'+user+'/'+await hash(old));
const state=random(),path='dexcom/state/'+user+'/'+await hash(state);if(!await put(env,path,{user,expiresAt:Date.now()+600000,consumed:false}))throw new Fault('token_storage_failed',503);diagnostic('login_redirect_ready','login_redirect',{hasState:true});const auth=new URL(API+'/v3/oauth2/login');auth.search=new URLSearchParams({client_id:env.DEXCOM_CLIENT_ID,redirect_uri:redirectUri,response_type:'code',scope:'offline_access',state});return new Response(null,{status:303,headers:{Location:auth.href,'Set-Cookie':cookie(stateCookie,state,600),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})}
if(route==='/api/auth/dexcom/callback'&&req.method==='GET'){
 stage='state_cookie';const state=url.searchParams.get('state'),bound=cookies(req)[stateCookie];
 if(!/^[a-f0-9]{64}$/.test(state||'')||state!==bound)throw new Fault('invalid_oauth_state');
 stage='state_load';const path='dexcom/state/'+user+'/'+await hash(state),pending=await load(env,path);
 if(!pending||pending.value.consumed||pending.value.expiresAt<Date.now()||pending.value.user!==user)throw new Fault('invalid_oauth_state');
 stage='state_claim';if(!await put(env,path,{...pending.value,consumed:true},pending.etag))throw new Fault('invalid_oauth_state');
 diagnostic('oauth_state_validated',stage,{stateValidated:true});const clear=cookie(stateCookie,'',0);
 if(url.searchParams.has('error')){await env.BUCKET.delete(path);diagnostic('authorization_declined','provider_authorization');return redirect('denied',{'Set-Cookie':clear})}
 stage='authorization_code';const code=url.searchParams.get('code');if(!code||code.length>4096)throw new Fault('invalid_oauth_code');
 stage='token_exchange';const tokens=await token(env,{grant_type:'authorization_code',code,redirect_uri:redirectUri});
 stage='previous_session';const previous=await session(req,env,user);
 stage='token_storage';const id=random(),newpath='dexcom/session/'+user+'/'+await hash(id);
 try{
  if(!await put(env,newpath,{...tokens,expiresAt:Date.now()+MAX_SESSION,lockUntil:0}))throw new Fault('token_storage_failed',503);
  const verified=await load(env,newpath);if(!verified||verified.value.access!==tokens.access||verified.value.refresh!==tokens.refresh)throw new Fault('token_storage_failed',503);
 }catch(error){try{await env.BUCKET.delete(newpath)}catch{}throw error}
 diagnostic('token_storage_succeeded',stage,{storageVerified:true});
 if(previous)await env.BUCKET.delete(previous.path);await env.BUCKET.delete(path);
 stage='callback_redirect';const response=redirect('connected');response.headers.append('Set-Cookie',clear);response.headers.append('Set-Cookie',cookie(sidCookie,id,MAX_SESSION/1000));diagnostic('callback_succeeded',stage,{httpStatus:303});return response;
}
if(route==='/api/dexcom/disconnect'&&req.method==='POST'){if(req.headers.get('origin')!==origin||req.headers.get('x-sugarpet-action')!=='disconnect')throw new Fault('invalid_origin',403);const s=await session(req,env,user);if(s)await env.BUCKET.delete(s.path);const response=json({connected:false,simulated:true});response.headers.set('Set-Cookie',cookie(sidCookie,'',0));return response}
if(route==='/api/dexcom/egvs'&&req.method==='GET'){let s=await session(req,env,user);if(!s)throw new Fault('reconnect_required',401);const now=Date.now();if(s.value.cachedAt&&now-s.value.cachedAt<60000)return json({...s.value.cached,reading:s.value.cached.reading?{...s.value.cached.reading,stale:now-utc(s.value.cached.reading.timestamp)>STALE}:null});let result=await dexGet(env,s,'/v3/users/self/egvs?'+new URLSearchParams({startDate:dateParam(now-86400000),endDate:dateParam(now+1000)}));s=result.session;let reading=latestG7(result.data,now),historical=false;
// Sandbox accounts can contain historical data only. Never rewrite its timestamps.
if(!reading){const range=await dexGet(env,s,'/v3/users/self/dataRange');s=range.session;const end=utc(range.data?.egvs?.end?.systemTime);if(Number.isFinite(end)&&end<now){result=await dexGet(env,s,'/v3/users/self/egvs?'+new URLSearchParams({startDate:dateParam(end-86400000),endDate:dateParam(end+1000)}));s=result.session;reading=latestG7(result.data,now);historical=!!reading}}
const body={connected:true,simulated:true,environment:'sandbox',reading,historical,staleAfterMinutes:15,fetchedAt:new Date(now).toISOString(),message:reading?null:'No simulated G7 readings found. Connect again and select Sandbox User - G7.'};await put(env,s.path,{...s.value,cached:body,cachedAt:now},s.etag);return json(body)}
return json({error:'not_found'},404)
}catch(error){const code=error instanceof Fault?error.code:'connection_unavailable',status=error instanceof Fault?error.status:503;
if(isCallback||url.pathname==='/api/dexcom/status'||url.pathname==='/api/auth/dexcom/login')diagnostic(failureEvent(url.pathname==='/api/dexcom/status'?'connection_status':stage,code),stage,{httpStatus:status,reason:code,...(error instanceof Fault?error.details:{}),errorName:error.name});
if(isCallback)return redirect(callbackResult(code,stage),{'Set-Cookie':cookie(stateCookie,'',0)});
return json({error:code,simulated:true},status)}}
