import { memo, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import "./arrival.css";
import { useAnimationNasheed } from "../state/Humming";
import { ClosingWriting } from "./ClosingWriting";

const LENGTH = 29000;
const answers = [
  ["Given.", "Allah may grant what you ask for in this life."],
  ["Kept.", "Its reward may be kept for you in the Hereafter."],
  ["Protected.", "An equivalent harm may be turned away from you."],
];

/** One painted scene with a shared, finite, pauseable timeline. */
export function Arrival({ onEnter }: { onEnter: () => void }) {
  const reduced = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useAnimationNasheed(
    !paused && !leaving && !reduced,
    0,
    Math.min(1, (LENGTH - elapsed) / 3000),
  );
  const complete = !!reduced || elapsed >= LENGTH;
  const phase = complete
    ? 4
    : elapsed < 6500
      ? 0
      : elapsed < 11000
        ? 1
        : elapsed < 15500
          ? 2
          : elapsed < 20000
            ? 3
            : 4;

  useEffect(() => {
    if (complete && !reduced && !paused) setLeaving(true);
  }, [complete, reduced, paused]);

  useEffect(() => {
    if (paused || reduced || complete) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = now - last;
      if (delta >= 28) {
        setElapsed((previous) => Math.min(LENGTH, previous + delta));
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, reduced, complete]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onEnter, reduced ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [leaving, onEnter, reduced]);

  return (
    <main
      className={`arrival living-arrival ${paused ? "is-paused" : ""} ${reduced ? "is-reduced" : ""} ${leaving ? "is-leaving" : ""}`}
    >
      <div className="arrival-top">
        <span>
          IJTABA
        </span>
        <button onClick={() => setLeaving(true)} disabled={leaving}>
          Skip introduction ↗
        </button>
      </div>
      <PaintedFilm />
      <div aria-live="polite" aria-atomic="true">
        <div className={`film-words phase-${phase}`} key={phase}>
          {phase === 0 ? (
            <>
              <span className="eyebrow">FROM YOUR HEART, WITH HOPE</span>
              <h1>
                Your du’a may be
                <br />
                <em>one away.</em>
              </h1>
              <p>Your du’a may be answered in three ways.</p>
            </>
          ) : phase < 4 ? (
            <>
              <span className="eyebrow">0{phase} / 03</span>
              <h1>{answers[phase - 1][0]}</h1>
              <p>{answers[phase - 1][1]}</p>
            </>
          ) : (
            <div className="film-signature">
              <img src="/assets/ijabah-logo.webp" alt="" />
              <h1>One Dua Away.</h1>
              <ClosingWriting elapsed={elapsed - 20000} reduced={!!reduced} />
              {reduced && (
                <ol>
                  {answers.map(([title, text]) => (
                    <li key={title}>
                      <strong>{title}</strong> {text}
                    </li>
                  ))}
                </ol>
              )}
              {(reduced || elapsed >= 26000) && (
                <button
                  className="button film-enter written-enter"
                  onClick={() => setLeaving(true)}
                  disabled={leaving}
                >
                  Enter Ijtaba <ArrowUpRight size={19} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="film-footer">
        <div className="animation-controls">
          {!complete && (
            <button onClick={() => setPaused(!paused)}>
              {paused ? <Play size={14} /> : <Pause size={14} />}{" "}
              {paused ? "Resume animation" : "Pause animation"}
            </button>
          )}
        </div>
        <span
          className="film-progress"
          aria-label="Introduction progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(complete ? 100 : (elapsed / LENGTH) * 100)}
        >
          <span
            style={{ width: `${complete ? 100 : (elapsed / LENGTH) * 100}%` }}
          />
        </span>
        <details className="arrival-source">
          <summary>About the three ways</summary>
          <p>
            A summary of the narration of Abu Sa‘id al-Khudri concerning
            supplication without sin or severing family ties. These are possible
            outcomes, not predictions for an individual prayer.{" "}
            <a
              href="https://sunnah.global/hadeeth/en/show/5100"
              target="_blank"
              rel="noreferrer"
            >
              Narration and grading ↗
            </a>
          </p>
        </details>
      </div>
    </main>
  );
}

const PaintedFilm = memo(function PaintedFilm() {
  return (
    <div className="painted-film" aria-hidden="true">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="film-canvas"
      >
        <defs>
          <filter
            id="film-pigment"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".016 .085"
              numOctaves="3"
              seed="12"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" />
          </filter>
          <filter
            id="film-drybrush"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".07"
              numOctaves="3"
              seed="4"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" />
          </filter>
          <radialGradient id="film-lantern">
            <stop stopColor="#fff8da" />
            <stop offset=".2" stopColor="#f9da87" />
            <stop offset="1" stopColor="#e6ae5900" />
          </radialGradient>
          <mask id="film-sky-reveal">
            <rect width="1440" height="900" fill="black" />
            <path
              className="sky-reveal"
              d="M-100 820 Q720 620 1540 810 M1540 580 Q720 350 -100 500 M-100 270 Q720 50 1540 190 M1540 -40 L-100 -40"
              fill="none"
              stroke="white"
              strokeWidth="340"
              filter="url(#film-pigment)"
            />
          </mask>
        </defs>
        <image
          href="/assets/desert-dua-hero-textured.jpg"
          width="1440"
          height="900"
          preserveAspectRatio="xMidYMid slice"
          opacity=".74"
        />
        <g className="first-ink" filter="url(#film-drybrush)">
          <path
            d="M-80 580 C200 390 380 670 690 545 S1150 360 1510 500"
            pathLength="1"
            fill="none"
            stroke="#b07851"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M-40 600 C300 440 430 675 790 535 S1220 415 1500 470"
            pathLength="1"
            fill="none"
            stroke="#ddb186"
            strokeWidth="3"
          />
        </g>
        <g className="night-scene" mask="url(#film-sky-reveal)">
          <g className="painted-stars" fill="#e4d6af">
            {[
              [210, 165],
              [360, 290],
              [560, 110],
              [830, 210],
              [1200, 350],
              [960, 90],
              [180, 430],
              [1290, 130],
              [660, 295],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 1.6} />
            ))}
          </g>
        </g>
        <g className="garden-scene" filter="url(#film-pigment)">
          <path
            className="earth-wash"
            d="M-100 820 Q240 600 720 720 T1540 690 L1540 1000 L-100 1000Z"
            fill="#a96943"
          />
          <path
            className="earth-wash"
            d="M-100 860 Q360 680 740 795 T1540 735 L1540 1000 L-100 1000Z"
            fill="#653925"
            opacity=".6"
          />
          <ellipse
            className="seed"
            cx="720"
            cy="740"
            rx="12"
            ry="19"
            fill="#593321"
          />
          <path
            className="growing-stem"
            pathLength="1"
            d="M720 755 Q690 610 726 465 Q747 410 718 350"
            fill="none"
            stroke="#8b8855"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            className="leaf leaf-left"
            d="M713 625 Q590 630 602 535 Q694 534 713 625Z"
            fill="#9e9a62"
          />
          <path
            className="leaf leaf-right"
            d="M718 560 Q835 570 838 474 Q747 472 718 560Z"
            fill="#797647"
          />
          <g className="bloom">
            {[0, 60, 120, 180, 240, 300].map((r, i) => (
              <ellipse
                key={r}
                cx="720"
                cy="300"
                rx="35"
                ry="73"
                transform={`rotate(${r} 720 350)`}
                fill={["#c77e63", "#e0ad82", "#a9604e"][i % 3]}
                opacity=".88"
              />
            ))}
            <circle cx="720" cy="350" r="31" fill="#dfbd79" />
            <circle cx="718" cy="345" r="16" fill="#f1dba1" />
          </g>
          <path
            className="earth-wash"
            d="M-50 845 Q420 730 710 803 T1490 760"
            fill="none"
            stroke="#e0a672"
            strokeWidth="30"
            opacity=".65"
          />
        </g>
        <path
          className="carrying-stroke"
          pathLength="1"
          d="M720 710 C650 610 770 480 720 350 S760 80 720 -100"
          fill="none"
          stroke="#ddc594"
          strokeWidth="11"
          filter="url(#film-drybrush)"
          strokeLinecap="round"
        />
        <g className="travelling-light">
          <circle cx="720" cy="710" r="85" fill="url(#film-lantern)" />
          <circle cx="720" cy="710" r="10" fill="#fff2b9" />
        </g>
        <g
          className="answer-branches"
          fill="none"
          stroke="#e0ca99"
          strokeWidth="4"
          filter="url(#film-drybrush)"
        >
          <path pathLength="1" d="M790 210 C615 260 550 350 650 500" />
          <path pathLength="1" d="M790 210 Q790 125 830 90" />
          <path pathLength="1" d="M790 210 C970 300 970 490 770 570" />
        </g>
        <g className="kept-light">
          <circle cx="830" cy="120" r="105" fill="url(#film-lantern)" />
          <path
            d="M830 93 Q833 116 852 120 Q833 124 830 147 Q826 124 808 120 Q827 116 830 93"
            fill="#fff0c5"
            filter="url(#film-drybrush)"
          />
        </g>
        <g filter="url(#film-pigment)">
          <path
            className="harm-left"
            d="M-200 240 C150 140 420 320 540 460 C600 550 430 630 190 590 L-200 800Z"
            fill="#1a100d"
          />
          <path
            className="harm-right"
            d="M1640 260 C1250 120 1040 320 895 440 C810 535 1040 645 1330 580 L1640 820Z"
            fill="#241510"
          />
          <path
            className="diverted-ink"
            d="M-80 450 C280 300 420 400 490 560 S260 760 -80 790 M1520 450 C1180 300 1010 390 950 560 S1200 770 1520 800"
            fill="none"
            stroke="#815039"
            strokeWidth="54"
          />
        </g>
        <g className="safe-light">
          <circle cx="720" cy="450" r="160" fill="url(#film-lantern)" />
          <ellipse
            cx="720"
            cy="450"
            rx="77"
            ry="98"
            fill="none"
            stroke="#e4ca93"
            strokeWidth="3"
            opacity=".6"
            filter="url(#film-drybrush)"
          />
          <circle cx="720" cy="450" r="11" fill="#fff5cd" />
        </g>
        <g className="sky-impact" style={{ transformOrigin: "720px 0px" }}>
          <circle cx="720" cy="0" r="110" fill="url(#film-lantern)" />
          <g
            filter="url(#film-drybrush)"
            fill="none"
            stroke="#ead4a1"
            strokeLinecap="round"
          >
            <circle cx="720" cy="0" r="65" strokeWidth="8" opacity=".7" />
            <path
              d="M720 0 Q640 65 590 105 M720 0 Q810 50 870 120 M720 0 Q690 110 720 170 M720 0 Q590 0 525 50 M720 0 Q845 0 935 50"
              strokeWidth="13"
              opacity=".65"
            />
          </g>
        </g>
      </svg>
    </div>
  );
});
