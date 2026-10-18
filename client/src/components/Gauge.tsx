import type { CSSProperties } from 'react';
import type { Reading } from '../types';

export function Gauge({ reading }: { reading: Reading | null }) {
  const value = reading?.aqi;
  const pct = value == null ? 0 : Math.min(100, value / 3);
  const color = reading?.category?.color || '#809397';
  const style = { '--status': color, '--progress': `${pct * 3.6}deg` } as CSSProperties;
  return <section className="gauge-card" style={style}>
    <div className="gauge"><div className="gauge-inner"><span>{reading?.standard.includes('PSI') ? 'PSI' : 'AQI'}</span><strong>{value ?? '—'}</strong><small>{reading?.category?.label || 'Unavailable'}</small></div></div>
    <div className="guidance"><div className="eyebrow">Health guidance</div><h2>{reading?.category?.explanation || 'No verified live reading is currently available.'}</h2><p>{reading?.category?.guidance || 'Try refreshing later.'}</p>{reading?.freshness?.stale && <div className="warning">This reading is stale ({reading.freshness.ageMinutes} minutes old). Alerts are suppressed.</div>}</div>
  </section>;
}
