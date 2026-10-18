import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { configuredSelectionKey, getSettings, updateSettings } from './settings.js';
import { appendAlert } from './workbook.js';
import { AppError } from '../utils/errors.js';

const episodes = new Map();

function smtpTransport() {
  if (!(env.smtp.host && env.smtp.user && env.smtp.password && env.smtp.from)) throw new AppError(503, 'SMTP_NOT_CONFIGURED', 'SMTP is not fully configured on the server.');
  return nodemailer.createTransport({ host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure, auth: { user: env.smtp.user, pass: env.smtp.password }, disableFileAccess: true, disableUrlAccess: true });
}

export function evaluateAlert(reading, _location, now = Date.now()) {
  const settings = getSettings({ sensitive: true });
  const expectedKey = configuredSelectionKey(settings);
  if (reading.selectionKey !== expectedKey) return { triggered: false, reason: 'This reading is unrelated to the configured alert location.' };
  if (!settings.emailEnabled || !settings.recipientEmails.length) return { triggered: false, reason: 'Email alerts are disabled or have no recipient.' };
  if (reading.freshness.stale || !Number.isFinite(reading.aqi)) return { triggered: false, reason: 'The reading is missing or stale.' };
  const current = episodes.get(expectedKey);
  if (reading.aqi <= settings.alertThreshold) {
    if (current?.active) episodes.set(expectedKey, { ...current, active: false, endedAt: now });
    return { triggered: false, reason: `The reading has not exceeded ${settings.alertThreshold}.` };
  }
  if (!current?.active) {
    const episode = { id: crypto.randomUUID(), active: true, startedAt: now, lastAttemptAt: 0, lastNotifiedAqi: null, peakAqi: reading.aqi };
    episodes.set(expectedKey, episode);
    return { triggered: true, reason: 'threshold-crossing', settings, episode };
  }
  current.peakAqi = Math.max(current.peakAqi, reading.aqi);
  const cooldownElapsed = now - current.lastAttemptAt >= settings.alertCooldownMinutes * 60_000;
  const escalation = current.lastNotifiedAqi != null && reading.aqi >= current.lastNotifiedAqi + settings.escalationStep;
  if (cooldownElapsed && escalation) return { triggered: true, reason: 'escalation', settings, episode: current };
  return { triggered: false, reason: 'An alert episode is active; duplicate notification suppressed.', episode: current };
}

export async function processAlert(reading, location) {
  const evaluation = evaluateAlert(reading, location);
  if (!evaluation.triggered) return { ...evaluation, episodeId: evaluation.episode?.id };
  const { settings, episode } = evaluation;
  episode.lastAttemptAt = Date.now();
  let status = 'failed'; let result = ''; let errorMessage = '';
  try {
    const info = await smtpTransport().sendMail({
      from: env.smtp.from, to: settings.recipientEmails[0],
      subject: `Singapore Air Quality Alert - ${location.name} - ${reading.standard} ${reading.aqi}`,
      text: `Air Quality Alert: The latest valid reading associated with ${location.name} is above your configured threshold.\n\nSelection method: ${settings.monitoringMethod}\nSelected location: ${location.name}\nActual data reference: ${reading.monitoringStation.name}\nReading: ${reading.aqi} (${reading.category.label}; ${reading.standard})\nConfigured threshold: greater than ${settings.alertThreshold}\nPM2.5: ${reading.pollutants.pm25 ?? 'Unavailable'} ${reading.pollutantUnits.pm25}\nPM10: ${reading.pollutants.pm10 ?? 'Unavailable'} ${reading.pollutantUnits.pm10}\nPrecautions: ${reading.category.guidance}\nReading time: ${reading.sourceTimestamp}\nSource: ${reading.sourceUrl}\nEpisode: ${episode.id}\n\nSingapore Haze & Air Quality Monitor\nDesigned and Implemented by G Sureshkumar`
    });
    if (!info.accepted?.length) throw new Error('The SMTP service did not accept the configured recipient.');
    status = 'accepted'; result = `Accepted for ${info.accepted[0]}.`; episode.lastNotifiedAqi = reading.aqi;
  } catch (error) { errorMessage = error.message; }
  const triggerTime = new Date().toISOString();
  await appendAlert({ 'Alert ID': crypto.randomUUID(), Location: location.name, 'Selection method': settings.monitoringMethod, 'Configured threshold': settings.alertThreshold, 'AQI reading': reading.aqi, 'Recipient email': settings.recipientEmails[0], 'Alert trigger time': triggerTime, 'Email sending status': status, 'Error details': errorMessage, 'Alert episode identifier': episode.id, 'Email delivery result': result });
  await updateSettings({ lastAlertTime: triggerTime, lastAlertStatus: status === 'accepted' ? result : `Failed: ${errorMessage}` });
  return { triggered: true, reason: evaluation.reason, status, result, error: errorMessage || undefined, episodeId: episode.id };
}

export async function sendTestEmail(recipient) {
  let status = 'failed'; let result = ''; let errorMessage = '';
  try {
    const info = await smtpTransport().sendMail({ from: env.smtp.from, to: recipient, subject: 'Singapore Air Quality Monitor - Test Email', text: 'This is a configuration test only. It does not represent an AQI or PSI threshold breach.\n\nDesigned and Implemented by G Sureshkumar' });
    if (!info.accepted?.length) throw new Error('The SMTP service did not accept the test recipient.');
    status = 'accepted'; result = `Test accepted for ${info.accepted[0]}.`;
  } catch (error) { errorMessage = error.message; }
  const triggerTime = new Date().toISOString();
  await appendAlert({ 'Alert ID': crypto.randomUUID(), Location: 'SMTP configuration test', 'Selection method': 'test-email', 'Configured threshold': null, 'AQI reading': null, 'Recipient email': recipient, 'Alert trigger time': triggerTime, 'Email sending status': status, 'Error details': errorMessage, 'Alert episode identifier': `test-${crypto.randomUUID()}`, 'Email delivery result': result });
  if (status !== 'accepted') throw new AppError(502, 'EMAIL_SEND_FAILED', errorMessage);
  return { status, result, timestamp: triggerTime };
}

export function getEpisodeState() { return Object.fromEntries([...episodes.entries()].map(([key, value]) => [key, { ...value }])); }
export function resetEpisodeState() { episodes.clear(); }
