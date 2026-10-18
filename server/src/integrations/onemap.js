import { AppError } from '../utils/errors.js';

const cache = new Map();

export async function resolveCoordinates(location) {
  if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) return location;
  const key = location.searchName || location.name;
  if (cache.has(key)) return { ...location, ...cache.get(key) };
  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(key)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`OneMap HTTP ${response.status}`);
    const payload = await response.json();
    const result = payload.results?.find((item) => Number.isFinite(Number(item.LATITUDE)) && Number.isFinite(Number(item.LONGITUDE)));
    if (!result) throw new Error('No geocoded result');
    const coordinates = { latitude: Number(result.LATITUDE), longitude: Number(result.LONGITUDE), geocodedAddress: result.ADDRESS, coordinateSource: 'Singapore OneMap' };
    cache.set(key, coordinates);
    return { ...location, ...coordinates };
  } catch (error) {
    throw new AppError(502, 'LOCATION_UNAVAILABLE', `Verified coordinates are unavailable for ${location.name}.`, error.message);
  }
}
