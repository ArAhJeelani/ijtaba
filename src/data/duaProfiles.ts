import type { Dua } from "./duas.ts";

export interface DuaProfile {
  id: string;
  title: string;
  arabic: string;
  description: string;
  categories: string[];
  duaIds: string[];
}

const profileCatalog: DuaProfile[] = [
  { id: "students", title: "Students", arabic: "الطُّلَّاب", description: "For studying, exams, and the search for useful knowledge.", categories: ["Knowledge", "Guidance"], duaIds: [] },
  { id: "parents", title: "Parents", arabic: "الآبَاءُ وَالأُمَّهَات", description: "For raising children with patience and asking for their protection.", categories: ["Family", "Protection"], duaIds: [] },
  { id: "career", title: "Career & Job Seekers", arabic: "العَمَلُ وَالرِّزْق", description: "For finding work, seeking provision, and making career decisions.", categories: ["Provision", "Guidance"], duaIds: [] },
  { id: "marriage-family", title: "Marriage & Family", arabic: "الزَّوَاجُ وَالأُسْرَة", description: "For marriage, relationships, and a peaceful home.", categories: ["Family", "Wellbeing"], duaIds: [] },
  { id: "new-muslims", title: "New Muslims", arabic: "المُسْلِمُونَ الجُدُد", description: "For learning the faith and asking for steadfastness.", categories: ["Guidance", "Worship"], duaIds: [] },
  { id: "duas-for-parents", title: "Du’as for Parents", arabic: "الدُّعَاءُ لِلْوَالِدَيْن", description: "For asking mercy, forgiveness, and wellbeing for your parents.", categories: ["Family", "Forgiveness"], duaIds: [] },
  { id: "hardship-healing", title: "Hardship & Healing", arabic: "الشِّدَّةُ وَالشِّفَاء", description: "For difficult days, illness, and moments when you need comfort.", categories: ["Hardship", "Wellbeing"], duaIds: [] },
  { id: "daily-essentials", title: "Daily Essentials", arabic: "أَذْكَارٌ يَوْمِيَّة", description: "For everyday supplication and remembrance.", categories: ["Worship", "Everyday blessings"], duaIds: [] },
];

const hiddenProfiles = new Set(["career", "duas-for-parents", "hardship-healing"]);
export const duaProfiles = profileCatalog.filter(profile => !hiddenProfiles.has(profile.id));

export const findDuaProfile = (id: string) => duaProfiles.find(profile => profile.id === id);
export const duaProfileTitle = (id: string) => profileCatalog.find(profile => profile.id === id)?.title;

export function resolveProfileItems(id: string, library: readonly Dua[]): Dua[] {
  const profile = findDuaProfile(id);
  if (!profile) return [];
  return [...new Set(profile.duaIds)].flatMap(duaId => {
    const dua = library.find(item => item.id === duaId && !item.personal);
    return dua ? [dua] : [];
  });
}
