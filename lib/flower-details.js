'use strict';
const records=require('../data/flower-details.json').products;
const FLOWERS=[['roses','Roses'],['peonies','Peonies'],['orchids','Orchids'],['gypsophila','Gypsophila'],['dahlias','Dahlias'],['lisianthus','Lisianthus'],['hydrangeas','Hydrangeas'],['ranunculus','Ranunculus'],['lavender','Lavender'],['sweet-peas','Sweet peas'],['magnolias','Magnolias'],['gerberas','Gerberas'],['mixed-blossoms','Mixed blossoms']];
const COMBINATIONS=[
 ['roses-peonies','Roses & peonies',['roses','peonies']],
 ['roses-hydrangeas','Roses & hydrangeas',['roses','hydrangeas']],
 ['roses-gypsophila','Roses & gypsophila',['roses','gypsophila']],
 ['roses-lisianthus','Roses & lisianthus',['roses','lisianthus']],
 ['roses-dahlias','Roses & dahlias',['roses','dahlias']],
 ['roses-lavender','Roses & lavender',['roses','lavender']],
 ['roses-ranunculus','Roses & ranunculus',['roses','ranunculus']],
 ['peonies-hydrangeas','Peonies & hydrangeas',['peonies','hydrangeas']]
];
function types(product){const record=records[product.id];return record?.verified?record.flowerTypes:[];}
function flowerFilters(){return [
 {key:'flower',label:'Flower type',items:FLOWERS.map(([id,label])=>({id,label,matches:p=>types(p).includes(id)}))},
 {key:'combination',label:'Flower combinations',items:COMBINATIONS.map(([id,label,flowers])=>({id,label,matches:p=>flowers.every(f=>types(p).includes(f))}))}
];}
module.exports={flowerFilters,FLOWERS,COMBINATIONS};
