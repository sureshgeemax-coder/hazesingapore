# Singapore Haze & Air Quality Monitor

A React + TypeScript and Node.js dashboard that associates a selected Singapore place or MRT station with verified air-quality data. It uses the World Air Quality Index (WAQI) geo-feed API when configured and automatically falls back to Singapore NEA regional PSI readings from Data.gov.sg. The UI always distinguishes a selected location from a monitoring station or regional aggregate.

## Features

- Two independent workflows: MRT line/station and direction-filtered Singapore location
- Ordered operational station lists for NEL, TEL, EWL, NSL, DTL, and CCL in `server/src/config/geography.js`
- Interchanges represented once internally with all codes and line colours, while each line preserves official order
- Coordinates resolved from Singapore OneMap instead of being guessed
- Server-side WAQI token with a credential-free official NEA/Data.gov.sg fallback, 8-second timeout, one retry, five-minute cache, error/rate-limit handling, and no fabricated readings
- US EPA AQI categories as reported by WAQI, with accessible text guidance and stale-reading detection
- PM2.5, PM10, NO2, O3, CO, and SO2 AQI sub-indices when supplied by WAQI
- Leaflet/OpenStreetMap map separating selected and measured locations
- AQI/PM trend chart with an honest empty state
- ExcelJS workbook with history, location, alert, and settings sheets
- Serialized writes and source-timestamp based duplicate prevention
- Nodemailer SMTP alerts with freshness checks, threshold, cooldown, escalation, and accepted-recipient verification
- Protected settings, alert history, and Excel export endpoints
- Responsive desktop, tablet, and mobile layout

The header uses a `GS` placeholder, not a generated portrait. Replace the `.avatar` content in `client/src/App.jsx` with a supplied photograph when one is available.

## Requirements

- Node.js 22 or newer
- An optional WAQI API token from <https://aqicn.org/data-platform/token/>. Without one, the official NEA/Data.gov.sg regional PSI feed is used.
- An SMTP account if email notifications are required
- Persistent writable storage for `server/data/` in production

## Local Setup

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Copy `server/.env.example` to `server/.env`. Configure an administration key; add WAQI if required:

   ```dotenv
   WAQI_API_TOKEN=
   ADMIN_KEY=a-long-random-secret
   ```

3. Start both applications:

   ```powershell
   npm.cmd run dev
   ```

4. Open <http://localhost:5173>. The API runs at <http://localhost:4000>.

For production:

```powershell
npm.cmd run build
$env:NODE_ENV="production"
npm.cmd start
```

Express then serves `client/dist` and the API from one process.

## WAQI Configuration and Terms

When configured, the backend calls:

```text
GET https://api.waqi.info/feed/geo:{latitude};{longitude}/?token=...
```

The token is never sent to React. The application records and displays WAQI's `city.name`, coordinates, source URL, originating attributions, AQI, pollutant sub-indices, and source timestamp.

Without a WAQI token, the backend calls the official public endpoint `https://api-open.data.gov.sg/v2/real-time/api/psi`. It selects the MRT direction's NEA region and displays Singapore 24-hour PSI, regional coordinates, pollutant concentrations, and timestamps. It explicitly labels these as regional aggregate readings rather than monitoring-station or MRT measurements. The endpoint is available without a key at the public rate limit and is documented at <https://guide.data.gov.sg/developer-guide/real-time-apis>.

WAQI's standard API terms require attribution and restrict cached/archived redistribution. Accordingly, Excel AQI history is disabled by default. Set the following only after confirming that the token/account/use case has permission to archive this data:

```dotenv
WAQI_ARCHIVING_AUTHORIZED=true
```

Without that permission, WAQI live readings still work but are not archived. NEA/Data.gov.sg readings can be stored under the Singapore Open Data Licence. Review the current WAQI terms at <https://aqicn.org/api/> before public deployment. Commercial WAQI use requires an appropriate agreement.

## AQI Standard

For WAQI, the dashboard labels the scale as **US EPA AQI (as reported by WAQI)** and uses the classifications documented on WAQI's API page:

| AQI | Category |
| --- | --- |
| 0-50 | Good |
| 51-100 | Moderate |
| 101-150 | Unhealthy for Sensitive Groups |
| 151-200 | Unhealthy |
| 201-300 | Very Unhealthy |
| 301+ | Hazardous |

WAQI `iaqi` pollutant fields are displayed as pollutant AQI sub-indices, not incorrectly labelled as mass concentrations.

For the NEA fallback, the dashboard uses **Singapore NEA 24-hour PSI** and its distinct bands: 0-50 Good, 51-100 Moderate, 101-200 Unhealthy, 201-300 Very Unhealthy, and above 300 Hazardous. NEA PM2.5 and PM10 fields are labelled as 24-hour concentrations in `µg/m³`. US AQI and Singapore PSI are never mixed or presented as the same scale.

## Email Alerts

Configure the SMTP variables in `server/.env`:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mailer@example.com
SMTP_PASSWORD=app-password
SMTP_FROM=Singapore Haze Monitor <mailer@example.com>
```

**Email Alert Settings** automatically follows the active dashboard location; it does not ask for an administrator key in the page. In local development, `LOCAL_ADMIN_AUTO_AUTH=true` permits protected actions only when the backend connection is loopback. Settings are validated and stored in the workbook.

For production, keep `LOCAL_ADMIN_AUTO_AUTH=false` and protect administrative API calls with `ADMIN_KEY` or an authenticated gateway. The key is never embedded in the React bundle. The dashboard’s automatic administrator controls are intended for the local loopback deployment unless an external authentication layer is installed.

The default threshold is `90`. Alerts use a strict `reading > threshold` comparison: 90 does not trigger and 91 does. A reading must match the configured place or station and must be current. Crossing above the threshold starts an episode; duplicate refreshes are suppressed, and a later email is allowed only after the cooldown and configured escalation increase. Returning to or below the threshold closes the episode. A backend scheduler performs checks while Express is running, so the browser need not remain open.

**Send Test Email** sends an explicitly labelled configuration test and never claims an AQI/PSI breach. SMTP acceptance is reported as acceptance, not inbox delivery. Every threshold and test attempt is appended to `Alert_History` with an episode identifier, delivery status, and any error.

## Excel Workbook

The workbook is created at `server/data/aqi-history.xlsx` and is ignored by Git. Writes are serialized in-process to prevent concurrent corruption. Do not open the workbook for editing while the service is writing it.

Production deployments must mount `server/data` on a persistent volume. Ephemeral serverless filesystems will lose history and are unsuitable. For multiple Node replicas, replace local Excel storage with a single-writer service or database; the in-process queue cannot coordinate separate processes.

## Station Configuration

`server/src/config/geography.js` is the canonical source for places, directions, operational MRT lines, station order, codes, and colours. It includes operational stations for the six requested lines as of October 2026, including Punggol Coast, Hume, and the completed Circle Line loop. Reserved and not-yet-confirmed future stations are intentionally excluded until opening is authoritative.

No AQI sensor is assigned in this file. OneMap resolves selected coordinates. WAQI selects its nearest available monitoring station when configured; the NEA fallback uses the matching regional aggregate. Four product regions are documented in the UI: northern and north-east towns are `north`, the Changi/eastern corridor is `east`, Jurong and the western corridor are `west`, and central/downtown/waterfront locations are grouped as `south`. These are not official planning boundaries.

## API

Public/read endpoints:

- `GET /api/health`
- `GET /api/directions`
- `GET /api/places`
- `GET /api/places?direction=east`
- `GET /api/places?q=katong`
- `GET /api/mrt-lines`
- `GET /api/mrt-stations?line=purple`
- `GET /api/aqi/current?method=place&place=pasir-ris`
- `GET /api/aqi/current?method=mrt&line=purple&station=sengkang`
- `GET /api/aqi/current?method=direction&direction=east&place=tampines`
- `GET /api/aqi/all-stations`
- `GET /api/aqi/history`
- `GET /api/aqi/summary`
- `GET /api/map/locations`
- `GET /api/settings` (recipient addresses are masked)

Protected endpoints require `x-admin-key` matching `ADMIN_KEY`:

- `GET /api/alerts/settings`
- `PUT /api/alerts/settings`
- `GET /api/export/excel`
- `GET /api/alerts/history`
- `POST /api/alerts/test-email`

## Testing

```powershell
npm.cmd test
npm.cmd run build
```

The suites use Vitest, React Testing Library, and Supertest. They cover place search, directional filtering, all six ordered line lists and station codes, interchange handling, switching workflows, AQI/PSI boundaries, stale data, provider retry, strict threshold comparison, unrelated-location rejection, duplicate suppression, escalation, SMTP errors, administrator authentication, workbook schema migration, and map marker updates.

## Deployment Checklist

- Use HTTPS and a long random `ADMIN_KEY`.
- Restrict `CLIENT_ORIGIN` to the deployed frontend.
- Store WAQI and SMTP credentials in the platform secret manager.
- Mount persistent storage at `server/data` and back up the workbook.
- Obtain required WAQI permission and set `WAQI_ARCHIVING_AUTHORIZED` appropriately.
- Review SMTP provider sending limits and sender authentication (SPF, DKIM, DMARC).
- Run one Node replica when using the Excel backend.
- Confirm the current MRT catalogue and coordinates before launch.
- Replace the profile placeholder only with a real supplied photograph.

## Credit

**Designed and Implemented by G Sureshkumar**
