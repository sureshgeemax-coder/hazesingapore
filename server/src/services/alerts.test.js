import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn(() => ({ sendMail: vi.fn(async () => ({ accepted: ['air@example.com'] })) })) } }));
import { evaluateAlert, processAlert, resetEpisodeState, sendTestEmail } from './alerts.js';
import { updateSettings } from './settings.js';
import { env } from '../config/env.js';

const station = { id: 'pasir-ris', name: 'Pasir Ris' };
const reading = { selectionKey: 'place:pasir-ris', aqi: 91, freshness: { stale: false } };

describe('alert evaluation', () => {
  beforeEach(async () => { resetEpisodeState(); await updateSettings({ monitoringMethod: 'place', monitoredPlaceId: 'pasir-ris', emailEnabled: true, recipientEmails: ['air@example.com'], alertThreshold: 90, alertCooldownMinutes: 60, escalationStep: 20 }); });
  afterEach(() => { Object.assign(env.smtp, { host: '', user: '', password: '', from: '' }); });
  it('uses a strict greater-than threshold', () => { expect(evaluateAlert({ ...reading, aqi: 90 }, station).triggered).toBe(false); expect(evaluateAlert(reading, station).triggered).toBe(true); });
  it('rejects unrelated and stale readings', () => { expect(evaluateAlert({ ...reading, selectionKey: 'place:tampines' }, station).triggered).toBe(false); expect(evaluateAlert({ ...reading, freshness: { stale: true } }, station).triggered).toBe(false); });
  it('suppresses duplicates in an active episode', () => { expect(evaluateAlert(reading, station).triggered).toBe(true); expect(evaluateAlert({ ...reading, aqi: 100 }, station).triggered).toBe(false); });
  it('reports missing SMTP configuration for test email', async () => { await expect(sendTestEmail('air@example.com')).rejects.toMatchObject({ code: 'EMAIL_SEND_FAILED' }); });
  it('allows escalation only after a delivered episode alert and cooldown', async () => {
    Object.assign(env.smtp, { host: 'smtp.example.com', user: 'user', password: 'secret', from: 'alerts@example.com' });
    const fullReading = { ...reading, category: { label: 'Moderate', guidance: 'Take care' }, standard: 'AQI', monitoringStation: { name: 'Reference' }, pollutants: { pm25: 20, pm10: 30 }, pollutantUnits: { pm25: 'sub-index', pm10: 'sub-index' }, sourceTimestamp: '2026-10-18T00:00:00Z', sourceUrl: 'https://example.com' };
    const sent = await processAlert(fullReading, station); expect(sent.status).toBe('accepted');
    expect(evaluateAlert({ ...fullReading, aqi: 110 }, station, Date.now() + 61 * 60_000).triggered).toBe(false);
    expect(evaluateAlert({ ...fullReading, aqi: 111 }, station, Date.now() + 61 * 60_000).reason).toBe('escalation');
  });
});
