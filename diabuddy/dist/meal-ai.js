/* Local component recipes. No model, image API, nutrition inference, or external requests.
   The legacy MellowMealAI export remains for saved-data/client compatibility. */
(function(root){
'use strict';
const lexicon={
 chicken:/\bchicken\b/,turkey:/\bturkey\b/,salmon:/\bsalmon\b/,fish:/\b(?:fish|cod|trout)\b/,tofu:/\btofu\b/,beef:/\b(?:beef|steak)\b/,beans:/\b(?:beans?|chickpeas?|lentils?)\b/,
 rice:/\brice\b/,broccoli:/\bbroccoli\b/,lettuce:/\b(?:lettuce|greens)\b/,tomato:/\btomato(?:es)?\b/,strawberry:/\bstrawberr(?:y|ies)\b/,blueberry:/\bblueberr(?:y|ies)\b/,banana:/\bbananas?\b/,avocado:/\bavocados?\b/,mushroom:/\bmushrooms?\b/,carrot:/\bcarrots?\b/,pepper:/\b(?:bell peppers?|peppers?)\b/,egg:/\b(?:eggs?|omelet(?:te)?)\b/,cheese:/\b(?:cheese|cheddar|parmesan|mozzarella)\b/,chocolate:/\bchocolate\b/,syrup:/\b(?:maple syrup|syrup)\b/,whippedCream:/\bwhipped cream\b/,cream:/\b(?:alfredo|creamy|cream sauce)\b/,tomatoSauce:/\b(?:marinara|bolognese|tomato sauce)\b/,peanutButter:/\bpeanut butter\b/,jam:/\b(?:jam|jelly)\b/,spinach:/\bspinach\b/,potato:/\b(?:potato(?:es)?|fries)\b/,corn:/\bcorn\b/,cucumber:/\bcucumbers?\b/,shrimp:/\b(?:shrimp|prawns?)\b/
};
const dishes=[['pasta',/\b(?:pasta|spaghetti|penne|fettuccine|macaroni)\b/],['pancakes',/\bpancakes?\b/],['sandwich',/\bsandwich(?:es)?\b/],['pizza',/\bpizza\b/],['noodles',/\b(?:noodles?|ramen|udon)\b/],['curry',/\bcurry\b/],['soup',/\b(?:soup|stew)\b/],['salad',/\bsalad\b/],['taco',/\btacos?\b/],['dumplings',/\b(?:dumplings?|gyoza)\b/],['burger',/\b(?:burger|hamburger)\b/],['toast',/\btoast\b/],['oatmeal',/\b(?:oatmeal|porridge|oats)\b/],['icecream',/\b(?:ice cream|gelato)\b/],['rice',/\brice\b/],['fish',/\b(?:salmon|fish|cod|trout)\b/],['chicken',/\b(?:chicken|turkey)\b/],['tofu',/\btofu\b/],['eggs',/\b(?:egg|eggs|omelette|omelet)\b/],['fruit',/\b(?:fruit|banana|strawberr(?:y|ies)|blueberr(?:y|ies))\b/]];
const labels={whippedCream:'whipped cream',tomatoSauce:'tomato sauce',peanutButter:'peanut butter',cream:'cream sauce'};
const modifiers=/\b(?:grilled|roasted|baked|fried|steamed|scrambled|omelette|omelet|creamy|whole wheat|white|brown|sliced|fresh|spicy)\b/g;
const stop=new Set('a an the and with of on in for my some side sides topped topping toppings plate bowl homemade served little meal dinner lunch breakfast alfredo sauce maple butter bell wheat whole white brown fruit berries'.split(' '));
function parse(input){
 const name=String(input??'').trim().slice(0,120),original=name.toLowerCase();
 // Excluded ingredients must never become a visible topping. Keep the original name intact.
 const exclusions=[];let text=original.replace(/\b(?:without|no|hold the)\s+([a-z]+(?:\s+(?:cream|sauce|butter))?)/g,(_,words)=>{exclusions.push(words);return ' ';});
 const dish=dishes.find(([,pattern])=>pattern.test(text));const base=dish?.[0]||'custom';
 const components=Object.entries(lexicon).filter(([,pattern])=>pattern.test(text)).map(([id])=>id);
 if(components.includes('salmon')){const i=components.indexOf('fish');if(i>=0)components.splice(i,1);}
 const preparation=[...text.matchAll(modifiers)].map(m=>m[0]);let remainder=text;
 for(const [,pattern]of dishes)remainder=remainder.replace(new RegExp(pattern.source,'g'),' ');
 for(const pattern of Object.values(lexicon))remainder=remainder.replace(new RegExp(pattern.source,'g'),' ');
 remainder=remainder.replace(modifiers,' ');
 const unsupported=[...new Set((remainder.match(/[a-z]+/g)||[]).filter(w=>!stop.has(w)))];
 const coverage=base==='custom'?'generic':unsupported.length?'partial':'composed';
 return {version:1,name,base,components,preparation,exclusions,unsupported,coverage,
  note:coverage==='generic'?'A generic plate: this meal is not in our illustrated component library.':coverage==='partial'?'Some details are not illustrated: '+unsupported.join(', ')+'. Your original meal name is kept.':'Built from illustrated components. A playful approximation, not a photo.',
  layers:[base,...components,...preparation]};
}
const foods=[...dishes.map(([id])=>({id,name:({pancakes:'Pancakes',icecream:'Ice cream',oatmeal:'Oatmeal',eggs:'Eggs',taco:'Tacos'})[id]||id[0].toUpperCase()+id.slice(1)})),{id:'custom',name:'Generic plate'}];
async function match(name,progress=()=>{}){progress('Composing your meal from pixel-art ingredients…');await new Promise(resolve=>setTimeout(resolve,0));const meal=parse(name);return {meal,food:{id:meal.base,name:meal.name},alternatives:[]};}
const api={foods,parse,match,labels};root.DiaMeals=api;root.MellowMealAI=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
