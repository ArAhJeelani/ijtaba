type SearchableMasjid = { id: string; name: string; city: string };
const aliases: Record<string, string> = {
  "quba-ajax": "qubaa kuba islamic society of ajax",
  "toronto-adelaide": "downtown adelaide",
  "aqsaa-ajax": "aqsa alaqsa alaqsaa",
  "usman-pickering": "uthman osman pic pickering islamic centre center",
};
const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
function distance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        row[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    previous = row;
  }
  return previous[b.length];
}
/** Every query word must match. Exact matches outrank prefixes, then small typos. */
export function searchMasjids<T extends SearchableMasjid>(
  masjids: T[],
  query: string,
): T[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  if (terms.length > 10 || terms.some((t) => t.length > 40)) return [];
  return masjids
    .map((m) => {
      const words = normalize(
        `${m.name} ${m.city} ${aliases[m.id] || ""}`,
      ).split(/\s+/);
      const scores = terms.map((term) =>
        Math.max(
          ...words.map((word) => {
            if (term === word) return 100;
            if (word.startsWith(term)) return 75;
            if (
              term.length >= 4 &&
              Math.abs(term.length - word.length) <= 1 &&
              distance(term, word) <= 1
            )
              return 40;
            return 0;
          }),
        ),
      );
      return {
        m,
        score: scores.every(Boolean) ? scores.reduce((a, b) => a + b, 0) : 0,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.m.name.localeCompare(b.m.name))
    .slice(0, 6)
    .map((item) => item.m);
}
