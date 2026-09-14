'use strict';
const pageCopy=require('../data/page-metadata.json');
function pageMetadata({title,description,path='/',canonicalPath=path}){
 const defined=pageCopy[path];
 const meta=defined?{...defined}:{title,description:description||title};
 const page=Number(new URL(canonicalPath,'https://metadata.invalid').searchParams.get('page'));
 if(defined&&Number.isInteger(page)&&page>1){
  meta.title+=' — Page '+page;
  meta.description='Page '+page+'. '+meta.description;
 }
 return meta;
}
function siteOrigin(config){
 try{const url=new URL(config.siteUrl);return /^https?:$/.test(url.protocol)?url.origin:'';}catch{return '';}
}
function seoHead(config,{path='/',canonicalPath=path,noindex=false},escape){
 const origin=siteOrigin(config);
 const privatePage=['/search','/wishlist','/cart','/bag','/checkout','/404'].includes(path);
 return '<meta name="robots" content="'+(privatePage||noindex?'noindex, follow':'index, follow, max-image-preview:large')+'">'+(origin?'<link rel="canonical" href="'+escape(origin+canonicalPath)+'">':'');
}
module.exports={siteOrigin,seoHead,pageMetadata};
