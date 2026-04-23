import { forwardRef } from 'react';
import { BILLING_UNIT_LABELS, TOOTH_NUMBERS } from '@/data/procedures';
import type { ProcedureEntry, QuoteData } from '@/types/quote';
import { calcInstallmentValue, calcPaymentOptions, formatBRL, formatBRLNoSymbol } from '@/utils/calculations';

interface Props {
  data: QuoteData;
}

const TEAL = '#0f766e';
const BLUE = '#1d4ed8';
const INK = '#0f172a';
const MUTED = '#64748b';

function formatDate(dateValue: string) {
  const baseDate = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(baseDate);
}

function addDays(dateValue: string, days: number) {
  const baseDate = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
  baseDate.setDate(baseDate.getDate() + days);
  return formatDate(baseDate.toISOString().slice(0, 10));
}

function calcEntryTotal(entry: ProcedureEntry) {
  return entry.procedure.price * entry.quantity;
}

function getEntryLocation(entry: ProcedureEntry) {
  const parts: string[] = [];
  if (entry.teeth.length > 0) parts.push(`Dentes ${entry.teeth.join(', ')}`);
  if (entry.region.trim()) parts.push(entry.region.trim());
  return parts.join(' · ') || '-';
}

function ToothMap({ entries }: { entries: ProcedureEntry[] }) {
  const selected = new Set(entries.flatMap((entry) => entry.teeth));
  if (selected.size === 0) return null;

  return (
    <div className="tooth-map">
      <div className="section-kicker">Odontograma resumido</div>
      <div className="tooth-row">
        {TOOTH_NUMBERS.slice(0, 16).map((tooth) => (
          <span key={tooth} className={selected.has(tooth) ? 'tooth active' : 'tooth'}>
            {tooth}
          </span>
        ))}
      </div>
      <div className="tooth-row">
        {TOOTH_NUMBERS.slice(16).map((tooth) => (
          <span key={tooth} className={selected.has(tooth) ? 'tooth active' : 'tooth'}>
            {tooth}
          </span>
        ))}
      </div>
    </div>
  );
}

const QuotePrint = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const total = data.procedures.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
  const payment = calcPaymentOptions(total);

  return (
    <div ref={ref} className="print-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .print-root {
          font-family: 'Inter', Arial, sans-serif;
          color: ${INK};
          background: #ffffff;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
          position: relative;
        }

        .page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .page-inner {
          padding: 24mm 20mm 22mm;
        }

        .cover {
          min-height: 297mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 28mm 22mm;
          background:
            linear-gradient(180deg, rgba(15,118,110,0.06), rgba(255,255,255,0) 38%),
            #ffffff;
        }

        .brand-mark {
          width: 15mm;
          height: 15mm;
          border: 2pt solid ${TEAL};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${TEAL};
          font-size: 18pt;
          font-weight: 800;
          line-height: 1;
        }

        .cover-title {
          margin-top: 28mm;
          max-width: 135mm;
          font-size: 30pt;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: 0;
          color: ${INK};
        }

        .cover-subtitle {
          margin-top: 7mm;
          max-width: 120mm;
          font-size: 12pt;
          line-height: 1.5;
          color: ${MUTED};
        }

        .patient-name {
          margin-top: 22mm;
          font-size: 24pt;
          line-height: 1.15;
          font-weight: 700;
          color: ${TEAL};
          overflow-wrap: break-word;
        }

        .cover-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6mm;
          border-top: 1pt solid #cbd5e1;
          padding-top: 9mm;
          font-size: 10pt;
          color: ${MUTED};
        }

        .meta-label {
          display: block;
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 1mm;
        }

        .meta-value {
          font-size: 10.5pt;
          font-weight: 700;
          color: ${INK};
        }

        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10mm;
          margin-bottom: 8mm;
          padding-bottom: 5mm;
          border-bottom: 1pt solid #dbe3ea;
        }

        .section-title {
          font-size: 20pt;
          line-height: 1.15;
          font-weight: 800;
          color: ${INK};
        }

        .section-kicker {
          font-size: 8pt;
          font-weight: 800;
          text-transform: uppercase;
          color: ${TEAL};
          letter-spacing: 0.04em;
        }

        .patient-chip {
          border: 1pt solid #dbe3ea;
          border-radius: 4mm;
          padding: 3mm 4mm;
          text-align: right;
          font-size: 9pt;
          color: ${MUTED};
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
        }

        .table th {
          background: #f1f5f9;
          color: #475569;
          font-size: 7.5pt;
          text-transform: uppercase;
          text-align: left;
          padding: 3mm 2mm;
          border-bottom: 1pt solid #cbd5e1;
        }

        .table td {
          padding: 3mm 2mm;
          vertical-align: top;
          border-bottom: 1pt solid #e2e8f0;
          line-height: 1.4;
        }

        .table .money,
        .table .qty {
          text-align: right;
          white-space: nowrap;
          font-weight: 700;
        }

        .procedure-name {
          font-weight: 700;
          color: ${INK};
        }

        .procedure-detail {
          margin-top: 1mm;
          color: ${MUTED};
          font-size: 7.7pt;
        }

        .tooth-map {
          margin: 9mm 0 8mm;
          border: 1pt solid #dbe3ea;
          border-radius: 5mm;
          padding: 5mm;
          background: #fbfdff;
        }

        .tooth-row {
          display: grid;
          grid-template-columns: repeat(16, 1fr);
          gap: 1.2mm;
          margin-top: 3mm;
        }

        .tooth {
          min-width: 0;
          border: 1pt solid #cbd5e1;
          border-radius: 2mm;
          text-align: center;
          padding: 1.7mm 0;
          font-size: 7pt;
          font-weight: 700;
          color: #64748b;
          background: #ffffff;
        }

        .tooth.active {
          border-color: ${TEAL};
          background: ${TEAL};
          color: #ffffff;
        }

        .total-box {
          margin-top: 8mm;
          margin-left: auto;
          width: 72mm;
          border-radius: 5mm;
          background: #ecfeff;
          border: 1pt solid #99f6e4;
          padding: 5mm;
        }

        .total-label {
          font-size: 8pt;
          font-weight: 800;
          text-transform: uppercase;
          color: ${TEAL};
        }

        .total-value {
          margin-top: 1mm;
          font-size: 18pt;
          font-weight: 800;
          color: ${INK};
        }

        .payment-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4mm;
          margin: 9mm 0;
        }

        .payment-card {
          border: 1pt solid #dbe3ea;
          border-radius: 5mm;
          padding: 5mm;
          min-height: 35mm;
        }

        .payment-card.highlight {
          border-color: #5eead4;
          background: #ecfeff;
        }

        .payment-label {
          font-size: 8pt;
          font-weight: 800;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .payment-value {
          margin-top: 3mm;
          font-size: 15pt;
          font-weight: 800;
          color: ${INK};
          line-height: 1.15;
        }

        .payment-note {
          margin-top: 2mm;
          font-size: 8pt;
          line-height: 1.45;
          color: ${MUTED};
        }

        .note-box {
          margin-top: 8mm;
          border-left: 3pt solid ${BLUE};
          background: #eff6ff;
          padding: 5mm;
          font-size: 9pt;
          line-height: 1.55;
          color: #1e3a8a;
        }

        .small-list {
          margin-top: 8mm;
          display: grid;
          gap: 3mm;
          font-size: 9pt;
          line-height: 1.5;
          color: ${MUTED};
        }

        .small-list strong {
          color: ${INK};
        }

        @media screen {
          .page {
            box-shadow: 0 4px 24px rgba(15, 23, 42, 0.18);
            border-radius: 2px;
          }
        }

        @media print {
          html, body {
            background: #ffffff !important;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            box-shadow: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      <section className="page">
        <div className="cover">
          <div>
            <div className="brand-mark">+</div>
            <div className="cover-title">Orçamento odontológico personalizado</div>
            <div className="cover-subtitle">
              Plano financeiro baseado nos procedimentos selecionados e nas regiões indicadas no atendimento.
            </div>
            <div className="patient-name">{data.patientName}</div>
          </div>

          <div className="cover-meta">
            <div>
              <span className="meta-label">Data</span>
              <span className="meta-value">{formatDate(data.date)}</span>
            </div>
            <div>
              <span className="meta-label">Validade</span>
              <span className="meta-value">até {addDays(data.date, data.validityDays)}</span>
            </div>
            <div>
              <span className="meta-label">Profissional</span>
              <span className="meta-value">
                {[data.dentistName || '-', data.cro].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="page">
        <div className="page-inner">
          <header className="section-header">
            <div>
              <div className="section-kicker">Plano de tratamento</div>
              <h2 className="section-title">Procedimentos selecionados</h2>
            </div>
            <div className="patient-chip">
              <span className="meta-label">Paciente</span>
              <strong>{data.patientName}</strong>
            </div>
          </header>

          <table className="table">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>Região</th>
                <th className="qty">Qtd.</th>
                <th className="money">Valor</th>
                <th className="money">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.procedures.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div className="procedure-name">{entry.procedure.name}</div>
                    <div className="procedure-detail">
                      {entry.procedure.category} · {BILLING_UNIT_LABELS[entry.procedure.billingUnit]}
                    </div>
                    {entry.notes && <div className="procedure-detail">{entry.notes}</div>}
                  </td>
                  <td>{getEntryLocation(entry)}</td>
                  <td className="qty">{entry.quantity}</td>
                  <td className="money">{formatBRL(entry.procedure.price)}</td>
                  <td className="money">{formatBRL(calcEntryTotal(entry))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ToothMap entries={data.procedures} />

          <div className="total-box">
            <div className="total-label">Total à vista</div>
            <div className="total-value">{formatBRL(payment.avista)}</div>
          </div>
        </div>
      </section>

      <section className="page">
        <div className="page-inner">
          <header className="section-header">
            <div>
              <div className="section-kicker">Condições de pagamento</div>
              <h2 className="section-title">Resumo financeiro</h2>
            </div>
          </header>

          <div className="payment-grid">
            <div className="payment-card highlight">
              <div className="payment-label">À vista</div>
              <div className="payment-value">{formatBRL(payment.avista)}</div>
              <div className="payment-note">PIX ou transferência.</div>
            </div>
            <div className="payment-card">
              <div className="payment-label">Até 6 vezes</div>
              <div className="payment-value">{formatBRL(payment.ate6x)}</div>
              <div className="payment-note">
                Cartão de crédito. Referência: 6x de R$ {formatBRLNoSymbol(calcInstallmentValue(payment.ate6x, 6))}.
              </div>
            </div>
            <div className="payment-card">
              <div className="payment-label">Até 12 vezes</div>
              <div className="payment-value">{formatBRL(payment.ate12x)}</div>
              <div className="payment-note">
                Cartão de crédito. Referência: 12x de R$ {formatBRLNoSymbol(calcInstallmentValue(payment.ate12x, 12))}.
              </div>
            </div>
          </div>

          {data.generalNotes && <div className="note-box">{data.generalNotes}</div>}

          <div className="small-list">
            <p>
              <strong>Escopo:</strong> este orçamento contempla os procedimentos listados no plano de tratamento. Exames,
              laboratório ou materiais especiais podem ser ajustados caso o planejamento clínico indique necessidade.
            </p>
            <p>
              <strong>Valores por dente:</strong> quando o procedimento estiver marcado como por dente, a quantidade
              corresponde aos dentes selecionados ou informados no item.
            </p>
            <p>
              <strong>Validade:</strong> condições comerciais válidas por {data.validityDays} dias a partir da data do orçamento.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
});

QuotePrint.displayName = 'QuotePrint';
export default QuotePrint;
