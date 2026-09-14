const {test}=require('node:test');
const assert=require('node:assert/strict');
const {requestedGuests,requestedWeight}=require('../lib/cake-size');
const {validateTiers}=require('../lib/tier-options');
test('requested sizes reject invalid numbers and omit edible weight from display tiers',()=>{
 for(const value of [-1,0,.3,Infinity,NaN,'5',501])assert.throws(()=>requestedWeight(value));
 for(const value of [-1,0,1.5,Infinity,'80',100000])assert.throws(()=>requestedGuests(value));
 assert.equal(requestedWeight(4.5),4.5);assert.equal(requestedGuests(80),80);
 assert.equal(requestedGuests(undefined),undefined);assert.equal(requestedWeight(''),undefined);
 const p={title:'2-Tier Cake',tiers:2},v={title:'2 tiers'};
 const input=[{type:'edible',sponge:'Chocolate',filling:'Coffee cream',weightLb:5},{type:'dummy',weightLb:5}];
 const result=validateTiers(input,p,v);
 assert.equal(result[0].weightLb,5);assert.equal(result[1].weightLb,undefined);
 assert.throws(()=>validateTiers([{...input[0],weightLb:-5},input[1]],p,v));
});
