'use strict';
let manifest={};
try{manifest=require('../data/responsive-images.json');}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
let stylesheet='';
try{stylesheet=require('../data/responsive-image-styles.json').stylesheet;}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
function imageCandidates(url){
 const file=(url||'').replace(/^\//,''),entry=manifest[file];
 return entry?.variants.length?[...entry.variants,{url:file,width:entry.width}].map(v=>'/'+v.url+' '+v.width+'w').join(', '):'';
}
function imageRatio(url){const entry=manifest[(url||'').replace(/^\//,'')];return entry?entry.width/entry.height:1;}
module.exports={imageCandidates,imageRatio,stylesheet};
