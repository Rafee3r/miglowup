/**
 * Helpers de tiempo para Server Components.
 * En Server Components Date.now() se ejecuta una vez por request, lo cual
 * es seguro. Encapsulado en este helper para mantener las páginas limpias.
 */

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateKeyDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}
