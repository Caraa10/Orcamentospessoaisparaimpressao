import { forwardRef, Fragment, useLayoutEffect, useRef, useState } from 'react';
import type { QuoteData } from '@/types/quote';
import { calcPaymentOptions, formatBRLNoSymbol, calcInstallmentValue } from '@/utils/calculations';
import { getIncludedSections } from '@/data/includedItems';
import { ARGOPLASMA_PRICE, ARGOPLASMA_PRICE_6X, ARGOPLASMA_PRICE_12X, IMPLANT_PRICES } from '@/data/procedures';

interface Props {
  data: QuoteData;
}

const PRINT_BLACK = '#000000';
const PRINT_BACKGROUND = '#ffffff';

function formatCoverDate(dateValue: string) {
  const baseDate = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(baseDate);
}

function getCoverPatientNameStyle(patientName: string) {
  const normalizedName = patientName.trim().replace(/\s+/g, ' ');
  const nameLength = normalizedName.length;
  const wordCount = normalizedName ? normalizedName.split(' ').length : 0;

  let fontSize = 34;
  let lineHeight = 1.1;

  if (nameLength > 28 || wordCount > 4) fontSize = 30;
  if (nameLength > 38 || wordCount > 5) {
    fontSize = 27;
    lineHeight = 1.14;
  }
  if (nameLength > 48 || wordCount > 6) {
    fontSize = 24;
    lineHeight = 1.16;
  }
  if (nameLength > 58 || wordCount > 7) {
    fontSize = 21;
    lineHeight = 1.18;
  }
  if (nameLength > 70 || wordCount > 8) {
    fontSize = 19;
    lineHeight = 1.2;
  }

  return {
    fontSize: `${fontSize}pt`,
    lineHeight,
  };
}

function withLineBreaks(text: string, keyPrefix: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <Fragment key={`${keyPrefix}-${i}`}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

function ItemRenderer({ text }: { text: string }) {
  const segments = text.split('\n');
  if (segments.length === 1) return <BoldText text={text} />;
  return (
    <>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        if (isLast) return <BoldText key={i} text={seg} />;
        return (
          <span key={i} style={{ display: 'block', textAlignLast: 'justify' }}>
            <BoldText text={seg} />
          </span>
        );
      })}
    </>
  );
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i}>{withLineBreaks(part, `b${i}`)}</strong>
        ) : (
          <Fragment key={i}>{withLineBreaks(part, `t${i}`)}</Fragment>
        ),
      )}
    </>
  );
}

function isInlineParagraph(item: string) {
  return item.startsWith('[[paragraph]]');
}

function stripInlineParagraphMarker(item: string) {
  return item.replace('[[paragraph]]', '');
}

function joinProcedureTitles(names: string[]) {
  if (shouldUseNeutralCombinedTitle(names)) {
    return 'Procedimentos Selecionados';
  }

  const title = buildLipoGroupedTitle(names);
  if (title) return title;

  const cleanNames = names.map((name) => normalizeProcedureTitleBasic(name));
  return joinPortuguese(cleanNames);
}

function normalizeComparisonText(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isMamoplastiaAumentoFamily(title: string) {
  return normalizeComparisonText(title).includes('mamoplastia de aumento');
}

function isMastopexiaFamily(title: string) {
  return normalizeComparisonText(title).includes('mastopexia');
}

function shouldUseNeutralCombinedTitle(names: string[]) {
  if (names.length <= 1) return false;
  const hasMamoplastiaAumento = names.some(isMamoplastiaAumentoFamily);
  const hasMastopexia = names.some(isMastopexiaFamily);
  return hasMamoplastiaAumento && hasMastopexia;
}

function shouldHideCombinedSummaryPage(names: string[]) {
  return shouldUseNeutralCombinedTitle(names);
}

function normalizeProcedureTitleBasic(title: string) {
  const parts = title
    .split(/\s*\+\s*/g)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return title;
  return joinPortuguese(parts);
}

function formatProcedureDisplayTitle(title: string) {
  return buildLipoGroupedTitle([title]) ?? normalizeProcedureTitleBasic(title);
}

function joinPortuguese(parts: string[]) {
  const cleanParts = parts.map((part) => part.trim()).filter(Boolean);
  if (cleanParts.length <= 1) return cleanParts[0] ?? '';
  if (
    cleanParts.length === 2 &&
    /\be lipoescultura\b/i.test(cleanParts[1])
  ) {
    return `${cleanParts[0]}, ${cleanParts[1]}`;
  }
  if (cleanParts.length === 2) return `${cleanParts[0]} e ${cleanParts[1]}`;
  return `${cleanParts.slice(0, -1).join(', ')} e ${cleanParts[cleanParts.length - 1]}`;
}

const LIPO_AREAS = [
  { key: 'pre-axilas', label: 'Pré-Axilas', patterns: [/pré-axilas/i, /pre-axilas/i] },
  { key: 'contorno-mamario', label: 'Contorno Mamário', patterns: [/contorno mamário/i, /contorno mamario/i] },
  { key: 'submento', label: 'Submento', patterns: [/submento/i] },
  { key: 'abdome', label: 'Abdome', patterns: [/abdome/i] },
  { key: 'flancos', label: 'Flancos', patterns: [/flancos?/i] },
  { key: 'laterais-quadril', label: 'Laterais do Quadril', patterns: [/laterais do quadril/i, /lateral do quadril/i] },
  { key: 'face-interna-coxas', label: 'Face Interna das Coxas', patterns: [/face interna das coxas/i, /fi coxas/i, /fi das coxas/i, /fi de coxas/i] },
  { key: 'culotes', label: 'Culotes', patterns: [/culotes?/i] },
  { key: 'bracos', label: 'Braços', patterns: [/braços/i, /bracos/i] },
  { key: 'dorso', label: 'Dorso', patterns: [/dorso/i] },
];

function getLipoAreas(title: string) {
  return LIPO_AREAS.filter((area) => area.patterns.some((pattern) => pattern.test(title)));
}

function stripLipoSegments(title: string) {
  return title
    .split(/\s*\+\s*/g)
    .map((part) => part.trim())
    .filter((part) => part && !/lipoaspiração/i.test(part) && getLipoAreas(part).length === 0);
}

function buildLipoGroupedTitle(names: string[]) {
  const areaKeys = new Set<string>();
  const segments: string[] = [];
  let hasAnyLipo = false;
  let hasGlutealFatGrafting = false;

  for (const rawName of names) {
    const parts = rawName
      .split(/\s*\+\s*/g)
      .flatMap((part) => splitProcedureChunk(part))
      .filter(Boolean);

    for (const part of parts) {
      if (/lipoenxertia gl[uú]tea/i.test(part)) {
        hasGlutealFatGrafting = true;
        continue;
      }
      const areas = getLipoAreas(part);
      if (/lipoaspiração/i.test(part) || areas.length > 0) {
        hasAnyLipo = true;
        for (const area of areas) areaKeys.add(area.key);
        continue;
      }
      segments.push(normalizeProcedureTitleBasic(part));
    }
  }

  if (!hasAnyLipo) return null;

  const uniqueSegments = Array.from(new Set(segments.map(normalizeProcedureTitleBasic)));
  const orderedAreas = LIPO_AREAS.filter((area) => areaKeys.has(area.key)).map((area) => area.label);

  if (orderedAreas.length > 0) {
    let lipoTitle = `Lipoaspiração de ${joinPortuguese(orderedAreas)}`;
    if (hasGlutealFatGrafting) {
      lipoTitle += ' e Lipoenxertia Glútea';
    }

    const lipoesculturaIndex = uniqueSegments.findIndex((segment) => /lipoescultura$/i.test(segment));
    if (lipoesculturaIndex >= 0) {
      const [lipoesculturaSegment] = uniqueSegments.splice(lipoesculturaIndex, 1);
      uniqueSegments.push(`${lipoesculturaSegment} - ${lipoTitle}`);
    } else {
      uniqueSegments.push(lipoTitle);
    }
  } else if (hasGlutealFatGrafting) {
    uniqueSegments.push('Lipoenxertia Glútea');
  }

  return joinPortuguese(uniqueSegments).replace(/\s-\s+e\s+(lipoaspiração)/i, ' - $1');
}

function splitProcedureChunk(part: string) {
  const trimmed = part.trim();
  if (!/lipoaspiração/i.test(trimmed)) {
    return [trimmed];
  }

  const lipoIndex = trimmed.search(/lipoaspiração/i);
  const before = trimmed
    .slice(0, lipoIndex)
    .replace(/[-,\s]+$/g, '')
    .replace(/\s+e\s*$/i, '')
    .trim();
  let afterLipo = trimmed.slice(lipoIndex).trim();
  const trailingProcedures = ['Lipoenxertia Glútea'];
  const extracted: string[] = [];

  for (const procedure of trailingProcedures) {
    const pattern = new RegExp(`^(.*?)(?:\\s+e\\s+|,\\s*|\\s+)(${procedure})$`, 'i');
    const match = afterLipo.match(pattern);
    if (match) {
      afterLipo = match[1].trim().replace(/[,\s]+$/g, '');
      extracted.push(match[2]);
      break;
    }
  }

  return [before, afterLipo, ...extracted].filter(Boolean);
}

function getTitleBreakPenalty(firstLine: string, nextLine: string) {
  let penalty = 0;

  if (/[,:;]$/.test(firstLine)) penalty += 24;
  if (/\b(de|da|do|das|dos|e)\s*$/i.test(firstLine)) penalty += 18;
  if (/[-–—]\s*$/i.test(firstLine)) penalty += 22;
  if (/^(abdome|flancos?|dorso|braços|bracos|culotes?|submento|pré-axilas|pre-axilas|face|laterais|lipoaspiração|lipoenxertia)/i.test(nextLine)) {
    penalty += 18;
  }

  return penalty;
}

function scoreTitleLines(lines: string[], titleLength: number) {
  const target = titleLength / lines.length;
  let score = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const diff = Math.abs(line.length - target);
    score += diff * diff;

    if (line.length < 18) score += 160;
    if (line.split(/\s+/).length <= 1) score += 220;

    if (i < lines.length - 1) {
      score += getTitleBreakPenalty(line, lines[i + 1]);
    }
  }

  const longest = Math.max(...lines.map((line) => line.length));
  score += Math.max(0, longest - 46) * 35;

  return score;
}

function getBalancedTitleLines(title: string) {
  const words = title.trim().split(/\s+/);
  if (title.length < 34 || words.length < 4) return [title.toUpperCase()];

  let bestLines = [title];
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = 1; i < words.length; i++) {
    const lines = [
      words.slice(0, i).join(' '),
      words.slice(i).join(' '),
    ];
    const score = scoreTitleLines(lines, title.length);
    if (score < bestScore) {
      bestScore = score;
      bestLines = lines;
    }
  }

  if (words.length >= 6) {
    for (let i = 1; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const lines = [
          words.slice(0, i).join(' '),
          words.slice(i, j).join(' '),
          words.slice(j).join(' '),
        ];
        const score = scoreTitleLines(lines, title.length);
        if (score < bestScore) {
          bestScore = score;
          bestLines = lines;
        }
      }
    }
  }

  return bestLines.map((line) => line.toUpperCase());
}

function preventCompoundWordBreaks(text: string) {
  return text.replace(/([A-Za-zÀ-ÿ])\-([A-Za-zÀ-ÿ])/g, '$1‑$2');
}

function ProcedureTitle({ title }: { title: string }) {
  return (
    <div className="p-proc-title">
      {getBalancedTitleLines(title).map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {preventCompoundWordBreaks(line)}
        </Fragment>
      ))}
    </div>
  );
}

// Pricing block for equipe cirúrgica
function FeeEquipe({ surgeryBase }: { surgeryBase: number }) {
  const p = calcPaymentOptions(surgeryBase);
  return (
    <div className="p-fee">
      <div className="p-fee-label">Equipe Cirúrgica</div>
      <div className="p-fee-value">R$ {formatBRLNoSymbol(p.avista)}</div>
      <div className="p-fee-options">
        - à vista (PIX ou transferência)<br />
        - de 1 a 6 vezes (cartão de crédito): R$ {formatBRLNoSymbol(p.ate6x)}<br />
        - de 7 a 12 vezes (cartão de crédito): R$ {formatBRLNoSymbol(p.ate12x)}
      </div>
    </div>
  );
}

// Pricing block for anestesista
function FeeAnestesista({ anesthesiaBase }: { anesthesiaBase: number }) {
  if (anesthesiaBase <= 0) return null;
  const p = calcPaymentOptions(anesthesiaBase);
  return (
    <div className="p-fee">
      <div className="p-fee-label">Anestesista</div>
      <div className="p-fee-value">R$ {formatBRLNoSymbol(p.avista)}</div>
      <div className="p-fee-options">
        - à vista (PIX ou transferência)<br />
        - de 1 a 6 vezes (cartão de crédito): R$ {formatBRLNoSymbol(p.ate6x)}<br />
        - de 7 a 12 vezes (cartão de crédito): R$ {formatBRLNoSymbol(p.ate12x)}
      </div>
    </div>
  );
}

// Hospital block
function FeeHospital({ name, min, max }: { name: string; min: number; max: number }) {
  return (
    <div className="p-fee">
      <div className="p-fee-label">Hospital</div>
      <div className="p-hospital-name">{name}</div>
      <div className="p-hospital-range">
        {min === max
          ? <>R$ {formatBRLNoSymbol(min)}</>
          : <>R$ {formatBRLNoSymbol(min)} - {formatBRLNoSymbol(max)}<span className="p-hospital-range-note">(estimativa de valor)</span></>
        }
      </div>
      <div className="p-fee-options">
        - à vista ou em até 2 vezes (cartão de crédito)
      </div>
    </div>
  );
}

// Argoplasma block
function FeeArgoplasma() {
  return (
    <div className="p-fee">
      <div className="p-fee-label">Argoplasma (opcional)</div>
      <div className="p-fee-value">R$ {formatBRLNoSymbol(ARGOPLASMA_PRICE)}</div>
      <div className="p-fee-options">
        - à vista (PIX ou transferência)<br />
        - de 1 a 6 vezes (cartão de crédito): R$ {formatBRLNoSymbol(ARGOPLASMA_PRICE_6X)}<br />
        - de 7 a 12 vezes (cartão de crédito): R$ {formatBRLNoSymbol(ARGOPLASMA_PRICE_12X)}
      </div>
    </div>
  );
}

type SectionPart = {
  sectionIdx: number;
  partIdx: number;
  showSectionIntro: boolean;
  showGlobalIntro: boolean;
  items: string[];
};

const QuotePrint = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const isMulti = data.procedures.length > 1;
  const isCombinedSurgery = data.combinedSurgery ?? true;

  const includedSections = getIncludedSections(
    data.procedures.map((e) => ({ category: e.procedure.category, name: e.procedure.name })),
    { includeArgoplasma: data.includeArgoplasma },
  );

  const initialParts: SectionPart[] = includedSections.map((s, idx) => ({
    sectionIdx: idx,
    partIdx: 0,
    showSectionIntro: true,
    showGlobalIntro: idx === 0,
    items: s.items,
  }));
  const [parts, setParts] = useState<SectionPart[]>(initialParts);
  const partRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLayoutEffect(() => {
    // Wait for fonts so measurements are accurate
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      for (let i = 0; i < parts.length; i++) {
        const el = partRefs.current[i];
        if (!el) continue;
        if (el.scrollHeight > el.clientHeight + 1) {
          const part = parts[i];
          if (part.items.length <= 1) continue;
          const newCount = part.items.length - 1;
          const overflow = part.items.slice(newCount);
          const reduced: SectionPart = { ...part, items: part.items.slice(0, newCount) };
          const next = parts[i + 1];
          const newParts = [...parts];
          if (next && next.sectionIdx === part.sectionIdx) {
            newParts[i] = reduced;
            newParts[i + 1] = { ...next, items: [...overflow, ...next.items] };
          } else {
            newParts[i] = reduced;
            newParts.splice(i + 1, 0, {
              sectionIdx: part.sectionIdx,
              partIdx: part.partIdx + 1,
              showSectionIntro: false,
              showGlobalIntro: false,
              items: overflow,
            });
          }
          setParts(newParts);
          return;
        }
      }
    };
    if (document.fonts && (document.fonts as any).ready) {
      (document.fonts as any).ready.then(run);
    } else {
      run();
    }
    return () => {
      cancelled = true;
    };
  }, [parts]);

  // Last part index per section (for argoplasma anchor)
  const lastPartIdxBySection = new Map<number, number>();
  parts.forEach((p, i) => lastPartIdxBySection.set(p.sectionIdx, i));

  const costComponents: string[] = ['equipe cirúrgica', 'anestesista', 'hospital'];
  if (data.includeImplants) costComponents.push('implantes');
  if (data.includeArgoplasma) costComponents.push('argoplasma (opcional)');

  // Combined totals for multi-procedure summary page
  const procedureNames = data.procedures.map((e) => e.procedure.name);
  const totalSurgery = data.procedures.reduce((s, e) => s + e.prices.surgery, 0);
  const totalAnesthesia = data.procedures.reduce((s, e) => s + e.prices.anesthesia, 0);
  const combinedTitle = joinProcedureTitles(procedureNames);
  const hideCombinedSummaryPage = shouldHideCombinedSummaryPage(procedureNames);

  return (
    <div ref={ref} className="print-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Pinyon+Script&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
        }

        .print-root {
          font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 400;
          --pdf-margin-top: 40mm;
          --pdf-margin-right: 20mm;
          --pdf-margin-bottom: 26mm;
          --pdf-margin-left: 40mm;
          color: ${PRINT_BLACK};
          background: ${PRINT_BACKGROUND};
        }

        @media print {
          * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: geometricPrecision !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* ══════════════════════════════════════
           SHARED: explicit page cards
        ══════════════════════════════════════ */
        .page {
          width: 210mm;
          background: ${PRINT_BACKGROUND};
          color: ${PRINT_BLACK};
          position: relative;
          page-break-before: always;
          break-before: page;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
          overflow: hidden;
        }
        /* Cover is exact height */
        .page-cover {
          height: 297mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 var(--pdf-margin-right) 0 var(--pdf-margin-left);
          page-break-before: avoid;
          break-before: avoid;
        }
        /* Content/pricing pages: exact A4 height to avoid overflow into next page */
        .page-content {
          height: 297mm;
          padding: 0;
          font-size: 12pt;
          line-height: 1.54;
          color: ${PRINT_BLACK};
          position: relative;
        }
        .page-body {
          height: calc(297mm - var(--pdf-margin-top) - var(--pdf-margin-bottom));
          margin: var(--pdf-margin-top) var(--pdf-margin-right) var(--pdf-margin-bottom) var(--pdf-margin-left);
          overflow: hidden;
          font-family: 'Avenir Next', sans-serif;
          text-align: justify;
        }

        /* ══════════════════════════════════════
           FLOWING TEXT SECTION (pages 2-4)
           No explicit page breaks — let browser paginate naturally
        ══════════════════════════════════════ */
        .content-flow {
          width: 210mm;
          background: ${PRINT_BACKGROUND};
          padding: var(--pdf-margin-top) var(--pdf-margin-right) var(--pdf-margin-bottom) var(--pdf-margin-left);
          font-size: 8pt;
          line-height: 1.55;
          color: ${PRINT_BLACK};
          font-family: 'Avenir Next', sans-serif;
          /* force a new page after this section in print */
          page-break-after: always;
          break-after: page;
        }
        .content-flow-footer {
          margin-top: 10mm;
          display: flex;
          justify-content: center;
        }

        /* ══════════════════════════════════════
           COVER
        ══════════════════════════════════════ */
        .cover-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 66mm;
          gap: 26mm;
        }
        .cover-title {
          font-family: 'Avenir Next', sans-serif;
          font-size: 13pt;
          font-weight: 400;
          letter-spacing: normal;
          text-transform: uppercase;
          color: ${PRINT_BLACK};
          text-align: center;
          line-height: 1.4;
        }
        .cover-patient-name {
          font-family: 'Snell Roundhand', 'Pinyon Script', cursive;
          font-weight: 700;
          color: ${PRINT_BLACK};
          text-align: center;
          position: absolute;
          top: 50%;
          left: var(--pdf-margin-left);
          right: var(--pdf-margin-right);
          transform: translateY(-50%);
          max-width: calc(210mm - var(--pdf-margin-left) - var(--pdf-margin-right));
          overflow-wrap: break-word;
          word-break: normal;
          hyphens: none;
        }
        .cover-date {
          position: absolute;
          left: var(--pdf-margin-left);
          right: var(--pdf-margin-right);
          bottom: 34mm;
          font-family: 'Avenir Next', sans-serif;
          font-size: 11pt;
          font-weight: 400;
          color: ${PRINT_BLACK};
          text-align: center;
          line-height: 1.3;
        }
        /* ══════════════════════════════════════
           CONTENT — TEXT
        ══════════════════════════════════════ */
        .p-intro {
          font-size: 11pt;
          margin-bottom: 4mm;
          text-align: justify;
          line-height: 1.58;
        }
        .p-intro + .p-intro {
          margin-bottom: 10pt;
        }
        .p-section-intro {
          font-size: 11pt;
          margin-top: 2mm;
          margin-bottom: 6pt;
          text-align: justify;
          line-height: 1.58;
        }
        .p-intro + .p-intro + .p-section-intro {
          margin-top: 5mm;
        }
        .p-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 4mm;
        }
        .p-list li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 1.25mm;
          line-height: 1.58;
          text-align: justify;
        }
        .p-list li.p-inline-paragraph {
          display: block;
          margin-top: 4mm;
          margin-bottom: 1.5mm;
          line-height: 1.58;
        }
        .p-list li.p-inline-paragraph + .p-inline-paragraph {
          margin-top: 4.5mm;
        }
        .p-list-bullet {
          flex-shrink: 0;
          margin-right: 3mm;
          margin-top: 0.05em;
          font-size: 11pt;
          line-height: 1.58;
        }
        .p-list-text {
          flex: 1;
          font-size: 11pt;
          text-align: justify;
          line-height: 1.58;
        }

        /* ══════════════════════════════════════
           CONTENT — PRICING
        ══════════════════════════════════════ */
        .p-hr {
          border: none;
          border-top: 0.5pt solid rgba(0,0,0,0.35);
          margin: 6mm 0;
        }
        .p-proc-title {
          font-size: 12pt;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${PRINT_BLACK};
          margin: 0 0 7mm 0;
          line-height: 1.35;
        }
        .p-fee { margin-bottom: 5.5mm; }
        .p-fee-label {
          font-size: 11pt;
          font-weight: 700;
          font-variant: small-caps;
          letter-spacing: 0.03em;
          margin-bottom: 0.5mm;
        }
        .p-fee-value {
          font-size: 11pt;
          font-weight: 700;
          margin-bottom: 1.5mm;
          letter-spacing: 0.01em;
          padding-left: 5mm;
        }
        .p-fee-options {
          font-size: 10pt;
          line-height: 1.58;
          text-align: justify;
        }
        .p-fee-optional {
          font-size: 8pt;
          opacity: 1;
          margin-top: 1mm;
        }
        .p-hospital-name {
          font-size: 11pt;
          font-weight: 700;
          color: ${PRINT_BLACK};
          padding-left: 5mm;
          margin-bottom: 0.5mm;
        }
        .p-hospital-range {
          font-size: 11pt;
          font-weight: 700;
          padding-left: 5mm;
          margin-bottom: 1.5mm;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 3mm;
          line-height: 1.38;
        }
        .p-hospital-range-note {
          font-size: 8pt;
          font-weight: 400;
        }

        /* ══════════════════════════════════════
           IMPLANTS
        ══════════════════════════════════════ */
        .p-implant-section-title {
          font-size: 11pt;
          font-weight: 700;
          color: ${PRINT_BLACK};
          margin: 0 0 6mm 0;
          line-height: 1.36;
          text-align: center;
        }
        .p-implant-brand {
          font-size: 11pt;
          font-weight: 700;
          margin-top: 5mm;
          margin-bottom: 1mm;
        }
        .p-implant-prices {
          font-size: 10pt;
          line-height: 1.58;
          text-align: justify;
        }
        .p-implant-note {
          font-size: 10pt;
          opacity: 1;
          margin-top: 5mm;
          line-height: 1.58;
          text-align: justify;
        }

        /* ══════════════════════════════════════
           CLOSING
        ══════════════════════════════════════ */
        .p-closing p {
          margin-bottom: 4mm;
          text-align: justify;
          font-size: 11pt;
          line-height: 1.58;
        }
        .p-closing p:last-child { margin-bottom: 0; }

        /* ══════════════════════════════════════
           SCREEN: cards with shadow + gap
        ══════════════════════════════════════ */
        @media screen {
          .page, .content-flow {
            box-shadow: 0 4px 24px rgba(0,0,0,0.18);
            border-radius: 2px;
          }
        }

        /* ══════════════════════════════════════
           PRINT OVERRIDES
        ══════════════════════════════════════ */
        @media print {
          .page, .content-flow {
            width: 210mm;
            margin: 0;
          }
          .page-cover {
            height: 297mm;
          }
          html, body {
            background: ${PRINT_BACKGROUND} !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .content-flow-footer { display: none !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════
          PAGE 1 — COVER
      ════════════════════════════════════════════════ */}
      <div className="page page-cover">
        <div className="cover-top">
          <div className="cover-title">
            Planejamento Cirúrgico<br />Personalizado
          </div>
          <div className="cover-patient-name" style={getCoverPatientNameStyle(data.patientName)}>
            {data.patientName}
          </div>
        </div>
        <div className="cover-date">{formatCoverDate(data.date)}</div>
      </div>

      {/* ════════════════════════════════════════════════
          INCLUDED-ITEMS PAGES — one page per section
          The intro paragraphs precede the first section on the same page
      ════════════════════════════════════════════════ */}
      {parts.map((part, i) => {
        const section = includedSections[part.sectionIdx];
        return (
          <div key={`${part.sectionIdx}-${part.partIdx}`} className="page page-content">
            <div
              className="page-body"
              ref={(el) => {
                partRefs.current[i] = el;
              }}
            >
              {part.showGlobalIntro && (
                <>
                  <p className="p-intro">
                    Este orçamento foi criado com todo o cuidado para que você tenha clareza ao decidir sobre sua cirurgia.
                  </p>
                  <p className="p-intro">
                    Nossa filosofia é unir técnica refinada e um acompanha&shy;mento muito próximo até sua recuperação completa.
                  </p>
                </>
              )}
              {part.showSectionIntro && (
                <p className="p-section-intro">
                  <BoldText text={section.intro} />
                </p>
              )}
              <ul className="p-list">
                {part.items.map((item, j) =>
                  isInlineParagraph(item) ? (
                    <li key={j} className="p-inline-paragraph">
                      <span className="p-list-text">
                        <BoldText text={stripInlineParagraphMarker(item)} />
                      </span>
                    </li>
                  ) : (
                    <li key={j}>
                      <span className="p-list-bullet">•</span>
                      <span className="p-list-text">
                        <ItemRenderer text={item} />
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        );
      })}

      {/* ════════════════════════════════════════════════
          INDIVIDUAL PROCEDURE PAGES
          - If multiple procedures: show one page per procedure (equipe + anestesista)
          - If single procedure: show one page (equipe + anestesista + hospital + argoplasma)
      ════════════════════════════════════════════════ */}
      {data.procedures.map((entry, idx) => {
        const procHospitalMin = entry.procedure.hospitalMin;
        const procHospitalMax = entry.procedure.hospitalMax ?? procHospitalMin;
        const procName = entry.procedure.name.toLowerCase();
        const matchesArgoplasma =
          procName.includes('abdominoplastia') ||
          procName.includes('miniabdominoplastia') ||
          (procName.includes('lipoaspiração') &&
            (procName.includes('abdome') ||
              procName.includes('flanco') ||
              procName.includes('dorso') ||
              procName.includes('coxa') ||
              procName.includes('braço')));
        const showArgoplasmaHere =
          data.includeArgoplasma && (isMulti ? matchesArgoplasma : true);
        return (
          <div key={idx} className="page page-content">
            <div className="page-body">
            <ProcedureTitle title={formatProcedureDisplayTitle(entry.procedure.name)} />

            <div className="p-hr" />

            <FeeEquipe surgeryBase={entry.prices.surgery} />
            <FeeAnestesista anesthesiaBase={entry.prices.anesthesia} />

            {/* Per-procedure hospital value (when available) */}
            {isMulti && procHospitalMin !== null && (
              <FeeHospital
                name={data.hospitalName}
                min={procHospitalMin}
                max={procHospitalMax ?? procHospitalMin}
              />
            )}

            {/* If single procedure: show hospital here */}
            {!isMulti && (
              <FeeHospital
                name={data.hospitalName}
                min={data.hospitalMin}
                max={data.hospitalMax}
              />
            )}

            {/* Argoplasma: shown on matching procedure pages */}
            {showArgoplasmaHere && <FeeArgoplasma />}

            </div>
          </div>
        );
      })}

      {/* ════════════════════════════════════════════════
          COMBINED SUMMARY PAGE (multi-procedure only)
          Shows total equipe + total anestesista + hospital + argoplasma
      ════════════════════════════════════════════════ */}
      {isMulti && isCombinedSurgery && !hideCombinedSummaryPage && (
        <div className="page page-content">
          <div className="page-body">
          <ProcedureTitle title={combinedTitle} />

          <div className="p-hr" />

          <FeeEquipe surgeryBase={totalSurgery} />
          <FeeAnestesista anesthesiaBase={totalAnesthesia} />
          <FeeHospital
            name={data.hospitalName}
            min={data.hospitalMin}
            max={data.hospitalMax}
          />
          {data.includeArgoplasma && <FeeArgoplasma />}

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          IMPLANTS PAGE
      ════════════════════════════════════════════════ */}
      {data.includeImplants && (
        <div className="page page-content">
          <div className="page-body">
          <div className="p-implant-section-title">
            Valores dos Implantes de Mama Redondos Texturizados*
          </div>

          <div className="p-implant-brand">Eurosilicone</div>
          <div className="p-implant-prices">
            - à vista: R$ {formatBRLNoSymbol(IMPLANT_PRICES.eurosilicone.avista)}<br />
            - em até 6 vezes (cartão): R$ {formatBRLNoSymbol(IMPLANT_PRICES.eurosilicone.ate6x)}<br />
            - de 7 a 10 vezes (cartão): R$ {formatBRLNoSymbol(IMPLANT_PRICES.eurosilicone.de7a10x)}
          </div>

          <div className="p-implant-brand">Silimed BioDesign</div>
          <div className="p-implant-prices">
            - à vista: R$ {formatBRLNoSymbol(IMPLANT_PRICES.silimed.avista)}<br />
            - em até 7 vezes (cartão): R$ {formatBRLNoSymbol(IMPLANT_PRICES.silimed.ate7x)}
          </div>

          <div className="p-implant-note">
            A marca é escolhida levando em consideração o que for mais adequado para seu caso e conforme a disponibilidade dos revendedores.
          </div>
          <div className="p-implant-note" style={{ marginTop: '3mm' }}>
            *Valores (referentes ao par de implantes) divulgados pelos revendedores, que podem alterá-los a qualquer tempo, sem aviso prévio.
          </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          CLOSING NOTES PAGE
      ════════════════════════════════════════════════ */}
      <div className="page page-content">
        <div className="page-body">
        <div className="p-closing">
          <p>O custo é calculado somando-se os valores de {costComponents.join(' + ')}.</p>
          <p>Os valores de equipe cirúrgica e anestesista são válidos para realização do procedimento em até 30 dias, considerando a data deste orçamento.</p>
          <p>
            Caso opte por fazer a cirurgia, o primeiro passo é agendar a data do procedimento. Depois disso, marcaremos seu retorno com o {data.doctorName} e a consulta pré-anestésica com a {data.anesthesiologistName} (valor de R$ 200).
          </p>
          <p>Se tiver qualquer dúvida, estamos à disposição para conversar. Até breve!</p>
        </div>

        </div>
      </div>
    </div>
  );
});

QuotePrint.displayName = 'QuotePrint';
export default QuotePrint;
