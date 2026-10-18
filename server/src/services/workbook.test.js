import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { ensureWorkbook, workbookPath } from './workbook.js';

describe('Excel storage', () => {
  it('creates all required sheets and exports a readable workbook', async () => {
    await ensureWorkbook(); const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile(workbookPath);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(expect.arrayContaining(['AQI_History','MRT_Locations','Place_Locations','Alert_History','Settings']));
    expect(workbook.getWorksheet('MRT_Locations').rowCount).toBeGreaterThan(100);
    expect(workbook.getWorksheet('AQI_History').getRow(1).values).toContain('Selection method');
    expect(workbook.getWorksheet('Alert_History').getRow(1).values).toContain('Alert episode identifier');
  });
});
