export function formatCurrency(number: number, currency: string): string {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });
  const value = currencyFormatter.format(parseFloat(number as any) || 0);

  if (value.endsWith('.00')) {
    return value.slice(0, -3);
  }
  return value;
}

export function formatCurrencyWithoutSymbol(number: number, hideDecimals = true): string {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const parts = currencyFormatter.formatToParts(number);
  const value = parts.filter(part => part.type !== 'currency').map(part => part.value).join('');
  if (hideDecimals && value.endsWith('.00')) {
    return value.slice(0, -3);
  }
  return value;
}

const numberFormatter = new Intl.NumberFormat('default', {
  notation: 'compact',
  unitDisplay: 'short',
});

export function formatAmount(amount: number | string) {
  const parseAmount = Math.round(parseFloat((amount as any) || 0));
  return numberFormatter.format(parseAmount);
}

export function getCurrencySymbol(currencyCode: string) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  });

  const parts = formatter.formatToParts(0);
  return parts.find(part => part.type === 'currency')!.value;
}

export function sanitizeCurrency(currency: string, output: 'int' | 'float' = 'float'): number {
  if (output === 'float') {
    return parseFloat(currency.replace(/[^0-9.-]+/g, ""));
  }

  return parseInt(currency.replace(/[^0-9.-]+/g, ""), 10);
}
