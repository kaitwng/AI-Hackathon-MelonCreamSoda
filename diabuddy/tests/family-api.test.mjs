import assert from 'node:assert/strict';
import {handleFamily} from '../worker/family-api.mjs';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test'};
const req=(headers={})=>new Request('https://example.org/api/family/children',{headers});
assert.equal((await handleFamily(req(),env)).status,401);
let calls=[];const fake=async(url,options)=>{calls.push({url:String(url),options});return calls.length===1?Response.json({id:'95b53771-1618-4980-9719-94bd89eecf70'}):Response.json([{id:'child-id',nickname:'Buddy',created_at:'2026-01-01',secret:'ignored'}])};
const r=await handleFamily(req({Authorization:'Bearer token.123'}),env,fake);assert.equal(r.status,200);assert.deepEqual(await r.json(),{children:[{id:'child-id',nickname:'Buddy',created_at:'2026-01-01'}]});assert.equal(calls[1].options.headers.Authorization,'Bearer token.123');assert.equal(calls[1].options.headers.apikey,'test');assert.match(calls[1].url,/db_children/);
assert.equal((await handleFamily(req(),{})).status,503);
console.log('PASS family endpoint uses verified authentication and RLS-scoped access');
