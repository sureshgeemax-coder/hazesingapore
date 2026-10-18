import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const cache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchNearestStation(latitude, longitude, options = {}) {
  if (!env.waqiToken) throw new AppError(503, 'PROVIDER_NOT_CONFIGURED', 'Live AQI is unavailable until WAQI_API_TOKEN is configured on the server.');
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = cache.get(key);
  if (!options.force && cached && cached.expires > Date.now()) return { ...cached.value, cache: 'hit' };

  const url = `${env.waqiBaseUrl}/feed/geo:${latitude};${longitude}/?token=${encodeURIComponent(env.waqiToken)}`;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } });
      if (response.status === 429) throw new AppError(429, 'PROVIDER_RATE_LIMIT', 'The AQI provider rate limit was reached. Please retry later.');
      if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.status !== 'ok' || !payload.data || !Number.isFinite(Number(payload.data.aqi))) {
        throw new AppError(502, 'INVALID_PROVIDER_RESPONSE', typeof payload.data === 'string' ? payload.data : 'The AQI provider returned no valid current reading.');
      }
      cache.set(key, { value: payload.data, expires: Date.now() + env.cacheSeconds * 1000 });
      return { ...payload.data, cache: 'miss' };
    } catch (error) {
      lastError = error;
      if (error instanceof AppError || attempt === 1) break;
      await sleep(200);
    }
  }
  if (lastError instanceof AppError) throw lastError;
  throw new AppError(502, 'PROVIDER_UNAVAILABLE', 'The live AQI provider did not respond in time.', lastError?.message);
}
