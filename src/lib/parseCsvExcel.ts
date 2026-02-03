/**
 * Parsea archivos CSV o Excel (.xlsx, .xls) y devuelve un array de objetos
 * con claves según la primera fila (headers).
 */
import * as XLSX from 'xlsx';

export type ParsedRow = Record<string, string | number | null>;

/**
 * Parsea texto CSV (separador coma o punto y coma).
 */
export function parseCsvText(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  const sep = text.includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const row: ParsedRow = {};
    headers.forEach((h, j) => {
      const val = values[j] ?? '';
      row[h] = val === '' ? null : isNumeric(val) ? Number(val) : val;
    });
    rows.push(row);
  }
  return rows;
}

function isNumeric(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s.trim());
}

/**
 * Parsea un archivo File (CSV o Excel). Los IDs no se incluyen en el archivo;
 * se generan al insertar en BD.
 */
export async function parseFile(file: File): Promise<ParsedRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await file.text();
    return parseCsvText(text);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const firstSheet = wb.SheetNames[0];
    if (!firstSheet) return [];
    const sheet = wb.Sheets[firstSheet];
    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: null,
    }) as unknown as (string | number | null)[][];
    if (data.length < 2) return [];
    const headers = (data[0] as (string | number)[]).map((h) => String(h ?? '').trim());
    const rows: ParsedRow[] = [];
    for (let i = 1; i < data.length; i++) {
      const values = data[i] as (string | number | null)[];
      const row: ParsedRow = {};
      headers.forEach((h, j) => {
        const v = values[j];
        row[h] = v === undefined || v === '' ? null : typeof v === 'number' ? v : String(v).trim() || null;
      });
      rows.push(row);
    }
    return rows;
  }
  throw new Error('Formato no soportado. Use CSV o Excel (.xlsx, .xls).');
}
