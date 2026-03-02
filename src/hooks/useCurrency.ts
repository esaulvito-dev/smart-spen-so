import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

export type CurrencyCode = 'PEN' | 'USD';

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string; name: string }> = {
  PEN: { symbol: 'S/', locale: 'es-PE', name: 'Soles (S/)' },
  USD: { symbol: '$', locale: 'en-US', name: 'Dólares ($)' },
};

// Base currency for all stored amounts
const BASE_CURRENCY: CurrencyCode = 'PEN';

function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('exchange-rate');
      if (error) throw error;
      // data.rate = how many PEN per 1 USD
      return data.rate as number;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
    retry: 2,
  });
}

export function useCurrency() {
  const { data: profile } = useProfile();
  const code = (profile?.currency as CurrencyCode) || 'PEN';
  const config = CURRENCY_CONFIG[code] || CURRENCY_CONFIG.PEN;
  const { data: usdToPenRate } = useExchangeRate();

  // rate defaults to 3.75 if not loaded yet
  const rate = usdToPenRate || 3.75;

  /**
   * Convert an amount from the base currency (PEN) to the display currency.
   * If display currency is PEN, no conversion. If USD, divide by rate.
   */
  const convertAmount = (amount: number): number => {
    if (code === BASE_CURRENCY) return amount;
    // PEN -> USD: divide by rate
    return amount / rate;
  };

  const formatCurrency = (amount: number) => {
    const converted = convertAmount(Math.abs(amount));
    return `${config.symbol} ${converted.toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return {
    currency: code,
    symbol: config.symbol,
    locale: config.locale,
    formatCurrency,
    currencyName: config.name,
    exchangeRate: rate,
    convertAmount,
  };
}

export { CURRENCY_CONFIG };
