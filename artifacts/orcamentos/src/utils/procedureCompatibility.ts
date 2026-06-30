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

function isStandalonePreAxillaryLiposuction(entry: ProcedureEntry) {
  return normalizeProcedureName(entry.procedure.name) === 'lipoaspiracao de pre-axilas';
}

function includesPreAxillaryLiposuction(entry: ProcedureEntry) {
  return normalizeProcedureName(entry.procedure.name).includes('lipoaspiracao de pre-axilas');
}

function getLiposuctionAreas(entry: ProcedureEntry) {
  const name = normalizeProcedureName(entry.procedure.name);
  const areas = new Set<string>();

  if (name.includes('pre-axilas')) areas.add('pre-axilas');
  if (name.includes('abdome')) areas.add('abdome');
  if (name.includes('flanco')) areas.add('flancos');
  if (name.includes('dorso')) areas.add('dorso');
  if (name.includes('braco')) areas.add('bracos');
  if (name.includes('submento')) areas.add('submento');
  if (name.includes('culote')) areas.add('culotes');
  if (name.includes('face interna das coxas') || name.includes('fi coxas') || name.includes('fi das coxas')) {
    areas.add('face-interna-coxas');
  }
  if (name.includes('laterais do quadril') || name.includes('lateral do quadril')) {
    areas.add('laterais-quadril');
  }

  return areas;
}

function isLipoescultura(entry: ProcedureEntry) {
  return normalizeProcedureName(entry.procedure.name).includes('lipoescultura');
}

function isStandaloneLiposuction(entry: ProcedureEntry) {
  const name = normalizeProcedureName(entry.procedure.name);
  return name.includes('lipoaspiracao') && !name.includes('lipoescultura');
}

function isRedundantWithLipoescultura(entry: ProcedureEntry, lipoesculturaAreas: Set<string>) {
  if (!isStandaloneLiposuction(entry)) return false;

  const nonPreAxillaryAreas = Array.from(getLiposuctionAreas(entry)).filter((area) => area !== 'pre-axilas');
  return nonPreAxillaryAreas.every((area) => lipoesculturaAreas.has(area));
}

export function normalizeProcedureSetForCombinedPricing(entries: ProcedureEntry[]) {
  const hasBundledPreAxillaryLiposuction = entries.some(
    (entry) => includesPreAxillaryLiposuction(entry) && !isStandalonePreAxillaryLiposuction(entry),
  );
  const lipoesculturaAreas = entries.reduce((areas, entry) => {
    if (!isLipoescultura(entry)) return areas;
    for (const area of getLiposuctionAreas(entry)) areas.add(area);
    return areas;
  }, new Set<string>());

  if (!hasBundledPreAxillaryLiposuction && lipoesculturaAreas.size === 0) return entries;

  return entries.filter((entry) => {
    if (hasBundledPreAxillaryLiposuction && isStandalonePreAxillaryLiposuction(entry)) return false;
    if (lipoesculturaAreas.size > 0 && isRedundantWithLipoescultura(entry, lipoesculturaAreas)) return false;
    return true;
  });
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
