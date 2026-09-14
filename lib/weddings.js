'use strict';
const STYLES = [
  ['fresh','Fresh flower cakes',/\bfresh flowers?\b/i],
  ['floral','Floral cakes',/\b(?:floral|flowers?|roses?|orchids?|peonies|lil(?:y|ies)|gypso(?:phila)?)\b/i],
  ['modern','Modern & sculptural',/\b(?:modern|abstract|square|hexagonal|wafer|drap(?:e|ed))\b/i],
  ['pearls-lace','Pearls & lace',/\b(?:pearls?|beads?|lace|lambeth|piping)\b/i],
  ['gold','Gold details',/\bgold(?:en)?\b/i]
];
const TIERS = [['2','Two tiers'],['3','Three tiers'],['4-plus','Four tiers & more'],['6-plus','Six tiers & more']];
function weddingMeta(p) {
  const text=p.title+' '+(p.description||'')+' '+(p.searchText||'')+' '+(p.flowers||'')+' '+(p.finish||'');
  const match=text.match(/\b(two|three|four|five|six|seven|eight|nine|ten|[2-9]|10)[ -]*tier(?:ed|s)?\b/i);
  const words={two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  const count=p.tiers||(match?(words[match[1].toLowerCase()]||Number(match[1])):null);
  return {styles:STYLES.filter(([, ,re])=>re.test(text)).map(([id])=>id),tier:count>=4?'4-plus':count?String(count):null,tierCount:count};
}
function matchesTier(p,tier){const counts=[weddingMeta(p).tierCount,...p.variants.map(v=>v.tiers).filter(Boolean)];return counts.some(count=>tier==='6-plus'?count>=6:tier==='4-plus'?count>=4:String(count)===tier);}
module.exports={STYLES,TIERS,weddingMeta,matchesTier};
