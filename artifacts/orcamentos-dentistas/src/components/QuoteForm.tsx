import { useMemo, useState } from 'react';
import { CalendarDays, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { BILLING_UNIT_LABELS, PROCEDURES, Procedure, TOOTH_NUMBERS } from '@/data/procedures';
import { calcPaymentOptions, formatBRL } from '@/utils/calculations';
import type { ProcedureEntry, QuoteData } from '@/types/quote';

interface Props {
  onGenerate: (data: QuoteData) => void;
}

const BRAND = '#0f766e';
const BRAND_DARK = '#115e59';
const MINT = '#dff7f3';
const BLUE = '#2563eb';

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function newEntry(procedure: Procedure): ProcedureEntry {
  return {
    id: `${procedure.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    procedure,
    quantity: procedure.defaultQuantity,
    teeth: [],
    region: '',
    notes: '',
  };
}

function calcEntryTotal(entry: ProcedureEntry) {
  return entry.procedure.price * entry.quantity;
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function ToothPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (teeth: number[]) => void;
}) {
  const upper = TOOTH_NUMBERS.slice(0, 16);
  const lower = TOOTH_NUMBERS.slice(16);

  const toggle = (tooth: number) => {
    onChange(
      selected.includes(tooth)
        ? selected.filter((item) => item !== tooth)
        : [...selected, tooth].sort((a, b) => a - b),
    );
  };

  const renderRow = (items: number[]) => (
    <div className="grid grid-cols-8 gap-1.5">
      {items.map((tooth) => {
        const active = selected.includes(tooth);
        return (
          <button
            key={tooth}
            type="button"
            onClick={() => toggle(tooth)}
            className="h-9 rounded-md border text-xs font-semibold transition-colors"
            style={
              active
                ? { background: BRAND, borderColor: BRAND, color: 'white' }
                : { background: 'white', borderColor: '#cbd5e1', color: '#334155' }
            }
            title={`Dente ${tooth}`}
          >
            {tooth}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase text-slate-500">Odontograma</span>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Limpar
        </button>
      </div>
      <div className="space-y-2">
        {renderRow(upper)}
        {renderRow(lower)}
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {selected.length > 0 ? `Selecionados: ${selected.join(', ')}` : 'Selecione os dentes envolvidos.'}
      </div>
    </div>
  );
}

export default function QuoteForm({ onGenerate }: Props) {
  const [patientName, setPatientName] = useState('');
  const [date, setDate] = useState(todayInSaoPaulo);
  const [dentistName, setDentistName] = useState('');
  const [cro, setCro] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [generalNotes, setGeneralNotes] = useState(
    'Valores sujeitos a confirmacao apos avaliacao clinica e exames complementares, quando indicados.',
  );

  const [entries, setEntries] = useState<ProcedureEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);

  const filteredProcedures = useMemo(() => {
    const q = normalizeText(search.trim());
    if (!q) return PROCEDURES;
    return PROCEDURES.filter((procedure) => {
      const haystack = normalizeText(`${procedure.name} ${procedure.category} ${procedure.description}`);
      return haystack.includes(q);
    });
  }, [search]);

  const total = entries.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
  const payment = calcPaymentOptions(total);

  const updateEntry = (id: string, patch: Partial<ProcedureEntry>) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const handleAdd = () => {
    if (!selectedProcedure) return;
    setEntries((prev) => [...prev, newEntry(selectedProcedure)]);
    setSearch('');
    setSelectedProcedure(null);
  };

  const canGenerate = patientName.trim() && entries.length > 0;

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Dados do orçamento</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Paciente *</span>
            <input
              value={patientName}
              onChange={(event) => setPatientName(event.target.value)}
              className={inputClass}
              placeholder="Nome completo"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Data *</span>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Dentista</span>
            <input
              value={dentistName}
              onChange={(event) => setDentistName(event.target.value)}
              className={inputClass}
              placeholder="Dr(a)."
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">CRO</span>
            <input value={cro} onChange={(event) => setCro(event.target.value)} className={inputClass} placeholder="CRO-SC" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Validade</span>
            <input
              type="number"
              min={1}
              value={validityDays}
              onChange={(event) => setValidityDays(Number(event.target.value) || 30)}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Procedimentos</h2>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedProcedure(null);
              }}
              className={`${inputClass} pl-10`}
              placeholder="Buscar procedimento..."
            />
          </div>

          <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {filteredProcedures.map((procedure) => {
              const active = selectedProcedure?.id === procedure.id;
              return (
                <button
                  key={procedure.id}
                  type="button"
                  onClick={() => {
                    setSelectedProcedure(procedure);
                    setSearch(procedure.name);
                  }}
                  className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-0"
                  style={active ? { background: MINT } : undefined}
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{procedure.name}</span>
                    <span className="block text-xs text-slate-500">
                      {procedure.category} · {BILLING_UNIT_LABELS[procedure.billingUnit]}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold" style={{ color: BRAND }}>
                    {formatBRL(procedure.price)}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedProcedure && (
            <div className="mt-3 rounded-lg border border-teal-100 bg-white p-3 text-sm text-slate-600">
              {selectedProcedure.description}
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedProcedure}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            style={selectedProcedure ? { background: BRAND } : undefined}
          >
            <Plus className="h-4 w-4" />
            Adicionar procedimento
          </button>
        </div>

        {entries.length > 0 && (
          <div className="mt-5 space-y-3">
            {entries.map((entry, index) => {
              const isByTooth = entry.procedure.billingUnit === 'tooth';
              return (
                <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400">Item {index + 1}</div>
                      <h3 className="text-base font-semibold text-slate-900">{entry.procedure.name}</h3>
                      <p className="text-sm text-slate-500">
                        {formatBRL(entry.procedure.price)} · {BILLING_UNIT_LABELS[entry.procedure.billingUnit]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntries((prev) => prev.filter((item) => item.id !== entry.id))}
                      className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      title="Remover procedimento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Quantidade</span>
                      <input
                        type="number"
                        min={1}
                        value={entry.quantity}
                        onChange={(event) => {
                          const quantity = Math.max(1, Number(event.target.value) || 1);
                          updateEntry(entry.id, { quantity });
                        }}
                        className={inputClass}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Região / arcada / observação curta</span>
                      <input
                        value={entry.region}
                        onChange={(event) => updateEntry(entry.id, { region: event.target.value })}
                        className={inputClass}
                        placeholder={isByTooth ? 'Opcional se os dentes estiverem marcados' : 'Ex: arcada superior, quadrante inferior direito'}
                      />
                    </label>
                  </div>

                  {isByTooth && (
                    <div className="mt-3">
                      <ToothPicker
                        selected={entry.teeth}
                        onChange={(teeth) => updateEntry(entry.id, { teeth, quantity: Math.max(1, teeth.length || entry.quantity) })}
                      />
                    </div>
                  )}

                  <label className="mt-3 block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Observações do item</span>
                    <input
                      value={entry.notes}
                      onChange={(event) => updateEntry(entry.id, { notes: event.target.value })}
                      className={inputClass}
                      placeholder="Ex: depende de radiografia, laboratorio incluso, material a definir"
                    />
                  </label>

                  <div className="mt-3 flex justify-end text-sm">
                    <span className="rounded-md bg-slate-100 px-3 py-2 font-bold text-slate-800">
                      Subtotal: {formatBRL(calcEntryTotal(entry))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Condições comerciais</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Observações gerais</span>
          <textarea
            value={generalNotes}
            onChange={(event) => setGeneralNotes(event.target.value)}
            className={`${inputClass} min-h-24 resize-y`}
          />
        </label>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">À vista</div>
            <div className="mt-1 text-lg font-bold" style={{ color: BRAND_DARK }}>{formatBRL(payment.avista)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">Até 6x</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{formatBRL(payment.ate6x)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">Até 12x</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{formatBRL(payment.ate12x)}</div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() =>
          canGenerate &&
          onGenerate({
            patientName: patientName.trim(),
            date,
            dentistName: dentistName.trim(),
            cro: cro.trim(),
            validityDays,
            procedures: entries,
            generalNotes: generalNotes.trim(),
          })
        }
        disabled={!canGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-4 text-base font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300"
        style={canGenerate ? { background: BLUE } : undefined}
      >
        <FileText className="h-5 w-5" />
        Gerar orçamento em PDF
      </button>
      {!canGenerate && (
        <p className="text-center text-sm text-slate-400">Preencha o paciente e adicione pelo menos um procedimento.</p>
      )}
    </div>
  );
}
