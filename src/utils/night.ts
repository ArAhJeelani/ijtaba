export function calculateNight(maghrib: string, fajr: string) {
  const start = new Date(maghrib),
    end = new Date(fajr);
  const duration = end.getTime() - start.getTime();
  if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 3600000)
    throw new Error(
      "Enter Maghrib and the following Fajr, with a night lasting less than 24 hours.",
    );
  return {
    start: new Date(end.getTime() - duration / 3),
    end,
    duration,
    third: duration / 3,
  };
}
