import type { Procedure } from '@/data/procedures';

export interface ProcedureEntry {
  id: string;
  procedure: Procedure;
  quantity: number;
  teeth: number[];
  region: string;
  notes: string;
}

export interface QuoteData {
  patientName: string;
  date: string;
  dentistName: string;
  cro: string;
  validityDays: number;
  procedures: ProcedureEntry[];
  generalNotes: string;
}
