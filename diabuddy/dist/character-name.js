/* One display-name source. Always escape at HTML boundaries; never replace user text. */
(function(root){'use strict';
const resolve=value=>typeof value==='string'&&value.trim()?value.trim():'Miso';
const current=()=>resolve(typeof state==='undefined'?null:state.characterName);
root.DiaNames={resolve,current};
})(window);
