function whatsappDestination(value){
 try{
  const url=new URL(value);
  if(url.origin!=='https://wa.me'||url.username||url.password||!/^\/\d{7,15}$/.test(url.pathname))return null;
  const query=new URLSearchParams({phone:url.pathname.slice(1),text:url.searchParams.get('text')||''});
  return {app:'whatsapp://send?'+query,web:url.href};
 }catch{return null;}
}

// Use the current tab so popup blockers cannot interrupt the handoff.
// If the app opens, cancel the web fallback before the customer returns.
export function prepareWhatsAppHandoff(){
 let timer;
 const close=()=>{
  clearTimeout(timer);
  document.removeEventListener('visibilitychange',onVisibility);
  window.removeEventListener('pagehide',close);
 };
 const onVisibility=()=>{if(document.hidden)close();};
 return {
  open(value){
   close();
   const destination=whatsappDestination(value);if(!destination)return;
   document.addEventListener('visibilitychange',onVisibility);
   window.addEventListener('pagehide',close);
   timer=setTimeout(()=>{close();window.location.assign(destination.web);},2000);
   try{window.open(destination.app,'_self');}catch{/* The HTTPS fallback also works without the app installed. */}
  },
  close
 };
}

const linkHandoff=prepareWhatsAppHandoff();
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest('a[href]');
 if(!link||link.hasAttribute('download')||!whatsappDestination(link.href))return;
 event.preventDefault();linkHandoff.open(link.href);
});

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
