import { Check, Plus } from "lucide-react";
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
}: {
  dua: Dua;
  transliteration?: boolean;
}) {
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
        <SaveDuaButton id={dua.id} />
      </div>
    </article>
  );
}
