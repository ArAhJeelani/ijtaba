import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { duas, type Dua } from "../data/duas";
interface Stored {
  ids: string[];
  personal: Dua[];
  days: Record<string, string[]>;
}
const key = "ijabah.collection.v1";
function load(): Stored {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "null");
    if (!s || !Array.isArray(s.ids) || !Array.isArray(s.personal))
      return { ids: [], personal: [], days: {} };
    const personal = s.personal.filter(
      (d: Dua) =>
        d &&
        typeof d.id === "string" &&
        typeof d.translation === "string" &&
        d.personal === true,
    );
    const available = new Set([...duas, ...personal].map((d) => d.id));
    const days: Stored["days"] = {};
    for (const [date, ids] of Object.entries(s.days ?? {})) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(ids)) {
        const valid = [...new Set<string>(ids.filter((id) => available.has(id)))];
        if (valid.length) days[date] = valid;
      }
    }
    return {
      days,
      personal,
      ids: [
        ...new Set<string>(
          s.ids.filter(
            (id: unknown) =>
              typeof id === "string" &&
              [...duas, ...personal].some((d) => d.id === id),
          ),
        ),
      ],
    };
  } catch {
    return { ids: [], personal: [], days: {} };
  }
}
function useCollectionState() {
  const [data, set] = useState(load);
  const [read, setRead] = useState<string[]>([]);
  const [storageError, setError] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setError("");
    } catch {
      setError(
        "Your browser could not save changes. Keep this page open to retain this collection.",
      );
    }
  }, [data]);
  const library = [...duas, ...data.personal];
  return {
    data,
    read,
    storageError,
    items: data.ids
      .map((id) => library.find((d) => d.id === id)!)
      .filter(Boolean),
    itemsForDay: (date: string) =>
      (data.days[date] ?? []).flatMap((id) => {
        const dua = library.find((item) => item.id === id);
        return dua ? [dua] : [];
      }),
    toggleDay: (date: string, id: string) =>
      set((s) => {
        const current = s.days[date] ?? [];
        const removing = current.includes(id);
        const days = { ...s.days };
        const next = removing ? current.filter((item) => item !== id) : [...current, id];
        if (next.length) days[date] = next;
        else delete days[date];
        return {
          ...s,
          days,
          ids: removing || s.ids.includes(id) ? s.ids : [...s.ids, id],
        };
      }),
    toggle: (id: string) =>
      set((s) => ({
        ...s,
        ids: s.ids.includes(id)
          ? s.ids.filter((x) => x !== id)
          : [...s.ids, id],
      })),
    move: (id: string, delta: number) =>
      set((s) => {
        const ids = [...s.ids],
          i = ids.indexOf(id),
          j = i + delta;
        if (i >= 0 && j >= 0 && j < ids.length) [ids[i], ids[j]] = [ids[j], ids[i]];
        return { ...s, ids };
      }),
    mark: (id: string) =>
      setRead((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    reset: () => setRead([]),
    addPersonal: (title: string, translation: string) => {
      const d: Dua = {
        id: crypto.randomUUID(),
        title,
        translation,
        category: "Personal prayer",
        reference: "Personal prayer · not a sourced supplication",
        context: "In your own words.",
        personal: true,
      };
      set((s) => ({ ...s, ids: [...s.ids, d.id], personal: [...s.personal, d] }));
    },
  };
}
const Context = createContext<ReturnType<typeof useCollectionState> | null>(
  null,
);
export function CollectionProvider({ children }: { children: ReactNode }) {
  return (
    <Context.Provider value={useCollectionState()}>{children}</Context.Provider>
  );
}
export function useCollection() {
  return useContext(Context)!;
}
