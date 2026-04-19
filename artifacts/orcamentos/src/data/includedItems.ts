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

// ─── Category-specific items ───

const LIPO_SPECIFIC_ITEMS: string[] = [
  '**SAFER (lipoaspiração ultrassônica)**: é um ultrassom cirúrgico que liquefaz a gordura, permitindo sua remoção de forma mais controlada, com menor trauma, menor sangramento, menos dor pós-operatória e mais previsibilidade cirúrgica',
  '**Vibrofit**: tecnologia que utiliza movimentos vibratórios para facilitar a retirada de gordura',
  '**Philips Lumify**: tecnologia que aumenta a segurança e precisão nas lipoenxertias',
  '**Irrigador cirúrgico**: para infusão de soluções para lipoaspiração de maneira mais controlada e rápida',
  '**Malha cirúrgica** (modelador): proteção e suporte da área operada',
  '**Cinturão abdominal**: para estabilização dos tecidos operados',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
  '**Canaletas**: para definição das áreas de sombra do abdome',
  '**Taping**: quando necessário, para melhor posicionamento dos tecidos operados',
];

const ABDOMINOPLASTY_SPECIFIC_ITEMS: string[] = [
  '**SAFER (lipoaspiração ultrassônica)**: é um ultrassom cirúrgico que liquefaz a gordura, permitindo sua remoção de forma mais controlada, com menor trauma, menor sangramento, menos dor pós-operatória e mais previsibilidade cirúrgica',
  '**Vibrofit**: tecnologia que utiliza movimentos vibratórios para facilitar a retirada de gordura',
  '**Philips Lumify**: tecnologia que aumenta a segurança e precisão nas lipoenxertias',
  '**Irrigador cirúrgico**: para infusão de soluções para lipoaspiração de maneira mais controlada e rápida',
  '**Cola cirúrgica** (Prineo® Johnson&Johnson): funciona como curativo (você não precisa se preocupar em fazer curativos no pós-operatório) e não há pontos para retirar no abdome',
  '**Malha cirúrgica** (modelador): proteção e suporte da área operada',
  '**Cinturão abdominal**: para estabilização dos tecidos operados',
  '**Meia elástica** (meia de compressão cirúrgica): para redução de riscos',
  '**Canaletas**: para definição das áreas de sombra do abdome',
  '**Taping**: quando necessário, para melhor posicionamento dos tecidos operados',
];

const BREAST_AUGMENTATION_SPECIFIC_ITEMS: string[] = [
  '**Técnicas** de recuperação rápida, sutiã interno, alça de sustentação e, caso necessário, enxertia de gordura nas mamas (mamoplastia de aumento híbrida)',
  '**Funil de inserção** (funil de Keller): dispositivo que permite a inserção suave dos implantes, reduzindo riscos relacio-\nnados à cirurgia, tempo cirúrgico, dor pós-operatória e tamanho da incisão',
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
  '**Funil de inserção** (funil de Keller): dispositivo que permite a inserção suave dos implantes, reduzindo riscos relacio\u00ADnados à cirurgia, tempo cirúrgico e dor pós-operatória',
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
      firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu investimento de lipoescultura**:',
      subIntro: 'Estão **incluídos em seu investimento de lipoescultura**:',
      items: LIPO_SPECIFIC_ITEMS,
    };
  }

  if (category === 'abdominoplasty') {
    const hasLipo = /lipoaspi|lipo/i.test(procedureName);
    const term = hasLipo ? 'abdominoplastia com lipoescultura' : 'abdominoplastia';
    return {
      firstIntro: `Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu investimento de ${term}**:`,
      subIntro: `Estão **incluídos em seu investimento de ${term}**:`,
      items: ABDOMINOPLASTY_SPECIFIC_ITEMS,
    };
  }

  if (category === 'breast') {
    const lower = procedureName.toLowerCase();
    if (lower.includes('redutora')) {
      return {
        firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu investimento de mamoplastia redutora**:',
        subIntro: 'Estão **incluídos em seu investimento de mamoplastia redutora**:',
        items: BREAST_REDUCTION_SPECIFIC_ITEMS,
      };
    }
    if (lower.includes('mastopexia')) {
      return {
        firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu investimento de mastopexia**:',
        subIntro: 'Estão **incluídos em seu investimento de mastopexia**:',
        items: MASTOPEXY_SPECIFIC_ITEMS,
      };
    }
    return {
      firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu investimento de mamoplastia de aumento**:',
      subIntro: 'Estão **incluídos em seu investimento de mamoplastia de aumento**:',
      items: BREAST_AUGMENTATION_SPECIFIC_ITEMS,
    };
  }

  return {
    firstIntro: 'Dessa forma, tendo como objetivo oferecer o melhor para você, já **incluímos em seu investimento**:',
    subIntro: 'Estão **incluídos em seu investimento**:',
    items: [],
  };
}

// ─── Public API ───

export function getIncludedSections(
  entries: Array<{ category: ProcedureCategory; name: string }>,
): IncludedSection[] {
  const isMulti = entries.length > 1;

  if (!isMulti) {
    const info = getCategoryInfo(entries[0].category, entries[0].name);
    return [
      {
        intro: info.firstIntro,
        items: [...info.items, ...COMMON_ITEMS],
      },
    ];
  }

  // Multi-procedure: deduplicate and build per-category sections
  const seen = new Set<string>();
  const sections: IncludedSection[] = [];
  let isFirst = true;

  for (const entry of entries) {
    const key = `${entry.category}:${entry.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const info = getCategoryInfo(entry.category, entry.name);
    if (info.items.length === 0) continue;

    sections.push({
      intro: isFirst ? info.firstIntro : info.subIntro,
      items: info.items,
    });
    isFirst = false;
  }

  // Shared section
  sections.push({
    intro: 'Todos os **investimentos incluem**:',
    items: COMMON_ITEMS,
  });

  return sections;
}
