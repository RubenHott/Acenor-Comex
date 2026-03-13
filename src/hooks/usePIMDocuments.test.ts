import { describe, it, expect } from 'vitest';

// Import the validation constants and function directly
// Since validateFile is not exported, we test the logic inline
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'message/rfc822',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif',
  'xlsx', 'xls', 'docx', 'doc', 'txt', 'csv', 'zip', 'rar', 'eml', 'msg',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function validateFile(file: { name: string; size: number; type: string }): void {
  if (file.size > MAX_FILE_SIZE) throw new Error(`El archivo excede el tamaño máximo de 50 MB`);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`Tipo de archivo no permitido (.${ext})`);
  if (file.type && file.type !== 'application/octet-stream' && !ALLOWED_MIME_TYPES.has(file.type))
    throw new Error(`Tipo MIME no permitido (${file.type})`);
}

describe('validateFile', () => {
  it('accepts valid PDF file', () => {
    expect(() =>
      validateFile({ name: 'doc.pdf', size: 1024, type: 'application/pdf' })
    ).not.toThrow();
  });

  it('accepts valid Excel file', () => {
    expect(() =>
      validateFile({
        name: 'data.xlsx',
        size: 5000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    ).not.toThrow();
  });

  it('rejects file exceeding 50MB', () => {
    expect(() =>
      validateFile({ name: 'big.pdf', size: 60 * 1024 * 1024, type: 'application/pdf' })
    ).toThrow('tamaño máximo');
  });

  it('rejects disallowed extension', () => {
    expect(() =>
      validateFile({ name: 'script.exe', size: 1024, type: 'application/x-msdownload' })
    ).toThrow('no permitido');
  });

  it('rejects disallowed MIME type', () => {
    expect(() =>
      validateFile({ name: 'file.pdf', size: 1024, type: 'application/javascript' })
    ).toThrow('MIME no permitido');
  });

  it('allows octet-stream MIME (browser fallback)', () => {
    expect(() =>
      validateFile({ name: 'doc.pdf', size: 1024, type: 'application/octet-stream' })
    ).not.toThrow();
  });

  it('allows empty MIME type', () => {
    expect(() =>
      validateFile({ name: 'doc.pdf', size: 1024, type: '' })
    ).not.toThrow();
  });

  it('rejects .html files', () => {
    expect(() =>
      validateFile({ name: 'page.html', size: 512, type: 'text/html' })
    ).toThrow('no permitido');
  });

  it('accepts .eml email files', () => {
    expect(() =>
      validateFile({ name: 'email.eml', size: 1024, type: 'message/rfc822' })
    ).not.toThrow();
  });
});
