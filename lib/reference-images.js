'use strict';
const {OrderError}=require('./orders');
const MAX_IMAGE_BYTES=5*1024*1024;
function validateReferences(value){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>3)throw new OrderError('Please choose up to 3 reference images.');
 return value.map(image=>{
  if(!image||typeof image.name!=='string'||image.name.length>200||typeof image.data!=='string')throw new OrderError('Please select your reference images again.');
  const match=image.data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match||match[2].length>Math.ceil(MAX_IMAGE_BYTES/3)*4)throw new OrderError('Use JPG, PNG or WebP images, up to 5 MB each.');
  const bytes=Buffer.from(match[2],'base64');
  // Some phone/downloaded photos have the wrong extension. Trust their bytes.
  const type=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;
  if(!type||bytes.length>MAX_IMAGE_BYTES||bytes.length<12)throw new OrderError('One reference image is invalid. Please choose a JPG, PNG or WebP photo.');
  return {name:image.name.replace(/[\x00-\x1f<>/\\]/g,'').trim()||'Reference image',type,size:bytes.length,data:match[2]};
 });
}
module.exports={validateReferences};
