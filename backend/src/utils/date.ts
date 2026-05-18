export function vietnamDayStart(input: Date | string): Date {
  const d = new Date(input);
  const utc7Ms = d.getTime() + 7 * 60 * 60 * 1000;
  const dayStartUtc7 = Math.floor(utc7Ms / 86400000) * 86400000;
  return new Date(dayStartUtc7 - 7 * 60 * 60 * 1000);
}

export function lastNDaysRange(n: number): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = vietnamDayStart(now);
  const start = new Date(todayStart.getTime() - (n - 1) * 86400000);
  const end = new Date(todayStart.getTime() + 86400000);
  return { start, end };
}
