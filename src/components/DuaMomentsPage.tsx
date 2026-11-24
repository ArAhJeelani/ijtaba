import { ArrowDown, ArrowUpRight, CalendarDays, ChevronDown, FolderHeart, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { introduction, visibleDuaMoments, type VisibleDuaMoment } from "../data/duaMoments";
import "./dua-moments.css";

const dayMoments = visibleDuaMoments.filter((moment) => moment.group === "day");
const specialMoments = visibleDuaMoments.filter((moment) => moment.group === "special");
const nightMoment = visibleDuaMoments.find((moment) => moment.group === "night");

function MomentDetails({ moment }: { moment: VisibleDuaMoment }) {
  return (
    <details className="moments-details">
      <summary>Why this moment matters <ChevronDown size={16} aria-hidden="true" /></summary>
      <p>{moment.context}</p>
      <ul className="moments-sources">
        {moment.sources.map(({ label, url, grading }) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer">{label} ↗</a>
            {grading && <span> · {grading}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

function MomentEntry({ moment }: { moment: VisibleDuaMoment }) {
  return (
    <article className="moments-entry">
      <div className="moments-art" data-scene={moment.scene} aria-hidden="true" />
      <div className="moments-entry-copy">
        <h3>{moment.title}</h3>
        <p>{moment.summary}</p>
        <MomentDetails moment={moment} />
      </div>
    </article>
  );
}

export default function DuaMomentsPage() {
  return (
    <main className="dua-moments">
      <section className="moments-hero" aria-labelledby="moments-title">
        <div className="moments-shell moments-hero-copy">
          <h1 id="moments-title">When to Make <i>Du’a</i></h1>
          <p>Every moment is an opportunity to turn to Allah. Discover the moments especially encouraged in the Qur’an and Sunnah.</p>
          <a href="#through-the-day">Explore the moments <ArrowDown size={16} aria-hidden="true" /></a>
        </div>
      </section>

      <div className="moments-shell">
        <section className="moments-day" id="through-the-day" aria-labelledby="moments-day-title">
          <header className="moments-heading">
            <h2 id="moments-day-title">Through the Day and Night</h2>
            <p>{introduction.text} <a href={introduction.source.url} target="_blank" rel="noreferrer">{introduction.source.label} ↗</a></p>
          </header>
          <ol className="moments-timeline">
            {dayMoments.map((moment) => <li key={moment.id}><MomentEntry moment={moment} /></li>)}
            {nightMoment && <li className="moments-timeline-night">
              <a href="#last-third"><Moon size={18} aria-hidden="true" /> {nightMoment.title} <ArrowDown size={16} aria-hidden="true" /></a>
            </li>}
          </ol>
        </section>

        {specialMoments.length > 0 && (
          <section className="moments-special" aria-labelledby="moments-special-title">
            <header className="moments-heading">
              <h2 id="moments-special-title">Special Moments and Circumstances</h2>
            </header>
            <div className="moments-special-grid">
              {specialMoments.map((moment) => <MomentEntry key={moment.id} moment={moment} />)}
            </div>
          </section>
        )}
      </div>

      {nightMoment && (
        <section className="moments-night" id="last-third" aria-labelledby="moments-night-title">
          <div className="moments-shell">
            <div className="moments-night-copy">
              <Moon size={27} aria-hidden="true" />
              <h2 id="moments-night-title">{nightMoment.title}</h2>
              <p>{nightMoment.summary}</p>
              {nightMoment.action && <Link className="moments-cta" to={nightMoment.action.to}>{nightMoment.action.label} <ArrowUpRight size={17} aria-hidden="true" /></Link>}
              <MomentDetails moment={nightMoment} />
            </div>
          </div>
        </section>
      )}

      <section className="moments-shell moments-close" aria-labelledby="moments-close-title">
        <h2 id="moments-close-title">Your Du’as, Your Moments</h2>
        <p>Keep the du’as closest to your heart, and return to them when you need them most.</p>
        <div className="moments-actions">
          <Link to="/my-duas"><FolderHeart size={18} aria-hidden="true" /> My Du’as</Link>
          <Link to="/calendar"><CalendarDays size={18} aria-hidden="true" /> My Calendar</Link>
          <Link to="/tahajjud"><Moon size={18} aria-hidden="true" /> Tahajjud</Link>
        </div>
      </section>
    </main>
  );
}
