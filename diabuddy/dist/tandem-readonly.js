/* Integration boundary: this project has no official Tandem delivered-event feed.
 * Do not substitute local fixtures or infer delivery from a carb entry/CGM trend.
 * A future adapter must fetch authorized, server-verified delivered meal events;
 * the contract is documented in docs/waiting-for-meal.md. No pump commands. */
(function(root){'use strict';
root.DiaTandemReadOnly=Object.freeze({available:false,events:()=>[],description:'Live t:slim meal-bolus events are not connected. This app cannot verify pump delivery.'});
})(window);
