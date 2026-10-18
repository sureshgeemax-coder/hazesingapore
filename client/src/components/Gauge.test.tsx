import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Gauge } from './Gauge';
import type { Reading } from '../types';

const reading = { aqi: 110, standard: 'US EPA AQI', category: { label: 'Unhealthy for Sensitive Groups', color: '#ef7b32', explanation: 'Sensitive groups may be affected.', guidance: 'Limit exertion.' }, freshness: { stale: false } } as Reading;
describe('AQI gauge', () => {
  it('shows text in addition to category colour', () => { render(<Gauge reading={reading} />); expect(screen.getByText('110')).toBeInTheDocument(); expect(screen.getByText('Unhealthy for Sensitive Groups')).toBeInTheDocument(); });
  it('renders an unavailable state without fake values', () => { render(<Gauge reading={null} />); expect(screen.getByText('Unavailable')).toBeInTheDocument(); expect(screen.getByText('—')).toBeInTheDocument(); });
});
