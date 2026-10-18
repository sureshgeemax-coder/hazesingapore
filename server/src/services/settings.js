import { persistSettings, readStoredSettings } from './workbook.js';

const settings = {
  alertThreshold: 90,
  recipientEmails: [],
  emailEnabled: false,
  monitoringMethod: 'direction',
  monitoredDirection: 'east',
  monitoredPlaceId: 'pasir-ris',
  monitoredMrtLineId: 'purple',
  monitoredStationId: 'sengkang',
  refreshIntervalMinutes: 10,
  aqiStandard: 'US EPA AQI (as reported by WAQI)',
  alertCooldownMinutes: 360,
  escalationStep: 20,
  lastAlertTime: '',
  lastAlertStatus: 'No alert attempted'
};

try {
  const stored = await readStoredSettings();
  for (const key of Object.keys(settings)) {
    if (stored[key] === undefined) continue;
    if (key === 'recipientEmails') settings[key] = JSON.parse(stored[key] || '[]');
    else if (typeof settings[key] === 'boolean') settings[key] = stored[key] === true || stored[key] === 'true';
    else if (typeof settings[key] === 'number') settings[key] = Number(stored[key]);
    else settings[key] = stored[key];
  }
} catch (error) {
  console.warn(`Settings could not be loaded from Excel: ${error.message}`);
}

export function getSettings({ sensitive = false } = {}) {
  return { ...settings, recipientEmails: sensitive ? [...settings.recipientEmails] : settings.recipientEmails.map((email) => email.replace(/(^.).*(@.*$)/, '$1***$2')) };
}

export async function updateSettings(next) {
  Object.assign(settings, next);
  await persistSettings(settings);
  return getSettings({ sensitive: true });
}

export function configuredSelectionKey(current = settings) {
  return current.monitoringMethod === 'mrt' ? `station:${current.monitoredStationId}` : `place:${current.monitoredPlaceId}`;
}
