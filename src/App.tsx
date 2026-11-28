import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Menu,
  X,
  Moon,
  Search,
  CalendarDays,
  FolderHeart,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duas, type Dua } from "./data/duas";
import { useCollection } from "./state/Collection";
import { DuaCard } from "./components/DuaCard";
import { TahajjudCalculator } from "./components/TahajjudCalculator";
import "./components/arrival.css";
import { DesertHero } from "./components/DesertHero";
import { DiscoverSections } from "./components/DiscoverSections";
import { TahajjudEntrance } from "./components/TahajjudEntrance";
import { TahajjudCollection } from './components/TahajjudCollection';
import "./components/dua-calendar.css";
import { collectionDate, dateKey, fullDate } from "./utils/calendar";
import { supabase } from "./state/supabase";
import { useAuth } from "./state/Auth";
import { AuthCallback, AuthForm, AccountPage } from "./components/Account";
import { CloudOrganizerStatus } from "./components/CloudOrganizerStatus";
import { useOnline } from "./state/useOnline";

const MyDuasPage = lazy(() => import("./components/MyDuasPage").then(({ MyDuasPage }) => ({ default: MyDuasPage })));
const DuaCalendar = lazy(() => import("./components/DuaCalendar").then(({ DuaCalendar }) => ({ default: DuaCalendar })));
const DuaProfilesPage = lazy(() => import("./components/DuaProfiles").then(({ DuaProfilesPage }) => ({ default: DuaProfilesPage })));
const DuaMomentsPage = lazy(() => import("./components/DuaMomentsPage"));
const UmmahReminderPage = lazy(() => import("./components/UmmahReminderPage"));
const Arrival = lazy(() => import("./components/Arrival").then(({ Arrival }) => ({ default: Arrival })));

function Navbar() {
  const [open, setOpen] = useState(false),
    c = useCollection(),
    location = useLocation();
  const menuToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  const { session } = useAuth();
  const home = location.pathname === "/";
  return (
    <header className={home ? "navbar desert-nav desert-nav-home" : "navbar desert-nav"}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          setOpen(false);
          menuToggle.current?.focus();
        }
      }}>
      <Link to="/" className="brand" aria-label="Ijtaba home">
        <img src="/assets/ijabah-logo.webp" alt="" />
        <span>
          Ijtaba{!home && <small>ONE DUA AWAY</small>}
        </span>
      </Link>
      <button
        ref={menuToggle}
        className="menu-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="main-nav"
        className={open ? "open" : ""}
        aria-label="Main navigation"
        onClick={(event) => {
          if (open && (event.target as Element).closest("a")) {
            setOpen(false);
            requestAnimationFrame(() => document.getElementById("content")?.focus({ preventScroll: true }));
          }
        }}
      >
        <NavLink to="/discover">Discover</NavLink>
        <NavLink to="/my-duas">
          My Du’as <span id="saved-dua-count" className="count">
            {c.items.length}
            {c.addition && <span key={c.addition.key} className="collection-count-gain" aria-hidden="true">+1</span>}
          </span>
        </NavLink>
        <NavLink to="/calendar">Calendar</NavLink>
        <NavLink to="/tahajjud">Tahajjud</NavLink>
        <NavLink to="/about">About</NavLink>
        {supabase && <NavLink to={session ? "/account" : "/login"}>{session ? "Account" : "Sign in"}</NavLink>}
      </nav>
      {!home && <Link className="nav-quiet" to="/my-duas">
        <BookOpen size={16} /> A moment for you
      </Link>}
    </header>
  );
}
function CollectionFeedback() {
  const { addition, items, notice } = useCollection();
  const reducedMotion = useReducedMotion();
  if (notice) return <div className="collection-toast" role="status">{notice}</div>;
  if (!addition) return null;

  const { origin, key } = addition;
  const target = document.getElementById("saved-dua-count")?.getBoundingClientRect();
  const targetVisible = target && target.width > 0 && target.top >= 0 && target.bottom <= window.innerHeight;
  const startX = origin.left + origin.width / 2;
  const startY = origin.top + origin.height / 2;
  const endX = targetVisible ? target.left + target.width / 2 : window.innerWidth / 2;
  const endY = targetVisible ? target.top + target.height / 2 : window.innerHeight - 48;
  const bend = Math.min(70, Math.abs(endX - startX) / 3 + 20);

  return <>
    {!reducedMotion && <motion.span
      key={key}
      className="collection-flight"
      aria-hidden="true"
      style={{ left: startX - 18, top: startY - 18 }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{
        x: [0, (endX - startX) * .45, endX - startX],
        y: [0, (endY - startY) * .45 - bend, endY - startY],
        scale: [1, 1.1, .35],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: .58, ease: "easeInOut" }}
    ><BookOpen size={16} /></motion.span>}
    <div key={`added-${key}`} className="collection-toast collection-added" role="status">
      <FolderHeart size={17} aria-hidden="true" />
      <strong>+1</strong> Added to My Du’as <span>· {items.length} total</span>
    </div>
  </>;
}

function Footer() {
  return (
    <footer className="desert-footer">
      <Link className="footer-brand" to="/">
        Ijtaba
      </Link>
      <span>A little closer, one du’a at a time.</span>
      <span>Made for moments that matter.</span>
    </footer>
  );
}
function Heading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
function Home({ onReplayIntro }: { onReplayIntro: () => void }) {
  const c = useCollection();
  return (
    <main className="desert-home">
      <DesertHero />
      <section className="intro-strip">
        <span lang="ar" dir="rtl">
          وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ
        </span>
        <p>
          “Call upon Me; I will respond to you.”{" "}
          <a href="https://quran.com/40/60" target="_blank" rel="noreferrer">
            Qur’an 40:60 ↗
          </a>
        </p>
        <button type="button" className="desert-replay" onClick={onReplayIntro}>
          Replay the Three Ways intro
        </button>
      </section>
      <section id="featured" className="section">
        <div className="section-top">
          <Heading
            eyebrow="WORDS TO CARRY WITH YOU"
            title="A du’a for where you are."
          />
          <Link className="underlined" to="/discover">
            Explore the library <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="dua-grid">
          {duas.slice(0, 2).map((d) => (
            <DuaCard key={d.id} dua={d} />
          ))}
        </div>
      </section>
      <section className="section categories-section">
        <Heading
          eyebrow="COME AS YOU ARE"
          title="What’s on your heart?"
          text="Begin with a feeling. Find words to meet it."
        />
        <div className="category-grid">
          {[
            ["Everyday blessings", "For the ordinary & extraordinary"],
            ["Guidance", "When you need a little direction"],
            ["Knowledge", "For a mind that keeps growing"],
          ].map(([name, desc]) => (
            <Link
              key={name}
              to={"/discover?category=" + encodeURIComponent(name)}
            >
              <h3>{name}</h3>
              <p>{desc}</p>
              <ArrowUpRight size={22} />
            </Link>
          ))}
        </div>
      </section>
      <section className="night-feature">
        <div className="night-feature-image" />
        <div>
          <span className="eyebrow">TAHAJJUD TONIGHT</span>
          <h2>
            When the world rests,
            <br />
            <i>let your heart speak.</i>
          </h2>
          <p>
            Find the last third of your night. Make room for a moment of prayer,
            reflection, and hope.
          </p>
          <Link className="button light" to="/tahajjud">
            In the quiet of the night <Moon size={17} />
          </Link>
        </div>
      </section>
      <section className="collection-invite section">
        <span className="eyebrow">YOUR PERSONAL PRAYER JOURNAL</span>
        <h2>
          Keep what speaks
          <br />
          to your <i>heart.</i>
        </h2>
        <p>
          Gather your du’as in one place. Return to them in your own time,
          <br /> at your own pace.{" "}
          {c.items.length > 0 && `${c.items.length} already waiting for you.`}
        </p>
        <Link className="button" to="/my-duas">
          Your Du’a Collection <ArrowUpRight size={18} />
        </Link>
      </section>
      <section className="purpose">
        <span className="eyebrow">THE HEART OF IJTABA</span>
        <p>
          Making du’a should feel accessible,
          <br />
          intentional, and deeply personal.
        </p>
        <Link to="/about" className="underlined">
          Our story <ArrowUpRight size={16} />
        </Link>
      </section>
    </main>
  );
}
function Discover({ prophetic = false }: { prophetic?: boolean }) {
  const location = useLocation(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(
      new URLSearchParams(location.search).get("category") || "All",
    ),
    [trans, setTrans] = useState(false);
  const collection = useCollection();
  const selected = collectionDate(new URLSearchParams(location.search).get("date"));
  const day = dateKey(selected);
  const count = collection.data.days[day]?.length ?? 0;
  const calendarDay = new URLSearchParams(location.search).has("date") ? day : undefined;
  const library = prophetic ? duas.filter((dua) => dua.prophet) : duas;
  const categories = ["All", ...new Set(library.flatMap((d) => d.categories ?? [d.category]))];
  const found = library.filter(
    (d) =>
      (category === "All" || (d.categories ?? [d.category]).includes(category)) &&
      [
        d.title,
        d.prophet,
        d.prophetGroup,
        d.arabic,
        d.translation,
        d.context,
        ...(d.categories ?? [d.category]),
        d.reference,
        d.transliteration,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const groups = new Map<string, Dua[]>();
  for (const dua of found) {
    const prophet = dua.prophetGroup ?? dua.prophet ?? "";
    const entries = groups.get(prophet);
    if (entries) entries.push(dua);
    else groups.set(prophet, [dua]);
  }
  const orderedGroups = [...groups].sort(([left], [right]) => {
    if (!left) return 1;
    if (!right) return -1;
    return left.localeCompare(right, "en");
  });
  return (
    <main className="section page">
      <Heading
        eyebrow="THE DU’A LIBRARY"
        title={prophetic ? "Prophetic Du’as" : "Words for every season."}
        text={prophetic ? "Read and save supplications from the lives of the prophets in the Qur’an." : "Find a prayer to carry with you."}
      />
      <DiscoverSections />
      <div className="library-controls">
        <label className="search">
          <Search size={19} />
          <input
            aria-label="Search duas"
            placeholder="Search a feeling, a word, a hope…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={trans}
            onChange={(e) => setTrans(e.target.checked)}
          />{" "}
          Show transliteration
        </label>
      </div>
      {calendarDay && <div className="daily-browse-bar">
        <div>
          <CalendarDays size={20} aria-hidden="true" />
          <span>Collecting for <strong>{fullDate.format(selected)}</strong></span>
        </div>
        <Link className="button" to={`/calendar?date=${day}`}>
          <BookOpen size={17} />
          Gathered for this day <span className="count" aria-live="polite">{count}</span>
        </Link>
      </div>
      }
      <div className="filters" aria-label="Filter by category">
        {categories.map((x) => (
          <button
            key={x}
            aria-pressed={category === x}
            className={category === x ? "selected" : ""}
            onClick={() => setCategory(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <p className="small" aria-live="polite">
        {found.length} {found.length === 1 ? "prayer" : "prayers"}
      </p>
      <div className="dua-library-groups">
        {orderedGroups.map(([prophet, entries]) => (
          <section className="dua-library-group" key={prophet}>
            <h3>{prophet ? `Prophet ${prophet}` : "Other du’as"}</h3>
            <div className="dua-grid">
              {entries.map(dua => (
                <DuaCard key={dua.id} dua={dua} transliteration={trans} day={calendarDay} headingLevel={4} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {!found.length && (
        <div className="empty">
          <h3>No prayers found.</h3>
          <p>Try another word or category.</p>
          <button
            className="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      <p className="source-note">
        Each entry links to its source. English meanings and transliteration are
        reading aids. {prophetic && (
          <a href="https://quran.com/duas/prophets" target="_blank" rel="noreferrer">
            View the collection on Quran.com ↗
          </a>
        )}
      </p>
    </main>
  );
}
function Tahajjud() {
  const reduced = useReducedMotion();
  const pageLocation = useLocation();
  const [intro, setIntro] = useState(!reduced && !pageLocation.hash);
  const heading = useRef<HTMLHeadingElement>(null);
  const finishIntro = useCallback(() => setIntro(false), []);
  useEffect(() => {
    if (!pageLocation.hash) setIntro(!reduced);
  }, [pageLocation.key, pageLocation.hash, reduced]);
  useEffect(() => {
    if (pageLocation.hash !== "#calculator") return;
    const frame = requestAnimationFrame(() => {
      const calculator = document.getElementById("calculator");
      calculator?.focus({ preventScroll: true });
      calculator?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [pageLocation.hash, pageLocation.key]);
  return (
    <main>
      <AnimatePresence
        onExitComplete={() => {
          if (!pageLocation.hash) {
            requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
          }
        }}
      >
        {intro && !reduced && !pageLocation.hash && (
          <TahajjudEntrance onComplete={finishIntro} />
        )}
      </AnimatePresence>
      <section className="tahajjud-hero">
        <span className="eyebrow">THE NIGHT HOLDS A QUIET INVITATION</span>
        <Moon size={30} />
        <h1 ref={heading} tabIndex={-1}>
          In the quiet
          <br />
          of the <i>night.</i>
        </h1>
        <p>A moment to turn to Allah, when the world is still.</p>
        <a href="#calculator" className="text-link">
          Find the last third ↓
        </a>
      </section>
      <div className="section" id="calculator" tabIndex={-1}>
        <TahajjudCalculator />
        <TahajjudCollection />
        <div className="night-explanation">
          <Heading
            eyebrow="UNDERSTANDING THE NIGHT"
            title="A little time. A sincere heart."
          />
          <div>
            <p>
              Tahajjud is voluntary night prayer, commonly prayed after waking
              from sleep. The last third of the night is a particularly
              recommended time for du’a; night prayer is not limited to this
              interval.
            </p>
            <p>
              The calculator measures from Maghrib to the following Fajr, then
              subtracts one third of that duration from Fajr. For example, 6 PM
              to 6 AM gives a last-third window of 2 AM–6 AM. These are
              illustrative times.
            </p>
            <p>
              Begin with wudu and your intention. Pray in units of two, and make
              du’a in your own words as well as with sourced supplications. For
              detailed practice, consult a trusted teacher.
            </p>
            <a
              href="https://sunnah.com/bukhari:1145"
              target="_blank"
              rel="noreferrer"
            >
              The last third · Sahih al-Bukhari 1145 ↗
            </a>
            <br />
            <a
              href="https://sunnah.com/bukhari:990"
              target="_blank"
              rel="noreferrer"
            >
              Night prayer in pairs · Sahih al-Bukhari 990 ↗
            </a>
          </div>
        </div>
        <Heading
          eyebrow="BRING YOUR HOPES WITH YOU"
          title="Prayers to return to."
          text="Qur’anic prayers you can include in your du’a, without a claim of special night-specific wording."
        />
        <div className="dua-grid">
          {duas
            .filter((d) => d.id !== "knowledge")
            .map((d) => (
              <DuaCard key={d.id} dua={d} />
            ))}
        </div>
      </div>
    </main>
  );
}
function About() {
  return (
    <main className="about-page">
      <div className="about-painting" />
      <article>
        <span className="eyebrow" lang="ar" dir="rtl">اجتبى</span>
        <h1>
          One Du’a
          <br />
          <i>Away.</i>
        </h1>
        <p className="lead">
          Ijtaba was created around a simple belief: making du’a should feel
          accessible, intentional, and personal.
        </p>
        <p>
          Sometimes the words come easily. Sometimes we need somewhere to begin.
          Ijtaba is a quiet space to discover meaningful supplications,
          understand their meaning, and keep them close.
        </p>
        <p>
          Explore a sourced collection. Save what speaks to you. Write what is
          on your heart. Then return, in the ordinary moments and the difficult
          ones.
        </p>
        <p>
          Guest collections stay in this browser. When signed in, your private organizer syncs to your account.
        </p>
        <Link className="button" to="/discover">
          Find your first du’a <ArrowUpRight size={18} />
        </Link>
      </article>
    </main>
  );
}
const introSeenKey = "ijabah:three-ways-intro-seen";

export default function App() {
  const online = useOnline();
  const [introPending, setIntroPending] = useState(() => {
    try {
      return localStorage.getItem(introSeenKey) === null;
    } catch {
      return true;
    }
  });
  const introStarted = useRef(false);
  const location = useLocation(), c = useCollection();
  const opening = location.pathname === "/" && introPending;
  useEffect(() => {
    if (opening) {
      introStarted.current = true;
      try {
        localStorage.setItem(introSeenKey, "1");
      } catch {
        // Navigation still works when browser storage is unavailable.
      }
    } else if (introStarted.current) {
      setIntroPending(false);
    }
  }, [opening]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.title =
      ({
        "/discover": "Discover Du’as",
        "/discover/ummah": "Don’t Forget the Ummah",
        "/discover/when-to-make-dua": "When to Make Du?a",
        "/discover/prophetic": "Prophetic Du’as",
        "/discover/profiles": "Du’a Profiles",
        "/my-duas": "My Du’as",
        "/calendar": "Du’a Calendar",
        "/tahajjud": "Tahajjud",
        "/about": "About Ijtaba",
      }[location.pathname] || "One Dua Away") + " · Ijtaba";
  }, [location.pathname]);
  if (opening)
    return (
      <Suspense fallback={<main className="section page" role="status">Opening Ijtaba…</main>}>
        <Arrival
          onEnter={() => {
            setIntroPending(false);
            window.scrollTo(0, 0);
          }}
        />
      </Suspense>
    );
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Navbar />
      <CloudOrganizerStatus />
      {!online && <div className="offline-notice" role="status">You’re offline. City prayer times and external links require a connection.</div>}
      {c.storageError && (
        <div role="alert" className="storage-warning">
          {c.storageError}
        </div>
      )}
      <div
        id="content"
        tabIndex={-1}
        className={location.pathname === "/" ? undefined : "desert-pages"}
        key={location.pathname}
      >
        <Suspense fallback={<main className="section page" role="status">Opening page…</main>}>
          <Routes>
            <Route path="/" element={<Home onReplayIntro={() => {
              window.scrollTo(0, 0);
              setIntroPending(true);
            }} />} />
            <Route path="/discover" element={<Discover key="all" />} />
            <Route path="/discover/when-to-make-dua" element={<DuaMomentsPage />} />
            <Route path="/discover/ummah" element={<UmmahReminderPage />} />
            <Route path="/discover/prophetic" element={<Discover key="prophetic" prophetic />} />
            <Route path="/discover/profiles/:profileId?" element={<DuaProfilesPage />} />
            <Route path="/my-duas" element={<MyDuasPage />} />
            <Route path="/calendar" element={<DuaCalendar />} />
            <Route path="/tahajjud" element={<Tahajjud />} />
            <Route path="/login" element={<AuthForm key="login" mode="login" />} />
            <Route path="/signup" element={<AuthForm key="signup" mode="signup" />} />
            <Route path="/forgot-password" element={<AuthForm key="forgot" mode="forgot" />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/account/password" element={<AuthForm key="password" mode="password" />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/about" element={<About />} />
            <Route
              path="*"
              element={
                <main className="section page">
                  <h1>A quiet wrong turn.</h1>
                  <Link className="button" to="/">
                    Return home
                  </Link>
                </main>
              }
            />
          </Routes>
        </Suspense>
      </div>
      <Footer />
      <CollectionFeedback />
    </>
  );
}

