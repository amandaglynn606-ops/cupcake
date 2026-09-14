'use strict';
const origin='https://weddingcakes.ae';
const token='FYSO_LLxu7jK8lE9Mm2Evy-bpdzX5E--bwJynsSqIPc';
(async()=>{
 for(const hostname of ['weddingcakes.ae','www.weddingcakes.ae'])await new Promise((resolve,reject)=>{
  const socket=require('node:tls').connect({host:hostname,port:443,servername:hostname,rejectUnauthorized:true},()=>{
   const cert=socket.getPeerCertificate();
   console.log(JSON.stringify({hostname,tlsAuthorized:socket.authorized,issuer:cert.issuer?.O,validFrom:cert.valid_from,validTo:cert.valid_to}));
   socket.end();resolve();
  });
  socket.setTimeout(15000,()=>socket.destroy(new Error('TLS check timed out')));
  socket.on('error',reject);
 });
 for(const route of ['/','/robots.txt','/sitemap.xml','/llms.txt','/assets/image-map.json','/server.js']){
  const response=await fetch(origin+route,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
  const body=await response.text();
  const result={route,status:response.status,url:response.url,server:response.headers.get('server')};
  if(route==='/'){
   const head=body.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
   result.verification=head.includes('<meta name="google-site-verification" content="'+token+'" />');
   result.canonical=head.match(/<link rel="canonical" href="([^"]+)"/)?.[1]||null;
   result.robots=head.match(/<meta name="robots" content="([^"]+)"/)?.[1]||null;
   result.xRobotsTag=response.headers.get('x-robots-tag');
  }
  if(route==='/robots.txt')result.policy=body.slice(0,1500);
  if(route==='/sitemap.xml')result.pages=(body.match(/<loc>/g)||[]).length;
  if(route==='/llms.txt')result.isGuide=body.startsWith('# Maison Zavi\n');
  console.log(JSON.stringify(result));
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
