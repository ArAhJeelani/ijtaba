import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import "./tahajjud-entrance.css";
import { useAnimationNasheed } from "../state/Humming";

/** A short visual metaphor, not a quotation attributed to scripture. */
export function TahajjudEntrance({ onComplete }: { onComplete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [elapsed, setElapsed] = useState(0);
  useAnimationNasheed(true, 0, Math.min(1, (4600 - elapsed) / 1000));
  useLayoutEffect(() => {
    const scene = dialog.current;
    scene?.showModal();
    return () => scene?.close();
  }, []);
  useEffect(() => {
    const started = performance.now();
    const ticker = window.setInterval(
      () => setElapsed(Math.min(4600, performance.now() - started)),
      100,
    );
    const timer = window.setTimeout(onComplete, 4600);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(ticker);
    };
  }, [onComplete]);
  return (
    <motion.dialog
      ref={dialog}
      className="tahajjud-arrival"
      aria-label="Tahajjud introduction"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      onCancel={(event) => {
        event.preventDefault();
        onComplete();
      }}
    >
      <button className="arrow-skip" onClick={onComplete}>
        Skip animation ↗
      </button>
      <div className="arrow-heading">
        <span className="eyebrow">IN THE QUIET OF THE NIGHT</span>
        <h1>
          An arrow that
          <br />
          <em>never misses.</em>
        </h1>
        <p>A moment of hope. A prayer from the heart.</p>
      </div>
      <svg className="arrow-painting" viewBox="0 0 1000 700" aria-hidden="true">
        <defs>
          <filter id="arrow-brush" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".045"
              numOctaves="3"
              seed="7"
              result="grain"
            />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="5" />
          </filter>
          <radialGradient id="arrow-halo">
            <stop stopColor="#ffe5a5" stopOpacity=".5" />
            <stop offset="1" stopColor="#ffe5a5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="painted-target" filter="url(#arrow-brush)">
          <circle cx="780" cy="350" r="145" fill="url(#arrow-halo)" />
          <circle
            cx="780"
            cy="350"
            r="93"
            fill="#ded3bd"
            fillOpacity=".12"
            stroke="#c7b495"
            strokeWidth="6"
          />
          <circle
            cx="780"
            cy="350"
            r="65"
            fill="none"
            stroke="#a9a9bd"
            strokeWidth="11"
          />
          <circle
            cx="780"
            cy="350"
            r="35"
            fill="none"
            stroke="#dcc49b"
            strokeWidth="7"
          />
          <circle cx="780" cy="350" r="9" fill="#f5ddb0" />
        </g>
        <path
          className="arrow-trail"
          pathLength="1"
          d="M-100 650 Q320 505 780 350"
          fill="none"
          stroke="#d8c39b"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#arrow-brush)"
        />
        <g className="flying-arrow" filter="url(#arrow-brush)">
          <path
            d="M0 0 H184"
            fill="none"
            stroke="#e6cf9e"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path d="M200 0 L172 -12 L179 0 L172 12Z" fill="#f4e7c6" />
          <path
            d="M15 0 L-8 -22 L23 -17 L43 0 M15 0 L-8 22 L23 17 L43 0"
            fill="#a5a6c1"
            stroke="#d7cdb8"
            strokeWidth="2"
          />
        </g>
        <g
          className="arrow-impact"
          style={{ transformOrigin: "780px 350px" }}
          filter="url(#arrow-brush)"
        >
          <circle cx="780" cy="350" r="55" fill="url(#arrow-halo)" />
          <circle
            cx="780"
            cy="350"
            r="25"
            fill="none"
            stroke="#f1d8a1"
            strokeWidth="4"
          />
          <path
            d="M780 310V286 M780 390V414 M740 350H716 M820 350H844 M751 321L734 304 M809 379L826 396 M809 321L826 304 M751 379L734 396"
            fill="none"
            stroke="#e7ce9b"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <span className="arrow-caption">TAHAJJUD · MAKE ROOM FOR YOUR DU’A</span>
    </motion.dialog>
  );
}
