import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../services/api';
import type { AlertHistoryItem, AlertSettings, Location, SelectionMethod } from '../types';

interface Props { settings: AlertSettings | null; activeMethod: SelectionMethod; activeLocation: Location | null; activeLineId?: string; onSaved: (settings: AlertSettings) => void }

export function SettingsPanel({ settings, activeMethod, activeLocation, activeLineId, onSaved }: Props) {
  const [threshold, setThreshold] = useState(90);
  const [recipient, setRecipient] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [refresh, setRefresh] = useState(10);
  const [cooldown, setCooldown] = useState(360);
  const [escalation, setEscalation] = useState(20);
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [adminKey, setAdminKey] = useState('');
  const [status, setStatus] = useState('Loading protected settings…');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedKey = window.localStorage.getItem('haze-admin-key') || '';
    setAdminKey(savedKey);
  }, []);

  useEffect(() => {
    if (!adminKey) {
      setHistory([]);
      setStatus('Enter your administrative API key to manage email alerts in production.');
      return;
    }
    if (typeof window !== 'undefined') window.localStorage.setItem('haze-admin-key', adminKey);
    Promise.all([api.alertSettings(adminKey), api.alertHistory(adminKey)])
      .then(([config, attempts]) => {
        const data = config.data;
        onSaved(data);
        setThreshold(data.alertThreshold);
        setRecipient(data.recipientEmails[0] || '');
        setEnabled(data.emailEnabled);
        setRefresh(data.refreshIntervalMinutes);
        setCooldown(data.alertCooldownMinutes);
        setEscalation(data.escalationStep);
        setHistory(attempts.data);
        setStatus('Protected alert settings loaded successfully.');
      })
      .catch((error) => {
        setHistory([]);
        setStatus(message(error));
      });
  }, [adminKey, onSaved]);

  useEffect(() => { if (!settings) return; setThreshold(settings.alertThreshold ?? 90); setEnabled(settings.emailEnabled); setRefresh(settings.refreshIntervalMinutes); setCooldown(settings.alertCooldownMinutes); setEscalation(settings.escalationStep); }, [settings]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!adminKey) { setStatus('Enter your administrative API key before saving alert settings.'); return; }
    if (!activeLocation) { setStatus('Choose a dashboard location before saving an alert.'); return; }
    setStatus('Saving alert settings…');
    try {
      const payload = { monitoringMethod: activeMethod, monitoredDirection: activeLocation.direction, monitoredPlaceId: activeLocation.type === 'place' ? activeLocation.id : settings?.monitoredPlaceId || 'pasir-ris', monitoredMrtLineId: activeLocation.type === 'station' ? activeLineId : settings?.monitoredMrtLineId || 'purple', monitoredStationId: activeLocation.type === 'station' ? activeLocation.id : settings?.monitoredStationId || 'sengkang', alertThreshold: Number(threshold), recipientEmail: recipient, emailEnabled: enabled, refreshIntervalMinutes: Number(refresh), alertCooldownMinutes: Number(cooldown), escalationStep: Number(escalation) };
      const result = await api.saveAlertSettings(payload, adminKey); onSaved(result.data); setStatus(`Alert settings saved for ${activeLocation.name}. Backend monitoring is active while the server runs.`);
    } catch (error) { setStatus(message(error)); }
  }
  async function testEmail() {
    if (!adminKey) { setStatus('Enter your administrative API key before sending a test email.'); return; }
    setStatus('Sending configuration test…');
    try {
      const result = await api.testEmail(recipient, adminKey);
      setStatus(result.data.result);
      setHistory((await api.alertHistory(adminKey)).data);
    } catch (error) { setStatus(message(error)); }
  }
  async function exportFile() {
    if (!adminKey) { setStatus('Enter your administrative API key before exporting Excel.'); return; }
    setStatus('Preparing Excel export…');
    try { await api.exportWorkbook(adminKey); setStatus('Workbook downloaded.'); } catch (error) { setStatus(message(error)); }
  }

  const methodLabel = activeMethod === 'mrt' ? 'MRT Line and Station' : 'Singapore Direction and Place';
  return <section className="panel alert-settings" id="email-alert-settings">
    <div className="panel-title"><span>Automatically follows active selection</span><h2>Email Alert Settings</h2></div>
    <div className="auto-monitor-target"><div><span>Monitoring method</span><strong>{methodLabel}</strong></div><div><span>Configured location</span><strong>{activeLocation?.name || 'Choose a location above'}</strong><small>{activeLocation ? `${activeLocation.direction} Singapore${activeLocation.type === 'station' ? ` · ${activeLocation.codes?.join(' / ')}` : ''}` : ''}</small></div></div>
    <form onSubmit={save}><div className="settings-grid">
      <label>Administrative API key<input type="password" value={adminKey} placeholder="Enter ADMIN_KEY" autoComplete="current-password" onChange={(event) => setAdminKey(event.target.value.trim())} /><small>Stored in this browser only so protected alert actions can call the backend in production.</small></label>
      <label>AQI / PSI alert threshold<input type="number" min="0" max="500" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /><small>Strict rule: reading must be greater than {threshold} on the displayed provider scale.</small></label>
      <label>Recipient email<input type="email" value={recipient} placeholder="user@example.com" onChange={(event) => setRecipient(event.target.value)} required /></label>
      <label>Refresh interval (minutes)<input type="number" min="5" value={refresh} onChange={(event) => setRefresh(Number(event.target.value))} /></label>
      <label>Cooldown (minutes)<input type="number" min="15" value={cooldown} onChange={(event) => setCooldown(Number(event.target.value))} /></label>
      <label>Escalation increase<input type="number" min="1" value={escalation} onChange={(event) => setEscalation(Number(event.target.value))} /></label>
      <label className="check"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Enable Email Alert</label>
    </div><div className="settings-actions"><button type="submit">Save Alert Settings</button><button type="button" className="secondary" onClick={testEmail}>Send Test Email</button><button type="button" className="secondary" onClick={exportFile}>Export Excel</button><span role="status">{status}</span></div></form>
    <div className="alert-state"><span>Last alert</span><strong>{settings?.lastAlertTime ? new Date(settings.lastAlertTime).toLocaleString('en-SG') : 'No alert attempted'}</strong><small>{settings?.lastAlertStatus}</small></div>
    <div className="alert-history"><h3>Alert History</h3>{history.length ? <div className="table-wrap"><table><thead><tr><th>Time</th><th>Location</th><th>Reading / threshold</th><th>Status</th><th>Episode</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{item.timestamp ? new Date(item.timestamp).toLocaleString('en-SG') : '—'}</td><td>{item.location}<small>{item.selectionMethod}</small></td><td>{item.aqi ?? 'Test'} / {item.threshold ?? '—'}</td><td>{item.status}<small>{item.error || item.result}</small></td><td><code>{item.episodeId || '—'}</code></td></tr>)}</tbody></table></div> : <div className="empty compact-empty">No alert attempts have been recorded.</div>}</div>
  </section>;
}

function message(error: unknown) { return error instanceof Error ? error.message : 'The operation failed.'; }
