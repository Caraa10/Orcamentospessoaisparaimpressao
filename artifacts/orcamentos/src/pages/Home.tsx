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
    <div className="min-h-screen bg-stone-50" style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #f9f7f2 50%, #f0ead6 100%)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: '#e8e0c4' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e2446" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.22.45 4.56 1.24"/>
              <path d="M16 3l4 4-4 4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1e2446' }}>
            Planejamento Cirúrgico
          </h1>
          <p className="text-stone-500 text-sm">
            Gere orçamentos personalizados em PDF
          </p>
        </div>

        <QuoteForm onGenerate={handleGenerate} />
      </div>
    </div>
  );
}
