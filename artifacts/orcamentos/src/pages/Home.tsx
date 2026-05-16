import { useState } from 'react';
import { useLocation } from 'wouter';
import QuoteForm from '@/components/QuoteForm';
import type { QuoteData } from '@/types/quote';

export default function Home() {
  const [, setLocation] = useLocation();
  const logoSrc = `${import.meta.env.BASE_URL}logo-thiago-ferri.png`;

  const handleGenerate = (data: QuoteData) => {
    sessionStorage.setItem('quoteData', JSON.stringify(data));
    setLocation('/preview');
  };

  return (
    <div className="min-h-screen" style={{ background: '#f8f6ef' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <img
            src={logoSrc}
            alt="Thiago Ferri Cirurgia Plástica"
            className="mx-auto mb-5 h-auto w-full max-w-[280px]"
          />
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1d2e3f' }}>
            Planejamento Cirúrgico
          </h1>
          <p className="text-sm" style={{ color: '#7b7466' }}>
            Gere orçamentos personalizados em PDF
          </p>
        </div>

        <QuoteForm onGenerate={handleGenerate} />
      </div>
    </div>
  );
}
