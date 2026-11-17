import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
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
  const [cycle, setCycle] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useAnimationNasheed(
    !paused && !leaving && !reduced,
    cycle,
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
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      setElapsed((t) => Math.min(LENGTH, t + delta));
      last = now;
    }, 100);
    return () => window.clearInterval(timer);
  }, [paused, reduced, complete, cycle]);

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
          IJABAH <span lang="ar">إجابة</span>
        </span>
        <button onClick={() => setLeaving(true)} disabled={leaving}>
          Skip introduction ↗
        </button>
      </div>
      <div className="painted-film" key={cycle} aria-hidden="true">
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
          <g className="first-ink" filter="url(#film-drybrush)">
            <path
              d="M-80 580 C200 390 380 670 690 545 S1150 360 1510 500"
              pathLength="1"
              fill="none"
              stroke="#536d90"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M-40 600 C300 440 430 675 790 535 S1220 415 1500 470"
              pathLength="1"
              fill="none"
              stroke="#a3aac4"
              strokeWidth="3"
            />
          </g>
          <g className="night-scene" mask="url(#film-sky-reveal)">
            <rect width="1440" height="900" fill="#182d50" />
            <g filter="url(#film-pigment)">
              <path
                d="M-80 180 Q290 320 670 165 T1530 190"
                fill="none"
                stroke="#4c547d"
                strokeWidth="220"
              />
              <path
                d="M-80 425 Q380 170 870 330 T1530 200"
                fill="none"
                stroke="#7b779b"
                strokeWidth="105"
                opacity=".5"
              />
              <path
                d="M-80 510 Q410 350 850 460 T1530 345"
                fill="none"
                stroke="#526785"
                strokeWidth="135"
              />
              <path
                d="M-80 840 Q420 640 850 755 T1530 715 L1530 1000 L-80 1000Z"
                fill="#34486a"
              />
              <path
                d="M-80 900 Q400 720 900 850 T1530 790"
                fill="none"
                stroke="#7e7c9b"
                strokeWidth="45"
                opacity=".4"
              />
            </g>
            <path
              d="M1090 125 Q1030 199 1110 232 Q1010 239 1017 166 Q1028 127 1090 125"
              fill="#e4d6af"
              filter="url(#film-drybrush)"
            />
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
            <image
              href="/assets/painted-canvas-v1.webp"
              x="0"
              y="0"
              width="1440"
              height="900"
              preserveAspectRatio="xMidYMax slice"
              opacity=".5"
              style={{ mixBlendMode: "soft-light" }}
            />
          </g>
          <g className="garden-scene" filter="url(#film-pigment)">
            <path
              className="earth-wash"
              d="M-100 820 Q240 600 720 720 T1540 690 L1540 1000 L-100 1000Z"
              fill="#a9ad8e"
            />
            <path
              className="earth-wash"
              d="M-100 860 Q360 680 740 795 T1540 735 L1540 1000 L-100 1000Z"
              fill="#7f927c"
              opacity=".6"
            />
            <ellipse
              className="seed"
              cx="720"
              cy="740"
              rx="12"
              ry="19"
              fill="#8a6e56"
            />
            <path
              className="growing-stem"
              pathLength="1"
              d="M720 755 Q690 610 726 465 Q747 410 718 350"
              fill="none"
              stroke="#637c69"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              className="leaf leaf-left"
              d="M713 625 Q590 630 602 535 Q694 534 713 625Z"
              fill="#87977b"
            />
            <path
              className="leaf leaf-right"
              d="M718 560 Q835 570 838 474 Q747 472 718 560Z"
              fill="#6e866f"
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
                  fill={["#aea5ca", "#c2afcd", "#8e91b9"][i % 3]}
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
              stroke="#ddd1ac"
              strokeWidth="30"
              opacity=".65"
            />
          </g>
          <g className="prayer-hands" filter="url(#film-drybrush)">
            <path
              d="M565 940 L593 767 Q591 713 623 656 Q633 638 644 653 L632 714 Q648 669 663 648 Q676 632 685 649 L669 716 Q690 681 702 689 Q715 698 704 722 Q688 760 680 790 L682 940Z"
              fill="#c3a894"
            />
            <path
              d="M875 940 L847 767 Q849 713 817 656 Q807 638 796 653 L808 714 Q792 669 777 648 Q764 632 755 649 L771 716 Q750 681 738 689 Q725 698 736 722 Q752 760 760 790 L758 940Z"
              fill="#d7bca0"
            />
            <path
              d="M582 874 Q630 848 684 862 L690 950 H560Z M858 874 Q810 848 756 862 L750 950 H880Z"
              fill="#61738b"
            />
            <path
              d="M615 780 Q639 749 663 748 M825 780 Q801 749 777 748"
              fill="none"
              stroke="#a58478"
              strokeWidth="5"
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
              fill="#090f27"
            />
            <path
              className="harm-right"
              d="M1640 260 C1250 120 1040 320 895 440 C810 535 1040 645 1330 580 L1640 820Z"
              fill="#0b142e"
            />
            <path
              className="diverted-ink"
              d="M-80 450 C280 300 420 400 490 560 S260 760 -80 790 M1520 450 C1180 300 1010 390 950 560 S1200 770 1520 800"
              fill="none"
              stroke="#716a91"
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
      <div
        className={`film-words phase-${phase}`}
        aria-live="polite"
        aria-atomic="true"
      >
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
            <img src="/assets/ijabah-logo.webp" alt="إجابة — Ijabah" />
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
                Enter Ijabah <ArrowUpRight size={19} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="film-footer">
        <div className="animation-controls">
          <button
            onClick={() => {
              setElapsed(0);
              setPaused(false);
              setCycle((n) => n + 1);
            }}
          >
            <RotateCcw size={14} /> Replay
          </button>
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
