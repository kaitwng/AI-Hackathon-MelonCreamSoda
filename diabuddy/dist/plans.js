/* Product amounts supplied by the owner; checkout requires provider IDs and limits. */
(function(root){
'use strict';
const plans=Object.freeze({
 free:Object.freeze({name:'Free',available:true,description:'Explore the current shared buddy, games, and activities on this device.',childLimit:null,coverageDescription:'Basic features for any number of children'}),
 plusMonthly:Object.freeze({name:'Plus Monthly',available:false,amountCents:599,currency:'USD',interval:'month',childLimit:1}),
 plusAnnual:Object.freeze({name:'Plus Annual',available:false,amountCents:5000,currency:'USD',interval:'year',childLimit:1}),
 familyMonthly:Object.freeze({name:'Family Monthly',available:false,amountCents:899,currency:'USD',interval:'month',childLimit:5})
});
if(typeof module!=='undefined'&&module.exports)module.exports=plans;
root.DiaPlans=plans;
})(typeof window==='undefined'?globalThis:window);
