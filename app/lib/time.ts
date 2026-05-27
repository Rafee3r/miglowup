/**
 * Helpers de tiempo para Server Components.
 * En Server Components Date.now() se ejecuta una vez por request, lo cual
 * es seguro. Encapsulado en este helper para mantener las páginas limpias.
 */

export function getChileanDateString(dateInput: Date | string | number = new Date()): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function todayKey(): string {
  return getChileanDateString();
}

export function dateKeyDaysAgo(days: number): string {
  return getChileanDateString(Date.now() - days * 86400000);
}
