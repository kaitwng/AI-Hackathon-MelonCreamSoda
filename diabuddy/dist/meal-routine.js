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
// The existing native dialog provides modal focus containment and Escape support.
function routineDialog(html,kind,title,description){
 modal.classList.add('meal-dialog');modal.dataset.mealDialog=kind;delete modal.dataset.mealReturn;
 modal.setAttribute('aria-labelledby',title);modal.setAttribute('aria-describedby',description);modal.setAttribute('aria-modal','true');showModal(html);
 modal.querySelector('[autofocus]')?.focus();
}
function closePrompts(){if($('#meal-start-dialog')||$('#meal-game-invite'))modal.close();}
function openGames(){
 if($('#portal-select')?.value==='parent'){$('#portal-select').value='child';$('#portal-select').onchange();}
 go('games');document.querySelector('[data-arcade]')?.focus();
}
function invite(){
 const t=state.timer,g=glucoseState();if(!t||g.valid&&g.band==='low')return;
 routineDialog(`<section id="meal-game-invite" data-timer-id="${escapeHTML(t.id)}"><div class="eyebrow">YOUR TIME, YOUR CHOICE</div><h2 id="meal-invite-title">Want to play while you wait?</h2><p id="meal-invite-description">Your timer is running. Pick a cozy mini-game, or enjoy a quiet moment. Games are optional, and you can eat or get help at any time.</p><p class="meal-invite-time">Time remaining: <span id="meal-invite-countdown" role="timer" aria-live="off">${format(R.seconds(t))}</span></p><div class="meal-dialog-actions"><button class="primary" id="meal-invite-games" autofocus>Choose a mini-game</button><button class="secondary" id="meal-invite-later">Maybe later</button></div><div class="meal-dialog-support"><button class="text-link" id="meal-invite-help">Parent / help</button><button class="text-link" id="meal-invite-stop">Stop routine</button></div></section>`,'invitation','meal-invite-title','meal-invite-description');
 $('#meal-invite-games').onclick=()=>{modal.dataset.mealReturn='games';modal.close();openGames();};
 $('#meal-invite-later').onclick=()=>modal.close();
 $('#meal-invite-help').onclick=()=>{modal.close();help();};
 $('#meal-invite-stop').onclick=stop;
}
function help(){
 closePrompts();
 routineDialog(`<section id="parent-help-panel" class="parent-help-panel"><div class="eyebrow">YOU CAN ALWAYS ASK FOR HELP</div><h2 id="parent-help-title">Find a parent or trusted adult</h2><p id="parent-help-description" class="parent-help-intro">Never wait for a timer or game before eating or getting help. For low glucose, follow your family’s low-glucose care plan now.</p><section class="parent-help-plan" aria-labelledby="parent-help-plan-title"><h3 id="parent-help-plan-title">Your saved family guidance</h3><p class="family-care-plan">${escapeHTML(careText()||'No family guidance has been saved here. Ask a parent and follow your existing care plan.')}</p></section>${policy()?.contact?'':'<p class="parent-help-contact-note">This app cannot notify a parent remotely. Find or call your parent or a trusted adult directly.</p>'}<p class="parent-help-emergency">For an emergency, contact local emergency services. DiaBuddy is not an emergency monitor.</p><div class="meal-dialog-actions parent-help-actions">${policy()?.contact?`<a class="primary" href="tel:${escapeHTML(policy().contact)}">Call parent / trusted adult</a>`:''}<button class="secondary" id="care-close" autofocus>Back to my buddy</button></div></section>`,'help','parent-help-title','parent-help-description');
 $('#care-close').onclick=()=>modal.close();
}

function event(){if(root.DiaFamilyDemoActive||!root.DiaTandemReadOnly.available)return null;const events=root.DiaTandemReadOnly.events();return Array.isArray(events)?events.slice().reverse().find(e=>R.eligibleEvent(e,state.usedMealEvents))||null:null;}
function clearTimer(kind){state.timer=null;state.mealNotice={kind,at:Date.now()};persist();paintKey='';}
function tick(now=Date.now()){
 if(state.timer&&!R.validTimer(state.timer))clearTimer('stopped');
 const g=glucoseState(now),action=R.transition(state.timer,g,now);
 if(g.valid&&g.band==='low'){root.DiaFamilyTour?.stopForCare?.();root.DiaOnboarding?.stopForCare?.();root.DiaFamilyDemo?.stopForCare?.();}
 if(action==='interrupted'){
  clearTimer('interrupted');closePrompts();
  root.DiaArcade?.pauseForCare?.();toast('The waiting routine has stopped. Follow your family’s low-glucose care plan and ask a parent for help.');
 }else if(action==='finished'){
  clearTimer('finished');if($('#meal-game-invite'))modal.close();toast('Your timer has finished. Follow your family’s care plan.');
 }
 if(g.valid&&g.band==='low'){
  closePrompts();
  if(!previousLow){root.DiaArcade?.pauseForCare?.();if(action!=='interrupted')toast('Your reading is in your family’s low range. Follow your family’s care plan and ask a parent for help.');}previousLow=true;
 }else previousLow=false;
 if($('#meal-game-invite')&&(!state.timer||$('#meal-game-invite').dataset.timerId!==state.timer.id))modal.close();
 if($('#meal-invite-countdown')&&state.timer)$('#meal-invite-countdown').textContent=format(R.seconds(state.timer,now));
 renderBanner(g,now);renderHome(g);
}
function renderBanner(g,now){
 const host=$('#meal-routine-banner');if(!host)return;
 const low=g.valid&&g.band==='low',notice=state.mealNotice,t=state.timer;
 host.dataset.active=String(!!t);updateScrollOffset();
 const key=JSON.stringify([low,t?.id,t?R.seconds(t,now):null,notice?.kind,glucoseNote(g),storageProblem,!!root.DiaFamilyDemoActive]);if(key===paintKey)return;paintKey=key;
 // Keep the controls mounted while the numerals change, preserving keyboard focus.
 const structure=[low,t?.id,notice?.kind,glucoseNote(g),storageProblem,!!root.DiaFamilyDemoActive].join('|');
 if(host.dataset.structure===structure&&t){const readout=host.querySelector('[data-countdown]');if(readout)readout.textContent=format(R.seconds(t,now));return;}
 host.dataset.structure=structure;
 host.className='meal-routine-banner'+(low?' meal-care-priority':'');
 host.innerHTML=`<div class="meal-banner-copy"><strong>${t?.source==='demo'?'DEMO · ':''}${low?'Your reading is in your family’s low range':t?'Your family meal routine':notice?.kind==='finished'?'Your timer has finished.':notice?.kind==='interrupted'?'Waiting routine interrupted':'Your family, your pace'}</strong>${t?`<span class="meal-countdown" data-countdown role="timer" aria-label="Time remaining" aria-live="off">${format(R.seconds(t,now))}</span>`:''}<p>${low?'Follow your family’s low-glucose care plan now. Ask a parent for help. Waiting prompts are off.':t?'Games are optional. You can eat or get help at any time.':notice?.kind==='interrupted'?'It will not restart automatically. Follow your family’s care plan.':notice?.kind==='finished'?'This is a routine reminder, not medical clearance to eat.':'No timer or game is required before eating or getting help.'}</p><small>${escapeHTML(glucoseNote(g))}</small>${root.DiaFamilyDemoActive?'<small>Fictional family demo · Timer changes stay in memory. Refresh returns to your saved world.</small>':''}${storageProblem?'<p role="status">Browser storage is unavailable. This timer cannot be relied on after refresh. Stop the routine or keep your own timer.</p>':''}</div><div class="meal-banner-actions">${t?'<button class="secondary" id="routine-games">Optional games</button><button class="secondary" id="routine-stop">Stop routine</button>':''}<button class="secondary" id="routine-help">Parent / help</button>${!low&&!t&&notice?'<button class="text-link" id="routine-dismiss">Dismiss</button>':''}</div>`;
 if($('#routine-stop'))$('#routine-stop').onclick=stop;
 if($('#routine-games'))$('#routine-games').onclick=openGames;
 $('#routine-help').onclick=help;
 if($('#routine-dismiss'))$('#routine-dismiss').onclick=()=>{state.mealNotice=null;persist();paintKey='';tick();};
}
function homeHTML(g){
 const low=g.valid&&g.band==='low',p=policy(),t=state.timer,ev=event();
 if(low)return `<div class="eyebrow">CARE COMES FIRST</div><h2>Let’s find your parent</h2><p>Follow your family’s low-glucose care plan. No waiting timer is offered while a recent reading is in the low range.</p><button class="primary" id="meal-care-help">Parent / help</button>`;
 if(t)return `<div class="eyebrow">${t.source==='demo'?'DEMO TIMER · SIMULATED PUMP DATA':'WAITING FOR MEAL · OPTIONAL ROUTINE'}</div><h2>A little time, your way</h2><p>The countdown stays above every screen. Play any available mini-game, relax, or stop whenever you like.</p><button class="primary" id="meal-play">Explore mini-games</button><button class="secondary" id="meal-stop">Stop routine</button>`;
 return `<div class="eyebrow">A FAMILY MEAL ROUTINE</div><h2>Your pace. Your plan.</h2>${demoWidget()}<p>${escapeHTML(root.DiaTandemReadOnly.description)}</p>${ev?'<div class="event-gate ready">A recent delivered meal bolus was confirmed by the connected read-only feed. Start only if it fits your family’s plan.</div><button class="primary" id="start-meal-timer">Review timer</button>':''}<p>${R.validPolicy(p)?p.mode==='parent'?'Your parent has set a fixed duration: '+p.minutes+' minutes.':'You can choose within your parent’s approved range: '+p.min+'–'+p.max+' minutes.':'Ask a parent to save your family’s timing in the parent portal first.'}</p>${R.validPolicy(p)&&p.manualAllowed?`<button class="secondary" id="manual-routine" >Review manual routine</button><p class="helper">MANUAL FALLBACK · No pump event is verified. Use only your family’s configured routine.</p>`:''}<p class="helper">No rewards for waiting longer, dose recommendations, or pump control. Never wait for this app before eating or getting help.</p>`;
}
function renderHome(g=glucoseState()){
 const el=$('#timer-panel');if(!el)return;const html=homeHTML(g);if(el.dataset.routineHTML===html)return;el.dataset.routineHTML=html;el.innerHTML=html;
 if($('#meal-care-help'))$('#meal-care-help').onclick=help;
 if($('#meal-play'))$('#meal-play').onclick=openGames;
 if($('#demo-pump-timer'))$('#demo-pump-timer').onclick=()=>offer('demo');
 if($('#meal-stop'))$('#meal-stop').onclick=stop;
 if($('#manual-routine'))$('#manual-routine').onclick=()=>offer('manual');
 if($('#start-meal-timer'))$('#start-meal-timer').onclick=()=>offer('tandem');
}
function demoWidget(){return `<section class="demo-pump-widget" aria-labelledby="demo-pump-title"><div class="demo-pump-top"><svg class="demo-pump-icon" viewBox="0 0 32 40" aria-hidden="true" shape-rendering="crispEdges"><path fill="#315c64" d="M6 1h20v3h3v32h-3v3H6v-3H3V4h3z"/><path fill="#8ebeb1" d="M6 5h20v22H6z"/><path fill="#edf8f1" d="M9 8h14v16H9z"/><path fill="#417b77" d="M11 11h2v8h-2zm4 4h2v4h-2zm4-5h2v9h-2z"/><path fill="#d8d4ae" d="M12 30h8v4h-8z"/></svg><div><div class="eyebrow">MOCK t:slim · NOT CONNECTED</div><h3 id="demo-pump-title">Demo — simulated pump data</h3></div></div><p class="demo-pump-event">Meal bolus detected · 45 g carbs recorded</p><p>This sample is not a real pump event. No insulin is delivered, no glucose alerts are simulated, and no coins are earned.</p><button class="secondary" id="demo-pump-timer">Set meal timer</button><small>Uses your parent’s saved duration settings and manual/demo permission.</small></section>`;}
function offer(source='manual'){
 if(root.DiaFamilyDemoActive&&source==='manual')source='demo';
 tick();if(state.timer)return toast('A routine is already running. You can stop it at any time.');
 if(glucoseState().valid&&glucoseState().band==='low')return help();
 const p=policy(),ev=source==='tandem'?event():null;
 if(!R.validPolicy(p))return toast('Ask a parent to save your family’s timing in the protected portal first.');
 if(['manual','demo'].includes(source)&&!p.manualAllowed)return toast('Ask a parent to enable manual/demo routines first.');
 if(source==='tandem'&&!ev||!['manual','demo','tandem'].includes(source))return toast('No eligible confirmed meal event is available.');
 const revision=JSON.stringify(p),minutes=p.mode==='parent'?p.minutes:p.min;
 routineDialog(`<div id="meal-start-dialog"><div class="eyebrow">${source==='demo'?'DEMO — SIMULATED PUMP DATA':source==='manual'?'MANUAL FALLBACK · NOT PUMP VERIFIED':'CONFIRMED MEAL EVENT · READ ONLY'}</div><h2 id="meal-setup-title">Review your family’s routine</h2><p id="meal-setup-description">Use the timing from your family’s care plan. DiaBuddy does not calculate a waiting period.</p>${p.mode==='child'?`<label class="field-label">Choose minutes within your parent’s range<input id="routine-duration" type="number" min="${p.min}" max="${p.max}" step="1" value="${minutes}" required></label>`:''}<p class="duration-preview">Chosen duration: <strong id="routine-chosen">${minutes} minutes</strong></p><p>${source==='demo'?'This simulated meal event is not pump verified and cannot earn coins.':source==='manual'?'This is a manual routine. It does not confirm a bolus or tell you when to eat.':'This event confirms delivery, not when it is safe to eat.'} You can stop any time. Never wait for food, low-glucose care, or help because of a timer or game.</p><p id="routine-start-error" role="status"></p><div class="modal-actions"><button class="secondary" id="routine-not-now">Not now</button><button class="primary" id="routine-begin">Start ${minutes}-minute routine</button></div></div>`,'setup','meal-setup-title','meal-setup-description');
 const input=$('#routine-duration');if(input)input.oninput=()=>{const value=Number(input.value),ok=input.value.trim()!==''&&R.canStart(p,value,source);$('#routine-chosen').textContent=ok?value+' minutes':'Choose an approved whole number';$('#routine-begin').textContent=ok?'Start '+value+'-minute routine':'Choose duration';$('#routine-begin').disabled=!ok;};
 $('#routine-not-now').onclick=()=>modal.close();
 $('#routine-begin').onclick=()=>{
  if(state.timer||!$('#meal-start-dialog'))return;
  const now=Date.now(),g=glucoseState(now),value=input?Number(input.value):minutes;
  if(g.valid&&g.band==='low'){modal.close();tick(now);help();return;}
  if(state.timer||revision!==JSON.stringify(policy())||input&&input.value.trim()===''||!R.canStart(policy(),value,source)||source==='tandem'&&(root.DiaFamilyDemoActive||!root.DiaTandemReadOnly.available||!R.eligibleEvent(ev,state.usedMealEvents,now))){$('#routine-start-error').textContent='Settings, permissions, or the event changed. Close this preview and review the routine again.';return;}
  const previousNotice=state.mealNotice,previousUsed=state.usedMealEvents.slice(),previousCoins=state.coins,previousClaims=state.mealRewardClaims.slice();
  const reward=root.DiaFamilyDemoActive?null:R.rewardOnStart(state.mealRewardSettings,ev,state.usedMealEvents,state.mealRewardClaims,source,now);
  state.timer={version:2,id:crypto.randomUUID(),source,eventId:ev?.id||null,minutes:value,startedAt:now,end:now+value*60000,invitationShown:true,rewardCoins:reward?.amount||0};state.mealNotice=null;
  if(ev)state.usedMealEvents.push(...R.eventKeys(ev));
  if(reward){state.coins+=reward.amount;state.mealRewardClaims.push(...reward.keys);}
  if(!persist()){state.timer=null;state.usedMealEvents=previousUsed;state.mealNotice=previousNotice;state.coins=previousCoins;state.mealRewardClaims=previousClaims;$('#routine-start-error').textContent='Could not save this routine. Enable browser storage or use your own timer.';return;}
  modal.close();paintKey='';tick(now);if(value){toast(reward?'Your optional routine has started. '+reward.amount+' participation coins added; they stay yours if you stop.':'Your optional routine has started. You can stop at any time.');invite();}
 };
}
function stop(){if(!state.timer)return;closePrompts();clearTimer('stopped');tick();toast('Routine stopped. Taking care of yourself comes first.');}
function parentCard(){const p=policy()||{},valid=R.validPolicy(p);return `<section class="card card-pad" id="parent-meal-settings"><div class="eyebrow">PARENT SETTINGS · FAMILY TIMING</div><h2>Waiting for Meal</h2><p>Copy timing from your family’s configured routine or care plan. No duration is suggested or calculated from glucose or insulin. Settings and progress stay in this browser.</p><form id="meal-policy-form"><label class="field-label">Who chooses the duration?<select id="meal-policy-mode"><option value="parent" ${p.mode!=='child'?'selected':''}>Parent chooses a fixed duration · child may start it</option><option value="child" ${p.mode==='child'?'selected':''}>Child may choose within my approved range</option></select></label><div id="meal-fixed-fields"><label class="field-label">Parent-set duration (minutes, 0–60)<input id="meal-policy-minutes" type="number" min="0" max="60" step="1" value="${Number.isInteger(p.minutes)?p.minutes:''}"></label></div><div id="meal-range-fields"><label class="field-label">Minimum minutes<input id="meal-policy-min" type="number" min="0" max="60" step="1" value="${Number.isInteger(p.min)?p.min:''}"></label><label class="field-label">Maximum minutes<input id="meal-policy-max" type="number" min="0" max="60" step="1" value="${Number.isInteger(p.max)?p.max:''}"></label></div><label class="context-toggle"><input id="meal-policy-manual" type="checkbox" ${p.manualAllowed?'checked':''}> Allow clearly labeled manual and demo routines while no Tandem delivered-event feed is connected</label><label class="field-label">Family low-glucose guidance (optional)<textarea id="meal-policy-care" maxlength="2000" placeholder="Your existing care plan or where to find it">${escapeHTML(p.carePlan||'')}</textarea></label><label class="field-label">Parent / trusted adult phone (optional)<input id="meal-policy-contact" type="tel" maxlength="30" value="${escapeHTML(p.contact||'')}" placeholder="Used only for the Call button"></label><p class="helper">Manual entries do not verify a bolus. Low readings stop routines; no automatic restart. High readings never change timing. Saving a changed policy stops an active routine so the new settings can be reviewed.</p><p id="meal-policy-status" role="status"></p><button class="primary">Save family timing</button></form>${rewardCard()}${valid?`<button class="secondary" id="parent-start-routine">Review ${p.manualAllowed?'manual routine':'confirmed event'}</button>`:''}<p class="helper">${escapeHTML(root.DiaTandemReadOnly.description)}</p></section>`;}
function rewardCard(){const r=R.validRewardSettings(state.mealRewardSettings)?state.mealRewardSettings:{enabled:false,amount:0};return `<section class="meal-reward-settings" aria-labelledby="meal-reward-title"><h3 id="meal-reward-title">Optional participation coins</h3><p>Off by default. When enabled, the fixed amount is earned once when an approved routine starts after a recent, confirmed delivered meal bolus from a trusted Tandem feed. Finishing or waiting longer earns nothing extra. Coins stay yours if the routine stops or care is needed.</p><p>Manual routines, demo events and unverified pump records never earn these coins. Dose size, carb amount and glucose results never set the reward.</p><p class="helper">No live Tandem feed is connected in this version, so no real meal-bolus reward can currently qualify. Your settings are saved for a future verified integration.</p><form id="meal-reward-form"><label class="context-toggle"><input id="meal-reward-enabled" type="checkbox" ${r.enabled?'checked':''}> Enable participation coins for verified meal-bolus routines</label><label class="field-label">Coins per eligible start (0–1000)<input id="meal-reward-amount" type="number" min="0" max="1000" step="1" value="${r.amount}"></label><p id="meal-reward-status" role="status"></p><button class="secondary">Save reward settings</button></form></section>`;}
function bindRewardSettings(){const form=$('#meal-reward-form');if(!form)return;form.onsubmit=e=>{e.preventDefault();const status=$('#meal-reward-status');if(!parent()){status.textContent='Unlock the parent portal to change reward settings.';return;}const text=$('#meal-reward-amount').value.trim(),next={enabled:$('#meal-reward-enabled').checked===true,amount:text===''?null:Number(text)};if(!R.validRewardSettings(next)){status.textContent='Choose a whole-number coin amount from 0–1000.';return;}const previous=state.mealRewardSettings;state.mealRewardSettings=next;if(!persist()){state.mealRewardSettings=previous;status.textContent='Reward settings could not be saved. Try again with browser storage enabled.';return;}status.textContent='Reward settings saved. Demo and manual routines cannot earn coins.';};}
function bindParent(){
 bindRewardSettings();
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
function updateScrollOffset(){const host=$('#meal-routine-banner'),height=state.timer?(host?.getBoundingClientRect?.().height||host?.offsetHeight||0):0;document.documentElement.style.setProperty('--meal-banner-height',height+'px');}
function init(){
 if(!Array.isArray(state.mealRewardClaims))state.mealRewardClaims=[];
 if(!R.validRewardSettings(state.mealRewardSettings))state.mealRewardSettings={enabled:false,amount:0};
 modal.addEventListener('close',()=>{if(modal.open||!modal.dataset.mealDialog)return;const kind=modal.dataset.mealDialog;modal.classList.remove('meal-dialog');delete modal.dataset.mealDialog;modal.removeAttribute('aria-labelledby');modal.removeAttribute('aria-describedby');modal.removeAttribute('aria-modal');const destination=modal.dataset.mealReturn;delete modal.dataset.mealReturn;if(kind==='invitation'||kind==='help')(destination==='games'?document.querySelector('[data-arcade]'):$('#routine-help'))?.focus();});
 modal.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.dataset.mealDialog){e.preventDefault();modal.close();}});
 if(typeof root.ResizeObserver==='function')new root.ResizeObserver(updateScrollOffset).observe($('#meal-routine-banner'));
 root.addEventListener?.('resize',updateScrollOffset);
 if(!Array.isArray(state.usedMealEvents))state.usedMealEvents=[];
 tick();setInterval(()=>tick(),1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 // Another tab may update the same browser-local family state. Reconcile before
 // displaying a timer; never resurrect a timer stopped in another tab.
 root.addEventListener?.('storage',e=>{if(e.key!=='mellow-v1'||!e.newValue)return;try{const next=JSON.parse(e.newValue);state={...state,...next};paintKey='';tick();root.refreshParentPortal?.();}catch{/* Ignore malformed external storage. */}});
}
root.DiaMealRoutine={init,tick,renderHome,offer,stop,help,parentCard,bindParent};
})(window);
