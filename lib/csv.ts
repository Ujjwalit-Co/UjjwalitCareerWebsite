/**
 * Client-side CSV export helpers.
 */

export interface CSVColumn {
  key: string;
  label: string;
}

type CSVRow = Record<string, unknown>;

function getByPath(row: CSVRow, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = row;
  for (const part of parts) {
    if (cur === null || cur === undefined) return '';
    cur = (cur as CSVRow)[part];
  }
  return cur;
}

export function toCSV(rows: CSVRow[], columns: CSVColumn[]): string {
  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(getByPath(row, c.key))).join(',')
  );

  return [header, ...body].join('\n');
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}