import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import QuotePrint from '@/components/QuotePrint';
import type { QuoteData } from '@/types/quote';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

function toTitleCasePart(part: string) {
  const lower = part.toLocaleLowerCase('pt-BR');
  return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
}

function formatPatientFileName(patientName: string) {
  const nameParts = patientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(toTitleCasePart);

  const safeName = nameParts.length > 0 ? nameParts.join('_') : 'Orcamento';
  const dateParts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((parts, part) => {
      parts[part.type] = part.value;
      return parts;
    }, {});
  const generatedDate = [dateParts.day, dateParts.month, dateParts.year].join('_');

  return `${safeName}_${generatedDate}.pdf`;
}

export default function Preview() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<QuoteData | null>(null);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (import.meta.env.DEV && window.location.search.includes('demo')) {
      setData({
        patientName: 'Fabiane Sorgetz',
        date: '2026-04-12',
        procedures: [
          {
            procedure: {
              id: 'lipoescultura-demo',
              name: 'Lipoescultura - Lipoaspiração de Abdome, Flancos e Dorso e Lipoenxertia Glútea',
              category: 'lipo',
              complexityA: null,
              complexityB: { total: 30000, surgery: 27000, anesthesia: 3000 },
              complexityC: null,
              hospitalMin: 3600,
              hospitalMax: 4100,
            },
            complexity: 'B',
            prices: { total: 30000, surgery: 27000, anesthesia: 3000 },
          },
          {
            procedure: {
              id: 'mamoplastia-redutora-demo',
              name: 'Mamoplastia Redutora',
              category: 'breast',
              hasImplants: true,
              complexityA: null,
              complexityB: { total: 32000, surgery: 29000, anesthesia: 3000 },
              complexityC: null,
              hospitalMin: 5700,
              hospitalMax: 6200,
            },
            complexity: 'B',
            prices: { total: 32000, surgery: 29000, anesthesia: 3000 },
          },
        ],
        hospitalName: 'Hospital Accurata',
        hospitalMin: 9300,
        hospitalMax: 10300,
        includeArgoplasma: true,
        includeImplants: true,
        doctorName: 'Dr. Thiago',
        anesthesiologistName: 'Drª. Priscila',
      } as any);
      return;
    }

    const stored = sessionStorage.getItem('quoteData');
    if (!stored) {
      setLocation('/');
      return;
    }
    setData(JSON.parse(stored));
  }, [setLocation]);

  const handleDownloadPDF = async () => {
    if (!printRef.current || !data) return;
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Make sure custom fonts (Pinyon Script, Lato) are loaded before capture.
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const pageEls = Array.from(
        printRef.current.querySelectorAll<HTMLElement>('.page'),
      );
      if (pageEls.length === 0) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidthMM = 210;
      const pageHeightMM = 297;

      for (let i = 0; i < pageEls.length; i++) {
        const el = pageEls[i];
        // Render at higher resolution for crisp text/images.
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: el.scrollWidth,
          windowHeight: el.scrollHeight,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) pdf.addPage('a4', 'portrait');
        // Fill the entire A4 page; the source is already 210x296mm so aspect matches.
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMM, pageHeightMM, undefined, 'FAST');
      }

      pdf.save(formatPatientFileName(data.patientName));
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  if (!data) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#d6d3cd' }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar e editar
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500 mr-2 hidden sm:block">
              Orçamento para {data.patientName}
            </span>
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-60"
              style={{ background: '#1e2446' }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
          <Download className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Clique em <strong>Baixar PDF</strong> para gerar o arquivo em A4 com o layout fiel — funciona em qualquer navegador (Safari, Chrome, Firefox), sem precisar configurar a janela de impressão.
          </span>
        </div>
      </div>

      {/* Document — pages stacked with gap */}
      <div style={{ padding: '16px 0 40px' }}>
        <div
          ref={printRef}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
        >
          <QuotePrint data={data} />
        </div>
      </div>

      <style>{`
        .page {
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
