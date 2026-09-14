'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const sharp=require('sharp');
test('responsive photo variants preserve every complete frame and reduce card downloads',async()=>{
 const manifest=require('../data/responsive-images.json');
 let originalBytes=0,cardBytes=0;
 for(const [original,entry]of Object.entries(manifest)){
  originalBytes+=(await fs.stat(original)).size;
  for(const variant of entry.variants){
   const metadata=await sharp(variant.url).metadata();
   assert.equal(metadata.width,variant.width);
   assert.ok(Math.abs(metadata.height-entry.height*variant.width/entry.width)<=1,original);
  }
  cardBytes+=(await fs.stat(entry.variants.find(v=>v.width===640)?.url||original)).size;
 }
 assert.ok(cardBytes<originalBytes*.6,'Card photos should use less than 60% of original bytes');
 console.log('640px card photos: '+Math.round(100*cardBytes/originalBytes)+'% of original bytes');
});
