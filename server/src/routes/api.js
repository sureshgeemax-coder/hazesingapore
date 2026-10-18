import { Router } from 'express';
import { z } from 'zod';
import { directions, directionRules, getLine, getPlace, getStation, listLines, listPlaces, listStations, listStationsByLine } from '../services/locations.js';
import { slug } from '../config/geography.js';
import { resolveCoordinates } from '../integrations/onemap.js';
import { getCurrentAqi } from '../services/aqi.js';
import { getHistory, getAlertHistory, ensureWorkbook, workbookPath } from '../services/workbook.js';
import { getSettings, updateSettings } from '../services/settings.js';
import { sendTestEmail } from '../services/alerts.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncRoute, AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

const router = Router();
const directionSchema = z.enum(['east', 'west', 'north', 'south']);
const stationIdSchema = z.string().regex(/^[a-z0-9-]+$/).max(80);
const lineSchema = z.enum(['purple', 'brown', 'green', 'red', 'blue', 'orange']);
const methodSchema = z.enum(['place', 'mrt', 'direction']);
const emailSchema = z.string().email();
const settingsSchema = z.object({
  alertThreshold: z.number().int().min(0).max(500).optional(),
  recipientEmails: z.array(emailSchema).max(10).optional(),
  emailEnabled: z.boolean().optional(),
  refreshIntervalMinutes: z.number().int().min(5).max(1440).optional(),
  alertCooldownMinutes: z.number().int().min(15).max(10080).optional(),
  escalationStep: z.number().int().min(10).max(200).optional()
}).strict();
const alertSettingsSchema = z.object({
  monitoringMethod: methodSchema,
  monitoredDirection: directionSchema.optional(),
  monitoredPlaceId: stationIdSchema.optional(),
  monitoredMrtLineId: lineSchema.optional(),
  monitoredStationId: stationIdSchema.optional(),
  alertThreshold: z.number().int().min(0).max(500).default(90),
  recipientEmail: emailSchema,
  emailEnabled: z.boolean(),
  refreshIntervalMinutes: z.number().int().min(5).max(1440),
  alertCooldownMinutes: z.number().int().min(15).max(10080),
  escalationStep: z.number().int().min(1).max(200)
}).strict();

function parse(schema, value, label) {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(400, 'INVALID_INPUT', `Invalid ${label}.`, result.error.flatten());
  return result.data;
}

router.get('/health', (_req, res) => res.json({ status: 'ok', providerConfigured: true, provider: env.waqiToken ? 'WAQI' : 'NEA/Data.gov.sg fallback', waqiConfigured: Boolean(env.waqiToken), archivingAuthorized: env.archivingAuthorized }));
router.get('/directions', (_req, res) => res.json({ data: directions }));
router.get('/mrt-lines', (_req, res) => res.json({ data: listLines() }));
router.get('/mrt-stations', (req, res) => { const line = req.query.line ? parse(lineSchema, req.query.line, 'MRT line') : undefined; const direction = req.query.direction ? parse(directionSchema, req.query.direction, 'direction') : undefined; res.json({ data: line ? listStationsByLine(line) : listStations(direction) }); });
router.get('/places', (req, res) => {
  const direction = req.query.direction ? parse(directionSchema, req.query.direction, 'direction') : undefined;
  const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const data = listPlaces(direction).filter((place) => !query || place.name.toLowerCase().includes(query));
  res.json({ data, directionRules, message: query && !data.length ? 'No recognised Singapore place matched your search.' : undefined });
});
router.get('/map/locations', (req, res) => { const direction = req.query.direction ? parse(directionSchema, req.query.direction, 'direction') : undefined; res.json({ data: listStations(direction).map((s) => ({ ...s, measurementStatus: 'No station-specific AQI asserted' })) }); });
router.get('/aqi/current', asyncRoute(async (req, res) => {
  if (!req.query.place && !req.query.station) throw new AppError(400, 'LOCATION_REQUIRED', 'Choose either a place or an MRT station.');
  if (req.query.place && req.query.station) throw new AppError(400, 'CONFLICTING_LOCATION', 'Choose a place or an MRT station, not both.');
  const method = req.query.method ? parse(methodSchema, req.query.method, 'selection method') : req.query.station ? 'mrt' : 'place';
  const location = req.query.place ? getPlace(slug(String(req.query.place))) : getStation(slug(String(req.query.station)));
  if (req.query.direction && parse(directionSchema, req.query.direction, 'direction') !== location.direction) throw new AppError(400, 'DIRECTION_MISMATCH', 'The selected location does not belong to this configured direction.');
  let mrtLine;
  if (req.query.line) {
    const line = getLine(parse(lineSchema, req.query.line, 'MRT line'));
    if (!location.lines?.some((item) => item.id === line.id)) throw new AppError(400, 'LINE_MISMATCH', 'The selected station does not belong to this MRT line.');
    mrtLine = line.shortName;
  }
  const resolvedLocation = await resolveCoordinates(location);
  const data = await getCurrentAqi(resolvedLocation, { method, mrtLine }, req.query.refresh === 'true');
  res.set('Cache-Control', 'no-store').json({ data });
}));
router.get('/aqi/all-stations', (req, res) => { const direction = req.query.direction ? parse(directionSchema, req.query.direction, 'direction') : undefined; res.json({ data: listStations(direction).map((s) => ({ station: s, aqi: null, status: 'not-fetched', notice: 'Use the current-reading endpoint for a verified nearest-station reading.' })) }); });
router.get('/aqi/history', asyncRoute(async (req, res) => { const station = req.query.station ? parse(stationIdSchema, req.query.station, 'station') : undefined; const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100)); res.json({ data: await getHistory(station, limit), archivingAuthorized: env.archivingAuthorized }); }));
router.get('/aqi/summary', asyncRoute(async (req, res) => { const station = req.query.station ? parse(stationIdSchema, req.query.station, 'station') : undefined; const history = await getHistory(station, 500); const values = history.map((r) => Number(r.aqi)).filter(Number.isFinite); res.json({ data: values.length ? { count: values.length, high: Math.max(...values), low: Math.min(...values), average: Math.round(values.reduce((a,b) => a+b,0) / values.length) } : null }); }));
router.get('/settings', (_req, res) => res.json({ data: getSettings(), protectedFields: ['recipientEmails'] }));
router.put('/settings', requireAdmin, asyncRoute(async (req, res) => res.json({ data: await updateSettings(parse(settingsSchema, req.body, 'settings')) })));
router.get('/alerts/settings', requireAdmin, (_req, res) => res.json({ data: getSettings({ sensitive: true }) }));
router.put('/alerts/settings', requireAdmin, asyncRoute(async (req, res) => {
  const input = parse(alertSettingsSchema, req.body, 'alert settings');
  let location;
  if (input.monitoringMethod === 'mrt') {
    if (!input.monitoredMrtLineId || !input.monitoredStationId) throw new AppError(400, 'ALERT_LOCATION_REQUIRED', 'Choose an MRT line and station for this monitoring method.');
    location = getStation(input.monitoredStationId);
    if (!location.lines.some((line) => line.id === input.monitoredMrtLineId)) throw new AppError(400, 'LINE_MISMATCH', 'The alert station does not belong to the selected MRT line.');
  } else {
    if (!input.monitoredPlaceId) throw new AppError(400, 'ALERT_LOCATION_REQUIRED', 'Choose a place for this monitoring method.');
    location = getPlace(input.monitoredPlaceId);
    if (input.monitoringMethod === 'direction' && input.monitoredDirection !== location.direction) throw new AppError(400, 'DIRECTION_MISMATCH', 'The alert place does not belong to the selected direction.');
  }
  const { recipientEmail, ...values } = input;
  const data = await updateSettings({ ...values, recipientEmails: [recipientEmail] });
  res.json({ data, location: { id: location.id, name: location.name, direction: location.direction } });
}));
router.get('/alerts/history', requireAdmin, asyncRoute(async (req, res) => res.json({ data: await getAlertHistory(Math.min(500, Math.max(1, Number(req.query.limit) || 100))) })));
router.post('/alerts/test-email', requireAdmin, asyncRoute(async (req, res) => { const recipient = parse(emailSchema, req.body?.recipientEmail, 'recipient email'); res.json({ data: await sendTestEmail(recipient) }); }));
router.post('/alerts/test', requireAdmin, asyncRoute(async (req, res) => { const recipient = parse(emailSchema, req.body?.recipientEmail, 'recipient email'); res.json({ data: await sendTestEmail(recipient) }); }));
router.get('/export/excel', requireAdmin, asyncRoute(async (_req, res) => { await ensureWorkbook(); res.download(workbookPath, 'singapore-aqi-history.xlsx'); }));

export default router;
