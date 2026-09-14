const settings=JSON.parse(document.getElementById('page-data').textContent).exchange;
const selector=document.querySelector('[data-currency-selector]');
const rates=settings.aedPerUnit;
let currency='AED';
try{const saved=localStorage.getItem('maison-currency');if(Object.hasOwn(rates,saved))currency=saved;}catch{}
selector.value=currency;
const originals=new WeakMap();
const pattern=/AED\s+([\d,]+(?:\.\d{1,2})?)/g;
const excluded='script,style,pre,textarea,option,input,[data-currency-fixed]';
function convert(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){
  if(node.parentElement?.closest(excluded))continue;
  let record=originals.get(node);
  if(!record||node.nodeValue!==record.rendered){
   if(!/AED\s+[\d,]+/.test(node.nodeValue))continue;
   record={original:node.nodeValue};
  }
  const next=currency==='AED'?record.original:record.original.replace(pattern,(_,amount)=>currency+' '+new Intl.NumberFormat('en',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(amount.replaceAll(',',''))/rates[currency]));
  record.rendered=next;originals.set(node,record);
  if(node.nodeValue!==next)node.nodeValue=next;
 }
 document.documentElement.dataset.currency=currency;
 document.querySelectorAll('[data-currency-notice]').forEach(el=>{
  const next=currency==='AED'?'All orders are quoted in AED.':'Approximate '+currency+' display. Orders are quoted in AED. Exchange rates: '+settings.date+'.';
  if(el.textContent!==next)el.textContent=next;
 });
}
let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;observer.disconnect();convert();observe();});});
function observe(){observer.observe(document.body,{subtree:true,childList:true,characterData:true});}
selector.addEventListener('change',()=>{currency=selector.value;try{localStorage.setItem('maison-currency',currency);}catch{}convert();});
convert();observe();
