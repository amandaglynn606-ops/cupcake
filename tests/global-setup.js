const { makeServer } = require('../server');
const path = require('node:path');
module.exports = async () => {
  await require('../scripts/build-responsive-images.cjs').buildResponsiveImages();
  const server = makeServer({ catalog: require('../lib/load-catalog').loadCatalog(), orderDir: path.join(__dirname, '..', 'private', 'browser-test-orders'), enquiryDir: path.join(__dirname, '..', 'private', 'browser-test-enquiries'), config: require('../store.config.json') });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(43189, '127.0.0.1', resolve); });
  return async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  };
};
