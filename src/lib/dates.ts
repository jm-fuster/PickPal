const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * Construye una Date para month+day en `year`. Si es 29-feb y `year` no es
 * bisiesto, hace fallback a 28-feb (la convención más común; ver dudas.md).
 */
function occurrenceInYear(year: number, month: number, day: number): Date {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28);
  }
  return new Date(year, month - 1, day);
}

/**
 * Días enteros desde `from` (00:00 local) hasta la próxima ocurrencia anual
 * de month/day. Devuelve 0 si la fecha es hoy.
 */
export function computeDaysUntilNextOccurrence(
  month: number,
  day: number,
  from: Date = new Date(),
): number {
  const today = startOfDay(from);
  let next = occurrenceInYear(today.getFullYear(), month, day);
  if (next.getTime() < today.getTime()) {
    next = occurrenceInYear(today.getFullYear() + 1, month, day);
  }
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}

export function formatDayMonth(month: number, day: number): string {
  return `${day} de ${MONTHS_ES[month - 1]}`;
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}
