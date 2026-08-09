const SYMBOLS: Record<string, string> = {
  PYG: "₲",
  ARS: "$",
  USD: "$",
  MXN: "$",
  EUR: "€",
};

const NO_DECIMALS = new Set(["PYG", "JPY", "KRW", "CLP"]);

export function currencySymbol(currency = "PYG"): string {
  return SYMBOLS[currency] ?? `${currency} `;
}

export function formatCurrency(amount: number, currency = "PYG"): string {
  const formatted = new Intl.NumberFormat("es", {
    minimumFractionDigits: NO_DECIMALS.has(currency) ? 0 : 2,
    maximumFractionDigits: NO_DECIMALS.has(currency) ? 0 : 2,
  }).format(amount);
  return `${currencySymbol(currency)}${formatted}`;
}

export function formatDate(date: string | Date, locale = "es-MX"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date, locale = "es-MX"): string {
  return new Date(date).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}