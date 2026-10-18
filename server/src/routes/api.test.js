import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { env } from '../config/env.js';

describe('location API validation', () => {
  afterEach(() => { env.adminApiKey = ''; env.localAdminAutoAuth = true; });
  it('returns east stations', async () => { const response = await request(app).get('/api/mrt-stations?direction=east'); expect(response.status).toBe(200); expect(response.body.data.some((station) => station.id === 'pasir-ris')).toBe(true); });
  it('rejects an invalid direction', async () => { const response = await request(app).get('/api/mrt-stations?direction=middle'); expect(response.status).toBe(400); expect(response.body.error.code).toBe('INVALID_INPUT'); });
  it('reports the credential-free government fallback', async () => { const response = await request(app).get('/api/health'); expect(response.status).toBe(200); expect(response.body.providerConfigured).toBe(true); expect(response.body.provider).toMatch(/NEA|WAQI/); });
  it('protects sensitive settings when local auto-auth is disabled', async () => { env.localAdminAutoAuth = false; const response = await request(app).put('/api/settings').send({ alertThreshold: 120 }); expect([401,503]).toContain(response.status); });
  it('searches places without returning station records', async () => { const response = await request(app).get('/api/places?q=katong'); expect(response.status).toBe(200); expect(response.body.data.map((place) => place.name)).toEqual(expect.arrayContaining(['Katong'])); expect(response.body.data.every((place) => place.type === 'place')).toBe(true); });
  it('returns ordered stations for an MRT line', async () => { const response = await request(app).get('/api/mrt-stations?line=purple'); expect(response.status).toBe(200); expect(response.body.data[0]).toMatchObject({ name: 'HarbourFront', selectedCode: 'NE1' }); expect(response.body.data.at(-1)).toMatchObject({ name: 'Punggol Coast', selectedCode: 'NE18' }); });
  it('rejects conflicting current-location inputs', async () => { const response = await request(app).get('/api/aqi/current?place=pasir-ris&station=sengkang'); expect(response.status).toBe(400); expect(response.body.error.code).toBe('CONFLICTING_LOCATION'); });
  it('authenticates and validates location-specific alert settings', async () => {
    env.localAdminAutoAuth = false; env.adminApiKey = 'test-admin';
    const response = await request(app).put('/api/alerts/settings').set('x-admin-key','test-admin').send({ monitoringMethod:'direction', monitoredDirection:'east', monitoredPlaceId:'pasir-ris', monitoredMrtLineId:'purple', monitoredStationId:'sengkang', alertThreshold:90, recipientEmail:'person@example.com', emailEnabled:true, refreshIntervalMinutes:10, alertCooldownMinutes:60, escalationStep:20 });
    expect(response.status).toBe(200); expect(response.body.data.alertThreshold).toBe(90); expect(response.body.location.name).toBe('Pasir Ris');
  });
});
