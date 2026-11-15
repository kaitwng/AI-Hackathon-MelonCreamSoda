/* On-device semantic matching. Meal text is never sent to a text API. */
window.MellowMealAI=(()=>{
const foods=[
{id:'pizza',name:'Pizza',description:'pizza flatbread melted cheese tomato toppings pepperoni margherita'},
{id:'pasta',name:'Pasta',description:'pasta spaghetti penne macaroni lasagna ravioli fettuccine tomato cheese bolognese'},
{id:'rice',name:'Rice bowl',description:'rice bowl fried rice risotto pilaf bibimbap grain quinoa'},
{id:'curry',name:'Curry & rice',description:'curry rice butter chicken tikka masala dal lentil korma chana Thai curry'},
{id:'soup',name:'Soup',description:'soup stew chowder broth chili vegetables lentils'},
{id:'noodles',name:'Noodle bowl',description:'noodles ramen pho udon pad thai lo mein stir fry'},
{id:'burger',name:'Burger',description:'burger hamburger cheeseburger veggie burger bun patty lettuce'},
{id:'sandwich',name:'Sandwich',description:'sandwich sub baguette grilled cheese panini peanut butter jelly'},
{id:'taco',name:'Tacos',description:'tacos tortilla Mexican filling carne asada carnitas'},
{id:'burrito',name:'Burrito',description:'burrito wrap tortilla beans rice filling'},
{id:'salad',name:'Salad',description:'salad greens lettuce cucumber tomatoes caesar vegetables'},
{id:'sushi',name:'Sushi',description:'sushi maki nigiri salmon tuna California roll Japanese seaweed rice'},
{id:'dumplings',name:'Dumplings',description:'dumplings gyoza pierogi wontons momos dim sum bao'},
{id:'pancakes',name:'Pancakes',description:'pancakes waffles French toast maple syrup breakfast'},
{id:'toast',name:'Toast & eggs',description:'toast eggs avocado scrambled omelette breakfast bread'},
{id:'oatmeal',name:'Oatmeal',description:'oatmeal porridge overnight oats granola cereal yogurt berries'},
{id:'chicken',name:'Chicken plate',description:'chicken turkey roast grilled poultry vegetables mashed potato dinner'},
{id:'fish',name:'Fish plate',description:'fish salmon cod trout seafood shrimp prawns vegetables'},
{id:'fries',name:'Fries',description:'fries french fries chips fried potato wedges'},
{id:'fruit',name:'Fruit bowl',description:'fruit apple banana berries melon oranges grapes'},
{id:'cake',name:'Cake',description:'cake cupcake brownie cheesecake chocolate dessert pastry'},
{id:'icecream',name:'Ice cream',description:'ice cream gelato frozen yogurt sundae dessert'},
{id:'custom',name:'Your own plate',description:'mixed meal dinner plate food homemade assorted meal'}
];foods.push(...[['biryani','Biryani','biryani spiced rice chicken vegetable dum rice'],['dosa','Dosa & sides','dosa idli sambar chutney South Indian crepe'],['falafel','Falafel plate','falafel hummus pita tabbouleh Middle Eastern chickpeas'],['kebab','Kebab plate','kebab shawarma souvlaki grilled meat skewers'],['bao','Bao buns','bao steamed buns Chinese pork vegetable buns'],['empanada','Empanadas','empanadas pastel pastry filled baked Latin American'],['congee','Congee','congee jook rice porridge breakfast'],['poke','Poke bowl','poke Hawaiian rice fish avocado edamame'],['injera','Injera & stew','injera Ethiopian lentils vegetables stew'],['shakshuka','Shakshuka','shakshuka eggs tomato peppers breakfast'],['tamale','Tamales','tamales masa corn steamed husk Mexican'],['roti','Roti & dal','roti chapati naan dal lentils flatbread']].map(([id,name,description])=>({id,name,description})));let extractor,embeddings,loading;
async function initialize(progress){if(extractor&&embeddings)return;if(loading)return loading;
loading=(async()=>{progress('Loading on-device AI · first use downloads a model (~25 MB)…');const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js');env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;extractor=await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress'&&Number.isFinite(p.progress))progress('Downloading meal model · '+Math.round(p.progress)+'%')}});progress('Preparing the meal illustrations…');const out=await extractor(foods.map(f=>f.name+'. '+f.description),{pooling:'mean',normalize:true});embeddings=out.tolist()})();try{await loading}catch(e){extractor=null;embeddings=null;throw e}finally{loading=null}}
async function match(name,progress=()=>{}){await initialize(progress);progress('Finding an illustration for your meal…');const out=await extractor(name,{pooling:'mean',normalize:true});const vector=out.tolist()[0];const ranked=foods.map((f,i)=>({...f,score:embeddings[i].reduce((a,n,j)=>a+n*vector[j],0)})).sort((a,b)=>b.score-a.score);return {food:ranked[0],alternatives:ranked.slice(0,4)}}
return {foods,match};})();
