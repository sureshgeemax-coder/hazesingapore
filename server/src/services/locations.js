import { directionRules, mrtLines, mrtStations, places } from '../config/geography.js';
import { AppError } from '../utils/errors.js';

export const directions = [
  { id: 'east', name: 'East Singapore' },
  { id: 'west', name: 'West Singapore' },
  { id: 'north', name: 'North Singapore' },
  { id: 'south', name: 'South Singapore' }
];

export function listStations(direction) {
  return direction ? mrtStations.filter((station) => station.direction === direction) : mrtStations;
}

export function getStation(id, direction) {
  const station = mrtStations.find((item) => item.id === id && (!direction || item.direction === direction));
  if (!station) throw new AppError(404, 'STATION_NOT_FOUND', 'The requested MRT station is not configured for this direction.');
  return station;
}

export function listLines() { return mrtLines; }
export function getLine(id) {
  const line = mrtLines.find((item) => item.id === id);
  if (!line) throw new AppError(404, 'LINE_NOT_FOUND', 'The requested MRT line is not configured.');
  return line;
}
export function listStationsByLine(lineId) {
  const selectedLine = getLine(lineId);
  return selectedLine.stations.map(({ code, name }) => {
    const station = getStation(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    return { ...station, selectedCode: code, selectedLine: { id: selectedLine.id, name: selectedLine.shortName, color: selectedLine.color } };
  });
}
export function listPlaces(direction) { return direction ? places.filter((item) => item.direction === direction) : places; }
export function getPlace(id) {
  const place = places.find((item) => item.id === id);
  if (!place) throw new AppError(404, 'PLACE_NOT_FOUND', 'The requested Singapore place is not configured.');
  return place;
}
export function getLocation({ placeId, stationId }) { return placeId ? getPlace(placeId) : getStation(stationId); }
export { directionRules };
export default mrtStations;
