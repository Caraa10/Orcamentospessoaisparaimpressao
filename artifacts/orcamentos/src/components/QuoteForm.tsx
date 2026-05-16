import { useState, useMemo, useEffect } from 'react';
import { Search, FileText, Plus, Trash2, ChevronDown } from 'lucide-react';
import { PROCEDURES, Procedure, Complexity, getPriceForComplexity, ARGOPLASMA_PRICE } from '@/data/procedures';
import { formatBRL } from '@/utils/calculations';
import type { QuoteData, ProcedureCombination, ProcedureEntry, ProcedureExclusion } from '@/types/quote';

interface Props {
  onGenerate: (data: QuoteData) => void;
}

const COMPLEXITY_LABELS: Record<Complexity, string> = {
  A: 'Complexidade A',
  B: 'Complexidade B',
  C: 'Complexidade C',
};

const HOSPITAL_NAME = 'Hospital Accurata';

const BRAND = '#0f766e';
const BRAND_HOVER = '#115e59';
const BRAND_SOFT = '#dff7f3';
const BRAND_BORDER = '#99f6e4';
const SURFACE = '#f8fafc';
const SURFACE_BORDER = '#e2e8f0';
const TEXT = '#0f172a';
const TEXT_MUTED = '#64748b';

function parseCurrencyInput(value: string) {
  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProcedureEntryId(entry: ProcedureEntry, index: number) {
  return entry.entryId ?? `${entry.procedure.id}-${index}`;
}

function makePairKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join('||');
}

function getExclusionKeys(exclusions: ProcedureExclusion[]) {
  return new Set(
    exclusions
      .filter((exclusion) => exclusion.procedureEntryIds.length >= 2)
      .map((exclusion) => makePairKey(exclusion.procedureEntryIds[0], exclusion.procedureEntryIds[1])),
  );
}

function hasBlockedPair(procedureEntryIds: string[], exclusions: ProcedureExclusion[]) {
  const exclusionKeys = getExclusionKeys(exclusions);
  for (let i = 0; i < procedureEntryIds.length; i++) {
    for (let j = i + 1; j < procedureEntryIds.length; j++) {
      if (exclusionKeys.has(makePairKey(procedureEntryIds[i], procedureEntryIds[j]))) return true;
    }
  }
  return false;
}

function calculateCombinedHospitalValues(entries: ProcedureEntry[]) {
  const items = entries
    .map((entry) => {
      const min = entry.procedure.hospitalMin;
      if (min === null) return null;
      const max = entry.procedure.hospitalMax ?? min;
      return { min, max };
    })
    .filter((item): item is { min: number; max: number } => item !== null);

  if (items.length === 0) {
    return { min: 0, max: 0 };
  }

  const applyDiscount = items.length >= 2;
  let highestIdx = 0;
  if (applyDiscount) {
    for (let i = 1; i < items.length; i++) {
      if (items[i].min > items[highestIdx].min) highestIdx = i;
    }
  }

  let min = 0;
  let max = 0;
  for (let i = 0; i < items.length; i++) {
    const factor = applyDiscount && i !== highestIdx ? 0.5 : 1;
    min += items[i].min * factor;
    max += items[i].max * factor;
  }

  return {
    min: Math.round(min),
    max: Math.round(max),
  };
}

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
  const [procedureCombinations, setProcedureCombinations] = useState<ProcedureCombination[]>([]);
  const [procedureExclusions, setProcedureExclusions] = useState<ProcedureExclusion[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [manualProcedureName, setManualProcedureName] = useState('');
  const [manualSurgeryValue, setManualSurgeryValue] = useState('');
  const [manualAnesthesiaValue, setManualAnesthesiaValue] = useState('0');

  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [pickerProcedure, setPickerProcedure] = useState<Procedure | null>(null);
  const [pickerComplexity, setPickerComplexity] = useState<Complexity>('A');

  const [hospitalMin, setHospitalMin] = useState('');
  const [hospitalMax, setHospitalMax] = useState('');
  const [hospitalName, setHospitalName] = useState(HOSPITAL_NAME);
  const [hospitalAuto, setHospitalAuto] = useState(true);
  const [combinedSurgery, setCombinedSurgery] = useState(true);
  const hasAutoHospitalValues = !manualMode && procedureEntries.some((entry) => entry.procedure.hospitalMin !== null);
  const effectiveHospitalAuto = hospitalAuto && hasAutoHospitalValues;

  // Auto-fill hospital values from selected procedures
  useEffect(() => {
    if (!effectiveHospitalAuto) return;
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

    // When 2+ procedures are combined, keep the highest hospital value full and apply 50% to the others.
    const applyDiscount = items.length >= 2 && combinedSurgery;
    let highestIdx = 0;
    if (applyDiscount) {
      for (let i = 1; i < items.length; i++) {
        if (items[i].min > items[highestIdx].min) highestIdx = i;
      }
    }
    let sumMin = 0;
    let sumMax = 0;
    for (let i = 0; i < items.length; i++) {
      const factor = applyDiscount && i !== highestIdx ? 0.5 : 1;
      sumMin += items[i].min * factor;
      sumMax += items[i].max * factor;
    }
    setHospitalMin(String(Math.round(sumMin)));
    setHospitalMax(String(Math.round(sumMax)));
  }, [procedureEntries, effectiveHospitalAuto, combinedSurgery]);

  const [includeArgoplasma, setIncludeArgoplasma] = useState(false);
  const [includeImplants, setIncludeImplants] = useState(false);

  const [doctorName, setDoctorName] = useState('Dr. Thiago');
  const [anesthesiologistName, setAnesthesiologistName] = useState('Drª. Priscila');

  useEffect(() => {
    if (manualMode) {
      setHospitalAuto(false);
      setShowDropdown(false);
      setSearch('');
      setPickerProcedure(null);
      setPickerComplexity('A');
    }
  }, [manualMode]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return PROCEDURES.slice(0, 30);

    const matches = PROCEDURES.filter((p) => p.name.toLowerCase().includes(q));

    if (/^abd/.test(q)) {
      const rankAbdomenProcedure = (name: string) => {
        const normalized = name.toLowerCase();
        const isAbdominoplasty = normalized.startsWith('abdominoplastia');
        const hasAbdomenFlanksLipo = /lipoaspiração de abdome,? flancos/.test(normalized);

        if (normalized === 'abdominoplastia') return 0;
        if (isAbdominoplasty && hasAbdomenFlanksLipo) return 1;
        if (isAbdominoplasty) return 2;
        if (normalized.startsWith('miniabdominoplastia')) return 3;
        if (normalized.includes('miniabdominoplastia')) return 4;
        if (normalized.includes('abdominoplastia')) return 5;
        return 6;
      };

      return matches
        .slice()
        .sort((a, b) => {
          const rankDiff = rankAbdomenProcedure(a.name) - rankAbdomenProcedure(b.name);
          if (rankDiff !== 0) return rankDiff;
          return a.name.localeCompare(b.name, 'pt-BR');
        })
        .slice(0, 40);
    }

    return matches.slice(0, 40);
  }, [search]);

  const pickerPrices = useMemo(() => {
    if (!pickerProcedure) return null;
    return getPriceForComplexity(pickerProcedure, pickerComplexity);
  }, [pickerProcedure, pickerComplexity]);

  const anyProcedureHasImplants = procedureEntries.some((e) => e.procedure.hasImplants);
  const anyProcedureSupportsArgoplasma = procedureEntries.some((entry) => {
    const procName = entry.procedure.name.toLowerCase();
    return (
      procName.includes('abdominoplastia') ||
      procName.includes('miniabdominoplastia') ||
      (procName.includes('lipoaspiração') &&
        (procName.includes('abdome') ||
          procName.includes('flanco') ||
          procName.includes('dorso') ||
          procName.includes('coxa') ||
          procName.includes('braço')))
    );
  });

  const shouldShowArgoplasmaOption = manualMode ? true : anyProcedureSupportsArgoplasma;
  const shouldShowImplantsOption = manualMode ? true : anyProcedureHasImplants || includeImplants;

  useEffect(() => {
    if (!manualMode) {
      setIncludeArgoplasma(anyProcedureSupportsArgoplasma);
    }
  }, [anyProcedureSupportsArgoplasma, manualMode]);

  useEffect(() => {
    const validIds = new Set(procedureEntries.map(getProcedureEntryId));
    setProcedureCombinations((prev) =>
      prev
        .map((combination) => ({
          ...combination,
          procedureEntryIds: combination.procedureEntryIds.filter((id) => validIds.has(id)),
        }))
        .filter((combination) => combination.procedureEntryIds.length > 0),
    );
    setProcedureExclusions((prev) =>
      prev
        .map((exclusion) => ({
          ...exclusion,
          procedureEntryIds: exclusion.procedureEntryIds.filter((id) => validIds.has(id)).slice(0, 2),
        }))
        .filter((exclusion) => exclusion.procedureEntryIds.length > 0),
    );
  }, [procedureEntries]);

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
      entryId: createLocalId('proc'),
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

  const handleAddCombination = () => {
    const defaultIds = procedureEntries
      .slice(0, 2)
      .map((entry, idx) => getProcedureEntryId(entry, idx));

    setProcedureCombinations((prev) => [
      ...prev,
      {
        id: createLocalId('combo'),
        procedureEntryIds: defaultIds,
      },
    ]);
  };

  const handleRemoveCombination = (combinationId: string) => {
    setProcedureCombinations((prev) => prev.filter((combination) => combination.id !== combinationId));
  };

  const handleToggleCombinationProcedure = (combinationId: string, procedureEntryId: string) => {
    setProcedureCombinations((prev) =>
      prev.map((combination) => {
        if (combination.id !== combinationId) return combination;
        const selected = combination.procedureEntryIds.includes(procedureEntryId);
        return {
          ...combination,
          procedureEntryIds: selected
            ? combination.procedureEntryIds.filter((id) => id !== procedureEntryId)
            : [...combination.procedureEntryIds, procedureEntryId],
        };
      }),
    );
  };

  const handleAddExclusion = () => {
    const defaultIds = procedureEntries
      .slice(0, 2)
      .map((entry, idx) => getProcedureEntryId(entry, idx));
    if (defaultIds.length < 2) return;

    setProcedureExclusions((prev) => [
      ...prev,
      {
        id: createLocalId('block'),
        procedureEntryIds: defaultIds,
      },
    ]);
  };

  const handleUpdateExclusion = (exclusionId: string, position: number, procedureEntryId: string) => {
    setProcedureExclusions((prev) =>
      prev.map((exclusion) => {
        if (exclusion.id !== exclusionId) return exclusion;
        const nextIds = [...exclusion.procedureEntryIds];
        nextIds[position] = procedureEntryId;
        return {
          ...exclusion,
          procedureEntryIds: nextIds.slice(0, 2),
        };
      }),
    );
  };

  const handleRemoveExclusion = (exclusionId: string) => {
    setProcedureExclusions((prev) => prev.filter((exclusion) => exclusion.id !== exclusionId));
  };

  const canAdd = pickerProcedure !== null && pickerPrices !== null;
  const hasManualProcedureData =
    manualProcedureName.trim() &&
    manualSurgeryValue.trim() &&
    hospitalMin.trim() &&
    hospitalMax.trim();
  const hasStructuredProcedureData =
    procedureEntries.length > 0 &&
    hospitalMin.trim() &&
    hospitalMax.trim();
  const canGenerate =
    patientName.trim() &&
    (manualMode ? hasManualProcedureData : hasStructuredProcedureData);

  const handleGenerate = () => {
    if (!canGenerate) return;
    const parsedHospitalMin = parseCurrencyInput(hospitalMin);
    const parsedHospitalMax = parseCurrencyInput(hospitalMax);
    const parsedManualSurgery = parseCurrencyInput(manualSurgeryValue);
    const parsedManualAnesthesia = parseCurrencyInput(manualAnesthesiaValue);

    const procedures = manualMode
      ? [
          {
            procedure: {
              id: 'manual-procedure',
              name: manualProcedureName.trim(),
              category: 'other' as const,
              complexityA: null,
              complexityB: null,
              complexityC: null,
              hasImplants: includeImplants,
              hospitalMin: parsedHospitalMin,
              hospitalMax: parsedHospitalMax,
            },
            complexity: 'A' as const,
            prices: {
              total: parsedManualSurgery + parsedManualAnesthesia,
              surgery: parsedManualSurgery,
              anesthesia: parsedManualAnesthesia,
            },
          },
        ]
      : procedureEntries;
    const validProcedureEntryIds = new Set(procedures.map(getProcedureEntryId));
    const validProcedureCombinations = manualMode
      ? []
      : procedureCombinations
          .map((combination) => ({
            ...combination,
            procedureEntryIds: combination.procedureEntryIds.filter((id) => validProcedureEntryIds.has(id)),
          }))
          .filter((combination) =>
            combination.procedureEntryIds.length >= 2 &&
            !hasBlockedPair(combination.procedureEntryIds, procedureExclusions),
          );
    const validProcedureExclusions = manualMode
      ? []
      : procedureExclusions
          .map((exclusion) => ({
            ...exclusion,
            procedureEntryIds: exclusion.procedureEntryIds.filter((id) => validProcedureEntryIds.has(id)).slice(0, 2),
          }))
          .filter((exclusion) =>
            exclusion.procedureEntryIds.length === 2 &&
            exclusion.procedureEntryIds[0] !== exclusion.procedureEntryIds[1],
          );

    onGenerate({
      patientName: patientName.trim(),
      date,
      procedures,
      procedureCombinations: validProcedureCombinations,
      procedureExclusions: validProcedureExclusions,
      manualMode,
      combinedSurgery: manualMode ? false : combinedSurgery,
      hospitalName: hospitalName.trim() || HOSPITAL_NAME,
      hospitalMin: parsedHospitalMin,
      hospitalMax: parsedHospitalMax,
      includeArgoplasma,
      includeImplants,
      doctorName: doctorName.trim(),
      anesthesiologistName: anesthesiologistName.trim(),
    });
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 transition-colors';
  const inputFocusStyle = {
    '--tw-ring-color': '#ccfbf1',
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* Patient & Date */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: SURFACE_BORDER }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: TEXT_MUTED }}>
          Dados da Paciente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
              Nome da paciente *
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nome completo"
              className={inputClass}
              style={{ ...inputFocusStyle, borderColor: patientName ? BRAND_BORDER : undefined }}
              onFocus={(e) => (e.target.style.borderColor = BRAND)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
              Data do orçamento *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              style={inputFocusStyle}
              onFocus={(e) => (e.target.style.borderColor = BRAND)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
        </div>
      </div>

      {/* Procedures */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: SURFACE_BORDER }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
            Procedimentos
          </h2>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => setManualMode(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Preencher manualmente
          </label>
        </div>

        {/* Added procedures list */}
        {!manualMode && procedureEntries.length > 0 && (
          <div className="mb-5 space-y-2">
            {procedureEntries.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: BRAND_SOFT, border: `1px solid ${BRAND_BORDER}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate" style={{ color: TEXT }}>
                    {entry.procedure.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                    {COMPLEXITY_LABELS[entry.complexity]} ·{' '}
                    <span className="font-semibold" style={{ color: BRAND }}>
                      Equipe: {formatBRL(entry.prices.surgery)}
                    </span>
                    {entry.prices.anesthesia > 0 && (
                      <span className="ml-1">· Anestesia: {formatBRL(entry.prices.anesthesia)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProcedure(idx)}
                  className="ml-3 transition-colors flex-shrink-0 text-slate-400 hover:text-slate-600"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {manualMode ? (
          <div className="border rounded-xl p-4 space-y-4" style={{ borderColor: SURFACE_BORDER, background: SURFACE }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
              Preenchimento manual do procedimento
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
                Nome do procedimento *
              </label>
              <input
                type="text"
                value={manualProcedureName}
                onChange={(e) => setManualProcedureName(e.target.value)}
                placeholder="Ex: Abdominoplastia com lipoescultura"
                className={inputClass}
                style={inputFocusStyle}
                onFocus={(e) => (e.target.style.borderColor = BRAND)}
                onBlur={(e) => (e.target.style.borderColor = '')}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
                  Equipe cirúrgica (R$) *
                </label>
                <input
                  type="text"
                  value={manualSurgeryValue}
                  onChange={(e) => setManualSurgeryValue(e.target.value)}
                  placeholder="Ex: 25000"
                  className={inputClass}
                  style={inputFocusStyle}
                  onFocus={(e) => (e.target.style.borderColor = BRAND)}
                  onBlur={(e) => (e.target.style.borderColor = '')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
                  Anestesista (R$)
                </label>
                <input
                  type="text"
                  value={manualAnesthesiaValue}
                  onChange={(e) => setManualAnesthesiaValue(e.target.value)}
                  placeholder="Ex: 3000 ou 0"
                  className={inputClass}
                  style={inputFocusStyle}
                  onFocus={(e) => (e.target.style.borderColor = BRAND)}
                  onBlur={(e) => (e.target.style.borderColor = '')}
                />
              </div>
            </div>
            {manualSurgeryValue.trim() && (
              <div className="bg-white rounded-xl px-3 py-2.5 text-sm text-slate-700 border border-slate-200 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipe cirúrgica:</span>
                  <span className="font-semibold">{formatBRL(parseCurrencyInput(manualSurgeryValue))}</span>
                </div>
                {parseCurrencyInput(manualAnesthesiaValue) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anestesista:</span>
                    <span className="font-semibold">{formatBRL(parseCurrencyInput(manualAnesthesiaValue))}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-xl p-4" style={{ borderColor: SURFACE_BORDER, background: SURFACE }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
              {procedureEntries.length === 0 ? 'Selecionar procedimento *' : 'Adicionar outro procedimento'}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none text-slate-800 placeholder-slate-400 bg-white transition-colors"
                style={inputFocusStyle}
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto" style={{ borderColor: SURFACE_BORDER }}>
                  {filtered.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">Nenhum procedimento encontrado</div>
                  ) : (
                    filtered.map((proc) => (
                      <button
                        key={proc.id}
                        onMouseDown={() => handleSelectProcedure(proc)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 transition-colors border-b border-slate-100 last:border-0"
                        style={{}}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = BRAND_SOFT;
                          (e.currentTarget as HTMLButtonElement).style.color = BRAND;
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
                <div className="text-xs font-medium text-slate-500 mb-2">Complexidade</div>
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
                            ? { borderColor: '#e2e8f0', color: '#cbd5e1', background: 'white', cursor: 'not-allowed' }
                            : selected
                            ? { borderColor: BRAND, background: BRAND_SOFT, color: BRAND }
                            : { borderColor: '#e2e8f0', color: '#475569', background: 'white' }
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
              <div className="bg-white rounded-xl px-3 py-2.5 text-sm text-slate-700 border border-slate-200 mb-3 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipe cirúrgica:</span>
                  <span className="font-semibold">{formatBRL(pickerPrices.surgery)}</span>
                </div>
                {pickerPrices.anesthesia > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anestesista:</span>
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
                  ? { background: BRAND, color: 'white' }
                  : { background: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }
              }
              onMouseEnter={(e) => { if (canAdd) (e.currentTarget as HTMLButtonElement).style.background = BRAND_HOVER; }}
              onMouseLeave={(e) => { if (canAdd) (e.currentTarget as HTMLButtonElement).style.background = BRAND; }}
            >
              <Plus className="w-4 h-4" />
              {procedureEntries.length === 0 ? 'Adicionar procedimento' : 'Adicionar mais um procedimento'}
            </button>
          </div>
        )}
      </div>

      {!manualMode && procedureEntries.length >= 2 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: SURFACE_BORDER }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                Combinações possíveis
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sem seleção específica, o documento considera os procedimentos como combináveis. Adicione combinações para imprimir somente as opções escolhidas.
              </p>
            </div>
            <button
              onClick={handleAddCombination}
              className="px-3 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
              style={{ background: BRAND, color: 'white' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = BRAND_HOVER; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = BRAND; }}
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>

          {procedureCombinations.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-slate-500" style={{ borderColor: SURFACE_BORDER, background: SURFACE }}>
              Nenhuma combinação específica adicionada. O documento vai apresentar a combinação geral dos procedimentos selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {procedureCombinations.map((combination, comboIdx) => {
                const selectedIds = combination.procedureEntryIds;
                const selectedEntries = procedureEntries.filter((entry, idx) =>
                  selectedIds.includes(getProcedureEntryId(entry, idx)),
                );
                const totalSurgery = selectedEntries.reduce((sum, entry) => sum + entry.prices.surgery, 0);
                const totalAnesthesia = selectedEntries.reduce((sum, entry) => sum + entry.prices.anesthesia, 0);
                const totalHospital = calculateCombinedHospitalValues(selectedEntries);
                const hasBlockedProcedures = hasBlockedPair(selectedIds, procedureExclusions);
                const isValid = selectedEntries.length >= 2 && !hasBlockedProcedures;

                return (
                  <div key={combination.id} className="rounded-xl border p-4" style={{ borderColor: SURFACE_BORDER, background: SURFACE }}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          Combinação {comboIdx + 1}
                        </div>
                        {!isValid && (
                          <div className="text-xs text-amber-700 mt-0.5">
                            {selectedEntries.length < 2
                              ? 'Selecione ao menos 2 procedimentos para imprimir esta combinação.'
                              : 'Esta combinação contém procedimentos marcados como incompatíveis e não será impressa.'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveCombination(combination.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Remover combinação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      {procedureEntries.map((entry, idx) => {
                        const entryId = getProcedureEntryId(entry, idx);
                        const checked = combination.procedureEntryIds.includes(entryId);

                        return (
                          <label key={entryId} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleCombinationProcedure(combination.id, entryId)}
                              className="w-4 h-4 rounded mt-0.5"
                            />
                            <span>
                              <span className="font-medium">{entry.procedure.name}</span>
                              <span className="block text-xs text-slate-500">
                                {COMPLEXITY_LABELS[entry.complexity]}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {selectedEntries.length > 0 && (
                      <div className="bg-white rounded-xl px-3 py-2.5 text-sm text-slate-700 border border-slate-200 space-y-0.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Equipe cirúrgica:</span>
                          <span className="font-semibold">{formatBRL(totalSurgery)}</span>
                        </div>
                        {totalAnesthesia > 0 && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Anestesista:</span>
                            <span className="font-semibold">{formatBRL(totalAnesthesia)}</span>
                          </div>
                        )}
                        {totalHospital.min > 0 && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Hospital:</span>
                            <span className="font-semibold">
                              {totalHospital.min === totalHospital.max
                                ? formatBRL(totalHospital.min)
                                : `${formatBRL(totalHospital.min)} - ${formatBRL(totalHospital.max)}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 pt-5 border-t" style={{ borderColor: SURFACE_BORDER }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Procedimentos que não podem ser combinados
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Marque pares incompatíveis. O documento não vai imprimir combinações que contenham esses dois procedimentos juntos.
                </p>
              </div>
              <button
                onClick={handleAddExclusion}
                className="px-3 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors border"
                style={{ background: 'white', color: BRAND, borderColor: BRAND_BORDER }}
              >
                <Plus className="w-4 h-4" />
                Restrição
              </button>
            </div>

            {procedureExclusions.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-slate-500" style={{ borderColor: SURFACE_BORDER, background: 'white' }}>
                Nenhuma restrição adicionada. Todos os procedimentos selecionados serão considerados combináveis.
              </div>
            ) : (
              <div className="space-y-3">
                {procedureExclusions.map((exclusion) => {
                  const firstId = exclusion.procedureEntryIds[0] ?? '';
                  const secondId = exclusion.procedureEntryIds[1] ?? '';
                  const invalidPair = !firstId || !secondId || firstId === secondId;

                  return (
                    <div key={exclusion.id} className="rounded-xl border bg-white p-3" style={{ borderColor: SURFACE_BORDER }}>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-2 md:items-center">
                        <select
                          value={firstId}
                          onChange={(e) => handleUpdateExclusion(exclusion.id, 0, e.target.value)}
                          className={inputClass}
                          style={inputFocusStyle}
                        >
                          {procedureEntries.map((entry, idx) => {
                            const entryId = getProcedureEntryId(entry, idx);
                            return (
                              <option key={entryId} value={entryId}>
                                {entry.procedure.name}
                              </option>
                            );
                          })}
                        </select>
                        <span className="text-xs font-semibold text-slate-400 text-center">não combina com</span>
                        <select
                          value={secondId}
                          onChange={(e) => handleUpdateExclusion(exclusion.id, 1, e.target.value)}
                          className={inputClass}
                          style={inputFocusStyle}
                        >
                          {procedureEntries.map((entry, idx) => {
                            const entryId = getProcedureEntryId(entry, idx);
                            return (
                              <option key={entryId} value={entryId}>
                                {entry.procedure.name}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          onClick={() => handleRemoveExclusion(exclusion.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors justify-self-end"
                          title="Remover restrição"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {invalidPair && (
                        <div className="text-xs text-amber-700 mt-2">
                          Escolha dois procedimentos diferentes para ativar esta restrição.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hospital */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: SURFACE_BORDER }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
            Hospital
          </h2>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={hospitalAuto}
              onChange={(e) => setHospitalAuto(e.target.checked)}
              disabled={manualMode}
              className="w-4 h-4 rounded"
            />
            Calcular automaticamente
          </label>
        </div>
        {hospitalAuto && procedureEntries.length > 0 && (
          <div className="mb-3 text-xs text-slate-500 rounded-lg px-3 py-2" style={{ background: SURFACE }}>
            {procedureEntries.length === 1
              ? 'Valor do hospital do procedimento selecionado. Desmarque para editar manualmente.'
              : 'Estimativa automática geral: maior valor hospitalar integral e 50% nos demais. As combinações escolhidas serão calculadas em suas próprias páginas.'}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
              Nome do hospital
            </label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className={inputClass}
              style={inputFocusStyle}
              onFocus={(e) => (e.target.style.borderColor = BRAND)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
              Valor mínimo (R$) *
            </label>
            <input
              type="text"
              value={hospitalMin}
              onChange={(e) => setHospitalMin(e.target.value)}
            disabled={effectiveHospitalAuto}
              placeholder="Ex: 4700"
              className={inputClass + (hospitalAuto ? ' bg-slate-100 text-slate-500' : '')}
              style={inputFocusStyle}
              onFocus={(e) => (e.target.style.borderColor = BRAND)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
              Valor máximo (R$) *
            </label>
            <input
              type="text"
              value={hospitalMax}
              onChange={(e) => setHospitalMax(e.target.value)}
            disabled={effectiveHospitalAuto}
              placeholder="Ex: 5700"
              className={inputClass + (hospitalAuto ? ' bg-slate-100 text-slate-500' : '')}
              style={inputFocusStyle}
              onFocus={(e) => (e.target.style.borderColor = BRAND)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          {hospitalMin && hospitalMax && (
            <div className="flex items-end">
              <div className="bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-600 w-full">
                {formatBRL(parseFloat(hospitalMin.replace(',', '.')))} – {formatBRL(parseFloat(hospitalMax.replace(',', '.')))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Items */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: SURFACE_BORDER }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: TEXT_MUTED }}>
          Itens Opcionais / Adicionais
        </h2>
        <div className="space-y-3">
          {shouldShowArgoplasmaOption && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeArgoplasma}
                onChange={(e) => setIncludeArgoplasma(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div>
                <div className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  Argoplasma - ARGON 4
                </div>
                <div className="text-sm text-slate-500">
                  R$ 5.000,00 à vista · 6x R$ 5.625,00 · 12x R$ 6.250,00 (opcional)
                </div>
              </div>
            </label>
          )}

          {shouldShowImplantsOption && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeImplants}
                onChange={(e) => setIncludeImplants(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div>
                <div className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  Tabela de implantes de mama
                </div>
                <div className="text-sm text-slate-500">
                  Eurosilicone e Silimed BioDesign (Redondos Texturizados)
                </div>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Doctor Info */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: SURFACE_BORDER }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: TEXT_MUTED }}>
          Equipe Médica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
              Cirurgião
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className={inputClass}
              style={inputFocusStyle}
              onFocus={(e) => (e.target.style.borderColor = BRAND)}
              onBlur={(e) => (e.target.style.borderColor = '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#334155' }}>
              Anestesiologista
            </label>
            <input
              type="text"
              value={anesthesiologistName}
              onChange={(e) => setAnesthesiologistName(e.target.value)}
              className={inputClass}
              style={inputFocusStyle}
              onFocus={(e) => (e.target.style.borderColor = BRAND)}
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
            ? { background: BRAND, color: 'white' }
            : { background: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }
        }
        onMouseEnter={(e) => { if (canGenerate) (e.currentTarget as HTMLButtonElement).style.background = BRAND_HOVER; }}
        onMouseLeave={(e) => { if (canGenerate) (e.currentTarget as HTMLButtonElement).style.background = BRAND; }}
      >
        <FileText className="w-5 h-5" />
        Gerar Orçamento
      </button>
      {!canGenerate && (
        <p className="text-center text-sm text-slate-400">
          Preencha: nome da paciente, ao menos um procedimento e os valores do hospital
        </p>
      )}
    </div>
  );
}
