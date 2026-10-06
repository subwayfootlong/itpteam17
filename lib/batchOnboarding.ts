export const BATCH_ONBOARDING_HEADERS = [
  'salutation',
  'first_name',
  'last_name',
  'email',
  'phone',
  'organization',
  'designation',
  'ars_status',
] as const;

export type BatchOnboardingField = (typeof BATCH_ONBOARDING_HEADERS)[number];

export type BatchOnboardingRow = Record<BatchOnboardingField, string> & {
  rowNumber: number;
};

export type BatchOnboardingResult = {
  rowNumber: number;
  email: string;
  status: 'created' | 'skipped' | 'failed';
  message: string;
  temporaryPassword?: string;
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

export function csvCell(value: unknown): string {
  let content = String(value ?? '');
  if (/^[=+\-@]/.test(content)) content = `'${content}`;
  return `"${content.replaceAll('"', '""')}"`;
}
