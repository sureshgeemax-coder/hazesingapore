import { useEffect, useState } from 'react';
import { api } from './services/api';
import { AirMap } from './components/AirMap';
import { TrendChart } from './components/TrendChart';
import { Gauge } from './components/Gauge';
import { SettingsPanel } from './components/SettingsPanel';
import type { AlertSettings, Direction, HistoryItem, Location, MrtLine, Reading, SelectionMethod } from './types';

const fmt = (value?: string) => value ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Singapore' }).format(new Date(value)) : 'Unavailable';
const pollutant = (value: number | null | undefined) => value == null ? 'Unavailable' : value;

export function App() {
  const [directions, setDirections] = useState<Direction[]>([]);
  const [places, setPlaces] = useState<Location[]>([]);
  const [lines, setLines] = useState<MrtLine[]>([]);
  const [stations, setStations] = useState<Location[]>([]);
  const [activeMethod, setActiveMethod] = useState<SelectionMethod>('direction');
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [lineId, setLineId] = useState('purple');
  const [stationId, setStationId] = useState('');
  const [direction, setDirection] = useState('east');
  const [directionPlaceId, setDirectionPlaceId] = useState('pasir-ris');
  const [reading, setReading] = useState<Reading | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.directions(), api.places(), api.lines(), api.publicSettings()]).then(([directionData, placeData, lineData, settingsData]) => {
      setDirections(directionData.data); setPlaces(placeData.data); setLines(lineData.data); setSettings(settingsData.data);
      setActiveLocation(placeData.data.find((place) => place.id === 'pasir-ris') || placeData.data[0]);
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.stationsByLine(lineId).then(({ data }) => { setStations(data); const next = data.find((station) => station.id === stationId) || data[0]; setStationId(next?.id || ''); if (activeMethod === 'mrt' && next) setActiveLocation(next); }).catch((reason: Error) => setError(reason.message));
  }, [lineId]);

  useEffect(() => {
    if (!activeLocation) return;
    let current = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const selectedLine = activeMethod === 'mrt' ? lineId : undefined;
        const [live, past] = await Promise.all([api.current(activeMethod, activeLocation, selectedLine), api.history(activeLocation.id)]);
        if (current) { setReading(live.data); setHistory(past.data); }
      } catch (reason) { if (current) { setReading(null); setHistory([]); setError(reason instanceof Error ? reason.message : 'AQI data unavailable for this location'); } }
      finally { if (current) setLoading(false); }
    };
    load();
    const interval = setInterval(load, (settings?.refreshIntervalMinutes || 10) * 60_000);
    return () => { current = false; clearInterval(interval); };
  }, [activeLocation?.id, activeMethod, lineId, settings?.refreshIntervalMinutes]);

  async function refresh() {
    if (!activeLocation) return;
    setLoading(true); setError('');
    try { const live = await api.current(activeMethod, activeLocation, activeMethod === 'mrt' ? lineId : undefined, true); setReading(live.data); setHistory((await api.history(activeLocation.id)).data); }
    catch (reason) { setReading(null); setError(reason instanceof Error ? reason.message : 'AQI data unavailable for this location'); }
    finally { setLoading(false); }
  }
  function activate(method: SelectionMethod, location?: Location) { if (!location) return; setActiveMethod(method); setActiveLocation(location); setReading(null); setError(''); }
  const directionPlaces = places.filter((place) => place.direction === direction);
  const selectedLine = lines.find((line) => line.id === lineId);
  const activeMethodLabel = activeMethod === 'mrt' ? 'MRT Line and Station' : 'Singapore Direction and Place';

  return <div className="app-shell">
    <header className="header"><div className="brand"><div className="logo">SG</div><div><span className="kicker">Live environmental intelligence</span><h1>Singapore Haze &amp; Air Quality Monitor</h1><p>Verified AQI and PSI references across Singapore</p></div></div><div className="credit"><div className="avatar" aria-label="Replaceable profile photo placeholder">GS</div><div><strong>G Sureshkumar</strong><span>Designed and Implemented by</span></div></div></header>
    <main>
      <section className="selection-section">
        <div className="selection-heading"><div><span>Choose one method</span><h2>Find air quality by MRT line or Singapore location</h2></div><div className="active-pill">Active: {activeMethodLabel}</div></div>
        <div className="selection-options">
          <article className={`selection-card ${activeMethod === 'mrt' ? 'active' : ''}`}><div className="option-no">A</div><h3>Choose MRT Line</h3><p>Select an operational line and one of its official stations.</p><label>Choose MRT Line<select value={lineId} onChange={(event) => { setActiveMethod('mrt'); setLineId(event.target.value); }}>{lines.map((line) => <option key={line.id} value={line.id}>{line.name}</option>)}</select></label><label>Choose MRT Station<select value={stationId} onChange={(event) => { const station = stations.find((item) => item.id === event.target.value); setStationId(event.target.value); activate('mrt', station); }}>{stations.map((station) => <option key={station.id} value={station.id}>{station.name} ({station.selectedCode})</option>)}</select></label></article>
          <article className={`selection-card ${activeMethod === 'direction' ? 'active' : ''}`}><div className="option-no">B</div><h3>Choose Singapore Location</h3><p>Choose a direction, then select a maintained neighbourhood, town or landmark.</p><label>Choose Singapore Direction<select value={direction} onChange={(event) => { const nextDirection = event.target.value; const next = places.find((place) => place.direction === nextDirection); setDirection(nextDirection); setDirectionPlaceId(next?.id || ''); activate('direction', next); }}>{directions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Choose Place<select value={directionPlaceId} onChange={(event) => { const place = places.find((item) => item.id === event.target.value); setDirectionPlaceId(event.target.value); activate('direction', place); }}>{directionPlaces.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label></article>
        </div>
        <div className="selection-footer"><div><span>Active search method</span><strong>{activeMethodLabel}</strong></div><div><span>Selected location</span><strong>{activeLocation?.name || 'Choose a location'} {activeLocation?.type === 'station' ? `(${activeLocation.selectedCode || activeLocation.codes?.join(' / ')})` : ''}</strong></div><button className="refresh" onClick={refresh} disabled={loading || !activeLocation}>{loading ? 'Refreshing…' : 'Refresh verified reading'}</button><div className="updated"><span>Source reading</span><strong>{fmt(reading?.sourceTimestamp)}</strong></div></div>
      </section>
      {error && <div className="error" role="alert"><strong>AQI data unavailable for this location.</strong> {error} No value has been invented.</div>}
      <section className="location-strip"><div><span>Selected location</span><strong>{activeLocation?.name || '—'}{activeLocation?.type === 'station' ? ' MRT' : ''}</strong><small>{activeLocation ? `${activeLocation.direction[0].toUpperCase()}${activeLocation.direction.slice(1)} Singapore` : '—'}{activeMethod === 'mrt' ? ` · ${selectedLine?.shortName}` : ''}</small></div><div><span>Actual monitoring station or regional reference</span><strong>{reading?.monitoringStation?.name || 'Unavailable'}</strong><small>{reading?.relationshipNotice || 'Awaiting a verified provider response.'}</small></div></section>
      <section className="stats"><Stat label="Current index" value={reading?.aqi ?? '—'} detail={reading?.standard || 'AQI / PSI unavailable'} /><Stat label="Air quality status" value={reading?.category?.label || 'Unavailable'} detail={reading?.freshness?.status || 'No current status'} color={reading?.category?.color} /><Stat label="PM2.5" value={pollutant(reading?.pollutants?.pm25)} detail={reading?.pollutantUnits?.pm25 || 'Unavailable'} /><Stat label="PM10" value={pollutant(reading?.pollutants?.pm10)} detail={reading?.pollutantUnits?.pm10 || 'Unavailable'} /><Stat label="Retrieved" value={fmt(reading?.retrievedAt)} detail={reading?.cache === 'hit' ? 'Short live cache' : 'Fetched from provider'} compact /><Stat label="Email alert" value={settings?.emailEnabled ? 'Enabled' : 'Disabled'} detail={`Strictly above ${settings?.alertThreshold ?? 90}`} compact /></section>
      <Gauge reading={reading} />
      <section className="grid-two"><article className="panel"><PanelTitle eyebrow="Geographic context" title="Selected location and data reference" />{activeLocation ? <AirMap location={activeLocation} reading={reading} /> : <div className="empty">Choose a location to update the map.</div>}</article><article className="panel"><PanelTitle eyebrow="Verified history" title="Air quality trend" /><TrendChart history={history} /></article></section>
      <SettingsPanel settings={settings} activeMethod={activeMethod} activeLocation={activeLocation} activeLineId={activeMethod === 'mrt' ? lineId : undefined} onSaved={setSettings} />
      <section className="panel methodology"><PanelTitle eyebrow="Transparency" title="Data source and methodology" /><div className="method-grid"><Method title="Provider" text={reading ? `${reading.provider}. The direct source and timestamps are retained.` : 'WAQI when configured; otherwise Singapore NEA via Data.gov.sg.'} link={reading?.sourceUrl || 'https://data.gov.sg/datasets/d_fe37906a0182569d891506e815e819b7/view'} /><Method title="Location relationship" text={reading?.relationshipNotice || 'A selected place or MRT is never described as an air-quality sensor.'} /><Method title="Index standard" text={reading?.standard === 'Singapore NEA 24-hour PSI' ? 'Singapore NEA 24-hour PSI is displayed. PSI and US AQI are not interchangeable.' : 'US EPA AQI is displayed when supplied by WAQI.'} link={reading?.classificationSource || 'https://www.haze.gov.sg/'} /><Method title="Region rules" text="North covers northern and north-east towns; east follows the Changi/eastern corridor; west covers Jurong and the western corridor; downtown, central and waterfront locations are grouped as south. These are product groupings, not official planning boundaries." /></div><div className="source-row"><span>Refresh: {settings?.refreshIntervalMinutes || 10} minutes</span><span>Reading time: {fmt(reading?.sourceTimestamp)}</span><a href={reading?.sourceUrl || 'https://data.gov.sg/'} target="_blank" rel="noreferrer">Direct source ↗</a></div></section>
    </main><footer><span>Singapore Haze &amp; Air Quality Monitor</span><span>Designed and Implemented by G Sureshkumar</span><span>Map © OpenStreetMap contributors</span></footer>
  </div>;
}

function Stat({ label, value, detail, color, compact }: { label: string; value: string | number; detail: string; color?: string; compact?: boolean }) { return <article className={`stat ${compact ? 'compact' : ''}`}><span>{label}</span><strong style={color ? { color } : undefined}>{value}</strong><small>{detail}</small></article>; }
function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="panel-title"><span>{eyebrow}</span><h2>{title}</h2></div>; }
function Method({ title, text, link }: { title: string; text: string; link?: string }) { return <div><h3>{title}</h3><p>{text}</p>{link && <a href={link} target="_blank" rel="noreferrer">View source ↗</a>}</div>; }
