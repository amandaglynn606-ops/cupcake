import {openDialog} from './app.js';
const buttons=document.querySelectorAll('[data-collection-zoom]');
if(buttons.length){
 const dialog=document.createElement('dialog');
 dialog.id='collection-lightbox';dialog.className='product-lightbox';
 dialog.setAttribute('aria-label','Enlarged collection photo');
 const close=document.createElement('button');
 close.type='button';close.className='lightbox-close';close.dataset.close='';
 close.setAttribute('aria-label','Close enlarged photo');close.textContent='×';
 const image=document.createElement('img');image.className='cake-image';
 dialog.append(close,image);document.body.append(dialog);
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
 for(const button of buttons)button.addEventListener('click',()=>{
  const original=button.closest('.collection-image').querySelector('img');
  image.src=original.src;image.alt=original.alt;
  openDialog(dialog.id);
 });
}
