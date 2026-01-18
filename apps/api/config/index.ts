import { developmentConfig } from './development';

const env = process.env.NODE_ENV || 'development';

export const config = {
  development: developmentConfig,
  production: developmentConfig, // TODO: Create production config
  staging: developmentConfig, // TODO: Create staging config
  test: developmentConfig, // TODO: Create test config
}[env] || developmentConfig;

export default config; 