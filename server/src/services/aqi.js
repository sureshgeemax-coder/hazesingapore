import { fetchNearestStation } from '../integrations/waqi.js';
import { fetchRegionalPsi } from '../integrations/nea.js';
import { AQI_STANDARD, AQI_CLASSIFICATION_SOURCE, classifyAqi, classifyPsi, freshness } from '../utils/aqi.js';
import { env } from '../config/env.js';
import { appendReading } from './workbook.js';
import { processAlert } from './alerts.js';

const value = (entry) => Number.isFinite(Number(entry?.v)) ? Number(entry.v) : null;

export async function getCurrentAqi(location, selection = {}, force = false) {
  if (!env.waqiToken) return getRegionalNeaReading(location, selection, force);
  const data = await fetchNearestStation(location.latitude, location.longitude, { force });
  const aqi = Number(data.aqi);
  const sourceTimestamp = data.time?.iso || (data.time?.s && data.time?.tz ? `${data.time.s.replace(' ', 'T')}${data.time.tz}` : data.time?.s);
  const category = classifyAqi(aqi);
  const reading = {
    selectedLocation: { ...location, selectedPlace: location.name, selectionMethod: selection.method || (location.type === 'station' ? 'mrt' : 'place'), selectedMrtLine: selection.mrtLine || null },
    selectionKey: `${location.type}:${location.id}`,
    relationship: 'associated-nearest-station',
    relationshipNotice: 'This AQI is supplied by the nearest station returned by WAQI for the selected MRT coordinates; it is not asserted to be measured at the MRT station.',
    aqi, category, standard: AQI_STANDARD, classificationSource: AQI_CLASSIFICATION_SOURCE,
    pollutants: { pm25: value(data.iaqi?.pm25), pm10: value(data.iaqi?.pm10), no2: value(data.iaqi?.no2), o3: value(data.iaqi?.o3), co: value(data.iaqi?.co), so2: value(data.iaqi?.so2) },
    pollutantUnits: { pm25: 'AQI sub-index', pm10: 'AQI sub-index', no2: 'AQI sub-index', o3: 'AQI sub-index', co: 'AQI sub-index', so2: 'AQI sub-index' },
    dominantPollutant: data.dominentpol || null,
    monitoringStation: { id: data.idx, name: data.city?.name || 'Unnamed monitoring station', latitude: data.city?.geo?.[0] ?? null, longitude: data.city?.geo?.[1] ?? null },
    sourceTimestamp, retrievedAt: new Date().toISOString(), freshness: freshness(sourceTimestamp, env.staleMinutes),
    sourceUrl: data.city?.url || 'https://aqicn.org/city/singapore/', provider: 'World Air Quality Index Project (WAQI)',
    attributions: data.attributions || [], cache: data.cache, storage: null, alert: null
  };
  const recordId = `${location.type}:${location.id}:${data.idx}:${sourceTimestamp}`;
  reading.storage = await appendReading({ recordId, selectionKey: reading.selectionKey, values: historyValues(recordId, reading, location, selection) });
  reading.alert = await processAlert(reading, location);
  return reading;
}

async function getRegionalNeaReading(location, selection, force) {
  const data = await fetchRegionalPsi(location.direction, { force });
  const aqi = data.psi;
  const category = classifyPsi(aqi);
  const sourceTimestamp = data.timestamp || data.updatedTimestamp;
  const regionName = `${location.direction[0].toUpperCase()}${location.direction.slice(1)} Singapore`;
  const reading = {
    selectedLocation: { ...location, selectedPlace: location.name, selectionMethod: selection.method || (location.type === 'station' ? 'mrt' : 'place'), selectedMrtLine: selection.mrtLine || null },
    selectionKey: `${location.type}:${location.id}`,
    relationship: 'associated-regional-reading',
    relationshipNotice: `This is NEA's regional 24-hour PSI for ${regionName}; it is not a measurement at the selected place or MRT station.`,
    aqi,
    category,
    standard: 'Singapore NEA 24-hour PSI',
    classificationSource: 'https://www.haze.gov.sg/',
    pollutants: data.pollutants,
    pollutantUnits: { pm25: 'µg/m³ (24-hour)', pm10: 'µg/m³ (24-hour)', no2: 'µg/m³ (1-hour max)', o3: 'µg/m³ (8-hour max)', co: 'mg/m³ (8-hour max)', so2: 'µg/m³ (24-hour)' },
    dominantPollutant: null,
    monitoringStation: { id: `nea-${location.direction}`, name: `NEA ${regionName} regional reading`, latitude: data.coordinates?.latitude ?? null, longitude: data.coordinates?.longitude ?? null },
    sourceTimestamp,
    retrievedAt: new Date().toISOString(),
    freshness: freshness(sourceTimestamp, env.staleMinutes),
    sourceUrl: 'https://data.gov.sg/datasets/d_fe37906a0182569d891506e815e819b7/view',
    provider: 'Singapore National Environment Agency via Data.gov.sg',
    attributions: [{ name: 'National Environment Agency', url: 'https://www.nea.gov.sg/' }, { name: 'Data.gov.sg', url: 'https://data.gov.sg/' }],
    cache: data.cache,
    storage: null,
    alert: null
  };
  const recordId = `${location.type}:${location.id}:nea-${location.direction}:${sourceTimestamp}`;
  reading.storage = await appendReading({ storageAuthorized: true, recordId, selectionKey: reading.selectionKey, values: historyValues(recordId, reading, location, selection) });
  reading.alert = await processAlert(reading, location);
  return reading;
}

function historyValues(recordId, reading, location, selection) {
  return {
    'Record ID': recordId, 'Date and time': new Date().toISOString(), 'Selection method': reading.selectedLocation.selectionMethod,
    'Singapore direction': location.direction, 'Place name': location.type === 'place' ? location.name : '', 'MRT line': selection.mrtLine || '',
    'MRT station': location.type === 'station' ? location.name : '', 'MRT station code': location.codes?.join(', ') || '', Latitude: location.latitude,
    Longitude: location.longitude, 'Actual AQI monitoring station': reading.monitoringStation.name, 'AQI value': reading.aqi, 'AQI standard': reading.standard,
    'AQI category': reading.category.label, 'PM2.5': reading.pollutants.pm25, 'PM10': reading.pollutants.pm10, 'Other pollutants': JSON.stringify(reading.pollutants),
    'Health guidance': reading.category.guidance, 'Source website': reading.sourceUrl, 'Source data timestamp': reading.sourceTimestamp,
    'Data retrieval timestamp': reading.retrievedAt, 'Data freshness status': reading.freshness.status
  };
}
