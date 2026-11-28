import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { uplifters, type Uplifter } from "../data/uplifters";
import { OrganizerDialog } from "./OrganizerDialog";
import "./uplifters.css";

const featuredPhoto = "/assets/uplifters-featured.jpg";

function FloatingImageGallery({ onSelect }: { onSelect: (index: number) => void }) {
  return (
    <ul className="uplifter-gallery" aria-label="Choose an uplifting reminder">
      {uplifters.map((reminder, index) => (
        <li key={reminder.id}>
          <button type="button" className="uplifter-tile" onClick={() => onSelect(index)}
            aria-label={reminder.scene + " reminder"} aria-haspopup="dialog" />
        </li>
      ))}
      {Array.from({ length: 12 }, (_, index) => (
        <li key={index} aria-hidden="true"><span className="uplifter-tile" /></li>
      ))}
    </ul>
  );
}

function FlippableReminderCard({ reminder, heading }: {
  reminder: Uplifter;
  heading: RefObject<HTMLHeadingElement | null>;
}) {
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [heading, reminder.id]);

  return (
    <div className="uplifter-flip-stage">
      <div className="uplifter-flip" key={reminder.id}>
        <img className="uplifter-flip-front" src={reminder.artwork} alt="" aria-hidden="true" />
        <article className="uplifter-flip-back">
          <h3 tabIndex={-1} ref={heading}>{reminder.title}</h3>
          <p>{reminder.body.join("\n")}</p>
        </article>
      </div>
    </div>
  );
}

export default function UpliftersPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [featured, setFeatured] = useState<"sign" | "verse" | null>(null);
  const lastFeatured = useRef<"sign" | "verse" | null>(null);
  const reminderHeading = useRef<HTMLHeadingElement>(null);
  const close = () => setSelected(null);

  function surprise() {
    const showVerse = lastFeatured.current === null ? Math.random() < 0.5 : lastFeatured.current === "sign";
    const next = showVerse ? "verse" : "sign";
    lastFeatured.current = next;
    setFeatured(next);
  }

  return (
    <main className="uplifters-page">
      <header className="uplifters-header">
        <Link to="/discover" className="uplifters-back"><ArrowLeft size={16} aria-hidden="true" /> Discover</Link>
        <h1>Uplifters</h1>
        <p>For the moments when your heart feels tired, and you need a gentle reminder to keep turning back to Allah.</p>
        <button type="button" className="uplifter-action" onClick={surprise} aria-haspopup="dialog">
          <Sparkles size={16} aria-hidden="true" /> Surprise Me
        </button>
      </header>
      <FloatingImageGallery onSelect={setSelected} />
      {featured && (
        <OrganizerDialog title="Your reminder" onClose={() => setFeatured(null)}>
          <div className="uplifter-featured">
            {featured === "sign" ? <>
              <img src={featuredPhoto} alt="Ya Allah, I’m so tired, I need Your Kun Fayakun." />
              <button type="button" className="uplifter-action" onClick={() => {
                setFeatured(null);
                setSelected(0);
              }}>Read the reflection <ArrowRight size={16} aria-hidden="true" /></button>
            </> : (
              <article className="uplifter-verse">
                <p lang="ar" dir="rtl">قَالَ لَا تَخَافَآۖ إِنَّنِي مَعَكُمَآ أَسْمَعُ وَأَرَىٰ</p>
                <blockquote>“Have no fear! I am with you, hearing and seeing.”</blockquote>
                <a href="https://quran.com/20/46" target="_blank" rel="noreferrer">Surah Taha 20:46</a>
              </article>
            )}
          </div>
        </OrganizerDialog>
      )}
      {selected !== null && (
        <OrganizerDialog title="Your reminder" onClose={close} initialFocus={reminderHeading}>
          <div className="uplifter-reading">
            <FlippableReminderCard reminder={uplifters[selected]} heading={reminderHeading} />
            <div className="uplifter-reading-actions">
              <button type="button" className="uplifter-action" onClick={close}>Back to gallery</button>
              <button type="button" className="uplifter-action" onClick={() => setSelected((selected + 1) % uplifters.length)}>
                Next reminder <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </OrganizerDialog>
      )}
    </main>
  );
}
