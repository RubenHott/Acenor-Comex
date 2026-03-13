import { describe, it, expect } from 'vitest';
import { parseCsvText } from './parseCsvExcel';

describe('parseCsvText', () => {
  it('parses comma-separated CSV', () => {
    const csv = 'nombre,cantidad,precio\nAcero,100,25.5\nCobre,200,30';
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ nombre: 'Acero', cantidad: 100, precio: 25.5 });
    expect(rows[1]).toEqual({ nombre: 'Cobre', cantidad: 200, precio: 30 });
  });

  it('parses semicolon-separated CSV', () => {
    const csv = 'nombre;cantidad\nAcero;100\nCobre;200';
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ nombre: 'Acero', cantidad: 100 });
  });

  it('returns empty array for empty input', () => {
    expect(parseCsvText('')).toEqual([]);
    expect(parseCsvText('   ')).toEqual([]);
  });

  it('handles quoted values', () => {
    const csv = '"nombre","cantidad"\n"Acero Inox",100';
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].nombre).toBe('Acero Inox');
    expect(rows[0].cantidad).toBe(100);
  });

  it('treats empty values as null', () => {
    const csv = 'a,b\n1,\n,2';
    const rows = parseCsvText(csv);
    expect(rows[0]).toEqual({ a: 1, b: null });
    expect(rows[1]).toEqual({ a: null, b: 2 });
  });

  it('parses negative numbers', () => {
    const csv = 'valor\n-10.5\n-3';
    const rows = parseCsvText(csv);
    expect(rows[0].valor).toBe(-10.5);
    expect(rows[1].valor).toBe(-3);
  });

  it('preserves non-numeric strings and converts numeric-looking ones', () => {
    const csv = 'code,name\nABC-123,Test\n001,Zero';
    const rows = parseCsvText(csv);
    expect(rows[0].code).toBe('ABC-123');
    // "001" matches /^-?\d+(\.\d+)?$/ so becomes number 1
    expect(rows[1].code).toBe(1);
  });
});
