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
        - em 6 vezes (cartão de crédito): 6x R$ {formatBRLNoSymbol(calcInstallmentValue(ARGOPLASMA_PRICE_6X, 6))}<br />
        - em 12 vezes (cartão de crédito): 12x R$ {formatBRLNoSymbol(calcInstallmentValue(ARGOPLASMA_PRICE_12X, 12))}
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

  const includedSections = getIncludedSections(
    data.procedures.map((e) => ({ category: e.procedure.category, name: e.procedure.name })),
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

  const hasArgoplasmaSection =
    data.includeArgoplasma &&
    data.procedures.some(
      (e) => e.procedure.category === 'abdominoplasty' || e.procedure.category === 'lipo',
    );

  // Decide which included-items section will host the argoplasma block (rendered inline at its end).
  // Prefer abdominoplasty section if present; otherwise the lipo section.
  let argoHostSectionIdx = -1;
  if (hasArgoplasmaSection) {
    argoHostSectionIdx = includedSections.findIndex((s) =>
      /abdominoplastia/i.test(s.intro),
    );
    if (argoHostSectionIdx === -1) {
      argoHostSectionIdx = includedSections.findIndex((s) =>
        /lipoescultura/i.test(s.intro),
      );
    }
  }
  const argoHostProcLabel = (() => {
    if (argoHostSectionIdx === -1) return 'lipoescultura';
    return /abdominoplastia/i.test(includedSections[argoHostSectionIdx].intro)
      ? 'abdominoplastia com lipoescultura'
      : 'lipoescultura';
  })();

  // Combined totals for multi-procedure summary page
  const totalSurgery = data.procedures.reduce((s, e) => s + e.prices.surgery, 0);
  const totalAnesthesia = data.procedures.reduce((s, e) => s + e.prices.anesthesia, 0);
  const combinedTitle = data.procedures.map((e) => e.procedure.name.toUpperCase()).join(' + ');

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
          --pdf-margin-top: 23mm;
          --pdf-margin-right: 10mm;
          --pdf-margin-bottom: 26mm;
          --pdf-margin-left: 15mm;
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
          font-size: 15pt;
          line-height: 1.28;
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
          font-size: 11pt;
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
          font-size: 22pt;
          font-weight: 700;
          letter-spacing: normal;
          text-transform: uppercase;
          color: ${PRINT_BLACK};
          text-align: center;
          line-height: 1.4;
        }
        .cover-patient-name {
          font-family: 'Snell Roundhand', 'Pinyon Script', cursive;
          font-size: 34pt;
          font-weight: 700;
          color: ${PRINT_BLACK};
          text-align: center;
          line-height: 1.1;
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
        }
        /* ══════════════════════════════════════
           CONTENT — TEXT
        ══════════════════════════════════════ */
        .p-intro {
          margin-bottom: 4mm;
          text-align: justify;
          line-height: 1.32;
        }
        .p-intro + .p-intro {
          margin-bottom: 14pt;
        }
        .p-section-intro {
          margin-top: 5mm;
          margin-bottom: 14pt;
          text-align: justify;
          line-height: 1.32;
        }
        .p-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 4mm;
        }
        .p-list li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 1.8mm;
          line-height: 1.32;
          text-align: justify;
        }
        .p-list-bullet {
          flex-shrink: 0;
          margin-right: 3mm;
          margin-top: 0.05em;
          font-size: 15pt;
          line-height: 1.32;
        }
        .p-list-text {
          flex: 1;
          font-size: 14pt;
          text-align: justify;
          line-height: 1.32;
        }

        .p-argo-intro {
          margin-top: 5mm;
          margin-bottom: 3mm;
          text-align: justify;
          line-height: 1.32;
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
          font-size: 17pt;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${PRINT_BLACK};
          margin: 0 0 7mm 0;
          line-height: 1.3;
        }
        .p-fee { margin-bottom: 5.5mm; }
        .p-fee-label {
          font-size: 15pt;
          font-weight: 700;
          font-variant: small-caps;
          letter-spacing: 0.03em;
          margin-bottom: 0.5mm;
        }
        .p-fee-value {
          font-size: 17pt;
          font-weight: 700;
          margin-bottom: 1.5mm;
          letter-spacing: 0.01em;
          padding-left: 5mm;
        }
        .p-fee-options {
          font-size: 14pt;
          line-height: 1.34;
          text-align: justify;
        }
        .p-fee-optional {
          font-size: 11pt;
          opacity: 1;
          margin-top: 1mm;
        }
        .p-hospital-name {
          font-size: 15pt;
          font-weight: 700;
          color: ${PRINT_BLACK};
          padding-left: 5mm;
          margin-bottom: 0.5mm;
        }
        .p-hospital-range {
          font-size: 17pt;
          font-weight: 700;
          padding-left: 5mm;
          margin-bottom: 1.5mm;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 3mm;
          line-height: 1.3;
        }
        .p-hospital-range-note {
          font-size: 11pt;
          font-weight: 400;
        }

        /* ══════════════════════════════════════
           IMPLANTS
        ══════════════════════════════════════ */
        .p-implant-section-title {
          font-size: 17pt;
          font-weight: 700;
          color: ${PRINT_BLACK};
          margin: 0 0 6mm 0;
          line-height: 1.3;
        }
        .p-implant-brand {
          font-size: 15pt;
          font-weight: 700;
          margin-top: 5mm;
          margin-bottom: 1mm;
        }
        .p-implant-prices {
          font-size: 14pt;
          line-height: 1.34;
          text-align: justify;
        }
        .p-implant-note {
          font-size: 13pt;
          opacity: 1;
          margin-top: 5mm;
          line-height: 1.34;
          text-align: justify;
        }

        /* ══════════════════════════════════════
           CLOSING
        ══════════════════════════════════════ */
        .p-closing p {
          margin-bottom: 4mm;
          text-align: justify;
          font-size: 14pt;
          line-height: 1.34;
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
          <div className="cover-patient-name">{data.patientName}</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          INCLUDED-ITEMS PAGES — one page per section
          The intro paragraphs precede the first section on the same page
      ════════════════════════════════════════════════ */}
      {parts.map((part, i) => {
        const section = includedSections[part.sectionIdx];
        const isLastOfSection = lastPartIdxBySection.get(part.sectionIdx) === i;
        const showArgoHere =
          hasArgoplasmaSection && part.sectionIdx === argoHostSectionIdx && isLastOfSection;
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
                {part.items.map((item, j) => (
                  <li key={j}>
                    <span className="p-list-bullet">•</span>
                    <span className="p-list-text">
                      <ItemRenderer text={item} />
                    </span>
                  </li>
                ))}
              </ul>
              {showArgoHere && (
                <>
                  <p className="p-argo-intro">
                    É ainda possível acrescentar ao seu procedimento de {argoHostProcLabel}:
                  </p>
                  <ul className="p-list">
                    <li>
                      <span className="p-list-bullet">•</span>
                      <span className="p-list-text">
                        <BoldText text="**Argoplasma - ARGON 4**: tecnologia de última geração, que promove maior retração da pele e estimula a produção de colágeno, melhorando a elasticidade e proporcionando um visual mais firme e rejuvenescido" />
                      </span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Fallback page only if argoplasma applies but no host section was found (shouldn't normally happen) */}
      {hasArgoplasmaSection && argoHostSectionIdx === -1 && (
        <div className="page page-content">
          <div className="page-body">
          <p className="p-argo-intro">
            É ainda possível acrescentar ao seu procedimento de {argoHostProcLabel}:
          </p>
          <ul className="p-list">
            <li>
              <span className="p-list-bullet">•</span>
              <span className="p-list-text">
                <BoldText text="**Argoplasma - ARGON 4**: tecnologia de última geração, que promove maior retração da pele e estimula a produção de colágeno, melhorando a elasticidade e proporcionando um visual mais firme e rejuvenescido" />
              </span>
            </li>
          </ul>
          </div>
        </div>
      )}

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
            <div className="p-proc-title">{entry.procedure.name.toUpperCase()}</div>

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
      {isMulti && (
        <div className="page page-content">
          <div className="page-body">
          <div className="p-proc-title">{combinedTitle}</div>

          <div className="p-hr" />

          <FeeEquipe surgeryBase={totalSurgery} />
          <FeeAnestesista anesthesiaBase={totalAnesthesia} />
          <FeeHospital
            name={data.hospitalName}
            min={data.hospitalMin}
            max={data.hospitalMax}
          />
          {hasArgoplasmaSection && <FeeArgoplasma />}

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
          <p>Os valores de equipe cirúrgica e anestesista são válidos para realização do procedimento em até 2 meses, considerando a data deste orçamento.</p>
          <p>
            <span style={{ display: 'block', textAlignLast: 'justify' }}>
              Caso opte por fazer a cirurgia, o primeiro passo é agendar a data do procedimento. Depois disso, marcaremos seu retor-
            </span>
            no com o {data.doctorName} e a consulta pré-anestésica com a {data.anesthesiologistName} (valor de R$ 200).
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
