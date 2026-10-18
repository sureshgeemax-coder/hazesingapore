import type { AlertHistoryItem, AlertSettings, Direction, HistoryItem, Location, MrtLine, Reading, SelectionMethod } from '../types';

type Payload<T> = { data: T; message?: string; directionRules?: string };
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Request failed (${response.status})`);
  return payload as T;
}
const admin = (key: string): HeadersInit => ({ 'content-type': 'application/json', 'x-admin-key': key });

export const api = {
  directions: () => request<Payload<Direction[]>>('/directions'),
  places: (direction?: string, query?: string) => request<Payload<Location[]>>(`/places?${new URLSearchParams({ ...(direction ? { direction } : {}), ...(query ? { q: query } : {}) })}`),
  lines: () => request<Payload<MrtLine[]>>('/mrt-lines'),
  stationsByLine: (line: string) => request<Payload<Location[]>>(`/mrt-stations?line=${encodeURIComponent(line)}`),
  current: (method: SelectionMethod, location: Location, line?: string, refresh = false) => {
    const params = new URLSearchParams({ method, [location.type === 'station' ? 'station' : 'place']: location.id });
    if (method === 'direction') params.set('direction', location.direction);
    if (line) params.set('line', line);
    if (refresh) params.set('refresh', 'true');
    return request<Payload<Reading>>(`/aqi/current?${params}`);
  },
  history: (id: string) => request<Payload<HistoryItem[]>>(`/aqi/history?station=${encodeURIComponent(id)}`),
  publicSettings: () => request<Payload<AlertSettings>>('/settings'),
  alertSettings: (key: string) => request<Payload<AlertSettings>>('/alerts/settings', { headers: admin(key) }),
  saveAlertSettings: (data: object, key: string) => request<Payload<AlertSettings>>('/alerts/settings', { method: 'PUT', headers: admin(key), body: JSON.stringify(data) }),
  alertHistory: (key: string) => request<Payload<AlertHistoryItem[]>>('/alerts/history', { headers: admin(key) }),
  testEmail: (recipientEmail: string, key: string) => request<Payload<{ status: string; result: string }>>('/alerts/test-email', { method: 'POST', headers: admin(key), body: JSON.stringify({ recipientEmail }) }),
  exportWorkbook: async (key: string) => {
    const response = await fetch('/api/export/excel', { headers: { 'x-admin-key': key } });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error?.message || 'Export failed.'); }
    const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'singapore-aqi-history.xlsx'; anchor.click(); URL.revokeObjectURL(url);
  }
};
