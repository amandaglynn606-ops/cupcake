const key='xavi-cart-details-v1';
export function getCartDetails(){try{const value=JSON.parse(localStorage.getItem(key));return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch{return null;}}
export function saveCartDetails(value){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Details are also held in the current form until navigation. */}}
export function clearCartDetails(){try{localStorage.removeItem(key);}catch{}}
