const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {parseHTML}=require('linkedom'),{createCanvas}=require('@napi-rs/canvas'),root=path.join(__dirname,'../dist');
const Meals=require('../dist/meal-ai.js');
const samples=[
 ['chicken alfredo pasta','pasta',['chicken','cream']],
 ['strawberry pancakes with whipped cream','pancakes',['strawberry','whippedCream']],
 ['salmon with rice and broccoli','rice',['salmon','rice','broccoli']],
 ['a turkey sandwich with lettuce and tomato','sandwich',['turkey','lettuce','tomato']],
 ['grilled tofu with rice and mushrooms','rice',['tofu','rice','mushroom']],
 ['beef tacos with beans and avocado','taco',['beef','beans','avocado']],
 ['carrot and lentil soup','soup',['carrot','beans']],
 ['oatmeal with banana and blueberries','oatmeal',['banana','blueberry']],
 ['spinach and cheese omelette','eggs',['spinach','cheese','egg']],
 ['shrimp noodles with peppers','noodles',['shrimp','pepper']],
 ['chicken curry with rice','curry',['chicken','rice']],
 ['dragonfruit mochi','custom',[]],
 ['pasta with truffles and cream sauce','pasta',['cream']]
];
const context={window:{DiaMeals:Meals}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'meal-art.js'),'utf8'),context);
const sheet=createCanvas(800,Math.ceil(samples.length/3)*190),sc=sheet.getContext('2d');sc.fillStyle='#f4f6e6';sc.fillRect(0,0,sheet.width,sheet.height);let hashes=[];
for(let i=0;i<samples.length;i++){const [name,base,components]=samples[i],m=Meals.parse(name);assert.equal(m.name,name);assert.equal(m.base,base);for(const id of components)assert(m.components.includes(id),name+': '+id);if(i<11)assert.equal(m.coverage,'composed',name);const c=createCanvas(240,150),g=c.getContext('2d');g.translate(120,90);g.scale(2.5,2.5);context.window.DiaMealArt.render(g,m,2);const png=c.toBuffer('image/png');assert(png.length>700);hashes.push(crypto.createHash('sha256').update(png).digest('hex'));sc.drawImage(c,i%3*265,Math.floor(i/3)*190);sc.fillStyle='#294e54';sc.font='11px sans-serif';sc.fillText(name,i%3*265+5,Math.floor(i/3)*190+165,255);sc.fillText(m.coverage,i%3*265+5,Math.floor(i/3)*190+182);}
assert.equal(new Set(hashes).size,samples.length);assert.equal(Meals.parse('dragonfruit mochi').coverage,'generic');assert(Meals.parse('pasta with truffles').unsupported.includes('truffles'));assert(!Meals.parse('pancakes without whipped cream').components.includes('whippedCream'));assert(!Meals.parse('sandwich with no tomato').components.includes('tomato'));
// The same dish with a changed ingredient must change pixels, not only its label.
function imageHash(name){const c=createCanvas(200,130),g=c.getContext('2d');g.translate(100,70);g.scale(2,2);context.window.DiaMealArt.render(g,Meals.parse(name));return c.toBuffer('image/png').toString('base64');}
assert.notEqual(imageHash('chicken alfredo pasta'),imageHash('chicken pasta with tomato sauce'));assert.notEqual(imageHash('pancakes'),imageHash('strawberry pancakes with whipped cream'));assert.notEqual(imageHash('salmon with rice'),imageHash('salmon with rice and broccoli'));
fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../test-results/meal-studio.png'),sheet.toBuffer('image/png'));
function luminance(hex){const a=hex.match(/[a-f0-9]{2}/gi).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]}
for(const [fg,bg] of [['#254a50','#fbfaf1'],['#50676e','#fff8e9'],['#fffef2','#287579'],['#204f55','#c0dfce'],['#28565f','#dceef4']]){const a=luminance(fg),b=luminance(bg);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,fg+' on '+bg);}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),{document,window}=parseHTML(html),backings=new WeakMap();
window.HTMLCanvasElement.prototype.getContext=function(){if(!backings.has(this))backings.set(this,createCanvas(Number(this.getAttribute('width')||300),Number(this.getAttribute('height')||150)));return backings.get(this).getContext('2d');};
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||''},set(v){for(const o of this.querySelectorAll('option')){if(o.value===v)o.setAttribute('selected','');else o.removeAttribute('selected');}}});
window.matchMedia=()=>({matches:false});window.AudioContext=function(){};const modal=document.querySelector('#modal');modal.showModal=()=>{modal.open=true};modal.close=()=>{modal.open=false;modal.dispatchEvent(new window.Event('close'))};
const stored=new Map([['mellow-v1',JSON.stringify({coins:420,owned:['bunny','cat'],equipped:{Characters:'cat'},entries:[{text:'Earlier journal page',date:'Earlier'}],arcadeProgress:{block:{best:{0:123}}},sharedMeal:{name:'Saved mystery dish',food:'custom'}})]]);
class FormData{constructor(form){this.form=form}get(key){return this.form.querySelector(`[name="${key}"]`)?.value??null}}
const sandbox={window,document,console,crypto:crypto.webcrypto,TextEncoder,URLSearchParams,Date,FormData,localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},setInterval:()=>0,setTimeout,clearTimeout,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},performance:{now:()=>0}};vm.createContext(sandbox);
for(const tag of document.querySelectorAll('script[src]'))vm.runInContext(fs.readFileSync(path.join(root,tag.getAttribute('src')),'utf8'),sandbox,{filename:tag.getAttribute('src')});
function evalJS(code){return vm.runInContext(code,sandbox)}
function submit(id){return document.querySelector(id).onsubmit({preventDefault(){},target:document.querySelector(id)})}
(async()=>{
 assert.equal(document.title,'DiaBuddy — a little T1D friend, everyday');assert.equal(document.querySelector('.tagline').textContent,'a little T1D friend, everyday');assert(!document.querySelector('.brand').textContent.includes('DAYBYDAY'));
 assert.equal(evalJS("activityCatalog.some(a=>['Hungry','Sweating'].includes(a.name))"),false);
 const buttons=[...document.querySelectorAll('nav [data-page]')],icons=buttons.map(b=>b.querySelector('path').getAttribute('d'));assert.equal(new Set(icons).size,buttons.length);for(const b of buttons)assert(b.getAttribute('aria-label'));
 // A glucose label alone must not change the room or harm the companion visually.
 const room=createCanvas(640,400);sandbox.neutralCanvas=room;let poses=[];
 for(const g of ['low','range','high']){evalJS(`paintWorld(neutralCanvas,'cozy',{Characters:'bunny'},'${g}','Reading',true,false,10000)`);poses.push(room.toBuffer('image/png').toString('base64'));}assert.equal(new Set(poses).size,1);
 fs.writeFileSync(path.join(__dirname,'../test-results/diabuddy-room.png'),room.toBuffer('image/png'));
 for(const pet of ['round','cat','bunny','dragon','bear','mushroom','fox','alien'])for(const action of ['Idle','Reading','Eating together','Sleeping','Walking around'])evalJS(`paintWorld(neutralCanvas,'cozy',{Characters:'${pet}'},'low','${action}',true,false,10000, {recipe:DiaMeals.parse('chicken alfredo pasta')})`.replace('DiaMeals.parse','window.DiaMeals.parse'));
 evalJS("go('home')");assert.equal(document.querySelector('[aria-current=page]').dataset.page,'home');
 for(const range of ['low','high','range']){for(let i=0;i<6;i++){evalJS(`activity='A little of everything'; reading=${range==='low'?50:range==='high'?260:110};activityStarted=Date.now()-${i*13000};`);assert(!['Hungry','Sweating','Snacking'].includes(evalJS('currentActivity()')));}}
 // Existing meals remain readable; new meals persist original names and exact component recipes.
 assert(document.querySelector('.shared-meal').textContent.includes('Saved mystery dish'));
 document.querySelector('#meal-name').value=samples[0][0];await submit('#meal-form');assert(document.querySelector('#meal-preview'));assert(document.querySelector('#meal-result').textContent.includes('chicken'));document.querySelector('#share-meal').click();let saved=JSON.parse(stored.get('mellow-v1'));assert.equal(saved.sharedMeal.name,samples[0][0]);assert(saved.sharedMeal.recipe.components.includes('cream'));assert.equal(saved.coins,420);assert.equal(saved.equipped.Characters,'cat');assert(saved.arcadeProgress.block.best[0]===123);
 evalJS("go('home')");document.querySelector('#meal-name').value='A family recipe';document.querySelector('#manual-meal').click();document.querySelector('#meal-illustration').value='pancakes';document.querySelector('#use-simple-meal').click();assert(document.querySelector('#meal-result').textContent.includes('YOUR MANUAL ILLUSTRATION'));assert(document.querySelector('#meal-result').textContent.includes('A family recipe'));assert(document.querySelector('#meal-result').textContent.includes('does not show every detail'));
 evalJS("go('settings')");document.querySelector('#range-low').value='200';document.querySelector('#range-high').value='100';submit('#range-form');assert.equal(evalJS('state.thresholds.low'),70);document.querySelector('#range-low').value='80';document.querySelector('#range-high').value='190';submit('#range-form');assert.equal(JSON.parse(stored.get('mellow-v1')).thresholds.high,190);
 evalJS("go('journal')");assert(document.querySelector('.journal-history').textContent.includes('Earlier journal page'));document.querySelector('textarea[name=text]').value='A new reflection';await submit('#journal-form');assert.equal(JSON.parse(stored.get('mellow-v1')).entries.length,2);
 evalJS("go('games')");assert(document.querySelector('[data-arcade=bridge]'));evalJS("go('reminders')");assert(document.querySelector('#demo-place'));
 document.querySelector('#portal-select').value='parent';document.querySelector('#portal-select').onchange();assert(document.querySelector('#pin-form'));document.querySelector('[name=pin]').value='4827';document.querySelector('[name=confirm]').value='4827';await submit('#pin-form');assert(document.querySelector('#content').hidden);assert(document.querySelector('#routine-parent').textContent.includes('DiaBuddy parent portal'));document.querySelector('#portal-select').value='child';document.querySelector('#portal-select').onchange();assert(!document.querySelector('#content').hidden);assert(document.querySelector('#routine-parent').hidden);
 console.log('PASS: 13 meal renders, ingredient-specific pixel changes, honest fallbacks, full app initialization, branding, unique navigation, neutral glucose/idle activity, meal/settings/journal persistence, reminders, games and PIN-separated portals.');
})().catch(e=>{console.error(e);process.exitCode=1});
