const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', testMatch: '**/*.spec.js', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:43189', channel: 'msedge', headless: true, screenshot: 'only-on-failure' },
  globalSetup: require.resolve('./tests/global-setup.js'),
  reporter: 'list'
});
