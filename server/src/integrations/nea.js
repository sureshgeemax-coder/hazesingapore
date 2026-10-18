import { AppError } from '../utils/errors.js';

const URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';
let cache;

export async function fetchRegionalPsi(region, options = {}) {
  if (!options.force && cache?.expires > Date.now()) return { ...normalise(cache.payload, region), cache: 'hit' };
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(URL, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } });
      if (response.status === 429) throw new AppError(429, 'PROVIDER_RATE_LIMIT', 'The Data.gov.sg public API rate limit was reached. Please retry later.');
      if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.code !== 0 || !payload.data?.items?.length) throw new AppError(502, 'INVALID_PROVIDER_RESPONSE', 'NEA returned no valid current PSI reading.');
      cache = { payload, expires: Date.now() + 5 * 60_000 };
      return { ...normalise(payload, region), cache: 'miss' };
    } catch (error) {
      lastError = error;
      if (error instanceof AppError || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  if (lastError instanceof AppError) throw lastError;
  throw new AppError(502, 'PROVIDER_UNAVAILABLE', 'The Singapore government air-quality service did not respond in time.', lastError?.message);
}

function normalise(payload, region) {
  const item = payload.data.items[0];
  const metadata = payload.data.regionMetadata.find((entry) => entry.name.toLowerCase() === region);
  const get = (name) => Number.isFinite(Number(item.readings?.[name]?.[region])) ? Number(item.readings[name][region]) : null;
  const psi = get('psi_twenty_four_hourly');
  if (!Number.isFinite(psi)) throw new AppError(502, 'INVALID_PROVIDER_RESPONSE', `NEA returned no current PSI reading for the ${region} region.`);
  return {
    psi,
    region,
    timestamp: item.timestamp,
    updatedTimestamp: item.updatedTimestamp,
    coordinates: metadata?.labelLocation || null,
    pollutants: {
      pm25: get('pm25_twenty_four_hourly'),
      pm10: get('pm10_twenty_four_hourly'),
      no2: get('no2_one_hour_max'),
      o3: get('o3_eight_hour_max'),
      co: get('co_eight_hour_max'),
      so2: get('so2_twenty_four_hourly')
    }
  };
}
