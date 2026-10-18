import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRegionalPsi } from './nea.js';

describe('NEA Data.gov.sg integration', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('selects the requested regional PSI and preserves concentration values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ code: 0, data: { regionMetadata: [{ name: 'east', labelLocation: { latitude: 1.35, longitude: 103.94 } }], items: [{ timestamp: '2026-10-18T22:00:00+08:00', readings: { psi_twenty_four_hourly: { east: 127 }, pm25_twenty_four_hourly: { east: 81 }, pm10_twenty_four_hourly: { east: 115 } } }] } }) }));
    const result = await fetchRegionalPsi('east', { force: true });
    expect(result.psi).toBe(127); expect(result.pollutants.pm25).toBe(81); expect(result.coordinates.longitude).toBe(103.94);
  });
});
