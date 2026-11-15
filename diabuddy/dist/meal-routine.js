/* Shared home/parent/arcade routine controller. Timing is exclusively family-set. */
(function(root){'use strict';
const R=root.DiaMealRules;
let previousLow=false,paintKey='',storageProblem=false;
const parent=()=>root.parentPortalUnlocked?.()===true;
const glucoseState=(now=Date.now())=>root.DiaContext.readingState(dexcom,state.thresholds,now);
const policy=()=>state.mealRoutine;
const format=secs=>String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
function persist(){try{save();storageProblem=false;return true;}catch{storageProblem=true;return false;}}
function lastUpdate(){const time=Date.parse(dexcom.reading?.timestamp);return Number.isFinite(time)?new Date(time).toLocaleString():'No reading received';}
function glucoseNote(g){return (g.simulated?'Dexcom sandbox · Simulated. ':'')+(g.valid?'Last glucose update: '+lastUpdate()+'.':'Current glucose data is unavailable'+(g.reason==='stale'?' (stale reading)':'')+'. Last update: '+lastUpdate()+'. Showing a neutral companion.');}
function careText(){return typeof policy()?.carePlan==='string'?policy().carePlan:'';}
function help(){showModal(`<div class="eyebrow">YOU CAN ALWAYS ASK FOR HELP</div><h2>Find a parent or trusted adult</h2><p>Never wait for a timer or game before eating or getting help. For low glucose, follow your family’s low-glucose care plan now.</p><h3>Your saved family guidance</h3><p class="family-care-plan">${escapeHTML(careText()||'No family guidance has been saved here. Ask a parent and follow your existing care plan.')}</p>${policy()?.contact?`<a class="primary" href="tel:${escapeHTML(policy().contact)}">Call parent / trusted adult</a>`:'<p>This app cannot notify a parent remotely. Find or call your parent or a trusted adult directly.</p>'}<p>For an emergency, contact local emergency services. DiaBuddy is not an emergency monitor.</p><button class="secondary" id="care-close">Close</button>`);$('#care-close').onclick=()=>modal.close();}
function event(){if(!root.DiaTandemReadOnly.available)return null;const events=root.DiaTandemReadOnly.events();return Array.isArray(events)?events.slice().reverse().find(e=>R.eligibleEvent(e,state.usedMealEvents))||null:null;}
function clearTimer(kind){state.timer=null;state.mealNotice={kind,at:Date.now()};persist();paintKey='';}
function tick(now=Date.now()){
 if(state.timer&&!R.validTimer(state.timer))clearTimer('stopped');
 const g=glucoseState(now),action=R.transition(state.timer,g,now);
 if(action==='interrupted'){
  clearTimer('interrupted');if($('#meal-start-dialog'))modal.close();
  root.DiaArcade?.pauseForCare?.();toast('The waiting routine has stopped. Follow your family’s low-glucose care plan and ask a parent for help.');
 }else if(action==='finished'){
  clearTimer('finished');toast('Your timer has finished. Follow your family’s care plan.');
 }
 if(g.valid&&g.band==='low'){
  if($('#meal-start-dialog'))modal.close();
  if(!previousLow){root.DiaArcade?.pauseForCare?.();if(action!=='interrupted')toast('Your reading is in your family’s low range. Follow your family’s care plan and ask a parent for help.');}previousLow=true;
 }else previousLow=false;
 renderBanner(g,now);renderHome(g);
}
function renderBanner(g,now){
 const host=$('#meal-routine-banner');if(!host)return;
 const low=g.valid&&g.band==='low',notice=state.mealNotice,t=state.timer;
 const key=JSON.stringify([low,t?.id,t?R.seconds(t,now):null,notice?.kind,glucoseNote(g),storageProblem]);if(key===paintKey)return;paintKey=key;
 // Keep the controls mounted while the numerals change, preserving keyboard focus.
 const structure=[low,t?.id,notice?.kind,glucoseNote(g),storageProblem].join('|');
 if(host.dataset.structure===structure&&t){const readout=host.querySelector('[data-countdown]');if(readout)readout.textContent=format(R.seconds(t,now));return;}
 host.dataset.structure=structure;
 host.className='meal-routine-banner'+(low?' meal-care-priority':'');
 host.innerHTML=`<div class="meal-banner-copy"><strong>${low?'Your reading is in your family’s low range':t?'Your family meal routine':notice?.kind==='finished'?'Your timer has finished.':notice?.kind==='interrupted'?'Waiting routine interrupted':'Your family, your pace'}</strong>${t?`<span class="meal-countdown" data-countdown role="timer" aria-label="Time remaining" aria-live="off">${format(R.seconds(t,now))}</span>`:''}<p>${low?'Follow your family’s low-glucose care plan now. Ask a parent for help. Waiting prompts are off.':t?'Games are optional. You can eat or get help at any time.':notice?.kind==='interrupted'?'It will not restart automatically. Follow your family’s care plan.':notice?.kind==='finished'?'This is a routine reminder, not medical clearance to eat.':'No timer or game is required before eating or getting help.'}</p><small>${escapeHTML(glucoseNote(g))}</small>${storageProblem?'<p role="status">Browser storage is unavailable. This timer cannot be relied on after refresh. Stop the routine or keep your own timer.</p>':''}</div><div class="meal-banner-actions">${t?'<button class="secondary" id="routine-games">Optional games</button><button class="secondary" id="routine-stop">Stop routine</button>':''}<button class="secondary" id="routine-help">Parent / help</button>${!low&&!t&&notice?'<button class="text-link" id="routine-dismiss">Dismiss</button>':''}</div>`;
 if($('#routine-stop'))$('#routine-stop').onclick=stop;
 if($('#routine-games'))$('#routine-games').onclick=()=>go('games');
 $('#routine-help').onclick=help;
 if($('#routine-dismiss'))$('#routine-dismiss').onclick=()=>{state.mealNotice=null;persist();paintKey='';tick();};
}
function homeHTML(g){
 const low=g.valid&&g.band==='low',p=policy(),t=state.timer,ev=event();
 if(low)return `<div class="eyebrow">CARE COMES FIRST</div><h2>Let’s find your parent</h2><p>Follow your family’s low-glucose care plan. No waiting timer is offered while a recent reading is in the low range.</p><button class="primary" id="meal-care-help">Parent / help</button>`;
 if(t)return `<div class="eyebrow">WAITING FOR MEAL · OPTIONAL ROUTINE</div><h2>A little time, your way</h2><p>The countdown stays above every screen. Play any available mini-game, relax, or stop whenever you like.</p><button class="primary" id="meal-play">Explore mini-games</button><button class="secondary" id="meal-stop">Stop routine</button>`;
 return `<div class="eyebrow">A FAMILY MEAL ROUTINE</div><h2>Your pace. Your plan.</h2><p>${escapeHTML(root.DiaTandemReadOnly.description)}</p>${ev?'<div class="event-gate ready">A recent delivered meal bolus was confirmed by the connected read-only feed. Start only if it fits your family’s plan.</div><button class="primary" id="start-meal-timer">Review timer</button>':''}<p>${R.validPolicy(p)?p.mode==='parent'?'Your parent has set a fixed duration: '+p.minutes+' minutes.':'You can choose within your parent’s approved range: '+p.min+'–'+p.max+' minutes.':'Ask a parent to save your family’s timing in the parent portal first.'}</p>${R.validPolicy(p)&&p.manualAllowed?`<button class="secondary" id="manual-routine" >Review manual routine</button><p class="helper">MANUAL FALLBACK · No pump event is verified. Use only your family’s configured routine.</p>`:''}<p class="helper">No waiting rewards, dose recommendations, or pump control. Never wait for this app before eating or getting help.</p>`;
}
function renderHome(g=glucoseState()){
 const el=$('#timer-panel');if(!el)return;const html=homeHTML(g);if(el.dataset.routineHTML===html)return;el.dataset.routineHTML=html;el.innerHTML=html;
 if($('#meal-care-help'))$('#meal-care-help').onclick=help;
 if($('#meal-play'))$('#meal-play').onclick=()=>go('games');
 if($('#meal-stop'))$('#meal-stop').onclick=stop;
 if($('#manual-routine'))$('#manual-routine').onclick=()=>offer('manual');
 if($('#start-meal-timer'))$('#start-meal-timer').onclick=()=>offer('tandem');
}
function offer(source='manual'){
 tick();if(state.timer)return toast('A routine is already running. You can stop it at any time.');
 if(glucoseState().valid&&glucoseState().band==='low')return help();
 const p=policy(),ev=source==='tandem'?event():null;
 if(!R.validPolicy(p))return toast('Ask a parent to save your family’s timing in the protected portal first.');
 if(source==='manual'&&!p.manualAllowed||source==='tandem'&&!ev)return toast('No eligible confirmed meal event is available.');
 const revision=JSON.stringify(p),minutes=p.mode==='parent'?p.minutes:p.min;
 showModal(`<div id="meal-start-dialog"><div class="eyebrow">${source==='manual'?'MANUAL FALLBACK · NOT PUMP VERIFIED':'CONFIRMED MEAL EVENT · READ ONLY'}</div><h2>Review your family’s routine</h2><p>Use the timing from your family’s care plan. DiaBuddy does not calculate a waiting period.</p>${p.mode==='child'?`<label class="field-label">Choose minutes within your parent’s range<input id="routine-duration" type="number" min="${p.min}" max="${p.max}" step="1" value="${minutes}" required></label>`:''}<p class="duration-preview">Chosen duration: <strong id="routine-chosen">${minutes} minutes</strong></p><p>${source==='manual'?'This is a manual routine. It does not confirm a bolus or tell you when to eat.':'This event confirms delivery, not when it is safe to eat.'} You can stop any time. Never wait for food, low-glucose care, or help because of a timer or game.</p><p id="routine-start-error" role="status"></p><div class="modal-actions"><button class="secondary" id="routine-not-now">Not now</button><button class="primary" id="routine-begin">Start ${minutes}-minute routine</button></div></div>`);
 const input=$('#routine-duration');if(input)input.oninput=()=>{const value=Number(input.value),ok=input.value.trim()!==''&&R.canStart(p,value,source);$('#routine-chosen').textContent=ok?value+' minutes':'Choose an approved whole number';$('#routine-begin').textContent=ok?'Start '+value+'-minute routine':'Choose duration';$('#routine-begin').disabled=!ok;};
 $('#routine-not-now').onclick=()=>modal.close();
 $('#routine-begin').onclick=()=>{
  const now=Date.now(),g=glucoseState(now),value=input?Number(input.value):minutes;
  if(g.valid&&g.band==='low'){modal.close();tick(now);help();return;}
  if(state.timer||revision!==JSON.stringify(policy())||input&&input.value.trim()===''||!R.canStart(policy(),value,source)||source==='tandem'&&(!root.DiaTandemReadOnly.available||!R.eligibleEvent(ev,state.usedMealEvents,now))){$('#routine-start-error').textContent='Settings, permissions, or the event changed. Close this preview and review the routine again.';return;}
  const previousNotice=state.mealNotice,previousUsed=state.usedMealEvents.slice();
  state.timer={version:2,id:crypto.randomUUID(),source,eventId:ev?.id||null,minutes:value,startedAt:now,end:now+value*60000};state.mealNotice=null;
  if(ev)state.usedMealEvents.push(...R.eventKeys(ev));
  if(!persist()){state.timer=null;state.usedMealEvents=previousUsed;state.mealNotice=previousNotice;$('#routine-start-error').textContent='Could not save this routine. Enable browser storage or use your own timer.';return;}
  modal.close();paintKey='';tick(now);if(value)toast('Your optional routine has started. You can stop at any time.');
 };
}
function stop(){if(!state.timer)return;clearTimer('stopped');tick();toast('Routine stopped. Taking care of yourself comes first.');}
function parentCard(){const p=policy()||{},valid=R.validPolicy(p);return `<section class="card card-pad" id="parent-meal-settings"><div class="eyebrow">PARENT SETTINGS · FAMILY TIMING</div><h2>Waiting for Meal</h2><p>Copy timing from your family’s configured routine or care plan. No duration is suggested or calculated from glucose or insulin. Settings and progress stay in this browser.</p><form id="meal-policy-form"><label class="field-label">Who chooses the duration?<select id="meal-policy-mode"><option value="parent" ${p.mode!=='child'?'selected':''}>Parent chooses a fixed duration · child may start it</option><option value="child" ${p.mode==='child'?'selected':''}>Child may choose within my approved range</option></select></label><div id="meal-fixed-fields"><label class="field-label">Parent-set duration (minutes, 0–60)<input id="meal-policy-minutes" type="number" min="0" max="60" step="1" value="${Number.isInteger(p.minutes)?p.minutes:''}"></label></div><div id="meal-range-fields"><label class="field-label">Minimum minutes<input id="meal-policy-min" type="number" min="0" max="60" step="1" value="${Number.isInteger(p.min)?p.min:''}"></label><label class="field-label">Maximum minutes<input id="meal-policy-max" type="number" min="0" max="60" step="1" value="${Number.isInteger(p.max)?p.max:''}"></label></div><label class="context-toggle"><input id="meal-policy-manual" type="checkbox" ${p.manualAllowed?'checked':''}> Allow a clearly labeled manual routine while no Tandem delivered-event feed is connected</label><label class="field-label">Family low-glucose guidance (optional)<textarea id="meal-policy-care" maxlength="2000" placeholder="Your existing care plan or where to find it">${escapeHTML(p.carePlan||'')}</textarea></label><label class="field-label">Parent / trusted adult phone (optional)<input id="meal-policy-contact" type="tel" maxlength="30" value="${escapeHTML(p.contact||'')}" placeholder="Used only for the Call button"></label><p class="helper">Manual entries do not verify a bolus. Low readings stop routines; no automatic restart. High readings never change timing. Saving a changed policy stops an active routine so the new settings can be reviewed.</p><p id="meal-policy-status" role="status"></p><button class="primary">Save family timing</button></form>${valid?`<button class="secondary" id="parent-start-routine">Review ${p.manualAllowed?'manual routine':'confirmed event'}</button>`:''}<p class="helper">${escapeHTML(root.DiaTandemReadOnly.description)}</p></section>`;}
function bindParent(){
 const form=$('#meal-policy-form');if(!form)return;
 const fields=()=>{$('#meal-fixed-fields').hidden=$('#meal-policy-mode').value!=='parent';$('#meal-range-fields').hidden=$('#meal-policy-mode').value!=='child';};$('#meal-policy-mode').onchange=fields;fields();
 form.onsubmit=e=>{e.preventDefault();const status=$('#meal-policy-status');if(!parent()){status.textContent='Unlock the parent portal to save settings.';return;}
  const read=id=>{const text=$(id).value.trim();return text===''?null:Number(text);},contact=$('#meal-policy-contact').value.trim().replace(/[ ()-]/g,'');
  const p={mode:$('#meal-policy-mode').value,minutes:read('#meal-policy-minutes'),min:read('#meal-policy-min'),max:read('#meal-policy-max'),manualAllowed:$('#meal-policy-manual').checked===true,carePlan:$('#meal-policy-care').value.slice(0,2000),contact};
  if(!R.validPolicy(p)||contact&&!/^\+?\d{3,20}$/.test(contact)){status.textContent='Enter whole minutes from 0–60 with minimum no greater than maximum. Use a valid phone number or leave it blank.';return;}
  if(state.timer&&JSON.stringify(p)!==JSON.stringify(policy()))clearTimer('stopped');
  const previousPolicy=state.mealRoutine;state.mealRoutine=p;if(!persist()){state.mealRoutine=previousPolicy;status.textContent='Settings could not be saved. Browser storage must be available.';return;}
  root.refreshParentPortal?.();tick();$('#meal-policy-status').textContent='Family timing saved. No timer starts automatically.';
 };
 if($('#parent-start-routine'))$('#parent-start-routine').onclick=()=>offer(policy().manualAllowed?'manual':'tandem');
}
function init(){
 if(!Array.isArray(state.usedMealEvents))state.usedMealEvents=[];
 tick();setInterval(()=>tick(),1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 // Another tab may update the same browser-local family state. Reconcile before
 // displaying a timer; never resurrect a timer stopped in another tab.
 root.addEventListener?.('storage',e=>{if(e.key!=='mellow-v1'||!e.newValue)return;try{const next=JSON.parse(e.newValue);state={...state,...next};paintKey='';tick();root.refreshParentPortal?.();}catch{/* Ignore malformed external storage. */}});
}
root.DiaMealRoutine={init,tick,renderHome,offer,stop,help,parentCard,bindParent};
})(window);
