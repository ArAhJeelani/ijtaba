import { useState, type MouseEvent } from "react";
import { ummahDua } from "../data/ummahDua";
import { useCollection } from "../state/Collection";
import { DiscoverSections } from "./DiscoverSections";
import { ScheduleDialog } from "./ScheduleDialog";
import "./ummah-reminder.css";

const regions = [
  ["palestine", "Palestine", "Pray for protection for families, shelter for those displaced, and healing for the wounded. Ask Allah for relief and justice."],
  ["congo", "Congo", "Pray for safety for those forced from their homes and comfort for those who grieve. Ask Allah for healing, mercy, and a just peace."],
  ["sudan", "Sudan", "Pray for food for those facing hunger, refuge for those seeking safety, and relief for those carrying loss. Ask Allah to protect and heal them."],
];

export default function UmmahReminderPage() {
  const collection = useCollection();
  const [schedule, setSchedule] = useState<"once" | "daily" | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [shareLink, setShareLink] = useState("");
  const saved = collection.data.ids.includes(ummahDua.id);
  const existingDaily = collection.schedulesFor(ummahDua.id)
    .find((item) => item.target.kind === "dua" && !item.paused && item.recurrence.frequency === "daily");

  function save(event: MouseEvent<HTMLButtonElement>) {
    if (!saved) collection.toggle(ummahDua.id, event.currentTarget.getBoundingClientRect());
  }

  async function share() {
    const url = new URL(window.location.pathname, window.location.origin).href;
    setShareStatus("");
    setShareLink("");
    try {
      if (navigator.share) {
        await navigator.share({ title: ummahDua.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Reminder link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareLink(url);
    }
  }

  return (
    <main className="ummah-page">
      <header className="ummah-hero">
        <DiscoverSections />
        <h1>{ummahDua.title}</h1>
        <p>When you turn to Allah with what is on your heart, make room for others in your du’a. Remember the people of Palestine, Congo, and Sudan.</p>
        <div className="ummah-actions">
          <a className="button" href="#ummah-dua" onClick={() => document.getElementById("ummah-dua")?.focus({ preventScroll: true })}>Make Dua Now</a>
          <button className="button" type="button" onClick={save} disabled={saved}>{saved ? "Reminder saved" : "Save This Reminder"}</button>
          <button className="button" type="button" onClick={() => setSchedule("once")}>Add to My Organizer</button>
        </div>
      </header>

      <div className="ummah-body">
        <section className="ummah-reflection">
          <h2>Carry others in your prayers</h2>
          <p>When suffering feels distant, pause long enough to remember the people living through it. Pray for those searching for food or shelter, those tending to the wounded, and those grieving someone they love. You can ask Allah for mercy and relief even when you do not know their names.</p>
        </section>

        <img
          className="ummah-flag-scene"
          src="/assets/ummah-flags-painting.jpg"
          alt="Painted flags of Palestine, the Democratic Republic of the Congo, and Sudan planted in desert sand at twilight."
          loading="lazy"
          decoding="async"
        />

        <div className="ummah-regions">
          {regions.map(([id, name, reflection]) => (
            <article className="ummah-card" key={id}>
              <h3>{name}</h3>
              <p>{reflection}</p>
            </article>
          ))}
        </div>

        <section className="ummah-card ummah-prayer" id="ummah-dua" tabIndex={-1} aria-labelledby="ummah-prayer-heading">
          <h2 id="ummah-prayer-heading">A du’a for the Ummah</h2>
          <p className="ummah-source">{ummahDua.reference}</p>
          <p className="ummah-arabic" lang="ar" dir="rtl">{ummahDua.arabic}</p>
          <h3>Transliteration</h3>
          <p>{ummahDua.transliteration}</p>
          <h3>Translation</h3>
          <p>{ummahDua.translation}</p>
        </section>

        <section className="ummah-reflection">
          <h2>Make room for this each day</h2>
          <p>Choose a moment you can return to, perhaps after a prayer or before sleep, and remember someone who needs relief.</p>
          <div className="ummah-actions">
            <button className="button" type="button" onClick={() => setSchedule("daily")}>Set a daily reminder</button>
            <button className="button" type="button" disabled={saved} onClick={save}>{saved ? "Du’a saved" : "Save this dua"}</button>
            <button className="button" type="button" disabled={saved} onClick={save}>{saved ? "In My Du’as" : "Add to my Dua List"}</button>
            <button className="button" type="button" onClick={() => void share()}>Share this reminder</button>
          </div>
          {shareStatus && <p role="status">{shareStatus}</p>}
          {shareLink && <p>Copy this link to share the reminder. <a href={shareLink}>{shareLink}</a></p>}
        </section>
      </div>

      {schedule && <ScheduleDialog
        onClose={() => setSchedule(null)}
        target={{ kind: "dua", id: ummahDua.id }}
        initialFrequency={schedule}
        initial={schedule === "daily" ? existingDaily : undefined}
      />}
    </main>
  );
}
