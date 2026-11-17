export interface Dua {
  id: string;
  title: string;
  arabic?: string;
  translation: string;
  transliteration?: string;
  category: string;
  reference: string;
  url?: string;
  context: string;
  personal?: boolean;
}
// Add reviewed entries to this array. Keep each id unique and permanent.
export const duas: Dua[] = [
  {
    id: "goodness",
    title: "Good in this life & the next",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    translation:
      "Our Lord, give us goodness in this world and goodness in the Hereafter, and protect us from the punishment of the Fire.",
    transliteration:
      "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar.",
    category: "Everyday blessings",
    reference: "Qur’an · Al-Baqarah 2:201 (supplication excerpt)",
    url: "https://quran.com/2/201",
    context: "A prayer for goodness that reaches beyond the present moment.",
  },
  {
    id: "knowledge",
    title: "A heart open to learning",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    translation: "My Lord, increase me in knowledge.",
    transliteration: "Rabbi zidni ilma.",
    category: "Knowledge",
    reference: "Qur’an · Taha 20:114 (supplication excerpt)",
    url: "https://quran.com/20/114",
    context: "Return to this prayer as you study, learn, and grow.",
  },
  {
    id: "guidance",
    title: "Keep my heart close",
    arabic:
      "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ",
    translation:
      "Our Lord, do not let our hearts turn away after You have guided us. Give us mercy from Yourself; You are the generous Giver.",
    transliteration:
      "Rabbana la tuzigh qulubana bada idh hadaytana wa hab lana min ladunka rahmatan innaka antal-wahhab.",
    category: "Guidance",
    reference: "Qur’an · Ali ‘Imran 3:8",
    url: "https://quran.com/3/8",
    context: "A prayer for steadfastness and mercy.",
  },
];
