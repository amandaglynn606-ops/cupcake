import {$,savedIds,syncSaved,esc} from './app.js';
let controller;
async function render(){
 controller?.abort();controller=new AbortController();
 const ids=savedIds();
 if(!ids.length){$('#wishlist-content').innerHTML='<div class="empty-state"><p class="eyebrow">YOUR PERSONAL EDIT</p><h2>Keep what<br><em>catches your eye.</em></h2><p>Use the heart on any design to save it here for another look.</p><a class="button" href="/collections/all">Explore the collection →</a></div>';return;}
 try{
  const response=await fetch('/api/wishlist?ids='+encodeURIComponent(ids.join(',')),{signal:controller.signal});
  if(!response.ok)throw new Error('Your wishlist could not be loaded.');
  const result=await response.json();
  $('#wishlist-content').innerHTML='<p class="eyebrow">'+result.count+' SAVED DESIGNS</p><div class="product-grid home-products">'+result.html+'</div>';syncSaved();
 }catch(error){if(error.name!=='AbortError')$('#wishlist-content').innerHTML='<p class="form-error">'+esc(error.message)+'</p><button class="button" id="retry-wishlist">Try again</button>';}
}
window.addEventListener('wishlist-change',render);
document.addEventListener('click',e=>{if(e.target.closest('#retry-wishlist'))render();});
render();

