import { readFileSync, writeFileSync } from 'fs';

const PRICES_CSV = 'attached_assets/Valores_Procedimentos-VALORES_PROCEDIMENTOS_(15.01.2024)_1776454094642.csv';
const HOSPITAL_CSV = 'attached_assets/Valores_Accurata-VALORES_PROCEDIMENTOS_(15.01.2024)_1776454094642.csv';

function parseMoney(s) {
  s = s.trim();
  if (!s || s === '-') return null;
  return Math.round(parseFloat(s.replace(/\./g, '').replace(',', '.')));
}

function readCsvLines(path) {
  return readFileSync(path, 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
}

const pricesLines = readCsvLines(PRICES_CSV);
const hospitalLines = readCsvLines(HOSPITAL_CSV);

// Skip first 2 header lines on both
const dataLines = [];
for (let i = 2; i < pricesLines.length; i++) {
  const pl = pricesLines[i];
  const hl = hospitalLines[i] || '';
  if (!pl.trim()) continue;
  dataLines.push({ rowIndex: i, prices: pl, hospital: hl });
}

console.log(`Found ${dataLines.length} procedure rows`);

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .substring(0, 70);
}

function categoryOf(name) {
  const n = name.toLowerCase();
  if (n.includes('mamoplastia') || n.includes('mastopexia') || n.includes('lipoenxertia mamária') || n.startsWith('substituição de implantes') || n.startsWith('retirada de implantes')) return 'breast';
  if (n.startsWith('lipoaspiração') || n.startsWith('lipoescultura')) return 'lipo';
  if (n.includes('miniabdominoplastia') || n.includes('abdominoplastia') || n.includes('flancoplastia') || n.includes('retirada de fuso')) return 'abdominoplasty';
  return 'other';
}

function hasImplantsFor(name) {
  const n = name.toLowerCase();
  if (n.includes('mamoplastia de aumento')) return true;
  if (n.includes('mastopexia com implantes')) return true;
  if (n.includes('substituição de implantes')) return true;
  if (n.includes('substituição de implante')) return true;
  return false;
}

const procedures = [];
let currentMain = null;
const usedIds = new Set();

for (const { prices, hospital } of dataLines) {
  const pCols = prices.split(';');
  const hCols = hospital.split(';');
  const rawName = pCols[0];
  if (!rawName.trim()) continue;

  const isSubVariant = /^\s*\+/.test(rawName);
  let fullName;
  if (isSubVariant) {
    if (!currentMain) {
      console.warn('Sub-variant without main:', rawName);
      continue;
    }
    const variantPart = rawName.replace(/^\s*\+\s*/, '').trim();
    fullName = `${currentMain} + ${variantPart}`;
  } else {
    currentMain = rawName.trim();
    fullName = currentMain;
  }

  // Parse prices: A.total, A.cir, A.anest, B.total, B.cir, B.anest, C.total, C.cir, C.anest
  const A_total = parseMoney(pCols[1]);
  const A_cir = parseMoney(pCols[2]);
  const A_anest = parseMoney(pCols[3]);
  const B_total = parseMoney(pCols[4]);
  const B_cir = parseMoney(pCols[5]);
  const B_anest = parseMoney(pCols[6]);
  const C_total = parseMoney(pCols[7]);
  const C_cir = parseMoney(pCols[8]);
  const C_anest = parseMoney(pCols[9]);

  const hospMin = parseMoney(hCols[1]);
  const hospMax = parseMoney(hCols[2]);

  // Generate unique ID
  let baseId = slugify(fullName);
  let id = baseId;
  let n = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${n++}`;
  }
  usedIds.add(id);

  const cA = A_total !== null ? { total: A_total, surgery: A_cir, anesthesia: A_anest } : null;
  const cB = B_total !== null ? { total: B_total, surgery: B_cir, anesthesia: B_anest } : null;
  const cC = C_total !== null ? { total: C_total, surgery: C_cir, anesthesia: C_anest } : null;

  procedures.push({
    id,
    name: fullName,
    category: categoryOf(fullName),
    hasImplants: hasImplantsFor(fullName),
    complexityA: cA,
    complexityB: cB,
    complexityC: cC,
    hospitalMin: hospMin,
    hospitalMax: hospMax,
  });
}

console.log(`Generated ${procedures.length} procedures`);

// Generate TS file
const out = [];
out.push("export type Complexity = 'A' | 'B' | 'C';");
out.push("export type ProcedureCategory = 'breast' | 'lipo' | 'abdominoplasty' | 'other';");
out.push('');
out.push('export interface PriceSet {');
out.push('  total: number;');
out.push('  surgery: number;');
out.push('  anesthesia: number;');
out.push('}');
out.push('');
out.push('export interface Procedure {');
out.push('  id: string;');
out.push('  name: string;');
out.push('  category: ProcedureCategory;');
out.push('  complexityA: PriceSet | null;');
out.push('  complexityB: PriceSet | null;');
out.push('  complexityC: PriceSet | null;');
out.push('  hasImplants?: boolean;');
out.push('  hospitalMin: number | null;');
out.push('  hospitalMax: number | null;');
out.push('}');
out.push('');
out.push('function p(total: number, surgery: number, anesthesia: number): PriceSet {');
out.push('  return { total, surgery, anesthesia };');
out.push('}');
out.push('');
out.push('export const PROCEDURES: Procedure[] = [');

for (const proc of procedures) {
  out.push('  {');
  out.push(`    id: ${JSON.stringify(proc.id)},`);
  out.push(`    name: ${JSON.stringify(proc.name)},`);
  out.push(`    category: ${JSON.stringify(proc.category)},`);
  if (proc.hasImplants) out.push('    hasImplants: true,');
  out.push(`    complexityA: ${proc.complexityA ? `p(${proc.complexityA.total}, ${proc.complexityA.surgery}, ${proc.complexityA.anesthesia})` : 'null'},`);
  out.push(`    complexityB: ${proc.complexityB ? `p(${proc.complexityB.total}, ${proc.complexityB.surgery}, ${proc.complexityB.anesthesia})` : 'null'},`);
  out.push(`    complexityC: ${proc.complexityC ? `p(${proc.complexityC.total}, ${proc.complexityC.surgery}, ${proc.complexityC.anesthesia})` : 'null'},`);
  out.push(`    hospitalMin: ${proc.hospitalMin === null ? 'null' : proc.hospitalMin},`);
  out.push(`    hospitalMax: ${proc.hospitalMax === null ? 'null' : proc.hospitalMax},`);
  out.push('  },');
}

out.push('];');
out.push('');
out.push('export function getPriceForComplexity(procedure: Procedure, complexity: Complexity): PriceSet | null {');
out.push("  if (complexity === 'A') return procedure.complexityA;");
out.push("  if (complexity === 'B') return procedure.complexityB;");
out.push('  return procedure.complexityC;');
out.push('}');
out.push('');
out.push('export function calcInstallments(value: number, rate: number): number {');
out.push('  return value * (1 + rate);');
out.push('}');
out.push('');
out.push('export const ARGOPLASMA_PRICE = 5000;');
out.push('export const ARGOPLASMA_PRICE_6X = 5625;');
out.push('export const ARGOPLASMA_PRICE_12X = 6250;');
out.push('');
out.push('export const IMPLANT_PRICES = {');
out.push('  eurosilicone: {');
out.push('    avista: 3630,');
out.push('    ate6x: 3880,');
out.push('    de7a10x: 4180,');
out.push('  },');
out.push('  silimed: {');
out.push('    avista: 4603,');
out.push('    ate7x: 4840,');
out.push('  },');
out.push('};');

writeFileSync('artifacts/orcamentos/src/data/procedures.ts', out.join('\n') + '\n');
console.log(`Wrote ${out.length} lines to procedures.ts`);

// Print sample for verification
console.log('\nFirst 3 procedures:');
console.log(JSON.stringify(procedures.slice(0, 3), null, 2));
console.log('\nLast 3 procedures:');
console.log(JSON.stringify(procedures.slice(-3), null, 2));
