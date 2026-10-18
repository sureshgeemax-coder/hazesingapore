import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env.js';
import { fetchNearestStation } from './waqi.js';

describe('WAQI integration', () => {
  afterEach(() => { vi.unstubAllGlobals(); env.waqiToken = ''; });
  it('retries a transient failure and accepts a valid response', async () => {
    env.waqiToken = 'test';
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'ok', data: { aqi: 42, idx: 1 } }) });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchNearestStation(1.1, 103.1, { force: true });
    expect(result.aqi).toBe(42); expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('rejects invalid provider data', async () => {
    env.waqiToken = 'test'; vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'error', data: 'Unknown station' }) }));
    await expect(fetchNearestStation(1.2, 103.2, { force: true })).rejects.toMatchObject({ code: 'INVALID_PROVIDER_RESPONSE' });
  });
});
