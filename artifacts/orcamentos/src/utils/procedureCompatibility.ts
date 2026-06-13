import type { ProcedureEntry } from '@/types/quote';

function normalizeProcedureName(name: string) {
  return name
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isImplantRemovalWithBreastFatGrafting(entry: ProcedureEntry) {
  const name = normalizeProcedureName(entry.procedure.name);
  return name.includes('retirada de implantes') && name.includes('lipoenxertia mamaria');
}

function includesMastopexy(entry: ProcedureEntry) {
  return normalizeProcedureName(entry.procedure.name).includes('mastopexia');
}

export function areProceduresBuiltInIncompatible(first: ProcedureEntry, second: ProcedureEntry) {
  if (!isImplantRemovalWithBreastFatGrafting(first) || !isImplantRemovalWithBreastFatGrafting(second)) {
    return false;
  }

  return includesMastopexy(first) !== includesMastopexy(second);
}

export function hasBuiltInProcedureConflict(entries: ProcedureEntry[]) {
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (areProceduresBuiltInIncompatible(entries[i], entries[j])) return true;
    }
  }
  return false;
}
