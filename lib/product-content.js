'use strict';
// Preserve source IDs, handles, variations and pricing. Public copy is maintained separately.
function productContent(p){
 if(!p.title||!p.handle)return p;
 let title=p.title.normalize('NFKC').replace(/\b(?:luxury|elegant|beautiful|stunning|gorgeous|delicious|premium|perfect)\s+/gi,'').replace(/\b(?:in Dubai|Dubai|UAE|same[- ]day delivery)\b/gi,'').replace(/New Born/gi,'Newborn').replace(/Heart Shape\b/gi,'Heart-shaped').replace(/Intials/gi,'Initials').replace(/Tiered\b/gi,'Tier').replace(/\s*[-–|,]\s*$/,'').replace(/\s+/g,' ').trim();
 // Put the design first and the colour second where the imported title starts with colours.
 const colour=title.match(/^((?:(?:Pink|White|Blue|Red|Black|Gold|Silver|Purple|Green|Ivory|Blush|Pastel|Peach)(?:\s*&\s*|\s+and\s+)?)+)\s+(.+)$/i);
 if(colour)title=colour[2]+' — '+colour[1];
 const facts=title.replace(/\s+—\s+/g,', ');
 const options=p.optionNames?.map(n=>n.trim().toLowerCase()).filter(Boolean)||[];
 const description=facts+'. '+(p.kind==='accessory'?'Choose the available option to finish your celebration.':options.length?'Explore the listed '+options.join(' and ')+' options, then add your personal message or design instructions.':'Share your preferred size and finishing details with your request.')+' Confirm the final design and availability with Maison Zavi on WhatsApp.';
 return {...p,title,description,originalTitle:p.title,searchText:p.title+' '+p.description};
}
module.exports={productContent};
