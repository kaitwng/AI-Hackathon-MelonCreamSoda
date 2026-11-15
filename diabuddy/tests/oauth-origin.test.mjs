import assert from 'node:assert/strict';
import {handleDexcom,ORIGIN,deploymentOrigin,configurationReport} from '../worker/oauth.mjs';
const current='https://diabuddy-arcade-review.delicatecurio4.chatgpt.site';
class Bucket{objects=new Map;async get(k){const r=this.objects.get(k);return r?{etag:r.etag,json:async()=>JSON.parse(r.body)}:null}async put(k,body,options={}){const prev=this.objects.get(k);if(options.onlyIf?.etagMatches&&prev?.etag!==options.onlyIf.etagMatches)return null;const etag=crypto.randomUUID();this.objects.set(k,{body,etag});return{etag}}async delete(k){this.objects.delete(k)}}
const env={DEXCOM_APP_ORIGIN:current,DEXCOM_CLIENT_ID:'synthetic-client',DEXCOM_CLIENT_SECRET:'synthetic-secret',DEXCOM_SESSION_KEY:'b'.repeat(64),BUCKET:new Bucket};
let jar={};const req=(path,options={})=>new Request(current+path,{...options,headers:{'oai-authenticated-user-id':'origin-test-user',Cookie:Object.entries(jar).map(([k,v])=>k+'='+v).join('; '),...options.headers}});
function capture(r){for(const s of r.headers.getSetCookie()){const [k,v]=s.split(';')[0].split('=');jar[k]=v;}}
assert.equal(deploymentOrigin({}),ORIGIN);assert.equal(deploymentOrigin(env),current);
for(const origin of ['*','https://evil.example',current+'.evil.example',current+'/',current+':443',current.replace('https:','http:'),'',null]){const invalid={...env,DEXCOM_APP_ORIGIN:origin};assert.equal(configurationReport(invalid).configured,false);assert.equal((await handleDexcom(req('/api/dexcom/status'),invalid)).status,403);}
const report=configurationReport(env);assert(report.configured);assert.equal(report.origin,current);assert.equal(report.redirectUri,current+'/api/auth/dexcom/callback');assert(Object.values(report.checks).every(Boolean));assert(!JSON.stringify(report).includes('synthetic-client'));assert(!JSON.stringify(report).includes('synthetic-secret'));
assert(!configurationReport({...env,DEXCOM_CLIENT_SECRET:' '}).configured);assert(!configurationReport({...env,BUCKET:{}}).configured);
for(const origin of [ORIGIN,'https://evil.example'])assert.equal((await handleDexcom(new Request(origin+'/api/dexcom/status',{headers:{'oai-authenticated-user-id':'test','x-forwarded-host':new URL(current).host}}),env)).status,403);
assert.equal((await handleDexcom(new Request(current+'/api/dexcom/status'),env)).status,401,'origin repair preserves user authentication');
assert.equal((await handleDexcom(req('/api/auth/dexcom/login',{headers:{'sec-fetch-site':'cross-site'}}),env)).status,403);
const status=await handleDexcom(req('/api/dexcom/status'),env);assert.equal(status.status,200);assert.equal((await status.json()).configured,true);assert.equal(status.headers.get('Access-Control-Allow-Origin'),null);
let r=await handleDexcom(req('/api/auth/dexcom/login'),env);assert.equal(r.status,303);capture(r);let auth=new URL(r.headers.get('Location'));assert.equal(auth.origin,'https://sandbox-api.dexcom.com');assert.equal(auth.pathname,'/v3/oauth2/login');assert.equal(auth.searchParams.get('redirect_uri'),current+'/api/auth/dexcom/callback');assert(/^[a-f0-9]{64}$/.test(auth.searchParams.get('state')));assert(['Secure','HttpOnly','SameSite=Lax'].every(x=>r.headers.get('Set-Cookie').includes(x)));
let state=auth.searchParams.get('state');r=await handleDexcom(req('/api/auth/dexcom/callback?state='+state+'&error=access_denied'),env);assert(r.headers.get('Location').includes('denied'));
r=await handleDexcom(req('/api/auth/dexcom/login'),env);capture(r);state=new URL(r.headers.get('Location')).searchParams.get('state');
const realFetch=globalThis.fetch;let exchanges=0;
try{globalThis.fetch=async(url,options)=>{assert.equal(url,'https://sandbox-api.dexcom.com/v3/oauth2/token');assert.equal(options.body.get('redirect_uri'),current+'/api/auth/dexcom/callback');exchanges++;return Response.json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:7200});};
 r=await handleDexcom(req('/api/auth/dexcom/callback?state='+state+'&code=synthetic-test-only'),env);assert(r.headers.get('Location').includes('connected'));capture(r);assert.equal(exchanges,1);assert.equal((await(await handleDexcom(req('/api/dexcom/status'),env)).json()).connected,true);
 assert.equal((await handleDexcom(req('/api/dexcom/disconnect',{method:'POST',headers:{origin:ORIGIN,'x-sugarpet-action':'disconnect'}}),env)).status,403);
 assert.equal((await handleDexcom(req('/api/dexcom/disconnect',{method:'POST',headers:{origin:current,'x-sugarpet-action':'disconnect'}}),env)).status,200);
}finally{globalThis.fetch=realFetch;}
console.log('PASS: exact per-site origins, fail-closed configuration, preserved authentication/CSRF/CORS, current-domain sandbox login/callback/token redirect consistency, encrypted sessions and same-origin disconnect.');
