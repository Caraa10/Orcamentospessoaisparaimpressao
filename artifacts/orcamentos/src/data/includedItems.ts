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

function getArgoplasmaProcedureLabel(entry: {
  category: ProcedureCategory;
  name: string;
}): string {
  const normalizedName = entry.name
    .replace(/\s*\+\s*/g, ' e ')
    .replace(/\s+/g, ' ')
    .trim();

  const baseName = normalizedName
    .replace(/\s*-\s*lipoaspiraç[aã]o[\s\S]*$/i, '')
    .replace(/\s+e\s+lipoenxertia gl[uú]tea$/i, '')
    .trim()
    .toLowerCase();

  if (entry.category === 'abdominoplasty' && /abdominoplastia/i.test(baseName) && /lipo/i.test(baseName)) {
    return 'abdominoplastia e lipoescultura';
  }

  return baseName || 'procedimento';
}

// ─── Category-specific items ───

const LIPO_SPECIFIC_ITEMS: string[] = [
  '**SAFER (lipoaspiração ultrassônica)**: é um ultrassom cirúrgico que liquefaz a gordura, permitindo sua remoção de forma mais controlada, com menor trauma, menor sangramento, menos dor pós-operatória e mais previsibilidade cirúrgica',
  '**Vibrofit**: tecnologia que utiliza movimentos vibratórios para facilitar a retirada de gordura',
  '**Philips Lumify**: tecnologia que aumenta a segurança e precisão nas lipoenxertias',
  '**Irrigador cirúrgico**: para infusão de soluções para lipoaspiração de maneira mais controlada e rápida',
  '**Malha cirúrgica** (modelador): quando necessário, para proteção e suporte da área operada',
  '**Cinturão abdominal**: para estabilização dos tecidos operados',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
  '**Canaletas**: quando necessário, para definição das áreas de sombra do abdome',
  '**Taping**: quando necessário, para melhor posicionamento dos tecidos operados',
];

const ABDOMINOPLASTY_SPECIFIC_ITEMS: string[] = [
  '**SAFER (lipoaspiração ultrassônica)**: é um ultrassom cirúrgico que liquefaz a gordura, permitindo sua remoção de forma mais controlada, com menor trauma, menor sangramento, menos dor pós-operatória e mais previsibilidade cirúrgica',
  '**Vibrofit**: tecnologia que utiliza movimentos vibratórios para facilitar a retirada de gordura',
  '**Philips Lumify**: tecnologia que aumenta a segurança e precisão nas lipoenxertias',
  '**Irrigador cirúrgico**: para infusão de soluções para lipoaspiração de maneira mais controlada e rápida',
  '**Cola cirúrgica** (Prineo® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar no abdome',
  '**Malha cirúrgica** (modelador): quando necessário, para proteção e suporte da área operada',
  '**Cinturão abdominal**: para estabilização dos tecidos operados',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
  '**Canaletas**: quando necessário, para definição das áreas de sombra do abdome',
  '**Taping**: quando necessário, para melhor posicionamento dos tecidos operados',
];

const BREAST_AUGMENTATION_SPECIFIC_ITEMS: string[] = [
  '**Técnicas** de recuperação rápida, sutiã interno, alça de sustentação e, caso necessário, enxertia de gordura nas mamas (mamoplastia de aumento híbrida)',
  '**Funil de inserção** (funil de Keller): dispositivo que permite a inserção suave dos implantes, reduzindo riscos relacionados à cirurgia, tempo cirúrgico, dor pós-operatória e tamanho da incisão',
  '**Cola cirúrgica** (Dermabond® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar nas mamas',
  '**Sutiã cirúrgico**: para suporte adequado e proteção das mamas',
];

const BREAST_REDUCTION_SPECIFIC_ITEMS: string[] = [
  '**Técnicas** de sutiã interno, alça de sustentação e, caso necessário, enxertia de gordura nas mamas',
  '**Cola cirúrgica** (Prineo® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar na mama',
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

function getCategoryInfo(category: ProcedureCategory, procedureName: string): CategoryInfo {
  if (category === 'lipo') {
    return {
      firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de lipoescultura**:',
      subIntro: 'Estão **incluídos em seu procedimento de lipoescultura**:',
      items: LIPO_SPECIFIC_ITEMS,
    };
  }

  if (category === 'abdominoplasty') {
    const hasLipo = /lipoaspi|lipo/i.test(procedureName);
    const term = hasLipo ? 'abdominoplastia com lipoescultura' : 'abdominoplastia';
    return {
      firstIntro: `Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de ${term}**:`,
      subIntro: `Estão **incluídos em seu procedimento de ${term}**:`,
      items: ABDOMINOPLASTY_SPECIFIC_ITEMS,
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
    if (lower.includes('mastopexia')) {
      return {
        firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu procedimento de mastopexia**:',
        subIntro: 'Estão **incluídos em seu procedimento de mastopexia**:',
        items: MASTOPEXY_SPECIFIC_ITEMS,
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

// ─── Public API ───

export function getIncludedSections(
  entries: Array<{ category: ProcedureCategory; name: string }>,
  options: { includeArgoplasma?: boolean } = {},
): IncludedSection[] {
  const isMulti = entries.length > 1;
  const shouldIncludeArgoplasma = options.includeArgoplasma === true;
  const supportsArgoplasma = (entry: { category: ProcedureCategory; name: string }) =>
    entry.category === 'abdominoplasty' || entry.category === 'lipo';

  if (!isMulti) {
    const info = getCategoryInfo(entries[0].category, entries[0].name);
    const argoplasmaItems =
      shouldIncludeArgoplasma && supportsArgoplasma(entries[0])
        ? getArgoplasmaIncludedItems(getArgoplasmaProcedureLabel(entries[0]))
        : [];
    return [
      {
        intro: info.firstIntro,
        items: [...info.items, ...argoplasmaItems, ...COMMON_ITEMS],
      },
    ];
  }

  const seen = new Set<string>();
  let intro = '';
  const items: string[] = [];

  for (const entry of entries) {
    const key = `${entry.category}:${entry.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const info = getCategoryInfo(entry.category, entry.name);
    if (info.items.length === 0) continue;

    if (!intro) {
      intro = info.firstIntro;
      items.push(...info.items);
    } else {
      items.push(`[[paragraph]]${info.subIntro}`, ...info.items);
    }
    if (shouldIncludeArgoplasma && supportsArgoplasma(entry)) {
      items.push(...getArgoplasmaIncludedItems(getArgoplasmaProcedureLabel(entry)));
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
