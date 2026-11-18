import { Check, Plus, ShoppingBag, X } from "lucide-react";
import type { Dua } from "../data/duas";
import { useCollection } from "../state/Collection";
export function SaveDuaButton({ id }: { id: string }) {
  const c = useCollection(),
    saved = c.data.ids.includes(id);
  return (
    <button
      className={"save " + (saved ? "saved" : "")}
      aria-pressed={saved}
      onClick={() => c.toggle(id)}
    >
      {saved ? <Check size={16} /> : <Plus size={16} />}{" "}
      {saved ? "Saved · remove" : "Add to My Du’as"}
    </button>
  );
}
export function DuaCard({
  dua,
  transliteration = false,
  day,
  dailyView = false,
}: {
  dua: Dua;
  transliteration?: boolean;
  day?: string;
  dailyView?: boolean;
}) {
  const c = useCollection();
  const added = day && c.data.days[day]?.includes(dua.id);
  return (
    <article className="dua-card">
      <div className="eyebrow">{dua.category}</div>
      <h3>{dua.title}</h3>
      {dua.arabic && (
        <p className="arabic" lang="ar" dir="rtl">
          {dua.arabic}
        </p>
      )}
      {transliteration && dua.transliteration && (
        <p className="transliteration">{dua.transliteration}</p>
      )}
      <p className="translation">{dua.translation}</p>
      <p className="context">{dua.context}</p>
      <div className="card-bottom">
        {dua.url ? (
          <a href={dua.url} target="_blank" rel="noreferrer">
            {dua.reference} ↗
          </a>
        ) : (
          <span>{dua.reference}</span>
        )}
        {day ? (
          <button
            className={"save" + (added && !dailyView ? " saved" : "")}
            aria-pressed={dailyView ? undefined : Boolean(added)}
            aria-label={dailyView ? `Remove ${dua.title} from this day` : undefined}
            onClick={() => c.toggleDay(day, dua.id)}
          >
            {dailyView ? <X size={16} /> : added ? <Check size={16} /> : <ShoppingBag size={16} />}
            {dailyView ? "Remove from day" : added ? "Added to day" : "Add to collection"}
          </button>
        ) : <SaveDuaButton id={dua.id} />}
      </div>
    </article>
  );
}
