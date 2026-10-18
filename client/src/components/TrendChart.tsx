import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { HistoryItem } from '../types';

export function TrendChart({ history }: { history: HistoryItem[] }) {
  if (!history.length) return <div className="empty"><strong>No historical readings available</strong><span>History appears after valid readings for this location have been stored.</span></div>;
  const data = history.map((item) => ({ ...item, label: new Date(item.timestamp).toLocaleDateString('en-SG', { day: '2-digit', month: 'short' }) }));
  return <div className="chart" aria-label="Air quality pollutant trend chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#d8e0df" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="aqi" name="AQI / PSI" stroke="#cf543b" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#177f84" dot={false} /><Line type="monotone" dataKey="pm10" name="PM10" stroke="#d29b2b" dot={false} /></LineChart></ResponsiveContainer></div>;
}
