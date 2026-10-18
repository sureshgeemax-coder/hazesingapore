import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Location } from './types';

const { mockApi } = vi.hoisted(() => {
  const places = [{ id: 'pasir-ris', name: 'Pasir Ris', direction: 'east', type: 'place' }, { id: 'tampines', name: 'Tampines', direction: 'east', type: 'place' }, { id: 'jurong-east', name: 'Jurong East', direction: 'west', type: 'place' }];
  const stations = [{ id: 'sengkang', name: 'Sengkang', direction: 'north', type: 'station', codes: ['NE16'], selectedCode: 'NE16', lines: [{ id: 'purple', name: 'NEL', color: '#9900aa' }] }];
  return { mockApi: {
    directions: vi.fn(async () => ({ data: [{ id: 'east', name: 'East Singapore' }, { id: 'west', name: 'West Singapore' }] })), places: vi.fn(async () => ({ data: places })), lines: vi.fn(async () => ({ data: [{ id: 'purple', name: 'Purple Line - North East Line', shortName: 'NEL', color: '#9900aa', stations: [] }] })), stationsByLine: vi.fn(async () => ({ data: stations })), publicSettings: vi.fn(async () => ({ data: { alertThreshold: 90, recipientEmails: [], emailEnabled: false, monitoringMethod: 'direction', monitoredDirection: 'east', monitoredPlaceId: 'pasir-ris', monitoredMrtLineId: 'purple', monitoredStationId: 'sengkang', refreshIntervalMinutes: 10, alertCooldownMinutes: 360, escalationStep: 20, lastAlertTime: '', lastAlertStatus: '' } })),
    current: vi.fn(async (method: string, location: { id: string; type: string; name: string }) => ({ data: { selectionKey: `${location.type}:${location.id}`, selectedLocation: { ...location, selectionMethod: method, latitude: 1.35, longitude: 103.8 }, aqi: 80, standard: 'Singapore NEA 24-hour PSI', category: { label: 'Moderate', color: '#e9a820', explanation: 'Moderate', guidance: 'Take care' }, freshness: { status: 'current', stale: false, ageMinutes: 10 }, pollutants: {}, pollutantUnits: {}, monitoringStation: { id: 'nea', name: 'NEA regional reading', latitude: 1.35, longitude: 103.8 }, sourceTimestamp: '2026-10-18T22:00:00+08:00', retrievedAt: '2026-10-18T22:05:00+08:00', sourceUrl: 'https://data.gov.sg', provider: 'NEA', relationshipNotice: 'Regional reading', cache: 'miss', alert: { triggered: false } } })), history: vi.fn(async () => ({ data: [] }))
  } };
});
vi.mock('./services/api', () => ({ api: mockApi }));
vi.mock('./components/AirMap', () => ({ AirMap: ({ location }: { location: Location }) => <div data-testid="map-location">{location.name}</div> }));
vi.mock('./components/TrendChart', () => ({ TrendChart: () => <div /> }));
vi.mock('./components/SettingsPanel', () => ({ SettingsPanel: () => <div>Email Alert Settings</div> }));

import { App } from './App';

describe('independent selection workflows', () => {
  beforeEach(() => vi.clearAllMocks());
  it('switches MRT and direction workflows without retaining conflicts', async () => {
    render(<App />);
    await screen.findByText('Active: Singapore Direction and Place');
    expect(screen.queryByRole('heading', { name: 'Find a Place' })).not.toBeInTheDocument();

    const mrtCard = screen.getByRole('heading', { name: 'Choose MRT Line' }).closest('article')!;
    await waitFor(() => expect(within(mrtCard).getByLabelText('Choose MRT Station')).not.toBeDisabled());
    fireEvent.change(within(mrtCard).getByLabelText('Choose MRT Station'), { target: { value: 'sengkang' } });
    await waitFor(() => expect(screen.getByText('Active: MRT Line and Station')).toBeInTheDocument());
    expect(screen.getByTestId('map-location')).toHaveTextContent('Sengkang');

    const directionCard = screen.getByRole('heading', { name: 'Choose Singapore Location' }).closest('article')!;
    fireEvent.change(within(directionCard).getByLabelText('Choose Singapore Direction'), { target: { value: 'west' } });
    await waitFor(() => expect(screen.getByText('Active: Singapore Direction and Place')).toBeInTheDocument());
    expect(screen.getByTestId('map-location')).toHaveTextContent('Jurong East');
  });
});
