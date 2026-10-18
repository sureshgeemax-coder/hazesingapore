import { describe, expect, it } from 'vitest';
import { classifyAqi, classifyPsi, freshness } from './aqi.js';

describe('US EPA AQI classification', () => {
  it.each([[0,'Good'],[50,'Good'],[51,'Moderate'],[100,'Moderate'],[101,'Unhealthy for Sensitive Groups'],[150,'Unhealthy for Sensitive Groups'],[151,'Unhealthy'],[200,'Unhealthy'],[201,'Very Unhealthy'],[300,'Very Unhealthy'],[301,'Hazardous']])('classifies %i as %s', (value, label) => expect(classifyAqi(value).label).toBe(label));
  it('rejects missing and invalid readings', () => { expect(classifyAqi(undefined)).toBeNull(); expect(classifyAqi(-1)).toBeNull(); });
});

describe('Singapore NEA PSI classification', () => {
  it.each([[50,'Good'],[51,'Moderate'],[100,'Moderate'],[101,'Unhealthy'],[200,'Unhealthy'],[201,'Very Unhealthy'],[300,'Very Unhealthy'],[301,'Hazardous']])('classifies %i as %s', (value, label) => expect(classifyPsi(value).label).toBe(label));
});

describe('freshness', () => {
  it('marks an old reading stale', () => expect(freshness('2026-01-01T00:00:00Z', 180, Date.parse('2026-01-01T04:00:00Z')).stale).toBe(true));
  it('marks invalid timestamps unknown', () => expect(freshness('not-a-date').status).toBe('unknown'));
});
