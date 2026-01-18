import { defineConfig } from '@playwright/test';

let baseURL = 'http://localhost:3000';
if (process.env.CI === 'true') {
  if (process.env.STAGE === 'stg') {
    baseURL = 'https://stg.myapp.com';
  } else if (process.env.STAGE === 'prod') {
    baseURL = 'https://myapp.com';
  }
}

export default defineConfig({
  testDir: '../../apps/web/tests',
  use: {
    baseURL,
    // ...他の設定があればここに
  },
}); 