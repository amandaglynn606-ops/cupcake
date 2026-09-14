'use strict';
function cart(ctx,path='/cart'){return require('./checkout').checkout(ctx,path);}
module.exports={cart};
