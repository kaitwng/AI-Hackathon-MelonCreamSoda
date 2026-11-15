/* Pure family-routine rules. No dose calculations or device commands; rewards never scale with medical values. */
(function(root){'use strict';
const EVENT_WINDOW_MS=10*60*1000;
const whole=n=>Number.isInteger(n)&&n>=0&&n<=60;
function validPolicy(p){return !!p&&['parent','child'].includes(p.mode)&&typeof p.manualAllowed==='boolean'&&(p.mode==='parent'?whole(p.minutes):whole(p.min)&&whole(p.max)&&p.min<=p.max);}
function canStart(p,minutes,source){return ['manual','demo','tandem'].includes(source)&&validPolicy(p)&&whole(minutes)&&(source==='tandem'||p.manualAllowed)&&(p.mode==='parent'?minutes===p.minutes:minutes>=p.min&&minutes<=p.max);}
function eventKeys(e){return ['event:'+e.id,'delivery:'+e.deliveryId];}
// Only apply to the authenticated server adapter's delivered-event response, never
// local demo fixtures, carb entries, requested boluses or frontend device claims.
function eligibleEvent(e,used=[],now=Date.now()){
 return Array.isArray(used)&&!!e&&e.source==='tandem'&&e.simulated!==true&&e.demo!==true&&!['sandbox','demo'].includes(e.environment)&&e.kind==='meal_bolus'&&e.status==='delivered'&&e.canceled!==true&&e.confirmed===true&&typeof e.id==='string'&&e.id.length>0&&typeof e.deliveryId==='string'&&e.deliveryId.length>0&&Number.isFinite(e.carbs)&&e.carbs>0&&Number.isFinite(e.deliveredUnits)&&e.deliveredUnits>0&&Number.isFinite(e.deliveredAt)&&Number.isFinite(e.receivedAt)&&e.deliveredAt<=e.receivedAt&&now-e.deliveredAt>=0&&now-e.deliveredAt<EVENT_WINDOW_MS&&now-e.receivedAt>=0&&now-e.receivedAt<EVENT_WINDOW_MS&&!eventKeys(e).some(k=>used.includes(k))&&!used.includes(e.id);
}
function validRewardSettings(s){return !!s&&typeof s.enabled==='boolean'&&Number.isInteger(s.amount)&&s.amount>=0&&s.amount<=1000;}
// Called only at explicit Start, before consuming the adapter event. Glucose,
// waiting duration, carb quantity and delivered dose never scale the reward amount.
function rewardOnStart(settings,event,used,claims,source,now=Date.now()){
 if(!Array.isArray(claims)||source!=='tandem'||!validRewardSettings(settings)||!settings.enabled||settings.amount===0||!eligibleEvent(event,used,now))return null;
 const keys=eventKeys(event);return keys.some(k=>claims.includes(k))?null:{amount:settings.amount,keys};
}
function validTimer(t){return !!t&&t.version===2&&typeof t.id==='string'&&t.id.length>0&&['manual','demo','tandem'].includes(t.source)&&whole(t.minutes)&&Number.isFinite(t.startedAt)&&Number.isFinite(t.end)&&t.end===t.startedAt+t.minutes*60000;}
function seconds(t,now=Date.now()){return validTimer(t)?Math.max(0,Math.ceil((t.end-now)/1000)):0;}
function transition(t,reading,now=Date.now()){
 // Low takes priority even when the saved deadline has already passed.
 if(reading.valid&&reading.band==='low')return validTimer(t)?'interrupted':'low';
 return validTimer(t)&&now>=t.end?'finished':'unchanged';
}
const api={EVENT_WINDOW_MS,validPolicy,canStart,eventKeys,eligibleEvent,validRewardSettings,rewardOnStart,validTimer,seconds,transition};root.DiaMealRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
