'use strict';
function requestedNumber(value,{label,min,max,step}){
 if(value===undefined||value===null||value==='')return undefined;
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||!Number.isInteger(value/step))throw new Error('Please enter a valid '+label+'.');
 return value;
}
const requestedWeight=value=>requestedNumber(value,{label:'tier weight in pounds (0.5 to 500, in half-pound steps)',min:0.5,max:500,step:0.5});
const requestedGuests=value=>requestedNumber(value,{label:'number of guests (1 to 99,999)',min:1,max:99999,step:1});
module.exports={requestedWeight,requestedGuests};
