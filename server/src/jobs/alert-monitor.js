import { getPlace, getStation, getLine } from '../services/locations.js';
import { resolveCoordinates } from '../integrations/onemap.js';
import { getCurrentAqi } from '../services/aqi.js';
import { getSettings } from '../services/settings.js';

let timer;

export function startAlertMonitor() {
  const run = async () => {
    const settings = getSettings({ sensitive: true });
    try {
      if (settings.emailEnabled && settings.recipientEmails.length) {
        const location = settings.monitoringMethod === 'mrt' ? getStation(settings.monitoredStationId) : getPlace(settings.monitoredPlaceId);
        const resolved = await resolveCoordinates(location);
        const mrtLine = settings.monitoringMethod === 'mrt' ? getLine(settings.monitoredMrtLineId).shortName : null;
        await getCurrentAqi(resolved, { method: settings.monitoringMethod, mrtLine }, true);
      }
    } catch (error) { console.error(`Scheduled alert check failed: ${error.message}`); }
    const next = Math.max(5, getSettings({ sensitive: true }).refreshIntervalMinutes) * 60_000;
    timer = setTimeout(run, next); timer.unref?.();
  };
  timer = setTimeout(run, 1000); timer.unref?.();
  return () => clearTimeout(timer);
}
