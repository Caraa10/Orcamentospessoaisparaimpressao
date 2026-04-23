import { useState } from 'react';
import { useLocation } from 'wouter';
import QuoteForm from '@/components/QuoteForm';
import type { QuoteData } from '@/types/quote';

export default function Home() {
  const [, setLocation] = useLocation();

  const handleGenerate = (data: QuoteData) => {
    sessionStorage.setItem('quoteData', JSON.stringify(data));
    setLocation('/preview');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
            style={{ background: '#dff7f3' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c2.5 0 4 2 4 5 0 5-2 10-4 13-2-3-4-8-4-13 0-3 1.5-5 4-5Z" />
              <path d="M9.5 4.5c.8.5 1.6.7 2.5.7s1.7-.2 2.5-.7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#0f172a' }}>
            Orçamento Odontológico
          </h1>
          <p className="text-stone-500 text-sm">
            Monte o plano de tratamento e gere o PDF para o paciente
          </p>
        </div>

        <QuoteForm onGenerate={handleGenerate} />
      </div>
    </div>
  );
}
