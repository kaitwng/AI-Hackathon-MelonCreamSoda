/* Browser-local routine support. Records are self-reported, never verified doses. */
(function (root) {
  'use strict';
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const at = (day, time) => new Date(`${day}T${time}:00`).getTime();
  const occurrence = (meal, day) => `${meal.id}|${day}`;
  function mealsFor(data, day) {
    const weekday = new Date(`${day}T12:00:00`).getDay();
    return data.meals.map(m => ({...m, version: [...m.versions].reverse().find(v => v.from <= day)})).filter(m => m.version && !m.version.deleted && m.version.days.includes(weekday));
  }
  function status(record, meal, day, now) {
    if (record?.helpAt && !record.ackAt) return 'Help requested';
    if (record?.completedAt) return `${record.source === 'parent' ? 'Parent' : 'Child'}-reported completion`;
    return now < at(day, meal.version.time) ? 'Upcoming' : 'Awaiting check-in';
  }
  function summary(data, now = new Date()) {
    return Array.from({length:7}, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6+i, 12), day = dateKey(d);
      const rows = mealsFor(data, day).map(m => ({m, r:data.records[occurrence(m, day)] || {}}));
      return {day, scheduled:rows.length, recorded:rows.filter(x=>x.r.completedAt).length,
        pending:rows.filter(x=>!x.r.completedAt && at(day,x.m.version.time)>now.getTime()).length,
        noRecord:rows.filter(x=>!x.r.completedAt && at(day,x.m.version.time)<=now.getTime()).length,
        help:rows.filter(x=>x.r.helpAt).length, snoozes:rows.reduce((n,x)=>n+(x.r.snoozes||0),0)};
    });
  }
  function attemptFailure(data, now) { data.attempts++; if (data.attempts >= 5) {data.lockUntil = now + 60000; data.attempts = 0;} }
  function actionRecord(r, action, now, source) {
    if (action === 'record' && !r.completedAt) return {...r, completedAt:now, source, snoozeUntil:null};
    if (action === 'snooze' && !r.completedAt) return {...r,snoozeUntil:now+300000,snoozes:(r.snoozes||0)+1};
    if (action === 'help' && !r.completedAt && !r.helpAt) return {...r,helpAt:now,ackAt:null};
    if (action === 'ack' && r.helpAt && !r.ackAt) return {...r,ackAt:now};
    return r;
  }
  const core = {dateKey, at, occurrence, mealsFor, status, summary, attemptFailure, actionRecord};
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (!root.document) return;
  const $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key='diabuddy-routine-v1', blank=()=>({meals:[],records:{},pin:null,attempts:0,lockUntil:0});
  let data; try { data={...blank(),...JSON.parse(localStorage.getItem(key)||'{}')}; } catch {data=blank();}
  let unlocked=false, demo=false, demoData=blank(), reminderNotice='', shown=new Set();
  const current=()=>demo?demoData:data, persist=()=>{if(!demo)localStorage.setItem(key,JSON.stringify(data));};
  const id=()=>crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const fmt=t=>t?new Date(t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'—';
  const timeLabel=t=>new Date(`2000-01-01T${t}:00`).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const recordFor=(m,day)=>current().records[occurrence(m,day)]||{};
  const put=(m,day,patch)=>{const k=occurrence(m,day); current().records[k]={...current().records[k],...patch};persist();};
  function dialog(html) { const el=$('#modal'); $('#modal-content').innerHTML=html; if(!el.open)el.showModal(); }
  function close(){if($('#modal').open)$('#modal').close();}
  async function digest(pin,salt) {const bytes=new TextEncoder().encode(salt+pin);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
  function pinDialog(error='') {
    const setting=!data.pin, locked=Date.now()<data.lockUntil;
    dialog(`<div class="eyebrow">PARENT PORTAL · BASIC BETA BARRIER</div><h2>${setting?'Create a parent PIN':'Enter parent PIN'}</h2><p>${setting?'Choose four digits and enter them twice.':'Enter your four-digit PIN to continue.'} This is a basic access barrier, not medical-account security.</p><form id="pin-form" class="routine-form"><label>Four-digit PIN<input name="pin" type="password" inputmode="numeric" autocomplete="off" pattern="[0-9]{4}" maxlength="4" required></label>${setting?'<label>Confirm PIN<input name="confirm" type="password" inputmode="numeric" autocomplete="off" pattern="[0-9]{4}" maxlength="4" required></label>':''}<p class="routine-error" role="alert">${esc(locked?'Too many attempts. Try again in '+Math.ceil((data.lockUntil-Date.now())/1000)+' seconds.':error)}</p><div class="routine-actions"><button type="button" class="secondary" id="pin-cancel">Cancel</button><button class="primary" ${locked?'disabled':''}>${setting?'Set PIN':'Unlock'}</button></div></form>`);
    $('#pin-cancel').onclick=()=>{close();$('#portal-select').value='child';};
    $('#pin-form').onsubmit=async e=>{e.preventDefault();if(Date.now()<data.lockUntil){pinDialog();return;}const f=new FormData(e.target), pin=f.get('pin');if(!/^\d{4}$/.test(pin)){pinDialog('Please enter exactly four digits.');return;}if(setting){if(pin!==f.get('confirm')){pinDialog('The PINs do not match. Please try again.');return;} const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join(''); data.pin={salt,hash:await digest(pin,salt)};data.attempts=0;} else if(await digest(pin,data.pin.salt)!==data.pin.hash){attemptFailure(data,Date.now());persist();pinDialog('That PIN did not match. Please try again.');return;}data.lockUntil=0;data.attempts=0;persist();unlocked=true;close();render();};
  }
  function switchPortal(){if($('#portal-select').value==='parent'){if(!unlocked){if(!crypto.subtle){$('#portal-select').value='child';alert('PIN setup requires a secure context such as localhost or HTTPS.');return;}pinDialog();return;}} else {unlocked=false;demo=false;}render();}
  $('#portal-select').onchange=switchPortal;
  $('#modal').addEventListener('close',()=>{if(!unlocked)$('#portal-select').value='child';});
  // Earlier check-in data remains saved; this focused version does not display it.
  function render(){const parent=unlocked&&$('#portal-select').value==='parent';$('#routine-child').hidden=true;$('#routine-child').innerHTML='';$('#routine-parent').hidden=!parent;$('#content').hidden=parent;if(parent){$('#routine-parent').innerHTML=`<div class="greeting"><div><div class="eyebrow">A LITTLE SUPPORT, TOGETHER</div><h1>DiaBuddy parent portal</h1><p>a little T1D friend, everyday</p></div></div><section class="card card-pad parent-medical-notice" aria-labelledby="medical-notice-title"><div class="eyebrow">IMPORTANT INFORMATION FOR FAMILIES</div><h2 id="medical-notice-title">A note about medical advice</h2><p>DiaBuddy offers general education and everyday support. Nothing in this app is personalized or prescriptive medical advice, and it is not a substitute for your child’s diabetes care plan or advice from a qualified healthcare professional.</p><p>Do not use the app to make decisions about insulin doses, treatment, or when to eat. Follow your child’s care plan and contact their diabetes care team with medical questions. The app does not provide emergency monitoring or emergency services. In an emergency, contact local emergency services.</p><details class="parent-guidance"><summary>Privacy and digital health resources</summary><p><strong>Children’s privacy (COPPA):</strong> COPPA may apply when an online service collects personal information from children under 13. The FTC explains parental notice, consent, and other protections in its <a href="https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions" target="_blank" rel="noopener noreferrer">COPPA guide</a>.</p><p><strong>FDA digital health guidance:</strong> The FDA describes how oversight depends on a software function’s intended use and capabilities. Read its <a href="https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications" target="_blank" rel="noopener noreferrer">digital health guidance</a> and <a href="https://www.fda.gov/medical-devices/device-software-functions-including-mobile-medical-applications/examples-software-functions-are-not-medical-devices" target="_blank" rel="noopener noreferrer">examples of general education functions</a>.</p><p>These resources are general information; they do not establish this app’s compliance or regulatory status.</p></details></section><div class="routine-grid"><section class="card card-pad"><h2>Support for your family</h2><p>Use the Child portal to explore the character, games, and meal reminders together. Your earlier check-in data remains saved in this browser.</p><p class="routine-note">This prototype does not deliver insulin or replace your care plan.</p></section><section class="card card-pad"><div class="eyebrow">PREMIUM CONCEPT · DEMO PREVIEW</div><h2>Family Insights</h2><p>A future Premium feature could help families notice routines and start a supportive conversation.</p><p><strong>Preview only:</strong> Real insights, subscriptions, and payment are not available.</p><button class="secondary" id="insights-preview">View fictional example</button></section>${window.DiaLearning.parentCard()}${window.FamilyRewards.parentCard()}${parentGlucoseFixture()}<div id="parent-dexcom-root"></div></div>`;renderDexPanel();$('#insights-preview').onclick=()=>dialog(`<div class="eyebrow">FAMILY INSIGHTS · FICTIONAL DEMO</div><h2>A routine to explore together</h2><div class="notice"><strong>Sample data only · Tuesday dinner</strong><p>In this fictional example, there was no recorded dinner check-in on 3 of 4 Tuesdays. A missing record does not tell us whether a bolus was taken.</p></div><p>A parent might wonder whether a busy activity, such as baseball practice, makes that evening harder to plan. This example does not establish a cause or describe your child.</p><p>Ask together: “Would a different routine after practice help?” Follow your care plan and talk with your care team about medical decisions.</p><p><strong>Privacy:</strong> This preview does not read journal entries or personal bolus data. No real insights, purchase, or subscription is available.</p>`);}}
  window.parentPortalUnlocked=()=>unlocked && $('#portal-select').value==='parent';
  window.refreshParentPortal=()=>{if(window.parentPortalUnlocked())render();};
  render();
})(typeof window === 'undefined' ? globalThis : window);
