import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Reading } from '../types';

vi.mock('react-leaflet', () => ({ MapContainer: ({ children, ...props }: { children: ReactNode; 'aria-label'?: string }) => <div aria-label={props['aria-label']}>{children}</div>, TileLayer: () => null, CircleMarker: ({ children }: { children: ReactNode }) => <div data-testid="marker">{children}</div>, Popup: ({ children }: { children: ReactNode }) => <span>{children}</span>, Polyline: () => <div data-testid="connection" />, useMap: () => ({ flyTo: vi.fn() }) }));
import { AirMap } from './AirMap';

describe('map markers', () => {
  it('distinguishes the selected MRT from the actual monitor', () => {
    const reading = { aqi: 80, standard: 'US EPA AQI', sourceUrl: 'https://example.com', category: { label: 'Moderate', color: '#e9a820' }, sourceTimestamp: '2026-01-01T00:00:00+08:00', selectedLocation: { latitude: 1.37, longitude: 103.94 }, monitoringStation: { name: 'Real Station', latitude: 1.35, longitude: 103.9 } } as Reading;
    render(<AirMap location={{ id: 'pasir-ris', type: 'station', direction: 'east', name: 'Pasir Ris', latitude: 1.37, longitude: 103.94 }} reading={reading} />);
    expect(screen.getAllByTestId('marker')).toHaveLength(2); expect(screen.getByText(/Selected location, not asserted/)).toBeInTheDocument(); expect(screen.getByText(/Real Station/)).toBeInTheDocument();
  });
});
