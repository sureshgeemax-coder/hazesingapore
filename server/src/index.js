import { app } from './app.js';
import { env } from './config/env.js';
import { startAlertMonitor } from './jobs/alert-monitor.js';

app.listen(env.port, () => console.log(`Singapore Haze Monitor API listening on http://localhost:${env.port}`));
startAlertMonitor();
