import {$,data,esc,downloadText,contactUrl} from './app.js';
const form=$('#enquiry-form');
if(form.elements.date)form.elements.date.min=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let lastPayload='',key='',pending=false;
let references=[];
const fileInput=$('#reference-images');
const referenceError=$('#reference-error');
const readImage=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,data:reader.result});reader.onerror=()=>reject(new Error('This image could not be read. Please choose it again.'));reader.readAsDataURL(file);});
function renderReferences(){
 $('#reference-previews').innerHTML=references.map((file,i)=>'<div class="reference-preview"><img src="'+esc(file.preview)+'" alt="Reference: '+esc(file.name)+'"><span>'+esc(file.name)+'</span><button type="button" data-remove-reference="'+i+'" aria-label="Remove '+esc(file.name)+'">Remove</button></div>').join('');
}
fileInput?.addEventListener('change',async()=>{
 const files=[...fileInput.files];referenceError.textContent='';
 if(files.length+references.length>3){referenceError.textContent='You can add up to 3 images. Remove one to choose another.';fileInput.value='';return;}
 if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024)){referenceError.textContent='Please use JPG, PNG or WebP images, up to 5 MB each.';fileInput.value='';return;}
 fileInput.disabled=true;
 try{const loaded=await Promise.all(files.map(async file=>({...file,name:file.name,preview:(await readImage(file)).data})));references.push(...loaded);renderReferences();}
 catch(error){referenceError.textContent=error.message;}
 finally{fileInput.value='';fileInput.disabled=false;}
});
$('#reference-previews')?.addEventListener('click',event=>{const button=event.target.closest('[data-remove-reference]');if(button){references.splice(Number(button.dataset.removeReference),1);renderReferences();referenceError.textContent='';fileInput.focus();}});
if(data.enquiryKind==='bespoke'&&form.elements.occasion&&new URLSearchParams(location.search).get('occasion')==='Wedding')form.elements.occasion.value='Wedding';
form.addEventListener('submit',async event=>{
 event.preventDefault();if(pending||fileInput?.disabled||!form.reportValidity())return;
 const input={...Object.fromEntries(new FormData(form)),kind:data.enquiryKind,consent:form.elements.consent.checked};
 delete input.referenceFiles;
 input.referenceImages=references.map(file=>({name:file.name,data:file.preview}));
 const body=JSON.stringify(input);if(body!==lastPayload){key=crypto.randomUUID();lastPayload=body;}
 const button=$('button[type=submit]',form),original=button.innerHTML,error=$('.form-error',form);
 pending=true;button.disabled=true;button.textContent='Saving your enquiry…';error.textContent='';
 try{
  const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body,signal:AbortSignal.timeout(20000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Your enquiry could not be saved.');
  const e=result.enquiry;
  const text=[data.config.name.toUpperCase()+' — '+(e.kind==='bespoke'?'CUSTOM CAKE ENQUIRY':'ENQUIRY'),e.id,'','Name: '+e.name,'Email: '+e.email,'Phone: '+e.phone,'Occasion / enquiry: '+e.occasion,...(e.kind==='bespoke'?['Preferred date: '+e.date,'Guests: '+e.guests,'Budget: '+e.budget]:[]),'',e.brief,...(e.referenceImages||[]).map(image=>'Reference image saved: '+image.name),'','Status: enquiry saved; subject to confirmation'].join('\n');
  const contact=contactUrl('Enquiry '+e.id,text);
  const email=data.config.email?contactUrl('Enquiry '+e.id,text,'email'):'';
  form.hidden=true;$('#enquiry-success').hidden=false;
  $('#enquiry-success').innerHTML='<div class="request-success"><img src="/assets/brand/monogram.svg?v=zavi" alt="" width="65" height="80"><p class="eyebrow">YOUR ENQUIRY</p><h2 id="enquiry-success-title" tabindex="-1">Your enquiry is saved.</h2><p>Keep a copy of your enquiry. Design, feasibility, pricing and timing require a separate confirmation.</p><p class="request-reference">'+esc(e.id)+'</p><div class="success-actions"><button class="button" id="download-enquiry">Download your enquiry ↓</button>'+(email?'<a class="button" href="'+esc(email)+'">Email your enquiry</a>':'')+(contact?'<a class="button button-outline" href="'+esc(contact)+'" target="_blank" rel="noopener">Send your enquiry on WhatsApp ↗</a>':'')+'<a class="text-link" href="/collections">View all collections →</a></div></div>';
  $('#download-enquiry').addEventListener('click',()=>downloadText(e.id+'.txt',text));$('#enquiry-success-title').focus();
  if(e.referenceImages?.length){const note=document.createElement('p');note.textContent=e.referenceImages.length+' reference image'+(e.referenceImages.length===1?'':'s')+' saved with your enquiry.';$('#enquiry-success .request-reference').before(note);}
 }catch(e){error.textContent=e.name==='TimeoutError'?'Your enquiry took too long to save. Please try again.':e.message;}
 finally{pending=false;button.disabled=false;button.innerHTML=original;}
});
