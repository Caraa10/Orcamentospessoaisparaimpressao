import type { Procedure, PriceSet, Complexity } from '@/data/procedures';

export interface ProcedureEntry {
  procedure: Procedure;
  complexity: Complexity;
  prices: PriceSet;
}

export interface QuoteData {
  patientName: string;
  date: string;
  procedures: ProcedureEntry[];
  combinedSurgery: boolean;
  hospitalName: string;
  hospitalMin: number;
  hospitalMax: number;
  includeArgoplasma: boolean;
  includeImplants: boolean;
  doctorName: string;
  anesthesiologistName: string;
}
