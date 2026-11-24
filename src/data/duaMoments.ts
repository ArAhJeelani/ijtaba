type Source = {
  label: string;
  url: string;
  grading?: string;
};

type Moment = {
  id: string;
  title: string;
  group: "day" | "special" | "night";
  scene: "dawn" | "prayer" | "sands" | "friday" | "rain" | "road" | "night";
  sources: readonly [Source, ...Source[]];
  action?: { label: string; to: string };
} & (
  | { reviewStatus: "source-checked" | "approved"; summary: string; context: string }
  | { reviewStatus: "pending"; reviewNote: string }
);

export const introduction = {
  text: "Du’a belongs in every part of life. These are some of the moments the sources draw our attention to.",
  source: { label: "Qur’an 2:186", url: "https://quran.com/2/186" },
};

export const duaMoments: readonly Moment[] = [
  {
    id: "before-prayer",
    title: "Between the adhan and iqamah",
    group: "day",
    scene: "dawn",
    reviewStatus: "source-checked",
    summary: "The pause between the call to prayer and the start of the congregational prayer is a time to make du’a.",
    context: "Anas ibn Malik narrated a hadith specifically encouraging supplication in this interval. The adhan announces the prayer, and the iqamah signals that the congregational prayer is about to begin.",
    sources: [{ label: "Sunan Abi Dawud 521", url: "https://sunnah.com/abudawud:521", grading: "Sahih (al-Albani)" }],
  },
  {
    id: "sujood",
    title: "In sujood",
    group: "day",
    scene: "prayer",
    reviewStatus: "source-checked",
    summary: "While in prostration, take time to make du’a.",
    context: "Abu Hurayrah narrated that the Prophet ﷺ described prostration as the moment a servant is closest to their Lord and encouraged making abundant supplication in it.",
    sources: [{ label: "Sahih Muslim 482", url: "https://sunnah.com/muslim/4/245" }],
  },
  {
    id: "before-salam",
    title: "Before the closing salam",
    group: "day",
    scene: "sands",
    reviewStatus: "source-checked",
    summary: "The closing sitting of salah includes an opportunity for du’a after the tashahhud.",
    context: "In Ibn Mas‘ud’s report, the Prophet ﷺ taught the tashahhud and then instructed the worshipper to choose a supplication. This is within the prayer, before the salam that ends it.",
    sources: [{ label: "Sahih al-Bukhari 835", url: "https://sunnah.com/bukhari:835" }],
  },
  {
    id: "friday",
    title: "A special time on Friday",
    group: "day",
    scene: "friday",
    reviewStatus: "source-checked",
    summary: "The Prophet ﷺ described a brief opportunity for supplication on Friday.",
    context: "Scholars differ about when it falls. One view places it between the imam taking his seat and the end of the Friday prayer. Another looks to the final part of the afternoon after ‘Asr. The reports below describe these timings.",
    sources: [
      { label: "Sahih al-Bukhari 935", url: "https://sunnah.com/bukhari:935" },
      { label: "Sahih Muslim 853", url: "https://sunnah.com/muslim:853" },
      { label: "Sunan Abi Dawud 1048", url: "https://sunnah.com/abudawud:1048", grading: "Sahih (al-Albani)" },
    ],
  },
  {
    id: "rain",
    title: "When rain falls",
    group: "special",
    scene: "rain",
    reviewStatus: "source-checked",
    summary: "When the Prophet ﷺ saw rain, he asked Allah to make it beneficial.",
    context: "‘A’ishah’s narration records a specific supplication asking for beneficial rain.",
    sources: [{ label: "Sahih al-Bukhari 1032", url: "https://sunnah.com/bukhari:1032" }],
  },
  {
    id: "travel",
    title: "While travelling",
    group: "special",
    scene: "road",
    reviewStatus: "source-checked",
    summary: "A journey is an occasion to turn to Allah in du’a.",
    context: "Abu Hurayrah’s report singles out the supplication of a traveller. The edition below grades the report hasan (good).",
    sources: [{ label: "Jami‘ at-Tirmidhi 1905", url: "https://sunnah.com/tirmidhi:1905", grading: "Hasan (Darussalam)" }],
  },
  {
    id: "iftar",
    title: "At iftar",
    group: "special",
    scene: "dawn",
    reviewStatus: "pending",
    reviewNote: "Confirm the wording, grading, and guidance about timing before publication.",
    sources: [{ label: "Jami‘ at-Tirmidhi 3598", url: "https://sunnah.com/tirmidhi:3598" }],
  },
  {
    id: "last-third",
    title: "The Last Third of the Night",
    group: "night",
    scene: "night",
    reviewStatus: "source-checked",
    summary: "The final third of the night is a time to call upon Allah, ask for what you need, and seek forgiveness.",
    context: "Abu Hurayrah’s narration singles out the final third of each night for these acts. Its clock time depends on when Maghrib and the following Fajr fall where you are.",
    sources: [{ label: "Sahih al-Bukhari 1145", url: "https://sunnah.com/bukhari:1145" }],
    action: { label: "Calculate the Last Third", to: "/tahajjud#calculator" },
  },
];

// Source-checked entries are eligible for preview. The owner records final editorial approval here before launch.
export const visibleDuaMoments = duaMoments.filter(
  (moment) => moment.reviewStatus !== "pending",
);

export type VisibleDuaMoment = (typeof visibleDuaMoments)[number];
