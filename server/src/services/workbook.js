import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, mkdir } from 'node:fs/promises';
import locations, { listPlaces } from './locations.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const workbookDir = process.env.VERCEL
  ? path.join(process.env.TMPDIR || process.env.TEMP || '/tmp', 'hazesingapore')
  : dataDir;
export const workbookPath = path.join(workbookDir, process.env.NODE_ENV === 'test' ? `aqi-history.test-${process.env.VITEST_POOL_ID || process.pid}.xlsx` : 'aqi-history.xlsx');
let queue = Promise.resolve();

const sheets = {
  history: ['Record ID','Date and time','Selection method','Singapore direction','Place name','MRT line','MRT station','MRT station code','Latitude','Longitude','Actual AQI monitoring station','AQI value','AQI standard','AQI category','PM2.5','PM10','Other pollutants','Health guidance','Source website','Source data timestamp','Data retrieval timestamp','Data freshness status'],
  locations: ['Direction','MRT station','Station code','MRT lines','Nearby places','Latitude','Longitude'],
  alerts: ['Alert ID','Location','Selection method','Configured threshold','AQI reading','Recipient email','Alert trigger time','Email sending status','Error details','Alert episode identifier','Email delivery result'],
  settings: ['Setting','Value']
};

function ensureHeaders(sheet, headers) {
  const existing = new Set(sheet.getRow(1).values.slice(1));
  headers.forEach((header) => { if (!existing.has(header)) sheet.getRow(1).getCell(sheet.columnCount + 1).value = header; });
}

function addObjectRow(sheet, values) {
  const headers = sheet.getRow(1).values.slice(1);
  sheet.addRow(headers.map((header) => values[header] ?? null));
}

function objectRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1);
  return (sheet.getRows(2, Math.max(0, sheet.rowCount - 1)) || []).map((row) => Object.fromEntries(headers.map((header, index) => [header, row.getCell(index + 1).value])));
}

async function loadWorkbook() {
  const workbook = new ExcelJS.Workbook();
  await mkdir(path.dirname(workbookPath), { recursive: true });
  try {
    await access(workbookPath);
    await workbook.xlsx.readFile(workbookPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!workbook.getWorksheet('AQI_History')) workbook.addWorksheet('AQI_History').addRow(sheets.history);
  if (!workbook.getWorksheet('MRT_Locations')) {
    const sheet = workbook.addWorksheet('MRT_Locations');
    sheet.addRow(sheets.locations);
    locations.forEach((s) => sheet.addRow([s.direction,s.name,s.codes.join(', '),s.lines.map((l) => l.name).join(', '),s.places.join(', '),s.latitude,s.longitude]));
  }
  const locationSheet = workbook.getWorksheet('MRT_Locations');
  const configuredNames = new Set(locationSheet.getColumn(2).values.map(String));
  locations.filter((station) => !configuredNames.has(station.name)).forEach((station) => locationSheet.addRow([station.direction,station.name,station.codes.join(', '),station.lines.map((line) => line.name).join(', '),station.places.join(', '),station.latitude ?? '',station.longitude ?? '']));
  if (!workbook.getWorksheet('Alert_History')) workbook.addWorksheet('Alert_History').addRow(sheets.alerts);
  if (!workbook.getWorksheet('Settings')) workbook.addWorksheet('Settings').addRow(sheets.settings);
  ensureHeaders(workbook.getWorksheet('AQI_History'), sheets.history);
  ensureHeaders(workbook.getWorksheet('Alert_History'), sheets.alerts);
  const placeSheet = workbook.getWorksheet('Place_Locations') || workbook.addWorksheet('Place_Locations');
  if (!placeSheet.rowCount) placeSheet.addRow(['Direction','Place','Search name']);
  if (placeSheet.rowCount === 1) listPlaces().forEach((place) => placeSheet.addRow([place.direction, place.name, place.searchName]));
  workbook.eachSheet((sheet) => { sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF143D47' } }; sheet.views = [{ state: 'frozen', ySplit: 1 }]; });
  return workbook;
}

function serialized(operation) {
  const result = queue.then(operation, operation);
  queue = result.catch(() => {});
  return result;
}

async function save(workbook) {
  try {
    await mkdir(path.dirname(workbookPath), { recursive: true });
    await workbook.xlsx.writeFile(workbookPath);
  }
  catch (error) { throw new AppError(503, 'WORKBOOK_WRITE_FAILED', 'The Excel workbook could not be written. It may be open or the storage may be unavailable.', error.message); }
}

export function appendReading(reading) {
  if (!env.archivingAuthorized && !reading.storageAuthorized) return Promise.resolve({ stored: false, reason: 'Provider archiving permission is not configured.' });
  return serialized(async () => {
    const workbook = await loadWorkbook();
    const sheet = workbook.getWorksheet('AQI_History');
    const duplicate = sheet.getColumn(1).values.includes(reading.recordId);
    if (duplicate) return { stored: false, reason: 'Duplicate reading.' };
    addObjectRow(sheet, reading.values);
    await save(workbook);
    return { stored: true };
  });
}

export function appendAlert(values) {
  return serialized(async () => { const workbook = await loadWorkbook(); addObjectRow(workbook.getWorksheet('Alert_History'), values); await save(workbook); });
}

export async function getHistory(stationId, limit = 100) {
  const workbook = await loadWorkbook();
  return objectRows(workbook.getWorksheet('AQI_History')).map((row) => ({ id: row['Record ID'], timestamp: row['Source data timestamp'] || row['Date and time'], selectionMethod: row['Selection method'], direction: row['Singapore direction'], place: row['Place name'] || row['Nearby place'], station: row['MRT station'], stationCode: row['MRT station code'], aqi: row['AQI value'], pm25: row['PM2.5'], pm10: row['PM10'], category: row['AQI category'] })).filter((row) => !stationId || String(row.id).includes(`:${stationId}:`) || String(row.id).startsWith(`${stationId}:`)).slice(-limit);
}

export async function getAlertHistory(limit = 100) {
  const workbook = await loadWorkbook();
  const sheet = workbook.getWorksheet('Alert_History');
  return objectRows(sheet).slice(-limit).map((row) => ({ id: row['Alert ID'], timestamp: row['Alert trigger time'] || row['Date and time'], location: row['Location'] || row['MRT station or place'], selectionMethod: row['Selection method'], aqi: row['AQI reading'] ?? row['AQI value'], threshold: row['Configured threshold'] ?? row['Threshold'], recipient: row['Recipient email'], status: row['Email sending status'] || row['Alert status'], result: row['Email delivery result'], error: row['Error details'] || row['Error message'], episodeId: row['Alert episode identifier'] }));
}

export async function readStoredSettings() {
  const workbook = await loadWorkbook();
  const sheet = workbook.getWorksheet('Settings');
  const rows = sheet.getRows(2, Math.max(0, sheet.rowCount - 1)) || [];
  return Object.fromEntries(rows.map((row) => [row.getCell(1).value, row.getCell(2).value]).filter(([key]) => key));
}

export function persistSettings(settings) {
  return serialized(async () => {
    const workbook = await loadWorkbook();
    const sheet = workbook.getWorksheet('Settings');
    if (sheet.rowCount > 1) sheet.spliceRows(2, sheet.rowCount - 1);
    Object.entries(settings).forEach(([key, value]) => sheet.addRow([key, Array.isArray(value) ? JSON.stringify(value) : value]));
    await save(workbook);
  });
}

export async function ensureWorkbook() { return serialized(async () => { const workbook = await loadWorkbook(); await save(workbook); return workbookPath; }); }
