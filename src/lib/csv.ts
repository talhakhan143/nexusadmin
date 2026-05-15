import Papa from "papaparse";

export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  return Papa.unparse(rows, { quotes: true, header: true });
}

export function parseCsv<T = Record<string, string>>(text: string): T[] {
  const result = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }
  return result.data;
}
