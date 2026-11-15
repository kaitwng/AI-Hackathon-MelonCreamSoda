/* Pure family-routine rules. No dose calculations, rewards or device commands. */
(function(root){'use strict';
const EVENT_WINDOW_MS=10*60*1000;
const whole=n=>Number.isInteger(n)&&n>=0&&n<=60;
function validPolicy(p){return !!p&&['parent','child'].includes(p.mode)&&typeof p.manualAllowed==='boolean'&&(p.mode==='parent'?whole(p.minutes):whole(p.min)&&whole(p.max)&&p.min<=p.max);}
function canStart(p,minutes,source){return ['manual','tandem'].includes(source)&&validPolicy(p)&&whole(minutes)&&(source!=='manual'||p.manualAllowed)&&(p.mode==='parent'?minutes===p.minutes:minutes>=p.min&&minutes<=p.max);}
function eventKeys(e){return ['event:'+e.id,'delivery:'+e.deliveryId];}
// Only apply to the authenticated server adapter's delivered-event response, never
// local demo fixtures, carb entries, requested boluses or frontend device claims.
function eligibleEvent(e,used=[],now=Date.now()){
 return !!e&&e.source==='tandem'&&e.kind==='meal_bolus'&&e.status==='delivered'&&e.canceled!==true&&e.confirmed===true&&typeof e.id==='string'&&e.id.length>0&&typeof e.deliveryId==='string'&&e.deliveryId.length>0&&Number.isFinite(e.carbs)&&e.carbs>0&&Number.isFinite(e.deliveredUnits)&&e.deliveredUnits>0&&Number.isFinite(e.deliveredAt)&&Number.isFinite(e.receivedAt)&&e.deliveredAt<=e.receivedAt&&now-e.deliveredAt>=0&&now-e.deliveredAt<EVENT_WINDOW_MS&&now-e.receivedAt>=0&&now-e.receivedAt<EVENT_WINDOW_MS&&!eventKeys(e).some(k=>used.includes(k))&&!used.includes(e.id);
}
function validTimer(t){return !!t&&t.version===2&&typeof t.id==='string'&&t.id.length>0&&['manual','tandem'].includes(t.source)&&whole(t.minutes)&&Number.isFinite(t.startedAt)&&Number.isFinite(t.end)&&t.end===t.startedAt+t.minutes*60000;}
function seconds(t,now=Date.now()){return validTimer(t)?Math.max(0,Math.ceil((t.end-now)/1000)):0;}
function transition(t,reading,now=Date.now()){
 // Low takes priority even when the saved deadline has already passed.
 if(reading.valid&&reading.band==='low')return validTimer(t)?'interrupted':'low';
 return validTimer(t)&&now>=t.end?'finished':'unchanged';
}
const api={EVENT_WINDOW_MS,validPolicy,canStart,eventKeys,eligibleEvent,validTimer,seconds,transition};root.DiaMealRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
