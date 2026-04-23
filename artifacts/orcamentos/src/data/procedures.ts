export type BillingUnit =
  | 'procedure'
  | 'tooth'
  | 'arch'
  | 'session'
  | 'unit'
  | 'package'
  | 'area'
  | 'syringe'
  | 'month'
  | 'quadrant';

export interface Procedure {
  id: string;
  category: string;
  name: string;
  price: number;
  billingUnit: BillingUnit;
  defaultQuantity: number;
  description: string;
}

export const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  procedure: 'por procedimento',
  tooth: 'por dente',
  arch: 'por arcada',
  session: 'por sessao',
  unit: 'por unidade',
  package: 'pacote',
  area: 'por area',
  syringe: 'por seringa',
  month: 'mensalidade',
  quadrant: 'por quadrante',
};

export const TOOTH_NUMBERS = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export const PROCEDURES: Procedure[] = [
  {
    id: 'consulta-inicial-avaliacao',
    category: 'Rotina / Preventivo',
    name: 'Consulta inicial / avaliacao',
    price: 300,
    billingUnit: 'procedure',
    defaultQuantity: 1,
    description: 'Avaliacao clinica, orientacoes iniciais e planejamento do tratamento.',
  },
  {
    id: 'limpeza-profilaxia',
    category: 'Rotina / Preventivo',
    name: 'Limpeza / profilaxia',
    price: 600,
    billingUnit: 'session',
    defaultQuantity: 1,
    description: 'Profilaxia profissional realizada por sessao.',
  },
  {
    id: 'aplicacao-de-fluor',
    category: 'Rotina / Preventivo',
    name: 'Aplicacao de fluor',
    price: 250,
    billingUnit: 'session',
    defaultQuantity: 1,
    description: 'Aplicacao topica preventiva, geralmente cobrada por sessao.',
  },
  {
    id: 'radiografia-periapical',
    category: 'Rotina / Preventivo',
    name: 'Radiografia periapical',
    price: 80,
    billingUnit: 'unit',
    defaultQuantity: 1,
    description: 'Valor por tomada radiografica.',
  },
  {
    id: 'restauracao-em-resina',
    category: 'Dentistica restauradora',
    name: 'Restauracao em resina',
    price: 500,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por dente, podendo variar conforme extensao e numero de faces.',
  },
  {
    id: 'restauracao-estetica-anterior',
    category: 'Dentistica restauradora',
    name: 'Restauracao estetica anterior',
    price: 800,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por dente anterior, indicado para restauracoes com exigencia estetica maior.',
  },
  {
    id: 'tratamento-de-canal-incisivo',
    category: 'Endodontia',
    name: 'Tratamento de canal (incisivo)',
    price: 1200,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por dente incisivo.',
  },
  {
    id: 'tratamento-de-canal-molar',
    category: 'Endodontia',
    name: 'Tratamento de canal (molar)',
    price: 2500,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por dente molar, geralmente mais complexo por ter mais canais.',
  },
  {
    id: 'extracao-simples',
    category: 'Cirurgia oral',
    name: 'Extracao simples',
    price: 400,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por dente extraido.',
  },
  {
    id: 'extracao-de-siso',
    category: 'Cirurgia oral',
    name: 'Extracao de siso',
    price: 1000,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por terceiro molar, sujeito a ajuste conforme inclusao e dificuldade cirurgica.',
  },
  {
    id: 'raspagem-tratamento-gengival',
    category: 'Periodontia',
    name: 'Raspagem / tratamento gengival',
    price: 1200,
    billingUnit: 'quadrant',
    defaultQuantity: 1,
    description: 'Valor por quadrante ou regiao periodontal tratada.',
  },
  {
    id: 'coroa-unitaria-metaloceramica-zirconia',
    category: 'Protese',
    name: 'Coroa unitaria (metaloceramica/zirconia)',
    price: 3500,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por elemento protetico.',
  },
  {
    id: 'protese-parcial-removivel',
    category: 'Protese',
    name: 'Protese parcial removivel',
    price: 3000,
    billingUnit: 'arch',
    defaultQuantity: 1,
    description: 'Valor por arcada, conforme planejamento protetico.',
  },
  {
    id: 'implante-dentario-coroa',
    category: 'Implantodontia',
    name: 'Implante dentario + coroa',
    price: 8000,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por implante com coroa protetica.',
  },
  {
    id: 'aparelho-fixo-instalacao',
    category: 'Ortodontia',
    name: 'Aparelho fixo (instalacao)',
    price: 4000,
    billingUnit: 'package',
    defaultQuantity: 1,
    description: 'Valor de instalacao do aparelho conforme planejamento ortodontico.',
  },
  {
    id: 'manutencao-mensal',
    category: 'Ortodontia',
    name: 'Manutencao mensal',
    price: 400,
    billingUnit: 'month',
    defaultQuantity: 1,
    description: 'Valor por mensalidade de acompanhamento ortodontico.',
  },
  {
    id: 'clareamento-dental',
    category: 'Estetica odontologica',
    name: 'Clareamento dental',
    price: 1500,
    billingUnit: 'package',
    defaultQuantity: 1,
    description: 'Pacote de clareamento conforme tecnica indicada pelo dentista.',
  },
  {
    id: 'lente-de-contato-dental',
    category: 'Estetica odontologica',
    name: 'Lente de contato dental',
    price: 2500,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por dente.',
  },
  {
    id: 'faceta-em-porcelana',
    category: 'Estetica odontologica',
    name: 'Faceta em porcelana',
    price: 3500,
    billingUnit: 'tooth',
    defaultQuantity: 1,
    description: 'Valor por dente.',
  },
  {
    id: 'toxina-botulinica-1-area',
    category: 'Harmonizacao Orofacial',
    name: 'Toxina botulinica (1 area)',
    price: 1800,
    billingUnit: 'area',
    defaultQuantity: 1,
    description: 'Valor por area tratada.',
  },
  {
    id: 'toxina-botulinica-full-face',
    category: 'Harmonizacao Orofacial',
    name: 'Toxina botulinica (full face)',
    price: 3000,
    billingUnit: 'package',
    defaultQuantity: 1,
    description: 'Pacote full face.',
  },
  {
    id: 'preenchimento-acido-hialuronico-1-seringa',
    category: 'Harmonizacao Orofacial',
    name: 'Preenchimento com acido hialuronico',
    price: 3500,
    billingUnit: 'syringe',
    defaultQuantity: 1,
    description: 'Valor por seringa.',
  },
  {
    id: 'preenchimento-labial',
    category: 'Harmonizacao Orofacial',
    name: 'Preenchimento labial',
    price: 3000,
    billingUnit: 'procedure',
    defaultQuantity: 1,
    description: 'Valor por procedimento.',
  },
  {
    id: 'bioestimuladores-de-colageno',
    category: 'Harmonizacao Orofacial',
    name: 'Bioestimuladores de colageno',
    price: 4500,
    billingUnit: 'session',
    defaultQuantity: 1,
    description: 'Valor por sessao/protocolo indicado.',
  },
  {
    id: 'fios-de-sustentacao',
    category: 'Harmonizacao Orofacial',
    name: 'Fios de sustentacao',
    price: 6000,
    billingUnit: 'procedure',
    defaultQuantity: 1,
    description: 'Valor por procedimento, conforme quantidade de fios planejada.',
  },
];
