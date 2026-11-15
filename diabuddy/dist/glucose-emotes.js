/* Read-only visual policy. No storage, rewards, dosing, logs or device commands. */
(function(root){'use strict';
const STALE_MS=15*60*1000;
const contexts={
 range:[{id:'book',action:'Reading',label:'Enjoying a favorite story'},{id:'knit',action:'Knitting',label:'Making something cozy'},{id:'stretch',action:'Stretching',label:'Taking a gentle stretch'}],
 high:[{id:'water',action:'Drinking water',label:'Taking a water break'},{id:'bathroom',action:'Bathroom break',label:'Looking toward the bathroom'},{id:'pumpCheck',action:'Checking pump',label:'Checking the pump screen'}],
 low:[{id:'candy',action:'Eating candy',label:'Having a candy break'},{id:'juice',action:'Sipping juice',label:'Sipping juice'},{id:'sweat',action:'Subtle sweating',label:'Taking a quiet pause'}]
};
function readingState(connection,thresholds,now=Date.now()){
 const neutral=reason=>({band:'range',valid:false,reason,simulated:connection?.reading?.simulated===true});
 if(!connection?.connected||connection.error)return neutral('unavailable');
 const r=connection.reading;if(!r)return neutral('missing');
 if(!thresholds||!Number.isInteger(thresholds.low)||!Number.isInteger(thresholds.high)||thresholds.low<20||thresholds.high>600||thresholds.low>=thresholds.high)return neutral('invalid_thresholds');
 if(!Number.isFinite(r.value)||r.value<39||r.value>401||r.unit!=='mg/dL'||r.sensor!=='G7'||![undefined,null,'ok','low','high'].includes(r.status))return neutral('invalid');
 const time=Date.parse(r.timestamp);if(!Number.isFinite(time))return neutral('invalid');
 if(r.future||time>now)return neutral('future');
 if(r.stale||now-time>STALE_MS)return neutral('stale');
 return {band:r.value<=thresholds.low?'low':r.value>=thresholds.high?'high':'range',valid:true,reason:'recent',simulated:r.simulated===true};
}
function createDirector(){
 let band=null,started=0,blocked=false,cooldownUntil=0,lastContext=null,segment=null,chosen=null;
 return {select({connection,thresholds,now=Date.now(),baseAction='Idle',manual=false,busy=false,hidden=false,reducedMotion=false,enabled=true}={}){
  const state=readingState(connection,thresholds,now),base={action:baseAction,context:null,simulated:state.simulated,dataState:state.reason};
  if(!enabled||!state.valid){band=null;started=0;blocked=false;cooldownUntil=0;segment=null;return base;}
  if(band!==state.band){band=state.band;started=now+2500;}
  const protectedActivity=manual||busy||hidden||['Eating together','Sleeping'].includes(baseAction);
  if(protectedActivity){blocked=true;cooldownUntil=now+45000;return base;}
  if(blocked){blocked=false;started=now+45000;}
  if(now<started||now<cooldownUntil)return base;
  // One 18-second illustrative sequence, followed by a 72-second quiet interval.
  // These are animation timings only, never treatment timings.
  const elapsed=now-started,within=elapsed%90000;if(within>=18000){return base;}
  const cycle=Math.floor(elapsed/90000),slot=reducedMotion?cycle%3:Math.floor(within/6000),key=band+':'+started+':'+cycle+':'+slot;
  if(key!==segment){let index=slot;if(contexts[band][index].id===lastContext)index=(index+1)%contexts[band].length;chosen=contexts[band][index];lastContext=chosen.id;segment=key;}
  const item=chosen;
  return {action:item.action,context:item.id,label:item.label,simulated:state.simulated,dataState:state.reason,reducedMotion};
 },reset(){band=null;started=0;blocked=false;cooldownUntil=0;lastContext=null;segment=null;chosen=null;}};
}
const api={STALE_MS,contexts,readingState,createDirector};root.DiaContext=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
