import { Task } from '@/types';

const CSV_HEADERS = [
  'id',
  'title',
  'revenue',
  'timeTaken',
  'priority',
  'status',
  'notes',
] as const;

export function toCSV(tasks: ReadonlyArray<Task>): string {
  if (tasks.length === 0) {
    return CSV_HEADERS.join(',');
  }

  const headerRow = CSV_HEADERS.join(',');

  const rows = tasks.map(t =>
    [
      t.id,
      t.title,
      t.revenue,
      t.timeTaken,
      t.priority,
      t.status,
      t.notes ?? '',
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headerRow, ...rows].join('\n');
}

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  const escaped = str.replace(/"/g, '""');
  if (/[",\n]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}



