import type { Procedure, PriceSet, Complexity } from '@/data/procedures';

export interface ProcedureEntry {
  entryId?: string;
  procedure: Procedure;
  complexity: Complexity;
  prices: PriceSet;
}

export interface ProcedureCombination {
  id: string;
  procedureEntryIds: string[];
}

export interface ProcedureExclusion {
  id: string;
  procedureEntryIds: string[];
}

export interface QuoteData {
  patientName: string;
  date: string;
  procedures: ProcedureEntry[];
  procedureCombinations?: ProcedureCombination[];
  procedureExclusions?: ProcedureExclusion[];
  manualMode?: boolean;
  combinedSurgery: boolean;
  hospitalName: string;
  hospitalMin: number;
  hospitalMax: number;
  includeArgoplasma: boolean;
  includeImplants: boolean;
  doctorName: string;
  anesthesiologistName: string;
}
