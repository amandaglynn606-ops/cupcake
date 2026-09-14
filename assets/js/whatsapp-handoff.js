// Reserve a tab during the customer's click, before asynchronous validation.
// The original page always retains a link and the complete message as fallback.
export function prepareWhatsAppTab(){
 let tab;
 try{
  tab=window.open('about:blank','_blank');
  if(tab){tab.opener=null;tab.document.title='Preparing your WhatsApp message';tab.document.body.textContent='Preparing your message. Please keep this tab open.';}
 }catch{/* The manual link remains available if popups are blocked. */}
 return {
  open(url){if(!/^https:\/\/wa\.me\/\d{7,15}\?text=/.test(url||'')){this.close();return;}try{if(tab&&!tab.closed)tab.location.replace(url);}catch{this.close();}},
  close(){try{if(tab&&!tab.closed)tab.close();}catch{/* Browser may have closed the tab. */}}
 };
}

export function addMessageActions(container,{text,files=[]}){
 const copy=document.createElement('button');copy.type='button';copy.className='button button-outline';copy.textContent='Copy full message';
 const status=document.createElement('p');status.setAttribute('role','status');
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);status.textContent='Message copied. Paste it into your WhatsApp chat.';}catch{status.textContent='Copy the text from the message preview below.';}});
 container.append(copy,status);
 if(files.length&&navigator.canShare?.({files})&&navigator.share){
  const share=document.createElement('button');share.type='button';share.className='button button-outline';share.textContent='Share message & reference photos';
  share.addEventListener('click',async()=>{try{await navigator.share({files,text,title:'Maison Zavi cake enquiry'});status.textContent='Complete sending in your selected app.';}catch(error){if(error.name!=='AbortError')status.textContent='Open WhatsApp, paste your message and attach the original reference photos.';}});
  container.prepend(share);
 }
}
