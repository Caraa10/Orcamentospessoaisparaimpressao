import { useState, useMemo, useEffect } from 'react';
import { Search, FileText, Plus, Trash2, ChevronDown } from 'lucide-react';
import { PROCEDURES, Procedure, Complexity, getPriceForComplexity, ARGOPLASMA_PRICE } from '@/data/procedures';
import { formatBRL } from '@/utils/calculations';
import type { QuoteData, ProcedureEntry } from '@/types/quote';

interface Props {
  onGenerate: (data: QuoteData) => void;
}

const COMPLEXITY_LABELS: Record<Complexity, string> = {
  A: 'Complexidade A',
  B: 'Complexidade B',
  C: 'Complexidade C',
};

const HOSPITAL_NAME = 'Hospital Accurata';

const NAVY = '#1e2446';
const NAVY_HOVER = '#2a3260';
const GOLD = '#c5ba7e';
const GOLD_LIGHT = '#f0ead6';
const GOLD_BORDER = '#d4ca8e';

export default function QuoteForm({ onGenerate }: Props) {
  const [patientName, setPatientName] = useState('');
  const [date, setDate] = useState(() => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(new Date());
  });

  const [procedureEntries, setProcedureEntries] = useState<ProcedureEntry[]>([]);

  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [pickerProcedure, setPickerProcedure] = useState<Procedure | null>(null);
  const [pickerComplexity, setPickerComplexity] = useState<Complexity>('A');

  const [hospitalMin, setHospitalMin] = useState('');
  const [hospitalMax, setHospitalMax] = useState('');
  const [hospitalName, setHospitalName] = useState(HOSPITAL_NAME);
  const [hospitalAuto, setHospitalAuto] = useState(true);
  const [combinedSurgery, setCombinedSurgery] = useState(true);

  // Auto-fill hospital values from selected procedures
  useEffect(() => {
    if (!hospitalAuto) return;
    if (procedureEntries.length === 0) {
      setHospitalMin('');
      setHospitalMax('');
      return;
    }
    const items: { min: number; max: number }[] = [];
    for (const entry of procedureEntries) {
      const min = entry.procedure.hospitalMin;
      if (min === null) continue;
      const max = entry.procedure.hospitalMax ?? min;
      items.push({ min, max });
    }
    if (items.length === 0) return;

    // When 2+ procedures combined in same surgery, apply 50% discount on the lowest-value procedure
    const applyDiscount = items.length >= 2 && combinedSurgery;
    let lowestIdx = 0;
    if (applyDiscount) {
      for (let i = 1; i < items.length; i++) {
        if (items[i].min < items[lowestIdx].min) lowestIdx = i;
      }
    }
    let sumMin = 0;
    let sumMax = 0;
    for (let i = 0; i < items.length; i++) {
      const factor = applyDiscount && i === lowestIdx ? 0.5 : 1;
      sumMin += items[i].min * factor;
      sumMax += items[i].max * factor;
    }
    setHospitalMin(String(Math.round(sumMin)));
    setHospitalMax(String(Math.round(sumMax)));
  }, [procedureEntries, hospitalAuto, combinedSurgery]);

  const [includeArgoplasma, setIncludeArgoplasma] = useState(false);
  const [includeImplants, setIncludeImplants] = useState(false);

  const [doctorName, setDoctorName] = useState('Dr. Thiago');
  const [anesthesiologistName, setAnesthesiologistName] = useState('Drª. Priscila');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return PROCEDURES.slice(0, 30);
    return PROCEDURES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 40);
  }, [search]);

  const pickerPrices = useMemo(() => {
    if (!pickerProcedure) return null;
    return getPriceForComplexity(pickerProcedure, pickerComplexity);
  }, [pickerProcedure, pickerComplexity]);

  const anyProcedureHasImplants = procedureEntries.some((e) => e.procedure.hasImplants);

  const handleSelectProcedure = (proc: Procedure) => {
    setPickerProcedure(proc);
    setSearch(proc.name);
    setShowDropdown(false);
    const prices = getPriceForComplexity(proc, 'A');
    if (prices) {
      setPickerComplexity('A');
    } else {
      const fallback: Complexity[] = ['B', 'C'];
      const next = fallback.find((c) => getPriceForComplexity(proc, c));
      if (next) setPickerComplexity(next);
    }
  };

  const handleAddProcedure = () => {
    if (!pickerProcedure || !pickerPrices) return;
    const entry: ProcedureEntry = {
      procedure: pickerProcedure,
      complexity: pickerComplexity,
      prices: pickerPrices,
    };
    setProcedureEntries((prev) => [...prev, entry]);
    if (pickerProcedure.hasImplants) setIncludeImplants(true);
    setPickerProcedure(null);
    setSearch('');
    setPickerComplexity('A');
  };

  const handleRemoveProcedure = (idx: number) => {
    setProcedureEntries((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.some((e) => e.procedure.hasImplants)) setIncludeImplants(false);
      return next;
    });
  };

  const canAdd = pickerProcedure !== null && pickerPrices !== null;
  const canGenerate =
    patientName.trim() &&
    procedureEntries.length > 0 &&
    hospitalMin &&
    hospitalMax;

  const handleGenerate = () => {
    if (!canGenerate) return;
    onGenerate({
      patientName: patientName.trim(),
      date,
      procedures: procedureEntries,
      hospitalName: hospitalName.trim() || HOSPITAL_NAME,
      hospitalMin: parseFloat(hospitalMin.replace(',', '.')),
      hospitalMax: parseFloat(hospitalMax.replace(',', '.')),
      includeArgoplasma,
      includeImplants,
      doctorName: doctorName.trim(),
      anesthesiologistName: anesthesiologistName.trim(),
    });
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 text-stone-800 placeholder-stone-400 transition-colors';
  const inputFocusStyle = {
    '--tw-ring-color': GOLD_BORDER,
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* Patient & Date */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
          Dados da Paciente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Nome da paciente *
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nome completo"
              className={inputClass}
              style={{ borderColor: patientName ? GOLD_BORDER : undefined }}
              onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Data do orçamento *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
        </div>
      </div>

      {/* Procedures */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
          Procedimentos
        </h2>

        {/* Added procedures list */}
        {procedureEntries.length > 0 && (
          <div className="mb-5 space-y-2">
            {procedureEntries.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-stone-800 text-sm truncate">
                    {entry.procedure.name}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {COMPLEXITY_LABELS[entry.complexity]} ·{' '}
                    <span className="font-semibold" style={{ color: NAVY }}>
                      Equipe: {formatBRL(entry.prices.surgery)}
                    </span>
                    {entry.prices.anesthesia > 0 && (
                      <span className="ml-1">· Anestesia: {formatBRL(entry.prices.anesthesia)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProcedure(idx)}
                  className="ml-3 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Procedure picker */}
        <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            {procedureEntries.length === 0 ? 'Selecionar procedimento *' : 'Adicionar outro procedimento'}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
                if (e.target.value !== pickerProcedure?.name) setPickerProcedure(null);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar procedimento..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none text-stone-800 placeholder-stone-400 bg-white transition-colors"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-stone-500">Nenhum procedimento encontrado</div>
                ) : (
                  filtered.map((proc) => (
                    <button
                      key={proc.id}
                      onMouseDown={() => handleSelectProcedure(proc)}
                      className="w-full text-left px-4 py-3 text-sm text-stone-700 transition-colors border-b border-stone-100 last:border-0"
                      style={{}}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = GOLD_LIGHT;
                        (e.currentTarget as HTMLButtonElement).style.color = NAVY;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '';
                        (e.currentTarget as HTMLButtonElement).style.color = '';
                      }}
                    >
                      <span className="font-medium">{proc.name}</span>
                      <span className="ml-2 text-xs text-stone-400">
                        {proc.category === 'breast' ? '• Mama' :
                          proc.category === 'lipo' ? '• Lipoaspiração' :
                          proc.category === 'abdominoplasty' ? '• Abdômen' : '• Outros'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Complexity selector */}
          {pickerProcedure && (
            <div className="mb-3">
              <div className="text-xs font-medium text-stone-500 mb-2">Complexidade</div>
              <div className="flex gap-2">
                {(['A', 'B', 'C'] as Complexity[]).map((c) => {
                  const prices = getPriceForComplexity(pickerProcedure, c);
                  const available = prices !== null;
                  const selected = pickerComplexity === c;
                  return (
                    <button
                      key={c}
                      onClick={() => available && setPickerComplexity(c)}
                      disabled={!available}
                      className="flex-1 py-2.5 rounded-xl border-2 font-semibold transition-all text-sm"
                      style={
                        !available
                          ? { borderColor: '#e7e5e4', color: '#d6d3d1', background: 'white', cursor: 'not-allowed' }
                          : selected
                          ? { borderColor: GOLD, background: GOLD_LIGHT, color: NAVY }
                          : { borderColor: '#e7e5e4', color: '#57534e', background: 'white' }
                      }
                    >
                      <div>{c}</div>
                      {available && prices && (
                        <div className="text-xs font-normal opacity-70 mt-0.5">
                          {formatBRL(prices.surgery)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price preview */}
          {pickerPrices && (
            <div className="bg-white rounded-xl px-3 py-2.5 text-sm text-stone-700 border border-stone-200 mb-3 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Equipe cirúrgica:</span>
                <span className="font-semibold">{formatBRL(pickerPrices.surgery)}</span>
              </div>
              {pickerPrices.anesthesia > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Anestesista:</span>
                  <span className="font-semibold">{formatBRL(pickerPrices.anesthesia)}</span>
                </div>
              )}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAddProcedure}
            disabled={!canAdd}
            className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
            style={
              canAdd
                ? { background: NAVY, color: 'white' }
                : { background: '#e7e5e4', color: '#a8a29e', cursor: 'not-allowed' }
            }
            onMouseEnter={(e) => { if (canAdd) (e.currentTarget as HTMLButtonElement).style.background = NAVY_HOVER; }}
            onMouseLeave={(e) => { if (canAdd) (e.currentTarget as HTMLButtonElement).style.background = NAVY; }}
          >
            <Plus className="w-4 h-4" />
            {procedureEntries.length === 0 ? 'Adicionar procedimento' : 'Adicionar mais um procedimento'}
          </button>
        </div>
      </div>

      {/* Hospital */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
            Hospital
          </h2>
          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={hospitalAuto}
              onChange={(e) => setHospitalAuto(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Calcular automaticamente
          </label>
        </div>
        {hospitalAuto && procedureEntries.length >= 2 && (
          <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer mb-3 bg-stone-50 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={combinedSurgery}
              onChange={(e) => setCombinedSurgery(e.target.checked)}
              className="w-4 h-4 rounded mt-0.5"
            />
            <span>
              Procedimentos realizados na mesma cirurgia (combinados)
              <span className="block text-stone-500 mt-0.5">
                Quando combinados, aplica 50% de desconto no procedimento de menor valor do hospital.
              </span>
            </span>
          </label>
        )}
        {hospitalAuto && procedureEntries.length > 0 && (
          <div className="mb-3 text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
            {procedureEntries.length === 1
              ? 'Valor do hospital do procedimento selecionado. Desmarque para editar manualmente.'
              : combinedSurgery
                ? 'Soma com 50% de desconto no procedimento de menor valor. Desmarque para editar manualmente.'
                : 'Soma integral dos valores (sem desconto, pois cirurgias separadas). Desmarque para editar manualmente.'}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Nome do hospital
            </label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className={inputClass}
              onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Valor mínimo (R$) *
            </label>
            <input
              type="text"
              value={hospitalMin}
              onChange={(e) => setHospitalMin(e.target.value)}
              disabled={hospitalAuto}
              placeholder="Ex: 4700"
              className={inputClass + (hospitalAuto ? ' bg-stone-100 text-stone-500' : '')}
              onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Valor máximo (R$) *
            </label>
            <input
              type="text"
              value={hospitalMax}
              onChange={(e) => setHospitalMax(e.target.value)}
              disabled={hospitalAuto}
              placeholder="Ex: 5700"
              className={inputClass + (hospitalAuto ? ' bg-stone-100 text-stone-500' : '')}
              onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          {hospitalMin && hospitalMax && (
            <div className="flex items-end">
              <div className="bg-stone-100 rounded-xl px-4 py-2.5 text-sm text-stone-600 w-full">
                {formatBRL(parseFloat(hospitalMin.replace(',', '.')))} – {formatBRL(parseFloat(hospitalMax.replace(',', '.')))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Items */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
          Itens Opcionais / Adicionais
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeArgoplasma}
              onChange={(e) => setIncludeArgoplasma(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <div>
              <div className="font-medium text-stone-700 group-hover:text-stone-900 transition-colors">
                Argoplasma - ARGON 4
              </div>
              <div className="text-sm text-stone-500">
                R$ 5.000,00 à vista · 6x R$ 937,50 · 12x R$ 520,84 (opcional)
              </div>
            </div>
          </label>

          {(anyProcedureHasImplants || includeImplants) && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeImplants}
                onChange={(e) => setIncludeImplants(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div>
                <div className="font-medium text-stone-700 group-hover:text-stone-900 transition-colors">
                  Tabela de implantes de mama
                </div>
                <div className="text-sm text-stone-500">
                  Eurosilicone e Silimed BioDesign (Redondos Texturizados)
                </div>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Doctor Info */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
          Equipe Médica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Cirurgião
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className={inputClass}
              onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Anestesiologista
            </label>
            <input
              type="text"
              value={anesthesiologistName}
              onChange={(e) => setAnesthesiologistName(e.target.value)}
              className={inputClass}
              onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-sm"
        style={
          canGenerate
            ? { background: NAVY, color: 'white' }
            : { background: '#e7e5e4', color: '#a8a29e', cursor: 'not-allowed' }
        }
        onMouseEnter={(e) => { if (canGenerate) (e.currentTarget as HTMLButtonElement).style.background = NAVY_HOVER; }}
        onMouseLeave={(e) => { if (canGenerate) (e.currentTarget as HTMLButtonElement).style.background = NAVY; }}
      >
        <FileText className="w-5 h-5" />
        Gerar Orçamento
      </button>
      {!canGenerate && (
        <p className="text-center text-sm text-stone-400">
          Preencha: nome da paciente, ao menos um procedimento e os valores do hospital
        </p>
      )}
    </div>
  );
}
