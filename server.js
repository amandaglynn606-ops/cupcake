'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {securityHeaders,isPublicAsset}=require('./lib/public-security');
const {totals,EMIRATES}=require('./lib/pricing');
const {createOrder,OrderError}=require('./lib/orders');
const {createEnquiry}=require('./lib/enquiries');
const {buildCatalog}=require('./lib/catalog');
const {card}=require('./lib/ui');
const {policy}=require('./pages/policies');
const {siteOrigin}=require('./lib/seo');
const {home,directory}=require('./pages/home');
const {collection}=require('./pages/collection');
const {product}=require('./pages/product');
const {atelier,information,faq,notFound}=require('./pages/editorial');
const forms=require('./pages/forms');
const ROOT=__dirname;
const TYPES={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.txt':'text/plain','.mp4':'video/mp4'};
function makeServer({catalog,orderDir=path.join(ROOT,'private','orders'),enquiryDir=path.join(ROOT,'private','enquiries'),config={}}){
 config={...config,siteUrl:process.env.PUBLIC_SITE_URL||config.siteUrl||''};
 const ctx={...buildCatalog(catalog,{curated:config.collectionScope==='curated'}),config};
 const photoPaths=products=>products.flatMap(p=>[p.image,...(p.images||[]),...(p.variants||[]).map(v=>v.image)]).filter(Boolean);
 const activePhotos=new Set(photoPaths(ctx.catalog.products));
 const retiredPhotos=new Set(photoPaths(catalog.products).filter(photo=>!activePhotos.has(photo)));
 const inFlight=new Map();
 return http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const page=(html,status=200)=>{res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:html);};
  for(const [name,value]of Object.entries(securityHeaders))res.setHeader(name,value);
  try{
   const url=new URL(req.url,'http://localhost');
   if(req.method==='GET'&&url.pathname==='/api/config')return send(200,{name:config.name||'Maison Zavi',whatsapp:config.whatsapp||'',email:config.email||''});
   if(req.method==='GET'&&/^\/api\/products\/\d+$/.test(url.pathname)){
    const p=ctx.byId.get(url.pathname.split('/').pop());
    if(!p)return send(404,{error:'This cake could not be found.'});
    return send(200,{product:{id:p.id,title:p.title,handle:p.handle,kind:p.kind,image:p.image,imageAlt:p.imageAlt||p.title,cakeImage:!!require('./lib/cake-images').cakeImageClass(p),optionNames:p.optionNames,variants:p.variants.map(v=>({id:v.id,options:v.options,title:v.title,priceFils:v.priceFils,available:v.available,image:v.image}))}});
   }
   if(req.method==='GET'&&url.pathname==='/api/wishlist'){
    const ids=(url.searchParams.get('ids')||'').split(',').slice(0,100);
    const selected=ids.map(id=>ctx.byId.get(id)).filter(Boolean);
    return send(200,{html:selected.map(p=>card(p,ctx)).join(''),count:selected.length});
   }
   if(req.method==='POST'&&['/api/orders','/api/quote','/api/enquiries'].includes(url.pathname)){
    if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{return send(403,{error:'Invalid origin.'});}if(origin.host!==req.headers.host)return send(403,{error:'Please submit your request from this website.'});}
    if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON is required.'});
    let raw='';
    const limit=url.pathname==='/api/enquiries'&&config.submissionMode!=='whatsapp'?22*1024*1024:65536;
    let bytesRead=0;const chunks=[];
    for await(const chunk of req){bytesRead+=chunk.length;if(bytesRead>limit)return send(413,{error:'This request is too large.'});chunks.push(chunk);}
    raw=Buffer.concat(chunks).toString('utf8');
    let input;try{input=JSON.parse(raw);}catch{return send(400,{error:'Invalid request.'});}
    if(url.pathname==='/api/quote'){
     if(!input||!Array.isArray(input.items)||input.items.length>50)throw new OrderError('Please check your selection.');
     const items=input.items.map((item,index)=>{
      if(!item||typeof item!=='object')throw new OrderError('A selected item could not be found.');
      const p=ctx.byId.get(item.productId),v=p?.variants.find(v=>v.id===item.variantId);
      if(!v)throw new OrderError('A saved cake is no longer in the collection. Clear your bag and choose a new design.');
      if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)throw new OrderError('Choose a quantity between 1 and 20.');
      let tiers;try{tiers=require('./lib/tier-options').validateTiers(item.personalisation?.tiers,p,v);}catch(error){throw new OrderError(error.message);}
      const needsTiers=require('./lib/tier-options').tierCount(p,v)>1&&!tiers.length;
      return {index,productId:p.id,variantId:v.id,title:p.title,handle:p.handle,kind:p.kind,image:p.image,imageAlt:p.imageAlt||p.title,cakeImage:!!require('./lib/cake-images').cakeImageClass(p),variation:require('./lib/tier-options').variationLabel(p,v,tiers),quantity:item.quantity,message:typeof item.message==='string'?item.message.slice(0,100):'',available:v.available,personalisation:{...item.personalisation,tiers},needsTiers,needsPersonalisation:needsTiers||p.kind==='cake'&&(!['accept','natural'].includes(item.personalisation?.colouring)||item.personalisation?.allergens!=='accept'),priceOnConsultation:!!p.priceOnConsultation||tiers.length>0,quoteOnly:!!p.quoteOnly,unitPriceFils:v.priceFils,lineTotalFils:p.quoteOnly?null:v.priceFils*item.quantity};
     });
     if(input.fulfilment!==undefined&&!['delivery','pickup'].includes(input.fulfilment))throw new OrderError('Choose delivery or pickup.');
     if(input.emirate!==undefined&&!EMIRATES.includes(input.emirate))throw new OrderError('Choose a valid UAE emirate.');
     return send(200,{items,hasStartingPrices:items.some(i=>i.priceOnConsultation),hasUnpricedItems:items.some(i=>i.quoteOnly),...totals(items.some(i=>i.quoteOnly)?null:items.reduce((sum,item)=>sum+item.lineTotalFils,0),input.fulfilment||'delivery',input.emirate||'Dubai'),...(items.some(i=>i.quoteOnly)?{subtotalFils:null,totalFils:null}:{}),canOrder:items.length>0&&items.every(item=>item.available&&!item.needsPersonalisation)});
    }
    const key=req.headers['idempotency-key'];
    if(typeof key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(key))return send(400,{error:'A valid request reference is required.'});
    const isOrder=url.pathname==='/api/orders';
    if(config.submissionMode==='whatsapp')return send(201,require('./lib/whatsapp-submission').prepareWhatsApp(input,{isOrder,catalog:ctx.catalog,number:config.whatsapp}));
    const directory=isOrder?orderDir:enquiryDir;
    const flightKey=(isOrder?'order:':'enquiry:')+key;
    const filename=path.join(directory,key+'.json');
    const requestHash=createHash('sha256').update(raw).digest('hex');
    const save=async()=>{
     try{const existing=JSON.parse(await fs.readFile(filename,'utf8'));if(existing.request!==raw&&existing.requestHash!==requestHash)return {status:409,body:{error:'Your request changed. Please try again.'}};return {status:200,body:isOrder?{order:existing.order}:{enquiry:existing.enquiry}};}catch(error){if(error.code!=='ENOENT')throw error;}
     const record=isOrder?createOrder(input,ctx.catalog):createEnquiry(input);
     await fs.mkdir(directory,{recursive:true});
     if(!isOrder&&record.referenceImages.length){
      const folder=key+'-references';await fs.mkdir(path.join(directory,folder),{recursive:true});
      for(const [index,image]of record.referenceImages.entries()){
       const file=folder+'/'+(index+1)+({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp' }[image.type]);
       await fs.writeFile(path.join(directory,file),Buffer.from(image.data,'base64'));
       delete image.data;image.file=file;
      }
     }
     const stored=isOrder?{requestHash,order:record}:{requestHash,enquiry:record};
     const temp=filename+'.tmp';
     await fs.writeFile(temp,JSON.stringify(stored,null,2),{flag:'wx'});
     await fs.rename(temp,filename);
     return {status:201,body:isOrder?{order:record}:{enquiry:record}};
    };
    const pending=inFlight.get(flightKey);if(pending)await pending;
    const operation=save();inFlight.set(flightKey,operation);
    try{const result=await operation;return send(result.status,result.body);}finally{if(inFlight.get(flightKey)===operation)inFlight.delete(flightKey);}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Method not allowed.'});
   let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return page(notFound(ctx),404);}
   if(pathname==='/index.html'||(pathname.endsWith('/')&&pathname!=='/')){res.writeHead(302,{Location:pathname==='/index.html'?'/':pathname.slice(0,-1)+url.search});return res.end();}
   if(pathname==='/')return page(home(ctx));
   if(pathname==='/robots.txt'){
    res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'});
    return res.end(req.method==='HEAD'?undefined:require('./lib/discovery').robots(config));
   }
   if(pathname==='/llms.txt'){
    if(!siteOrigin(config))return send(503,{error:'The public site URL has not been configured.'});
    res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'});
    return res.end(req.method==='HEAD'?undefined:require('./lib/discovery').llms(ctx));
   }
   if(pathname==='/sitemap.xml'){
    const origin=siteOrigin(config);if(!origin)return send(503,{error:'The public site URL has not been configured.'});
    const routes=[...new Set(['/','/collections','/collections/all','/atelier','/bespoke','/contact','/delivery','/privacy','/faq',...Object.keys(require('./pages/policies').policies),...ctx.collections.map(c=>'/collections/'+c.slug),...ctx.catalog.products.map(p=>'/cakes/'+p.handle)])];
    const xmlEscape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8'});
    return res.end(req.method==='HEAD'?undefined:'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>'<url><loc>'+xmlEscape(origin+r)+'</loc></url>').join('')+'</urlset>');
   }
   if(pathname==='/collections')return page(directory(ctx));
   if(pathname.startsWith('/collections/')){
    const rendered=collection(ctx,pathname.slice('/collections/'.length),url.searchParams,pathname);
    return page(rendered||notFound(ctx),rendered?200:404);
   }
   if(pathname==='/search')return page(collection(ctx,'all',url.searchParams,pathname));
   if(pathname.startsWith('/cakes/')){
    const p=ctx.byHandle.get(pathname.slice('/cakes/'.length));
    return page(p?product(ctx,p):notFound(ctx),p?200:404);
   }
   if(pathname==='/atelier')return page(atelier(ctx));
   const policyPage=policy(ctx,pathname);if(policyPage)return page(policyPage);
   const policyAliases={'/policies/shipping-policy':'/delivery','/policies/privacy-policy':'/privacy','/pages/edible-items-policy':'/policies/edible-items-policy','/pages/substitution-policy':'/policies/substitution-policy','/pages/about-us':'/atelier','/pages/contact-us':'/contact','/pages/frequently-asked-questions':'/faq'};
   if(policyAliases[pathname]){res.writeHead(301,{Location:policyAliases[pathname]});return res.end();}
   if(pathname==='/bespoke'||pathname==='/contact')return page(forms.enquiry(ctx,pathname==='/contact'));
   if(pathname==='/delivery'||pathname==='/privacy')return page(information(ctx,pathname.slice(1)));
   if(pathname==='/faq')return page(faq(ctx));
   if(pathname==='/bag'||pathname==='/cart')return page(forms.bag(ctx,pathname));
   if(pathname==='/checkout')return page(forms.checkout(ctx));
   if(pathname==='/wishlist')return page(forms.wishlist(ctx));
   const relative=pathname.replace(/^\/+/,'');
   if(retiredPhotos.has(relative))return send(410,{error:'This image has been replaced.'});
   if(/^assets\/(?:licensed|studio)\//.test(relative))return send(410,{error:'This image has been retired.'});
   if(relative.split('/').includes('..'))return send(404,{error:'Not found.'});
   if(!isPublicAsset(relative))return page(notFound(ctx),404);
   const file=path.resolve(ROOT,relative);
   if(!file.startsWith(ROOT+path.sep))return send(404,{error:'Not found.'});
   const body=await fs.readFile(file);

   const headers={'Content-Type':TYPES[path.extname(file)]||'application/octet-stream','Content-Length':body.length,'Cache-Control':/\.(css|js)$/.test(file)?'no-cache':'public, max-age=86400'};
   if(relative.startsWith('assets/responsive/'))headers['Cache-Control']='public, max-age=31536000, immutable';
   if(path.extname(file)==='.mp4'){
    headers['Accept-Ranges']='bytes';
    if(req.headers.range&&req.method==='GET'){
     const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
     let start=match?.[1]?Number(match[1]):0,end=match?.[2]?Number(match[2]):body.length-1;
     if(match&&!match[1]&&match[2]){start=Math.max(0,body.length-Number(match[2]));end=body.length-1;}
     if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=body.length||start>end){
      res.writeHead(416,{'Content-Range':'bytes */'+body.length,'Content-Length':0});return res.end();
     }
     end=Math.min(end,body.length-1);
     res.writeHead(206,{...headers,'Content-Range':'bytes '+start+'-'+end+'/'+body.length,'Content-Length':end-start+1});
     return res.end(body.subarray(start,end+1));
    }
   }
   res.writeHead(200,headers);
   res.end(req.method==='HEAD'?undefined:body);
  }catch(error){
   if(error instanceof OrderError)return send(400,{error:error.message});
   if(error.code==='ENOENT'||error.code==='EISDIR')return send(404,{error:'Not found.'});
   console.error('Request failed:',error.message);
   send(500,{error:'We could not complete your request. Please try again.'});
  }
 });
}
if(require.main===module){
 const catalog=require('./lib/load-catalog').loadCatalog(),config=require('./store.config.json');
 const port=Number(process.env.PORT||3000);
 makeServer({catalog,config}).listen(port,'127.0.0.1',()=>console.log((config.name||'Cake Website')+': http://localhost:'+port));
}
module.exports={makeServer};
