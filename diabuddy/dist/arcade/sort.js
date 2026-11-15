(function(root){'use strict';const C=typeof module!=='undefined'?require('./core.js'):root.ArcadeCore;
const levels=[
{id:'bloom-1',name:'Two little blooms',subtitle:'Separate rose and mint. Each bottle holds three layers.',capacity:3,tubes:[['a','b','a'],['b','a','b'],[],[]],sealed:[],par:7},
{id:'bloom-2',name:'Lavender afternoon',subtitle:'A third pigment and taller bottles need a little extra planning.',capacity:4,tubes:[['a','b','a','b'],['b','c','b','c'],['c','a','c','a'],[],[]],sealed:[],par:12},
{id:'bloom-3',name:'The sealed bottle',subtitle:'One bottle opens only after you finish a full single-color bottle.',capacity:4,tubes:[['a','b','a','b'],['b','c','b','c'],['c','a','c','a'],[],[],[]],sealed:[5],par:12},
{id:'bloom-4',name:'A bouquet of possibilities',subtitle:'Four pigments and two spare bottles. Find the order that keeps room to breathe.',capacity:4,tubes:[['a','b','c','d'],['b','c','d','a'],['c','d','a','b'],['d','a','b','c'],[],[]],sealed:[],par:18}];
function create(level){return{level,tubes:C.copy(level.tubes),selected:null,moves:0,history:[]};}
function full(t,cap){return t.length===cap&&t.every(c=>c===t[0]);}
function locked(m,i){return m.level.sealed.includes(i)&&!m.tubes.some(t=>full(t,m.level.capacity));}
function amount(m,from,to){if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=m.tubes.length||to>=m.tubes.length||from===to||locked(m,from)||locked(m,to))return 0;const a=m.tubes[from],b=m.tubes[to],cap=m.level.capacity;if(!a.length||b.length>=cap||(b.length&&b.at(-1)!==a.at(-1)))return 0;let n=0;for(let i=a.length-1;i>=0&&a[i]===a.at(-1);i--)n++;return Math.min(n,cap-b.length);}
function pour(m,from,to){const n=amount(m,from,to);if(!n)return null;m.history.push(C.copy(m.tubes));const color=m.tubes[from].at(-1);m.tubes[from].splice(-n);m.tubes[to].push(...Array(n).fill(color));m.moves++;return{from,to,color,amount:n};}
function undo(m){if(!m.history.length)return false;m.tubes=m.history.pop();m.selected=null;m.moves++;return true;}
function solved(m){return m.tubes.every(t=>t.length===0||full(t,m.level.capacity));}
function options(m){return m.tubes.flatMap((t,from)=>m.tubes.flatMap((_,to)=>amount(m,from,to)?[[from,to]]:[]));}
const api={id:'sort',title:'Color Garden',tag:'THE LITTLE POTION GARDEN',instructions:'Tap a bottle to lift it, then tap a destination. Only matching top colors can pour together; an empty bottle accepts any color. A full, single-color bottle blossoms. Complete every color to finish. In the sealed chapter, finishing a color opens the extra bottle. Bottle letters and flower patterns identify colors as well as their hues.',levels,create,locked,amount,pour,undo,solved,options,score:m=>Math.max(100,1800-Math.max(0,m.moves-m.level.par)*50)};if(typeof module!=='undefined')module.exports=api;root.ArcadeGames=root.ArcadeGames||{};root.ArcadeGames.sort=api;
})(typeof window!=='undefined'?window:globalThis);
