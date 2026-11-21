import { useId } from "react";

/** Continuous calligraphic text revealed by a moving, rough-edged ink mask. */
export function ClosingWriting({
  elapsed,
  reduced,
}: {
  elapsed: number;
  reduced: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const lines = [
    { text: "Just know…", y: 43, delay: 150, duration: 850, size: 38 },
    {
      text: "Every du’a has an answer.",
      y: 111,
      delay: 1100,
      duration: 1950,
      size: 46,
    },
    {
      text: "In ways we may not see…",
      y: 181,
      delay: 3200,
      duration: 2250,
      size: 46,
    },
  ];
  return (
    <svg
      className="closing-writing"
      viewBox="0 0 800 225"
      role="img"
      aria-label="Just know… Every du’a has an answer, in ways we may not see."
    >
      <defs>
        <filter id={`${id}-grain`} x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".08"
            numOctaves="2"
            result="grain"
          />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="2" />
        </filter>
        {lines.map((line, i) => {
          const progress = reduced
            ? 1
            : Math.max(0, Math.min(1, (elapsed - line.delay) / line.duration));
          return (
            <mask
              id={`${id}-line-${i}`}
              key={i}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x="-50"
              y="-80"
              width="900"
              height="400"
            >
              <path
                d={`M0 ${line.y - 10} Q180 ${line.y - 24} 360 ${line.y - 8} T800 ${line.y - 10}`}
                pathLength="1"
                fill="none"
                stroke="white"
                strokeWidth="140"
                strokeLinecap="butt"
                strokeDasharray="1"
                strokeDashoffset={1 - progress}
                filter={`url(#${id}-grain)`}
              />
            </mask>
          );
        })}
      </defs>
      {lines.map((line, i) => (
        <text
          key={i}
          x="400"
          y={line.y}
          textAnchor="middle"
          fontSize={line.size}
          mask={`url(#${id}-line-${i})`}
        >
          {line.text}
        </text>
      ))}
      <path
        className="writing-flourish"
        d="M215 210 Q350 189 440 207 T600 202"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1"
        strokeDashoffset={
          reduced ? 0 : 1 - Math.max(0, Math.min(1, (elapsed - 5100) / 650))
        }
      />
    </svg>
  );
}
