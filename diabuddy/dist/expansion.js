const extraItems=[
{id:'bunny',name:'Little rabbit',type:'Characters',price:0,desc:'Long ears, a curious heart, and a soft knitted sweater.'},
{id:'cat',name:'Moonbeam cat',type:'Characters',price:90,desc:'A thoughtful little cat who loves books and quiet corners.'},
{id:'fox',name:'Maple fox',type:'Characters',price:120,desc:'A warm woodland companion for cabin adventures.'},
{id:'bear',name:'Cocoa bear',type:'Characters',price:100,desc:'A gentle lodge companion with round velvet ears.'},
{id:'alien',name:'Orbit friend',type:'Characters',price:140,desc:'A green antenna-topped visitor, perfectly at home among the stars.'},
{id:'library',name:'The enchanted library',type:'Rooms',price:0,premium:true,desc:'Tall bookcases, framed portraits, warm woodwork and collected treasures.'},
{id:'garden',name:'The glasshouse atelier',type:'Rooms',price:0,premium:true,desc:'An intricate botanical hideaway with climbing vines and flowering pots.'}
];
function renameCharacter(){showModal(`<div class="eyebrow">A NAME THAT FEELS LIKE HOME</div><h2>Meet… whoever you imagine.</h2><p>Rename your companion any time. Always free.</p><form id="name-form"><label class="field-label" for="new-name">Your companion’s name</label><input id="new-name" maxlength="48" required value="${escapeHTML(buddyName())}"><div class="modal-actions"><button class="primary">Save name · Free</button></div></form>`);$('#name-form').onsubmit=e=>{e.preventDefault();const name=$('#new-name').value.trim();if(!name||name.length>48)return;state.characterName=name;save();modal.close();render();window.refreshParentPortal?.();window.DiaMealRoutine?.tick();toast('Hello, '+name+' ♡')}}
function games(){window.DiaArcade.show()}
