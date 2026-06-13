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

function isImplantReplacementWithPreAxillaryLiposuction(entry: ProcedureEntry) {
  const name = normalizeProcedureName(entry.procedure.name);
  return (
    name.includes('substituicao de implantes') &&
    name.includes('lipoaspiracao de pre-axilas') &&
    !name.includes('contratura capsular') &&
    !name.includes('mamoplastia redutora')
  );
}

export function areProceduresBuiltInIncompatible(first: ProcedureEntry, second: ProcedureEntry) {
  const isRemovalAlternative =
    isImplantRemovalWithBreastFatGrafting(first) &&
    isImplantRemovalWithBreastFatGrafting(second);
  const isReplacementAlternative =
    isImplantReplacementWithPreAxillaryLiposuction(first) &&
    isImplantReplacementWithPreAxillaryLiposuction(second);

  if (isRemovalAlternative || isReplacementAlternative) {
    return includesMastopexy(first) !== includesMastopexy(second);
  }

  return false;
}

export function hasBuiltInProcedureConflict(entries: ProcedureEntry[]) {
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (areProceduresBuiltInIncompatible(entries[i], entries[j])) return true;
    }
  }
  return false;
}
