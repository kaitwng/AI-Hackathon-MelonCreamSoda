(function(root){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
function rotate(cells,turns=0,mirror=false){let out=cells.map(([x,y])=>[mirror?-x:x,y]);for(let t=0;t<turns%4;t++)out=out.map(([x,y])=>[-y,x]);const x=Math.min(...out.map(p=>p[0])),y=Math.min(...out.map(p=>p[1]));return out.map(([a,b])=>[a-x,b-y]);}
function award(progress,game,id,score,stars,day){const next=copy(progress||{});next.records=next.records||{};next.claims=next.claims||[];const key=game+':'+id,old=next.records[key]||{};next.records[key]={score:Math.max(old.score||0,score),stars:Math.max(old.stars||0,stars)};const claim=day+':'+key,reward=next.claims.includes(claim)?0:5+5*stars;if(reward)next.claims.push(claim);next.claims=next.claims.slice(-500);return {progress:next,reward};}
function stars(moves,par){return moves<=par?3:moves<=par+4?2:1;}
const core={copy,rotate,award,stars};if(typeof module!=='undefined')module.exports=core;root.ArcadeCore=core;
})(typeof window!=='undefined'?window:globalThis);
