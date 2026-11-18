export function dateKey(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function collectionDate(value: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value + "T12:00:00");
    if (!Number.isNaN(date.getTime()) && dateKey(date) === value) return date;
  }
  return new Date();
}

export function calendarDate(year: number, month: number, day: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, month, day);
  return date;
}

export const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: "full" });
