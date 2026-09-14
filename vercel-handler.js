'use strict';
const {makeServer}=require('./server');
const {loadCatalog}=require('./lib/load-catalog');
const config=require('./store.config.json');

// Vercel supplies the HTTP listener; export the existing request handler.
const server=makeServer({catalog:loadCatalog(),config});
module.exports=server.listeners('request')[0];
