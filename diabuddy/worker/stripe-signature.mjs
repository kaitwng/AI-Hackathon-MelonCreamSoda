/* Verify Stripe webhook signatures against raw bytes, before parsing JSON.
 * Signature verification alone is not entitlement processing: webhook routes
 * must also verify account/livemode and reconcile authoritative Stripe state.
 */
const hex=buf=>Array.from(new Uint8Array(buf),n=>n.toString(16).padStart(2,'0')).join('');
function equal(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
export async function verifyStripeWebhook(rawBody,header,secret,nowSeconds=Math.floor(Date.now()/1000)){
 if(!ArrayBuffer.isView(rawBody) || rawBody.BYTES_PER_ELEMENT!==1||rawBody.length>1048576||typeof header!=='string'||typeof secret!=='string'||!secret)return false;
 const values=header.split(',').map(x=>x.trim().split('='));const timestamps=values.filter(x=>x[0]==='t').map(x=>x[1]);const signatures=values.filter(x=>x[0]==='v1').map(x=>x[1]);
 if(timestamps.length!==1||!/^\d{1,12}$/.test(timestamps[0])||!signatures.length)return false;
 const t=Number(timestamps[0]);if(!Number.isSafeInteger(t)||Math.abs(nowSeconds-t)>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const prefix=new TextEncoder().encode(timestamps[0]+'.'),signed=new Uint8Array(prefix.length+rawBody.length);signed.set(prefix);signed.set(rawBody,prefix.length);
 const expected=hex(await crypto.subtle.sign('HMAC',key,signed));return signatures.some(sig=>/^[0-9a-f]{64}$/.test(sig)&&equal(expected,sig));
}
