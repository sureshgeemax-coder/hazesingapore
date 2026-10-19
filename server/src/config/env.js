import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(configDir, '..', '..');

// Load the server-local .env file explicitly so workspace/root launches still pick it up.
dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config();

const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const defaultFrom = (user) => user ? `Singapore Haze Monitor <${user}>` : '';

export const env = {
  port: number(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  waqiToken: process.env.WAQI_API_TOKEN || '',
  waqiBaseUrl: process.env.WAQI_API_BASE_URL || 'https://api.waqi.info',
  archivingAuthorized: process.env.WAQI_ARCHIVING_AUTHORIZED === 'true',
  cacheSeconds: number(process.env.AQI_CACHE_SECONDS, 300),
  staleMinutes: number(process.env.DATA_STALE_MINUTES, 180),
  adminApiKey: process.env.ADMIN_KEY || process.env.ADMIN_API_KEY || '',
  localAdminAutoAuth: process.env.LOCAL_ADMIN_AUTO_AUTH ? process.env.LOCAL_ADMIN_AUTO_AUTH === 'true' : process.env.NODE_ENV !== 'production',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: number(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || defaultFrom(process.env.SMTP_USER || '')
  }
};
