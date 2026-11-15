/* DiaBuddy navigation. Removed tabs do not delete stored entries or preferences. */
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
// Removed navigation only; existing journal entries and preferences stay saved.
for(const id of ['journal','settings'])nav.querySelector(`[data-page="${id}"]`)?.remove();
for(const button of nav.querySelectorAll('[data-page]')){const id=button.dataset.page;button.innerHTML=icon(id)+`<span>${labels[id]}</span>`;button.setAttribute('aria-label',labels[id]);}
const profile=document.querySelector('#profile .avatar');profile.innerHTML=icon('settings');
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();go('home')});
function selected(){for(const button of nav.querySelectorAll('[data-page]')){if(button.dataset.page===page)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}}
const previousRender=render;render=function(){previousRender();selected();};
const previousGo=go;go=function(p){if(['journal','settings'].includes(p))p='home';previousGo(p);if(labels[p])$('#page-label').textContent=labels[p].toUpperCase();selected();};
selected();window.DiaIdentity={icons:paths,icon};
})();
