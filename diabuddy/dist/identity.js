/* DiaBuddy presentation and browser-local journal/preferences. Storage keys stay stable. */
(function(){'use strict';
const paths={
 home:'M2 7h2V5h2V3h4v2h2v2h2v7H9v-4H7v4H2z',
 wardrobe:'M5 2h2v2h2V2h2l4 3-2 4-2-1v6H5V8L3 9 1 5z',
 games:'M4 4h8v1h2v2h1v6h-4l-1-2H6l-1 2H1V7h1V5h2zm0 2v2H2v2h2v2h2v-2h2V8H6V6zm6 1v2h2V7zm2 3v2h2v-2z',
 reminders:'M6 1h4v2H6zM4 3h8v2h2v7h-2v2H4v-2H2V5h2zm3 2v4h4V7H9V5z',
 journal:'M1 2h5l2 2 2-2h5v11h-5l-2 2-2-2H1zm2 2v7h3l1 1V6L5 4zm6 2v6l1-1h3V4h-2z',
 settings:'M6 1h4v3l2-1 2 3-2 2 2 2-2 3-2-1v3H6v-3l-2 1-2-3 2-2-2-2 2-3 2 1zm0 5v4h4V6z',
 parent:'M3 1h4v4H3zm6 2h4v4H9zM1 7h8v7H1zm9 2h5v5h-5z'
};
function icon(id){return `<svg class="nav-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" fill-rule="evenodd" d="${paths[id]}"></path></svg>`;}
const labels={home:'My little world',wardrobe:'Wardrobe & shop',games:'Mini games',reminders:'Meal reminders',journal:'Journal',settings:'Preferences & devices'};
const nav=document.querySelector('nav');nav.setAttribute('aria-label','DiaBuddy activities');
for(const id of ['journal','settings'])if(!nav.querySelector(`[data-page="${id}"]`))nav.insertAdjacentHTML('beforeend',`<button data-page="${id}"></button>`);
for(const button of nav.querySelectorAll('[data-page]')){const id=button.dataset.page;button.innerHTML=icon(id)+`<span>${labels[id]}</span>`;button.setAttribute('aria-label',labels[id]);}
const profile=document.querySelector('#profile .avatar');profile.innerHTML=icon('settings');
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();go('home')});
function selected(){for(const button of nav.querySelectorAll('[data-page]')){if(button.dataset.page===page)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}}
function journal(){
 const prompts=['What brought you a little joy today?','What would you like a friend to know?','What felt tricky, and what helped?','What are you looking forward to?'];const prompt=prompts[Math.floor(Date.now()/86400000)%prompts.length];
 content.innerHTML=greeting('A page for your day.','Your words stay in this browser. Share only what feels right.','DiaBuddy · JOURNAL')+`<div class="journal-layout"><section class="card card-pad"><h2>${prompt}</h2><form id="journal-form"><label class="field-label">Mood<select name="mood">${['Okay','Happy','Calm','Excited','Sad','Frustrated','Worried','Mixed'].map(x=>`<option>${x}</option>`).join('')}</select></label><label class="field-label">Energy<select name="energy"><option>Steady</option><option>Full of energy</option><option>Low energy</option><option>Prefer not to say</option></select></label><label class="field-label">A little win<input name="win" maxlength="120" placeholder="Optional"></label><label class="field-label">Your thoughts<textarea name="text" maxlength="4000" placeholder="Write, wonder, or let it all out…"></textarea></label><button class="primary">Save journal entry</button><p role="status" id="journal-status"></p></form></section><section class="card card-pad journal-history"><h2>Your pages</h2>${state.entries.slice().reverse().map(e=>`<article class="entry"><small>${escapeHTML(e.date||new Date(e.createdAt||Date.now()).toLocaleDateString())}</small><h3>${escapeHTML(e.prompt||'A little reflection')}</h3><p>${escapeHTML([e.mood,e.energy,e.win].filter(Boolean).join(' · '))}</p><p>${escapeHTML(e.text||e.feelings||'')}</p></article>`).join('')||'<p>Your saved entries will appear here.</p>'}</section></div>`;
 $('#journal-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),text=String(f.get('text')||'').trim(),win=String(f.get('win')||'').trim();if(!text&&!win){$('#journal-status').textContent='Add a thought or a little win to save.';return;}state.entries.push({id:crypto.randomUUID(),createdAt:Date.now(),date:new Date().toLocaleDateString(),prompt,mood:f.get('mood'),energy:f.get('energy'),win,text});save();journal();$('#journal-status').textContent='Your entry is saved.';};
}
function settings(){content.innerHTML=greeting('Make yourself at home.','Your personal preferences, kept on this browser.','DiaBuddy · PREFERENCES')+`<section class="card card-pad personal-range"><h2>Your parent-configured ranges</h2><p>Low at or below <strong>${Number(state.thresholds.low)} mg/dL</strong> · High at or above <strong>${Number(state.thresholds.high)} mg/dL</strong></p><p>Recent readings can select brief fictional illustrations. These are not treatment instructions and never affect coins or progress.</p><p>Contextual illustrations: <strong>${state.contextualEmotes===false?'Off':'On'}</strong>. A parent can edit these preferences in the PIN-protected parent portal.</p><div class="settings-actions"><button class="secondary" id="parent-visual-settings">Open parent settings</button><button class="text-link" id="preferences-name">Rename companion · Free</button></div></section><div id="dexcom-root" class="settings-connection"></div>`;renderDexPanel();$('#preferences-name').onclick=renameCharacter;$('#parent-visual-settings').onclick=()=>{$('#portal-select').value='parent';$('#portal-select').onchange();};}
const previousRender=render;render=function(){previousRender();if(page==='journal')journal();if(page==='settings')settings();selected();};
const previousGo=go;go=function(p){previousGo(p);if(labels[p])$('#page-label').textContent=labels[p].toUpperCase();selected();};
selected();window.DiaIdentity={icons:paths,icon};
})();
