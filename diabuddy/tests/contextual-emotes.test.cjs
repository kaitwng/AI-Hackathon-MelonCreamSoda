const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../dist/glucose-emotes.js');const now=Date.parse('2026-11-14T12:00:00Z'),thresholds={low:70,high:180};
const reading=(value,time=now)=>({value,unit:'mg/dL',sensor:'G7',timestamp:new Date(time).toISOString(),simulated:true,stale:false,future:false,status:null});
const connection=value=>({connected:true,reading:reading(value),error:null});
for(const [v,band]of [[39,'low'],[69,'low'],[70,'low'],[71,'range'],[179,'range'],[180,'high'],[181,'high'],[401,'high']])assert.equal(C.readingState(connection(v),thresholds,now).band,band);
assert.equal(C.readingState(connection(100),{low:100,high:190},now).band,'low');assert.equal(C.readingState(connection(190),{low:100,high:190},now).band,'high');
for(const r of [null,{...reading(50),value:NaN},{...reading(50),value:'50'},{...reading(50),value:20},{...reading(50),value:450},{...reading(50),unit:'mmol/L'},{...reading(50),sensor:'G6'},{...reading(50),status:'unexpected'},{...reading(50),timestamp:'invalid'},reading(50,now+1),reading(50,now-C.STALE_MS-1),{...reading(50),stale:true},{...reading(50),future:true},{...reading(50),status:'notComputable'}]){const result=C.readingState({connected:true,reading:r},thresholds,now);assert.equal(result.valid,false);assert.equal(result.band,'range');}
assert(C.readingState({connected:true,reading:reading(50,now-C.STALE_MS)},thresholds,now).valid);
assert.equal(C.readingState({connected:false,reading:reading(50)},thresholds,now).band,'range');assert.equal(C.readingState({...connection(50),error:'unavailable'},thresholds,now).band,'range');assert.equal(C.readingState(connection(50),{low:200,high:70},now).valid,false);
for(const [value,ids]of [[50,['candy','juice','sweat']],[250,['water','bathroom','pumpCheck']]]){
 const d=C.createDirector(),args={connection:connection(value),thresholds,now,baseAction:'Reading'};assert.equal(d.select(args).context,null);
 for(let i=0;i<3;i++)assert.equal(d.select({...args,now:now+2500+i*6000}).context,ids[i]);
 assert.equal(d.select({...args,now:now+20500}).context,null);assert.equal(d.select({...args,now:now+92500}).context,ids[0]);
 assert.equal(d.select({...args,now:now+100000,manual:true,baseAction:'Eating together'}).action,'Eating together');
 assert.equal(d.select({...args,now:now+100100}).context,null,'manual activity yields to a quiet interval');
 for(const overrides of [{busy:true},{hidden:true},{baseAction:'Sleeping'},{manual:true,baseAction:'Dancing'},{enabled:false}])assert.equal(d.select({...args,now:now+200000,...overrides}).context,null);
 const reduced=C.createDirector();reduced.select(args);for(const t of [2500,8500,14500])assert.equal(reduced.select({...args,now:now+t,reducedMotion:true}).context,ids[0]);
 assert.equal(reduced.select({...args,now:now+3000,connection:{connected:false}}).context,null);
 assert.equal(reduced.select({...args,now:now+4000,connection:{...connection(value),reading:reading(value,now-C.STALE_MS)}}).context,null);
}
// Visual selection does not mutate the connection, configured ranges or any game/account state.
const data=connection(50),saved=JSON.stringify(data),ranges={...thresholds};const d=C.createDirector();for(let i=0;i<2000;i++)d.select({connection:data,thresholds:ranges,now:now+i*1000,baseAction:'Idle'});assert.equal(JSON.stringify(data),saved);assert.deepEqual(ranges,thresholds);
const source=fs.readFileSync(path.join(__dirname,'../dist/glucose-emotes.js'),'utf8');assert(!/localStorage|fetch\(|console\.|\.coins|\.owned|\.equipped|correction/i.test(source));
console.log('PASS: parent threshold boundaries, validity/staleness/future handling, no fixture substitution, six contextual choices, protected activities, cooldown, reduced motion and read-only visual policy.');
