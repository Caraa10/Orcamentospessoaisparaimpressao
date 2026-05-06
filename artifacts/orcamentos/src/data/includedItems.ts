export type ProcedureCategory = 'breast' | 'lipo' | 'abdominoplasty' | 'other';

export interface IncludedSection {
  intro: string; // may contain **text** for bold portions
  items: string[];
}

// ─── Common items (always shown) ───

export const COMMON_ITEMS: string[] = [
  '**Sistema de aquecimento** (Bair Hugger, Warm Touch): para lhe manter aquecida durante todo o procedimento',
  '**Sistema de compressão venosa de membros inferiores**: para reduzir o risco de trombose durante e após a cirurgia',
  '**Anestesia geral venosa total**: o que há de mais avançado em termos de anestesia — maior segurança e conforto para o seu procedimento',
  'Após a cirurgia, **você será cuidada pelo Dr. Thiago**: o acompanhamento não é delegado para a equipe — ele lhe vê em todas as consultas e você tem o telefone pessoal dele para o que precisar',
];

export function getArgoplasmaIncludedItems(procedureLabel: string): string[] {
  return [
    `[[paragraph]]É ainda possível acrescentar ao seu procedimento de ${procedureLabel}:`,
    '**Argoplasma - ARGON 4**: é uma tecnologia que emprega gás argônio ionizado (plasma) para promover estímulo a novas fibras de colágeno, melhorando firmeza, elasticidade e aparência da pele.',
  ];
}

function normalizeProcedureLabel(name: string) {
  return name
    .replace(/\s*\+\s*/g, ' e ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isMamoplastiaAumentoFamily(name: string) {
  return normalizeProcedureLabel(name).includes('mamoplastia de aumento');
}

function isMastopexiaFamily(name: string) {
  return normalizeProcedureLabel(name).includes('mastopexia');
}

function shouldTreatAsAlternativeProcedures(
  entries: Array<{ category: ProcedureCategory; name: string }>,
) {
  if (entries.length <= 1) return false;
  const hasMamoplastiaAumento = entries.some((entry) => isMamoplastiaAumentoFamily(entry.name));
  const hasMastopexia = entries.some((entry) => isMastopexiaFamily(entry.name));
  return hasMamoplastiaAumento && hasMastopexia;
}

function getProcedureLabel(entry: {
  category: ProcedureCategory;
  name: string;
}): string {
  const normalizedName = normalizeProcedureLabel(entry.name);

  if (
    entry.category === 'abdominoplasty' &&
    /retirada de fuso de pele do abdome/i.test(normalizedName) &&
    /lipoaspiraç[aã]o/i.test(normalizedName)
  ) {
    const lipoMatch = normalizedName.match(/(lipoaspiraç[aã]o[\s\S]*)/i);
    if (lipoMatch) {
      const lipoSegment = lipoMatch[1]
        .replace(/\s+e\s+lipoenxertia gl[uú]tea$/i, '')
        .trim()
        .replace(/\s*-\s*$/g, '');
      return `${lipoSegment} e retirada de fuso de pele do abdome`;
    }
  }

  if (/lipoescultura/i.test(normalizedName)) {
    if (entry.category === 'abdominoplasty' && /abdominoplastia/i.test(normalizedName)) {
      return 'abdominoplastia com lipoescultura';
    }

    const compactLipoLabel = normalizedName
      .replace(/(\blipoescultura\b)[\s\S]*$/i, '$1')
      .trim()
      .replace(/\s*-\s*$/g, '');

    return compactLipoLabel || 'procedimento';
  }

  if (entry.category === 'lipo' && /lipoaspiraç[aã]o/i.test(normalizedName)) {
    return 'lipoaspiração';
  }

  if (entry.category === 'abdominoplasty' && /abdominoplastia/i.test(normalizedName) && /lipoaspiraç[aã]o/i.test(normalizedName)) {
    return 'abdominoplastia com lipoaspiração';
  }

  const baseName = normalizedName
    .replace(/\s+e\s+lipoenxertia gl[uú]tea$/i, '')
    .trim()
    .replace(/\s*-\s*$/g, '');

  return baseName || 'procedimento';
}

function isLipoesculturaOnly(entry: { category: ProcedureCategory; name: string }) {
  const normalizedName = normalizeProcedureLabel(entry.name);
  return entry.category === 'lipo' && /lipoescultura/i.test(normalizedName);
}

function isAbdominoplastyWithLipoescultura(entry: {
  category: ProcedureCategory;
  name: string;
}) {
  const normalizedName = normalizeProcedureLabel(entry.name);
  return (
    entry.category === 'abdominoplasty' &&
    /abdominoplastia/i.test(normalizedName) &&
    /lipoescultura/i.test(normalizedName)
  );
}

function isLipoaspiracaoOnly(entry: { category: ProcedureCategory; name: string }) {
  const normalizedName = normalizeProcedureLabel(entry.name);
  return entry.category === 'lipo' && /lipoaspiraç[aã]o/i.test(normalizedName);
}

function isAbdominoplastyWithLipoaspiracao(entry: {
  category: ProcedureCategory;
  name: string;
}) {
  const normalizedName = normalizeProcedureLabel(entry.name);
  return (
    entry.category === 'abdominoplasty' &&
    /abdominoplastia/i.test(normalizedName) &&
    /lipoaspiraç[aã]o/i.test(normalizedName) &&
    !/lipoescultura/i.test(normalizedName)
  );
}

// ─── Category-specific items ───

const LIPO_SPECIFIC_ITEMS: string[] = [
  '**SAFER (lipoaspiração ultrassônica)**: é um ultrassom cirúrgico que liquefaz a gordura, permitindo sua remoção de forma mais controlada, com menor trauma, menor sangramento, menos dor pós-operatória e mais previsibilidade cirúrgica',
  '**Irrigador cirúrgico**: para infusão de soluções para lipoaspiração de maneira mais controlada e rápida',
  '**Vibrofit**: tecnologia que utiliza movimentos vibratórios para facilitar a retirada de gordura',
  '**Malha cirúrgica** (modelador): quando necessário, para proteção e suporte da área operada',
  '**Cinturão abdominal**: para estabilização dos tecidos operados',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
  '**Canaletas**: quando necessário, para definição das áreas de sombra do abdome',
  '**Taping**: quando necessário, para melhor posicionamento dos tecidos operados',
];

const LIPO_WITH_GRAFTING_EXTRA_ITEMS: string[] = [
  '**Philips Lumify**: tecnologia que aumenta a segurança e precisão nas lipoenxertias',
];

const ABDOMINOPLASTY_SPECIFIC_ITEMS: string[] = [
  '**SAFER (lipoaspiração ultrassônica)**: é um ultrassom cirúrgico que liquefaz a gordura, permitindo sua remoção de forma mais controlada, com menor trauma, menor sangramento, menos dor pós-operatória e mais previsibilidade cirúrgica',
  '**Irrigador cirúrgico**: para infusão de soluções para lipoaspiração de maneira mais controlada e rápida',
  '**Vibrofit**: tecnologia que utiliza movimentos vibratórios para facilitar a retirada de gordura',
  '**Cola cirúrgica** (Prineo® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar no abdome',
  '**Malha cirúrgica** (modelador): quando necessário, para proteção e suporte da área operada',
  '**Cinturão abdominal**: para estabilização dos tecidos operados',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
  '**Canaletas**: quando necessário, para definição das áreas de sombra do abdome',
  '**Taping**: quando necessário, para melhor posicionamento dos tecidos operados',
];

const ABDOMINOPLASTY_WITH_GRAFTING_EXTRA_ITEMS: string[] = [
  '**Philips Lumify**: tecnologia que aumenta a segurança e precisão nas lipoenxertias',
];

const BREAST_AUGMENTATION_SPECIFIC_ITEMS: string[] = [
  '**Técnicas** de recuperação rápida, sutiã interno, alça de sustentação e, caso necessário, enxertia de gordura nas mamas (mamoplastia de aumento híbrida)',
  '**Funil de inserção** (funil de Keller): dispositivo que permite a inserção suave dos implantes, reduzindo riscos relacionados à cirurgia, tempo cirúrgico, dor pós-operatória e tamanho da incisão',
  '**Cola cirúrgica** (Dermabond® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar nas mamas',
  '**Sutiã cirúrgico**: para suporte adequado e proteção das mamas',
];

const BREAST_FAT_GRAFTING_AUGMENTATION_ITEMS: string[] = [
  '**Sutiã cirúrgico**: para suporte adequado e proteção das mamas',
];

const BREAST_REDUCTION_SPECIFIC_ITEMS: string[] = [
  '**Técnicas** de sutiã interno, alça de sustentação e, caso necessário, enxertia de gordura nas mamas',
  '**Cola cirúrgica** (Prineo® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar nas mamas',
  '**Sutiã cirúrgico**: para suporte adequado e proteção das mamas',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
];

const MASTOPEXY_SPECIFIC_ITEMS: string[] = [
  '**Técnicas** de sutiã interno, alça de sustentação e, caso necessário, enxertia de gordura nas mamas',
  '**Funil de inserção** (funil de Keller): dispositivo que permite a inserção suave dos implantes, reduzindo riscos relacionados à cirurgia, tempo cirúrgico e dor pós-operatória',
  '**Cola cirúrgica** (Prineo® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar nas mamas',
  '**Sutiã cirúrgico**: para suporte adequado e proteção das mamas',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
];

// ─── Helper ───

interface CategoryInfo {
  firstIntro: string;    // intro for first / single procedure
  subIntro: string;      // intro for second+ procedures in multi-proc
  items: string[];
}

interface IncludedGroup {
  intro: string;
  subIntro: string;
  items: string[];
  argoplasmaLabel?: string;
  supportsArgoplasma: boolean;
}

function getCategoryInfo(category: ProcedureCategory, procedureName: string): CategoryInfo {
  const term = getProcedureLabel({ category, name: procedureName });
  const hasFatGrafting = /lipoenxertia gl[uú]tea|lipoescultura/i.test(procedureName);

  if (category === 'lipo') {
    const items = hasFatGrafting
      ? [
          LIPO_SPECIFIC_ITEMS[0],
          ...LIPO_WITH_GRAFTING_EXTRA_ITEMS,
          ...LIPO_SPECIFIC_ITEMS.slice(1),
        ]
      : LIPO_SPECIFIC_ITEMS;

    return {
      firstIntro: `Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de ${term}**:`,
      subIntro: `Estão **incluídos em seu procedimento de ${term}**:`,
      items,
    };
  }

  if (category === 'abdominoplasty') {
    const items = hasFatGrafting
      ? [
          ABDOMINOPLASTY_SPECIFIC_ITEMS[0],
          ...ABDOMINOPLASTY_WITH_GRAFTING_EXTRA_ITEMS,
          ...ABDOMINOPLASTY_SPECIFIC_ITEMS.slice(1),
        ]
      : ABDOMINOPLASTY_SPECIFIC_ITEMS;

    return {
      firstIntro: `Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de ${term}**:`,
      subIntro: `Estão **incluídos em seu procedimento de ${term}**:`,
      items,
    };
  }

  if (category === 'breast') {
    const lower = procedureName.toLowerCase();
    if (lower.includes('redutora')) {
      return {
        firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de mamoplastia redutora**:',
        subIntro: 'Estão **incluídos em seu procedimento de mamoplastia redutora**:',
        items: BREAST_REDUCTION_SPECIFIC_ITEMS,
      };
    }
    if (lower.includes('lipoenxertia mamária de aumento')) {
      return {
        firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de lipoenxertia mamária de aumento**:',
        subIntro: 'Estão **incluídos em seu procedimento de lipoenxertia mamária de aumento**:',
        items: BREAST_FAT_GRAFTING_AUGMENTATION_ITEMS,
      };
    }
    if (lower.includes('retirada implantes e lipoenxertia mamária')) {
      return {
        firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de retirada de implantes e lipoenxertia mamária**:',
        subIntro: 'Estão **incluídos em seu procedimento de retirada de implantes e lipoenxertia mamária**:',
        items: BREAST_FAT_GRAFTING_AUGMENTATION_ITEMS,
      };
    }
    if (lower.includes('mastopexia')) {
      return {
        firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de mastopexia**:',
        subIntro: 'Estão **incluídos em seu procedimento de mastopexia**:',
        items: MASTOPEXY_SPECIFIC_ITEMS,
      };
    }
    if (lower.includes('substituição de implantes')) {
      return {
        firstIntro: `Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de ${term}**:`,
        subIntro: `Estão **incluídos em seu procedimento de ${term}**:`,
        items: BREAST_AUGMENTATION_SPECIFIC_ITEMS,
      };
    }
    return {
      firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de mamoplastia de aumento**:',
      subIntro: 'Estão **incluídos em seu procedimento de mamoplastia de aumento**:',
      items: BREAST_AUGMENTATION_SPECIFIC_ITEMS,
    };
  }

  return {
    firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento**:',
    subIntro: 'Estão **incluídos em seu procedimento**:',
    items: [],
  };
}

function dedupeItems(items: string[]) {
  return Array.from(new Set(items));
}

function buildIncludedGroups(
  entries: Array<{ category: ProcedureCategory; name: string }>,
): IncludedGroup[] {
  const groups: IncludedGroup[] = [];
  const consumed = new Set<number>();

  for (let index = 0; index < entries.length; index += 1) {
    if (consumed.has(index)) continue;

    const entry = entries[index];

    if (isLipoesculturaOnly(entry)) {
      const matchIndex = entries.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          !consumed.has(candidateIndex) &&
          isAbdominoplastyWithLipoescultura(candidate),
      );

      if (matchIndex !== -1) {
        const currentInfo = getCategoryInfo(entry.category, entry.name);
        const matchInfo = getCategoryInfo(entries[matchIndex].category, entries[matchIndex].name);
        consumed.add(index);
        consumed.add(matchIndex);
        groups.push({
          intro:
            'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de lipoescultura ou de abdominoplastia com lipoescultura**:',
          subIntro:
            'Estão **incluídos em seu procedimento de lipoescultura ou de abdominoplastia com lipoescultura**:',
          items: dedupeItems([...currentInfo.items, ...matchInfo.items]),
          argoplasmaLabel: 'lipoescultura ou de abdominoplastia com lipoescultura',
          supportsArgoplasma: true,
        });
        continue;
      }
    }

    if (isAbdominoplastyWithLipoescultura(entry)) {
      const matchIndex = entries.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          !consumed.has(candidateIndex) &&
          isLipoesculturaOnly(candidate),
      );

      if (matchIndex !== -1) {
        const currentInfo = getCategoryInfo(entry.category, entry.name);
        const matchInfo = getCategoryInfo(entries[matchIndex].category, entries[matchIndex].name);
        consumed.add(index);
        consumed.add(matchIndex);
        groups.push({
          intro:
            'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de lipoescultura ou de abdominoplastia com lipoescultura**:',
          subIntro:
            'Estão **incluídos em seu procedimento de lipoescultura ou de abdominoplastia com lipoescultura**:',
          items: dedupeItems([...matchInfo.items, ...currentInfo.items]),
          argoplasmaLabel: 'lipoescultura ou de abdominoplastia com lipoescultura',
          supportsArgoplasma: true,
        });
        continue;
      }
    }

    if (isLipoaspiracaoOnly(entry)) {
      const matchIndex = entries.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          !consumed.has(candidateIndex) &&
          isAbdominoplastyWithLipoaspiracao(candidate),
      );

      if (matchIndex !== -1) {
        const currentInfo = getCategoryInfo(entry.category, entry.name);
        const matchInfo = getCategoryInfo(entries[matchIndex].category, entries[matchIndex].name);
        consumed.add(index);
        consumed.add(matchIndex);
        groups.push({
          intro:
            'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de lipoaspiração ou de abdominoplastia com lipoaspiração**:',
          subIntro:
            'Estão **incluídos em seu procedimento de lipoaspiração ou de abdominoplastia com lipoaspiração**:',
          items: dedupeItems([...currentInfo.items, ...matchInfo.items]),
          argoplasmaLabel: 'lipoaspiração ou de abdominoplastia com lipoaspiração',
          supportsArgoplasma: true,
        });
        continue;
      }
    }

    if (isAbdominoplastyWithLipoaspiracao(entry)) {
      const matchIndex = entries.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          !consumed.has(candidateIndex) &&
          isLipoaspiracaoOnly(candidate),
      );

      if (matchIndex !== -1) {
        const currentInfo = getCategoryInfo(entry.category, entry.name);
        const matchInfo = getCategoryInfo(entries[matchIndex].category, entries[matchIndex].name);
        consumed.add(index);
        consumed.add(matchIndex);
        groups.push({
          intro:
            'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de lipoaspiração ou de abdominoplastia com lipoaspiração**:',
          subIntro:
            'Estão **incluídos em seu procedimento de lipoaspiração ou de abdominoplastia com lipoaspiração**:',
          items: dedupeItems([...matchInfo.items, ...currentInfo.items]),
          argoplasmaLabel: 'lipoaspiração ou de abdominoplastia com lipoaspiração',
          supportsArgoplasma: true,
        });
        continue;
      }
    }

    const info = getCategoryInfo(entry.category, entry.name);
    consumed.add(index);
    groups.push({
      intro: info.firstIntro,
      subIntro: info.subIntro,
      items: info.items,
      argoplasmaLabel: getProcedureLabel(entry),
      supportsArgoplasma: entry.category === 'abdominoplasty' || entry.category === 'lipo',
    });
  }

  return groups;
}

// ─── Public API ───

export function getIncludedSections(
  entries: Array<{ category: ProcedureCategory; name: string }>,
  options: { includeArgoplasma?: boolean } = {},
): IncludedSection[] {
  const isMulti = entries.length > 1;
  const hasAlternativeProcedures = shouldTreatAsAlternativeProcedures(entries);
  const shouldIncludeArgoplasma = options.includeArgoplasma === true;
  const supportsArgoplasma = (entry: { category: ProcedureCategory; name: string }) =>
    entry.category === 'abdominoplasty' || entry.category === 'lipo';

  if (!isMulti) {
    const info = getCategoryInfo(entries[0].category, entries[0].name);
    const argoplasmaItems =
      shouldIncludeArgoplasma && supportsArgoplasma(entries[0])
        ? getArgoplasmaIncludedItems(getProcedureLabel(entries[0]))
        : [];
    return [
      {
        intro: info.firstIntro,
        items: [...info.items, ...COMMON_ITEMS, ...argoplasmaItems],
      },
    ];
  }

  const groups = buildIncludedGroups(entries);

  if (hasAlternativeProcedures) {
    const seen = new Set<string>();
    let intro = '';
    const items: string[] = [];

    for (const entry of entries) {
      const key = `${entry.category}:${entry.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const info = getCategoryInfo(entry.category, entry.name);
      if (info.items.length === 0) continue;

      const argoplasmaItems =
        shouldIncludeArgoplasma && supportsArgoplasma(entry)
          ? getArgoplasmaIncludedItems(getProcedureLabel(entry))
          : [];

      if (!intro) {
        intro = info.firstIntro;
        items.push(...info.items, ...argoplasmaItems);
      } else {
        items.push(`[[paragraph]]${info.subIntro}`, ...info.items, ...argoplasmaItems);
      }
    }

    return [{
      intro,
      items: [...items, '[[paragraph]]Todos os **procedimentos incluem**:', ...COMMON_ITEMS],
    }];
  }

  let intro = '';
  const items: string[] = [];

  for (const group of groups) {
    if (group.items.length === 0) continue;

    if (!intro) {
      intro = group.intro;
      items.push(...group.items);
    } else {
      items.push(`[[paragraph]]${group.subIntro}`, ...group.items);
    }
    if (shouldIncludeArgoplasma && group.supportsArgoplasma && group.argoplasmaLabel) {
      items.push(...getArgoplasmaIncludedItems(group.argoplasmaLabel));
    }
  }

  const sharedItems = ['[[paragraph]]Todos os **procedimentos incluem**:', ...COMMON_ITEMS];
  if (!intro) {
    return [{
      intro: 'Todos os **procedimentos incluem**:',
      items: COMMON_ITEMS,
    }];
  }

  return [{
    intro,
    items: [...items, ...sharedItems],
  }];
}
