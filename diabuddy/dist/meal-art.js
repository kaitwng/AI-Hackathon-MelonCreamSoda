/* Original 96 × 64 integer-grid food components. Shared by meal preview and pet table. */
(function(root){'use strict';
const C={edge:'#695541',bread:'#d89e57',toast:'#edbf79',light:'#fff0c9',rice:'#fff3db',green:'#538963',leaf:'#8cba69',red:'#d8664e',pink:'#e9a089',cream:'#f4e0b1',brown:'#986b4c',gold:'#e9be57'};
function render(c,meal,frame=0){
 const m=typeof meal==='object'&&meal?meal:root.DiaMeals.parse(({custom:'',fish:'fish',rice:'rice',toast:'toast and eggs'})[meal]??meal??'');
 const has=id=>m.components.includes(id),r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const poly=(points,color)=>{c.fillStyle=color;for(let y=Math.min(...points.map(p=>p[1]));y<Math.max(...points.map(p=>p[1]));y++){const xs=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)r(xs[i],y,xs[i+1]-xs[i],1,color);}};
 const oval=(x,y,w,h,color)=>{r(x+3,y,w-6,h,color);r(x+1,y+2,w-2,h-4,color);r(x,y+4,w,h-8,color);};
 c.save();c.imageSmoothingEnabled=false;
 oval(-44,9,88,17,'#76999855');oval(-45,-1,90,23,'#5a7b7d');oval(-43,-2,86,21,'#c5e0d8');oval(-38,-2,76,17,'#fff7df');r(-25,16,50,1,'#94b7b3');
 function grains(x,y){oval(x,y,29,15,C.rice);for(let i=0;i<22;i++)r(x+3+(i*7)%23,y+3+(i*3)%8,3,1,'#d7c9a5');}
 function leaves(x,y){for(let i=0;i<7;i++){const xx=x+(i*7)%21,yy=y+(i*5)%12;oval(xx,yy,9,6,i%2?C.leaf:C.green);r(xx+2,yy+2,5,1,'#bbd88b');}}
 function ingredient(id,x,y){
  if(id==='rice'){grains(x,y);return;}
  if(['lettuce','spinach'].includes(id)){leaves(x,y);return;}
  if(id==='broccoli'){for(let i=0;i<3;i++){const xx=x+i*7,yy=y+(i%2)*4;r(xx+4,yy+5,3,10,C.green);r(xx+2,yy+6,7,3,C.green);oval(xx,yy,11,9,C.green);r(xx+2,yy+1,5,2,C.leaf);r(xx+7,yy+4,2,2,'#3b7050');}return;}
  if(['chicken','turkey','fish','salmon','beef'].includes(id)){const fish=['fish','salmon'].includes(id);poly([[x,y+4],[x+6,y],[x+27,y+2],[x+30,y+13],[x+6,y+15]],C.edge);poly([[x+2,y+4],[x+7,y+1],[x+25,y+3],[x+28,y+11],[x+7,y+13]],fish?C.pink:id==='beef'?C.brown:'#e7c294');for(let i=0;i<4;i++){r(x+5+i*5,y+4,2,6,fish?'#ffdab0':m.preparation.includes('grilled')?'#966645':'#c69973');}r(x+5,y+2,15,1,C.light);return;}
  if(id==='egg'&&m.preparation.some(p=>['omelet','omelette'].includes(p))){poly([[x,y+2],[x+7,y-2],[x+25,y],[x+30,y+5],[x+24,y+14],[x+5,y+14],[x,y+9]],'#bc944a');poly([[x+1,y+2],[x+8,y-1],[x+24,y+1],[x+28,y+5],[x+23,y+10],[x+5,y+10]],C.gold);r(x+4,y+2,18,2,'#ffe2a0');r(x+5,y+9,18,2,C.cream);return;}
  if(id==='egg'&&m.preparation.includes('scrambled')){for(let i=0;i<8;i++){oval(x+(i*7)%24,y+(i*5)%12,9,7,C.gold);r(x+2+(i*7)%24,y+1+(i*5)%12,5,1,C.light);}return;}
  if(id==='egg'){oval(x,y,19,13,'#dac8a3');oval(x,y-1,18,12,'#fff4d8');oval(x+6,y+2,8,7,C.gold);r(x+7,y+2,3,1,'#fff0a6');return;}
  if(id==='whippedCream'){r(x+1,y+4,18,5,'#e3dac7');r(x+3,y,14,6,'#fff9e9');r(x+6,y-4,9,6,'#fff9e9');r(x+9,y-7,5,5,'#fff9e9');r(x+5,y+3,8,1,'#dfceb4');return;}
  if(id==='strawberry'){poly([[x,y+2],[x+3,y],[x+9,y],[x+12,y+3],[x+10,y+8],[x+6,y+12],[x+1,y+6]],C.red);r(x+2,y+1,7,2,C.green);for(let i=0;i<4;i++)r(x+3+i%2*4,y+4+Math.floor(i/2)*3,1,1,C.light);return;}
  if(id==='blueberry'){for(let i=0;i<4;i++){const xx=x+i%2*7,yy=y+Math.floor(i/2)*6;oval(xx,yy,7,7,'#586d9d');r(xx+2,yy+1,2,1,'#adc7df');}return;}
  if(id==='banana'){poly([[x,y],[x+3,y],[x+5,y+6],[x+12,y+7],[x+19,y+4],[x+18,y+9],[x+10,y+12],[x+3,y+10]],C.gold);r(x+6,y+8,7,1,C.light);return;}
  if(id==='tomato'){oval(x,y,14,9,C.red);oval(x+2,y+1,10,6,'#f49a6b');r(x+4,y+3,2,2,C.light);r(x+9,y+3,2,2,C.light);return;}
  if(id==='avocado'){oval(x,y,16,11,C.green);oval(x+2,y+1,12,8,'#c5d388');oval(x+6,y+3,5,4,C.brown);return;}
  if(id==='mushroom'){r(x+6,y+4,4,9,C.cream);oval(x,y,16,9,C.brown);r(x+3,y+1,7,2,'#ceb18a');return;}
  if(id==='shrimp'){poly([[x,y+4],[x+4,y],[x+12,y],[x+16,y+5],[x+14,y+11],[x+6,y+11],[x+3,y+7],[x+9,y+7],[x+10,y+4]],C.pink);r(x+5,y+1,3,2,C.light);return;}
  if(id==='tofu'){for(let i=0;i<4;i++){const xx=x+i%2*11,yy=y+Math.floor(i/2)*8;r(xx,yy,10,8,'#cda66d');r(xx,yy,9,6,'#efdbad');r(xx+1,yy+1,6,1,C.light);r(xx+6,yy+3,2,2,C.brown);}return;}
  if(id==='potato'){for(let i=0;i<5;i++){r(x+i*4,y+i%2*3,3,15,C.gold);r(x+i*4,y+i%2*3,1,12,C.light);}return;}
  if(id==='cucumber'){for(let i=0;i<3;i++){oval(x+i*7,y+i%2*4,9,8,C.green);oval(x+1+i*7,y+1+i%2*4,7,6,'#c3d796');r(x+4+i*7,y+3+i%2*4,1,2,C.light);}return;}
  if(['cheese','tomatoSauce','cream','chocolate','syrup','peanutButter','jam'].includes(id)){const col=({cheese:C.gold,tomatoSauce:C.red,cream:C.cream,chocolate:'#70503f',syrup:'#b57b3f',peanutButter:'#c69b65',jam:'#ac5f75'})[id];r(x,y,18,3,col);r(x+3,y+3,4,4,col);r(x+11,y+2,3,3,col);return;}
  // Distinct bean, carrot, pepper and corn morsels.
  const color=({beans:'#936650',carrot:'#e99d50',pepper:'#d67b50',corn:'#edcb70'})[id]||'#9bab87';for(let i=0;i<6;i++){const xx=x+(i*7)%19,yy=y+(i*5)%10;oval(xx,yy,5,5,color);r(xx+1,yy+1,2,1,C.light);}
 }
 const base=m.base;
 if(base==='custom'){r(-24,0,48,1,'#a0bbb1');r(-18,5,36,1,'#c2d6c8');r(-3,-14,6,9,'#739998');r(-3,-18,6,2,'#739998');}
 else if(base==='pasta'||base==='noodles'){oval(-29,-12,58,24,has('tomatoSauce')?C.red:has('cream')?C.cream:C.gold);for(let i=0;i<18;i++){let x=-26+(i*11)%48,y=-10+(i*7)%17;r(x,y,9,2,C.light);r(x+7,y,2,6,C.light);r(x+2,y+5,6,1,'#c99d5e');}if(base==='noodles'){r(25,-26,2,28,C.brown);r(30,-27,2,28,C.brown);}}
 else if(base==='pancakes'){for(let i=0;i<4;i++){oval(-26,3-i*5,52,10,C.bread);oval(-25,1-i*5,50,8,C.toast);r(-19,2-i*5,25,1,C.light);}}
 else if(['sandwich','burger','toast'].includes(base)){const burger=base==='burger';if(burger)oval(-27,-3,54,15,C.bread);else{poly([[-29,4],[-25,-5],[23,-5],[30,5],[25,14],[-25,14]],C.bread);r(-23,-3,46,14,C.toast);}if(base!=='toast'){let yy=0;for(const id of m.components){if(id==='lettuce'){r(-27,yy,54,3,C.green);r(-25,yy-1,8,1,C.leaf);}else if(id==='tomato'){for(let x=-22;x<20;x+=16)ingredient(id,x,yy-3);}else{r(-24,yy,48,3,({turkey:'#e8c1a2',chicken:'#d4af85',cheese:C.gold,beef:C.brown})[id]||C.cream);}yy-=3;}if(burger){oval(-27,-23,54,15,C.bread);oval(-25,-23,50,10,C.toast);for(let i=0;i<7;i++)r(-18+i*6,-19-i%2*2,2,1,C.light);}else{poly([[-29,-14],[-4,-28],[29,-14],[25,-7],[-25,-7]],C.bread);poly([[-24,-14],[-4,-25],[24,-14],[21,-10],[-21,-10]],C.cream);}}}
 else if(base==='pizza'){oval(-33,-15,66,30,C.bread);oval(-29,-14,58,25,C.red);oval(-26,-12,52,20,C.gold);for(let x=-22;x<24;x+=14)r(x,-5,7,2,C.light);r(-1,-14,1,25,C.bread);}
 else if(['soup','curry','oatmeal','icecream'].includes(base)){oval(-29,-1,58,24,'#537f87');oval(-30,-9,60,21,'#a4c6bf');oval(-26,-9,52,18,base==='curry'?'#d4a056':base==='soup'?'#dcb77c':base==='icecream'?'#fff0d8':'#d9c5a3');if(base==='icecream')for(let i=0;i<3;i++)oval(-24+i*17,-18-i%2*8,24,22,C.cream);}
 else if(base==='salad'){leaves(-29,-13);leaves(-4,-7);}
 else if(base==='taco'){for(let x=-30;x<24;x+=22){poly([[x,7],[x-2,-8],[x+4,-18],[x+16,-18],[x+21,-8],[x+19,8]],C.bread);poly([[x+2,4],[x+1,-7],[x+6,-15],[x+14,-15],[x+18,-6],[x+16,5]],C.gold);r(x+4,-9,12,4,C.green);}}
 else if(base==='dumplings'){for(let i=0;i<5;i++){const x=-29+i%3*22,y=-13+Math.floor(i/3)*14;poly([[x,y+10],[x+2,y+3],[x+9,y-2],[x+17,y+3],[x+20,y+10]],'#c6aa83');poly([[x+2,y+8],[x+4,y+3],[x+10,y],[x+16,y+4],[x+18,y+8]],C.cream);for(let dx=6;dx<16;dx+=4)r(x+dx,y+3,1,5,'#bc9b76');}}
 else if(base==='rice'){grains(m.components.some(id=>['salmon','fish','chicken','turkey','tofu','egg'].includes(id))?0:-30,-8);}
 else if(base==='fruit'){/* Components form the fruit plate. */}
 // Protein plates use the ingredient drawing itself as the centerpiece.
 const plateBases=['rice','fish','chicken','tofu','eggs','fruit'];
 let all=m.components.filter(id=>!(id==='rice'&&base==='rice'));
 if(base==='toast')all=m.components;
 if(!['sandwich','burger','custom'].includes(base)){
   const xs=all.length<=1?[0]:all.length===2?[-22,9]:[-29,0,21];
   all.forEach((id,i)=>{let x=xs[i%xs.length],y=-16+Math.floor(i/xs.length)*11;if(['soup','curry','oatmeal'].includes(base))y=-8+Math.floor(i/xs.length)*7;
    if(plateBases.includes(base)){if(['salmon','fish','chicken','turkey','tofu','egg'].includes(id))x=-31;else if(id==='rice')x=0;else x=18; y=['salmon','fish','chicken','turkey','tofu','egg','rice'].includes(id)?-13:-6;}
    ingredient(id,x,y);
   });
 }
 if(base!=='custom'&&m.preparation.some(p=>['grilled','roasted','baked'].includes(p)))for(let i=0;i<3;i++)r(-17+i*7,1,4,1,'#966e4e');
 if(base!=='custom'&&!['fruit','icecream','sandwich','salad'].includes(base)){for(let i=0;i<2;i++){const yy=-29-(frame+i)%4;r(-10+i*18,yy,1,4,'#b1c5b5');r(-9+i*18,yy-3,1,3,'#d3dec8');}}
 c.restore();return m.layers;
}
root.DiaMealArt={render};if(typeof module!=='undefined')module.exports={render};
})(typeof window!=='undefined'?window:globalThis);
