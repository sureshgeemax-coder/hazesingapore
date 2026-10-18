export const AQI_STANDARD = 'US EPA AQI (as reported by WAQI)';
export const AQI_CLASSIFICATION_SOURCE = 'https://aqicn.org/api/';

const categories = [
  { max: 50, key: 'good', label: 'Good', color: '#169873', explanation: 'Air quality is satisfactory and pollution poses little or no risk.', guidance: 'Normal outdoor activities are appropriate.' },
  { max: 100, key: 'moderate', label: 'Moderate', color: '#e9a820', explanation: 'Air quality is acceptable, although unusually sensitive people may experience symptoms.', guidance: 'Unusually sensitive people should consider reducing prolonged outdoor exertion.' },
  { max: 150, key: 'sensitive', label: 'Unhealthy for Sensitive Groups', color: '#ef7b32', explanation: 'Sensitive groups may experience health effects; the general public is less likely to be affected.', guidance: 'Children, older adults, and people with heart or respiratory conditions should limit prolonged outdoor exertion.' },
  { max: 200, key: 'unhealthy', label: 'Unhealthy', color: '#d94141', explanation: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.', guidance: 'Sensitive groups should avoid prolonged outdoor exertion. Everyone else should reduce it.' },
  { max: 300, key: 'very-unhealthy', label: 'Very Unhealthy', color: '#8546a8', explanation: 'Health alert: the risk of health effects is increased for everyone.', guidance: 'Avoid prolonged outdoor exertion. Sensitive groups should remain indoors where possible.' },
  { max: Infinity, key: 'hazardous', label: 'Hazardous', color: '#781f39', explanation: 'Health warning of emergency conditions; everyone is more likely to be affected.', guidance: 'Everyone should avoid outdoor exertion and follow official public-health advice.' }
];

export function classifyAqi(value) {
  if (!Number.isFinite(Number(value)) || Number(value) < 0) return null;
  return categories.find((category) => Number(value) <= category.max);
}

const psiCategories = [
  { max: 50, key: 'good', label: 'Good', color: '#169873', explanation: 'Air quality is in the Good range under Singapore NEA 24-hour PSI.', guidance: 'Normal activities may continue.' },
  { max: 100, key: 'moderate', label: 'Moderate', color: '#e9a820', explanation: 'Air quality is in the Moderate range under Singapore NEA 24-hour PSI.', guidance: 'Normal activities may continue. People who feel unwell should reduce strenuous activity.' },
  { max: 200, key: 'unhealthy', label: 'Unhealthy', color: '#d94141', explanation: 'Air quality is in the Unhealthy range under Singapore NEA 24-hour PSI.', guidance: 'Reduce prolonged or strenuous outdoor activity. Children, older adults, and people with heart or lung conditions should take extra care.' },
  { max: 300, key: 'very-unhealthy', label: 'Very Unhealthy', color: '#8546a8', explanation: 'Air quality is in the Very Unhealthy range under Singapore NEA 24-hour PSI.', guidance: 'Minimise outdoor activity. Vulnerable people should avoid strenuous outdoor activity.' },
  { max: Infinity, key: 'hazardous', label: 'Hazardous', color: '#781f39', explanation: 'Air quality is in the Hazardous range under Singapore NEA 24-hour PSI.', guidance: 'Avoid outdoor activity and follow current NEA and Ministry of Health advice.' }
];

export function classifyPsi(value) {
  if (!Number.isFinite(Number(value)) || Number(value) < 0) return null;
  return psiCategories.find((category) => Number(value) <= category.max);
}

export function freshness(timestamp, staleMinutes = 180, now = Date.now()) {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return { status: 'unknown', stale: true, ageMinutes: null };
  const ageMinutes = Math.max(0, Math.round((now - parsed) / 60000));
  return { status: ageMinutes > staleMinutes ? 'stale' : 'current', stale: ageMinutes > staleMinutes, ageMinutes };
}
