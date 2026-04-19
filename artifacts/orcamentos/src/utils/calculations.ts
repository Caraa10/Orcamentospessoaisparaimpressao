export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBRLNoSymbol(value: number): string {
  const isRound = Number.isInteger(value);
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: isRound ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export interface PaymentOptions {
  avista: number;
  ate6x: number;
  ate12x: number;
}

export function calcPaymentOptions(base: number): PaymentOptions {
  return {
    avista: base,
    ate6x: Math.round(base * 1.125),
    ate12x: Math.round(base * 1.25),
  };
}

export function calcInstallmentValue(total: number, installments: number): number {
  return total / installments;
}
