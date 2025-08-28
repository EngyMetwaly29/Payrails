// src/utils/csv.ts
export const parseCsv = (text: string) => {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  return { headers: header.split(','), rows: lines.map(l => l.split(',')) };
};

export const toNum = (s: string) => {
  const n = Number(s); if (Number.isNaN(n)) throw new Error(`NaN: ${s}`); return n;
};
