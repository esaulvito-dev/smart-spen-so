import { useProfile } from '@/hooks/useProfile';

export type CurrencyCode = 'PEN' | 'USD';

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string; name: string }> = {
  PEN: { symbol: 'S/', locale: 'es-PE', name: 'Soles (S/)' },
  USD: { symbol: '$', locale: 'en-US', name: 'Dólares ($)' },
};

export function useCurrency() {
  const { data: profile } = useProfile();
  const code = (profile?.currency as CurrencyCode) || 'PEN';
  const config = CURRENCY_CONFIG[code] || CURRENCY_CONFIG.PEN;

  const formatCurrency = (amount: number) => {
    return `${config.symbol} ${Math.abs(amount).toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { currency: code, symbol: config.symbol, locale: config.locale, formatCurrency, currencyName: config.name };
}

export { CURRENCY_CONFIG };
