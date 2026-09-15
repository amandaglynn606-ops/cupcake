'use strict';
const {siteOrigin}=require('./seo');
const publicIdentityFiles=['favicon.svg','favicon.ico','favicon-48.png','apple-touch-icon.png','icon-192.png','icon-512.png'];
const domainHosts=['weddingcakes.ae','www.weddingcakes.ae'];

function identityHead(config,{path='/'},escape){
 const name=config.name||'Maison Zavi';
 const icons='<link rel="icon" href="/favicon.ico?v=zavi-2" sizes="16x16 32x32 48x48">'+
  '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=zavi-2">'+
  '<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg?v=zavi-2">'+
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=zavi-2">';
 const origin=siteOrigin(config);
 let head=icons+'<meta property="og:site_name" content="'+escape(name)+'">';
 if(origin&&path==='/'){
  const logo=origin+'/assets/brand/site-logo.png';
  head+='<meta property="og:image" content="'+escape(logo)+'"><meta property="og:image:alt" content="'+escape(name+' — Wedding and Luxury Cakes')+'">';
  const identity={'@context':'https://schema.org','@graph':[
   {'@type':'Organization','@id':origin+'/#organization',name,url:origin+'/',logo:{'@type':'ImageObject',url:logo,width:512,height:512}},
   {'@type':'WebSite','@id':origin+'/#website',name,alternateName:'Wedding Cakes UAE',url:origin+'/',publisher:{'@id':origin+'/#organization'}}
  ]};
  head+='<script type="application/ld+json">'+JSON.stringify(identity).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026')+'</script>';
 }
 return head;
}

// Only the two owned production hosts are eligible; local and preview hosts stay local.
function canonicalDomain(config){
 const origin=siteOrigin(config);
 if(!origin)return null;
 const target=new URL(origin);
 if(target.protocol!=='https:'||target.port||!domainHosts.includes(target.hostname))return null;
 return {origin,alias:domainHosts.find(host=>host!==target.hostname)};
}
function canonicalRedirect(config,host,requestTarget){
 const domain=canonicalDomain(config);
 if(!domain||typeof host!=='string'||host.toLowerCase().replace(/:(?:80|443)$/,'')!==domain.alias)return null;
 // Concatenate the validated origin: a path beginning // must never become a new host.
 if(typeof requestTarget!=='string'||!requestTarget.startsWith('/')||/[\r\n]/.test(requestTarget))return null;
 return domain.origin+requestTarget;
}
function canonicalRoutes(config){
 const domain=canonicalDomain(config);
 return domain?[{src:'/(.*)',has:[{type:'host',value:domain.alias}],status:308,headers:{Location:domain.origin+'/$1'}}]:[];
}
module.exports={publicIdentityFiles,identityHead,canonicalRedirect,canonicalRoutes};
