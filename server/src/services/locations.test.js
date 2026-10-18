import { describe, expect, it } from 'vitest';
import { getStation, listLines, listPlaces, listStations, listStationsByLine } from './locations.js';

describe('MRT location configuration', () => {
  it('filters by direction', () => expect(listStations('east').every((station) => station.direction === 'east')).toBe(true));
  it('represents an interchange once with all lines', () => {
    const tampines = getStation('tampines');
    expect(tampines.codes).toEqual(['EW2','DT32']);
    expect(tampines.lines.map((line) => line.id)).toEqual(['green','blue']);
    expect(listStations().filter((station) => station.id === 'tampines')).toHaveLength(1);
  });
  it('contains complete operational line sequences', () => {
    expect(Object.fromEntries(listLines().map((line) => [line.id, line.stations.length]))).toEqual({ purple: 17, brown: 27, green: 35, red: 27, blue: 35, orange: 33 });
    expect(listStationsByLine('purple').map((station) => station.selectedCode)).toEqual(['NE1','NE3','NE4','NE5','NE6','NE7','NE8','NE9','NE10','NE11','NE12','NE13','NE14','NE15','NE16','NE17','NE18']);
    expect(listStationsByLine('purple').some((station) => station.name === 'Kallang')).toBe(false);
  });
  it('keeps places separate and filters by direction', () => {
    expect(listPlaces('east').every((place) => place.direction === 'east' && place.type === 'place')).toBe(true);
    expect(listPlaces().find((place) => place.id === 'pasir-ris')?.name).toBe('Pasir Ris');
  });
});
