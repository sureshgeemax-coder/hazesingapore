import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Location, Reading } from '../types';
import 'leaflet/dist/leaflet.css';

function Focus({ center }: { center: LatLngExpression }) { const map = useMap(); map.flyTo(center, 12, { duration: 0.8 }); return null; }

export function AirMap({ location, reading }: { location: Location; reading: Reading | null }) {
  const selected: LatLngExpression = [reading?.selectedLocation.latitude ?? location.latitude ?? 1.3521, reading?.selectedLocation.longitude ?? location.longitude ?? 103.8198];
  const monitor: LatLngExpression | null = reading?.monitoringStation?.latitude != null && reading.monitoringStation.longitude != null ? [reading.monitoringStation.latitude, reading.monitoringStation.longitude] : null;
  const color = reading?.category?.color || '#70878c';
  return <div className="map-wrap">
    <MapContainer center={selected} zoom={12} scrollWheelZoom className="map" aria-label="Map of selected and monitoring locations">
      <Focus center={selected} />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={selected} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#0b6d77', fillOpacity: 1 }}><Popup><strong>{location.name}{location.type === 'station' ? ' MRT' : ''}</strong><br />Selected location, not asserted as an AQI sensor</Popup></CircleMarker>
      {monitor && reading && <><Polyline positions={[selected, monitor]} pathOptions={{ color: '#516a70', dashArray: '6 8' }} /><CircleMarker center={monitor} radius={12} pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }}><Popup><strong>{reading.monitoringStation.name}</strong><br />{reading.standard} {reading.aqi} · {reading.category.label}<br />{formatTime(reading.sourceTimestamp)}<br /><a href={reading.sourceUrl} target="_blank" rel="noreferrer">Source</a></Popup></CircleMarker></>}
    </MapContainer>
    <div className="legend"><span><i className="dot selected" /> Selected place or MRT</span><span><i className="dot monitor" style={{ background: color }} /> Actual data reference</span></div>
  </div>;
}

function formatTime(value?: string) { return value ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Singapore' }).format(new Date(value)) : 'Unavailable'; }
